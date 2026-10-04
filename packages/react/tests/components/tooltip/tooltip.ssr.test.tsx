import {ssrSmoke} from "@peakui/testing/helpers";

import {Button} from "@/components/button";
import {Tooltip} from "@/components/tooltip";

describe("Tooltip SSR", () => {
  it("рендерится без расхождения гидратации в закрытом состоянии", async () => {
    await ssrSmoke(
      <Tooltip delay={0}>
        <Button>Hover me</Button>
        <Tooltip.Content>Hover tip</Tooltip.Content>
      </Tooltip>,
    );
  });

  it("рендерится без расхождения гидратации при defaultOpen со стрелкой", async () => {
    await ssrSmoke(
      <Tooltip defaultOpen delay={0}>
        <Button>Hover me</Button>
        <Tooltip.Content showArrow>
          <Tooltip.Arrow />
          Hover tip
        </Tooltip.Content>
      </Tooltip>,
    );
  });
});
