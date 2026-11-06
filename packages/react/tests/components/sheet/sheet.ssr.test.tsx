import {ssrSmoke} from "@peakui/testing/helpers";

import {Button} from "@/components/button";
import {Sheet} from "@/components/sheet/index.ts";

describe("Sheet SSR", () => {
  it("renders without hydration mismatch while closed", async () => {
    await ssrSmoke(
      <Sheet>
        <Sheet.Trigger>
          <Button>Open</Button>
        </Sheet.Trigger>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.Heading>Title</Sheet.Heading>
              <Sheet.Body>Content</Sheet.Body>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>,
    );
  });

  // The open overlay needs the scroll geometry RAC reads on mount; Task 10 completes the smoke.
  it.todo("renders without hydration mismatch when defaultOpen");
});
