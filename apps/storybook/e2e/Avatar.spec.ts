import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Browser tier for Avatar and AvatarGroup. jsdom fakes three things this component depends on: an
 * image that really loads or fails, the crescent mask that the clip overlap computes, and forced
 * colors. The jsdom suite stubs `window.Image`; this one lets the browser decide.
 *
 * Every test opens the iframe URL directly: the page is the preview document.
 */

const STORY = {
  avatarDefault: "components-avatar--default",
  avatarFallback: "components-avatar--fallback",
  groupDefault: "components-avatargroup--default",
  groupOverlap: "components-avatargroup--overlap",
} as const;

const iframe = (id: string, theme: "default-dark" | "default-light" = "default-light") =>
  `/iframe.html?id=${id}&globals=theme:${theme}`;

/* A cold dev server compiles the preview on the first request, longer than the default window. */
const COLD = {timeout: 60_000} as const;

/*
 * One worker for the file: every test here opens a story, and a cold dev server compiling the
 * preview for six simultaneous first visits leaves the iframe on its loading spinner past any
 * timeout worth setting. Serial, the first test pays for the compile and the rest find it warm.
 */
test.describe.configure({mode: "serial"});

test.describe("Avatar (browser)", () => {
  test.setTimeout(150_000);

  test("a loaded image replaces the fallback", async ({page}) => {
    await page.goto(iframe(STORY.avatarDefault));

    const image = page.getByRole("img", {name: "Jane Doe"});

    await expect(image).toBeVisible(COLD);
    // "JD" is this avatar's fallback text; it must be gone once the image is in.
    await expect(page.getByText("JD", {exact: true})).toHaveCount(0);
  });

  test("an image that fails to load leaves the fallback", async ({page}) => {
    await page.goto(iframe(STORY.avatarFallback));

    await expect(page.getByText("NA", {exact: true})).toBeVisible(COLD);
    await expect(page.getByRole("img", {name: "Broken image"})).toHaveCount(0);
  });

  test("keeps a visible boundary under forced colors", async ({page}) => {
    await page.emulateMedia({forcedColors: "active"});
    await page.goto(iframe(STORY.avatarDefault));

    const avatar = page.locator('[data-slot="avatar"]').first();

    await expect(avatar).toBeVisible(COLD);

    const outline = await avatar.evaluate((element) => getComputedStyle(element).outlineStyle);

    expect(outline).toBe("solid");
  });

  for (const theme of ["default-light", "default-dark"] as const) {
    for (const [name, id] of [
      ["Avatar", STORY.avatarDefault],
      ["AvatarGroup", STORY.groupDefault],
      ["AvatarGroup overlap", STORY.groupOverlap],
    ] as const) {
      test(`${name} breaks no WCAG 2.2 AA rule in ${theme}`, async ({page}) => {
        await page.goto(iframe(id, theme));
        await expect(page.getByRole("heading", {level: 2})).toBeVisible(COLD);

        await injectAxe(page);
        await checkA11y(page, undefined, {
          axeOptions: {runOnly: {type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"]}},
          detailedReport: true,
        });
      });
    }
  }
});

test.describe("AvatarGroup (browser)", () => {
  test.setTimeout(150_000);

  test("the clip overlap masks every avatar but the last", async ({page}) => {
    await page.goto(iframe(STORY.groupDefault));

    const avatars = page.locator('[data-slot="avatar-group"] > [data-slot="avatar"]');

    await expect(avatars.first()).toBeVisible(COLD);

    const masks = await avatars.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).maskImage),
    );

    expect(masks.length).toBeGreaterThan(1);
    expect(masks.slice(0, -1).every((mask) => mask !== "none")).toBe(true);
    expect(masks.at(-1)).toBe("none");
  });

  test("the ring overlap draws a seam and no mask", async ({page}) => {
    await page.goto(iframe(STORY.groupOverlap));

    const ringGroup = page.locator(".avatar-group--ring");
    const first = ringGroup.locator('[data-slot="avatar"]').first();

    await expect(first).toBeVisible(COLD);

    const style = await first.evaluate((element) => {
      const computed = getComputedStyle(element);

      return {boxShadow: computed.boxShadow, maskImage: computed.maskImage};
    });

    expect(style.maskImage).toBe("none");
    expect(style.boxShadow).not.toBe("none");
  });
});
