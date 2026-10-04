import {ssrSmoke} from "@peakui/testing/helpers";

import {Disclosure} from "@/components/disclosure";
import {DisclosureGroup} from "@/components/disclosure-group";

describe("DisclosureGroup SSR", () => {
  it("рендерится без расхождения гидратации с одним раскрытым элементом", async () => {
    const {html} = await ssrSmoke(
      <DisclosureGroup data-testid="disclosure-group" defaultExpandedKeys={["preview"]}>
        <Disclosure aria-label="Предпросмотр" id="preview">
          <Disclosure.Heading>
            <Disclosure.Trigger>
              Предпросмотр
              <Disclosure.Indicator />
            </Disclosure.Trigger>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body>Содержимое предпросмотра.</Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
        <Disclosure aria-label="Загрузка" id="download">
          <Disclosure.Heading>
            <Disclosure.Trigger>
              Загрузка
              <Disclosure.Indicator />
            </Disclosure.Trigger>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body>Содержимое загрузки.</Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      </DisclosureGroup>,
    );

    expect(html).toContain('data-slot="disclosure-group"');
    expect(html).toContain('aria-expanded="true"');
  });
});
