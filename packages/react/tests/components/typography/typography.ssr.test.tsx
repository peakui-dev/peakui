import {ssrSmoke} from "@peakui/testing/helpers";

import {Heading, Prose} from "@/components/typography";

describe("Typography SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <Prose>
        <Heading level={2}>Title</Heading>
      </Prose>,
    );

    expect(html).toContain('data-slot="prose"');
    expect(html).toContain("<h2");
    expect(html).toContain('data-type="h2"');
  });
});
