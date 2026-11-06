import {ssrSmoke} from "@peakui/testing/helpers";

import {Button} from "@/components/button";
import {Sheet} from "@/components/sheet/index.ts";

/*
 * jsdom has no IntersectionObserver and no Element.scrollTo, both of which the primitive's open
 * overlay uses once it is in the document (every browser has them; the server never runs refs or
 * effects). Stubs that do nothing are enough: the smoke judges the hydration, not the enter.
 */
class SilentIntersectionObserver {
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", SilentIntersectionObserver);
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: () => {},
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  // jsdom defines no scrollTo of its own, so removing the stub restores it.
  Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
});

describe("Sheet SSR", () => {
  it("renders without a hydration mismatch while closed", async () => {
    await ssrSmoke(
      <Sheet>
        <Sheet.Trigger>
          <Button>Open</Button>
        </Sheet.Trigger>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.Handle />
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <Sheet.Heading>Title</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body>Content</Sheet.Body>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>,
    );
  });

  /*
   * The overlay portals in on the client only, as every modal overlay of the primitive does, so the
   * server sends the trigger alone and the open sheet mounts during hydration. Its handle is then a
   * slider whose aria-valuenow appears only after the first effect has measured the scroller; any
   * warning that mount raises is caught by the smoke.
   */
  it("renders without a hydration mismatch with defaultOpen and snapPoints", async () => {
    const {html} = await ssrSmoke(
      <Sheet defaultOpen snapPoints={["25%", "50%"]}>
        <Sheet.Trigger>
          <Button>Open</Button>
        </Sheet.Trigger>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.Handle />
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <Sheet.Heading>Title</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body>Content</Sheet.Body>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>,
    );

    expect(html).toContain('data-slot="button"');
    expect(html).not.toContain('data-slot="sheet-dialog"');
  });
});
