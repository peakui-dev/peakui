import {describe, expect, it} from "vitest";

import {sheetVariants} from "./sheet.styles.ts";

describe("sheetVariants", () => {
  it("emits the BEM name of every slot", () => {
    const slots = sheetVariants();

    expect(slots.overlay()).toBe("sheet__overlay");
    expect(slots.handle()).toBe("sheet__handle");
    expect(slots.handleBar()).toBe("sheet__handle-bar");
    expect(slots.closeTrigger()).toBe("sheet__close-trigger");
    expect(slots.header()).toBe("sheet__header");
    expect(slots.heading()).toBe("sheet__heading");
    expect(slots.body()).toBe("sheet__body");
    expect(slots.footer()).toBe("sheet__footer");
  });

  it("defaults the placement to bottom", () => {
    const slots = sheetVariants();

    expect(slots.content()).toContain("sheet__content--bottom");
    expect(slots.dialog()).toContain("sheet__dialog--bottom");
  });

  it.each(["bottom", "top", "left", "right"] as const)(
    "adds the %s placement modifier to content and dialog",
    (placement) => {
      const slots = sheetVariants({placement});

      expect(slots.content()).toContain(`sheet__content--${placement}`);
      expect(slots.dialog()).toContain(`sheet__dialog--${placement}`);
    },
  );

  it("defaults the backdrop to opaque", () => {
    expect(sheetVariants().backdrop()).toContain("sheet__backdrop--opaque");
  });

  it.each(["opaque", "blur", "transparent"] as const)(
    "adds the %s backdrop modifier",
    (backdrop) => {
      expect(sheetVariants({backdrop}).backdrop()).toContain(`sheet__backdrop--${backdrop}`);
    },
  );
});
