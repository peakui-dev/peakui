import {ssrSmoke} from "@peakui/testing/helpers";

import {TextArea} from "@/components/textarea/index.ts";

describe("TextArea SSR", () => {
  it("рендерится без расхождения гидратации", async () => {
    const {html} = await ssrSmoke(<TextArea aria-label="Описание" defaultValue="Текст" />);

    expect(html).toContain('data-slot="textarea"');
    expect(html).toContain("Текст");
  });
});
