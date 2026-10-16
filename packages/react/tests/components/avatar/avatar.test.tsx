import type {ComponentProps} from "react";

import {render, screen} from "@peakui/testing/helpers";
import {createRef} from "react";

import * as avatarBarrel from "@/components/avatar/index.ts";
import {
  AVATAR_GROUP_CHILD,
  AVATAR_SLOT,
  AvatarGroupContext,
} from "@/components/avatar-group/avatar-group-context.ts";
import * as groupBarrel from "@/components/avatar-group/index.ts";

/*
 * jsdom never loads an image, and Radix's Image renders its <img> only once a preload through
 * `new window.Image()` has succeeded. The stub decides the outcome of every preload in a test.
 */
let imageOutcome: "error" | "load" = "load";
const RealImage = window.Image;

class StubImage extends EventTarget {
  complete = false;
  crossOrigin: string | null = null;
  naturalWidth = 0;
  referrerPolicy = "";

  set src(_value: string) {
    queueMicrotask(() => {
      if (imageOutcome === "load") {
        this.complete = true;
        this.naturalWidth = 1;
      }

      this.dispatchEvent(new Event(imageOutcome));
    });
  }
}

beforeEach(() => {
  imageOutcome = "load";
  window.Image = StubImage as unknown as typeof window.Image;
});

afterEach(() => {
  window.Image = RealImage;
});

const {Avatar, AvatarRoot} = avatarBarrel;

describe("Avatar", () => {
  it("renders the fallback text when there is no image", () => {
    render(
      <Avatar>
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders the image under its alt text and hides the fallback once it loads", async () => {
    render(
      <Avatar>
        <Avatar.Image alt="Jane Doe" src="https://example.test/jane.png" />
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );

    const image = await screen.findByRole("img", {name: "Jane Doe"});

    expect(image).toHaveAttribute("src", "https://example.test/jane.png");
    expect(screen.queryByText("JD")).not.toBeInTheDocument();
  });

  it("shows the fallback when the image fails to load", async () => {
    imageOutcome = "error";
    render(
      <Avatar>
        <Avatar.Image alt="Jane Doe" src="https://example.test/missing.png" />
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );

    expect(await screen.findByText("JD")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders the image through the render prop once it has loaded", async () => {
    const render_ = vi.fn((props: React.ComponentProps<"img">) => (
      <img {...props} data-testid="custom" />
    ));

    render(
      <Avatar>
        <Avatar.Image alt="Jane Doe" render={render_} src="https://example.test/jane.png" />
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );

    const image = await screen.findByRole("img", {name: "Jane Doe"});

    expect(image).toHaveAttribute("data-testid", "custom");
    expect(image).toHaveAttribute("data-slot", "avatar-image");
    expect(image).toHaveAttribute("src", "https://example.test/jane.png");
    expect(image.className).toContain("avatar__image");
    expect(screen.queryByText("JD")).not.toBeInTheDocument();
  });

  it("passes the ref of Avatar.Image to the element the render prop returns", async () => {
    const ref = createRef<HTMLImageElement>();

    render(
      <Avatar>
        <Avatar.Image
          ref={ref}
          alt="Jane Doe"
          render={(props) => <img {...props} />}
          src="https://example.test/jane.png"
        />
      </Avatar>,
    );

    expect(await screen.findByRole("img")).toBe(ref.current);
  });

  it("still shows the fallback when the image fails and a render prop is given", async () => {
    imageOutcome = "error";
    render(
      <Avatar>
        <Avatar.Image
          alt="Jane Doe"
          render={(props) => <img {...props} />}
          src="https://example.test/missing.png"
        />
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );

    expect(await screen.findByText("JD")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("puts a data-slot on the root, the image and the fallback", async () => {
    const {container, unmount} = render(
      <Avatar>
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );

    expect(container.firstElementChild).toHaveAttribute("data-slot", "avatar");
    expect(screen.getByText("JD")).toHaveAttribute("data-slot", "avatar-fallback");
    unmount();

    render(
      <Avatar>
        <Avatar.Image alt="Jane Doe" src="https://example.test/jane.png" />
      </Avatar>,
    );

    expect(await screen.findByRole("img")).toHaveAttribute("data-slot", "avatar-image");
  });

  it("puts the size on the root and the color on the fallback", () => {
    render(
      <Avatar color="accent" data-testid="root" size="lg">
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );

    expect(screen.getByTestId("root").className).toContain("avatar--lg");
    expect(screen.getByText("JD").className).toContain("avatar__fallback--accent");
  });

  it("lets a Fallback override the color of its Avatar", () => {
    render(
      <Avatar color="success">
        <Avatar.Fallback color="danger">JD</Avatar.Fallback>
      </Avatar>,
    );

    expect(screen.getByText("JD").className).toContain("avatar__fallback--danger");
  });

  it("passes data attributes and a consumer className to the root", () => {
    render(
      <Avatar className="custom" data-foo="bar" data-testid="root">
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );

    expect(screen.getByTestId("root")).toHaveAttribute("data-foo", "bar");
    expect(screen.getByTestId("root").className).toContain("custom");
  });

  it("keeps the contract data-slot over one a consumer passes", () => {
    render(
      <Avatar data-slot="mine" data-testid="root">
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );

    expect(screen.getByTestId("root")).toHaveAttribute("data-slot", "avatar");
  });

  it("takes the data-slot of the part that owns the root through the slot marker", () => {
    render(
      <Avatar {...{[AVATAR_SLOT]: "avatar-group-count"}} data-testid="root">
        <Avatar.Fallback>+2</Avatar.Fallback>
      </Avatar>,
    );

    expect(screen.getByTestId("root")).toHaveAttribute("data-slot", "avatar-group-count");
  });

  describe("group context", () => {
    it("ignores the group's props without the group-child marker", () => {
      render(
        <AvatarGroupContext value={{color: "accent", size: "sm"}}>
          <Avatar data-testid="root">
            <Avatar.Fallback>JD</Avatar.Fallback>
          </Avatar>
        </AvatarGroupContext>,
      );

      expect(screen.getByTestId("root").className).not.toContain("avatar--sm");
      expect(screen.getByText("JD").className).not.toContain("avatar__fallback--accent");
    });

    it("inherits size, color and variant when marked as a group child", () => {
      render(
        <AvatarGroupContext value={{color: "accent", size: "sm", variant: "soft"}}>
          <Avatar {...{[AVATAR_GROUP_CHILD]: true}} data-testid="root">
            <Avatar.Fallback>JD</Avatar.Fallback>
          </Avatar>
        </AvatarGroupContext>,
      );

      expect(screen.getByTestId("root").className).toContain("avatar--sm");
      expect(screen.getByTestId("root").className).toContain("avatar--soft");
      expect(screen.getByText("JD").className).toContain("avatar__fallback--accent");
    });

    it("prefers its own props to the group's", () => {
      render(
        <AvatarGroupContext value={{size: "sm"}}>
          <Avatar {...{[AVATAR_GROUP_CHILD]: true}} data-testid="root" size="lg">
            <Avatar.Fallback>JD</Avatar.Fallback>
          </Avatar>
        </AvatarGroupContext>,
      );

      expect(screen.getByTestId("root").className).toContain("avatar--lg");
      expect(screen.getByTestId("root").className).not.toContain("avatar--sm");
    });
  });

  it("keeps the internal markers out of the public barrels", () => {
    for (const name of ["AVATAR_GROUP_CHILD", "AVATAR_SLOT"]) {
      expect(avatarBarrel).not.toHaveProperty(name);
      expect(groupBarrel).not.toHaveProperty(name);
    }
  });

  it("does not accept the markers as props of Avatar", () => {
    // @ts-expect-error the marker is not in the public props: a consumer cannot name it
    const props: ComponentProps<typeof Avatar> = {__avatar_slot: "mine"};

    expect(props).toBeDefined();
  });

  it("forwards role and aria-label so a fallback-only avatar can be named", () => {
    render(
      <Avatar aria-label="Jane Doe" role="img">
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );

    expect(screen.getByRole("img", {name: "Jane Doe"})).toHaveAttribute("data-slot", "avatar");
  });

  it("behaves identically as Avatar.Root and AvatarRoot", () => {
    render(
      <>
        <Avatar.Root data-testid="namespaced">
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <AvatarRoot data-testid="flat">
          <Avatar.Fallback>B</Avatar.Fallback>
        </AvatarRoot>
      </>,
    );

    for (const id of ["namespaced", "flat"]) {
      expect(screen.getByTestId(id)).toHaveAttribute("data-slot", "avatar");
    }
  });
});
