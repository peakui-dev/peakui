import {ssrSmoke} from "@peakui/testing/helpers";

import {Button} from "@/components/button";
import {Popover} from "@/components/popover";

describe("Popover SSR", () => {
  it("рендерится без расхождения гидратации в закрытом состоянии", async () => {
    await ssrSmoke(
      <Popover>
        <Button>Открыть</Button>
        <Popover.Content>
          <Popover.Dialog>Содержимое поповера</Popover.Dialog>
        </Popover.Content>
      </Popover>,
    );
  });

  it("рендерится без расхождения гидратации при defaultOpen со стрелкой", async () => {
    await ssrSmoke(
      <Popover defaultOpen>
        <Button>Открыть</Button>
        <Popover.Content>
          <Popover.Dialog>
            <Popover.Arrow />
            <Popover.Heading>Заголовок</Popover.Heading>
            <p>Содержимое поповера</p>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>,
    );
  });
});
