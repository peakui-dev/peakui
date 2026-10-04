import {ssrSmoke} from "@peakui/testing/helpers";

import {Disclosure} from "@/components/disclosure";

describe("Disclosure SSR", () => {
  it("рендерится без расхождения гидратации с defaultExpanded", async () => {
    const {html} = await ssrSmoke(
      <Disclosure defaultExpanded data-testid="disclosure">
        <Disclosure.Heading>
          <Disclosure.Trigger>
            Показать подробности
            <Disclosure.Indicator />
          </Disclosure.Trigger>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body>Скрытое содержимое.</Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>,
    );

    expect(html).toContain('data-slot="disclosure"');
    expect(html).toContain('aria-expanded="true"');
  });
});
