import {ssrSmoke} from "@peakui/testing/helpers";

import {Button} from "@/components/button/index.ts";
import {ButtonGroup} from "@/components/button-group/index.ts";

describe("ButtonGroup SSR", () => {
  it("рендерится без расхождения гидратации", async () => {
    const {html} = await ssrSmoke(
      <ButtonGroup>
        <Button>Первый</Button>
        <Button>
          <ButtonGroup.Separator />
          Вторый
        </Button>
      </ButtonGroup>,
    );

    expect(html).toContain('data-slot="button-group"');
    expect(html).toContain('data-slot="button-group-separator"');
  });

  it("рендерится без расхождения гидратации в вертикальной ориентации", async () => {
    const {html} = await ssrSmoke(
      <ButtonGroup orientation="vertical">
        <Button>Первый</Button>
      </ButtonGroup>,
    );

    expect(html).toContain("button-group--vertical");
  });
});
