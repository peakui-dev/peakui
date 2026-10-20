import {ssrSmoke} from "@peakui/testing/helpers";

import {Accordion} from "@/components/accordion";

describe("Accordion SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <Accordion defaultExpandedKeys={["a"]}>
        <Accordion.Item id="a">
          <Accordion.Heading>
            <Accordion.Trigger>
              Title
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>Content</Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>,
    );

    expect(html).toContain('data-slot="accordion"');
    expect(html).toContain('data-slot="accordion-trigger"');
  });
});
