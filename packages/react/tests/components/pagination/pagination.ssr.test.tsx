import {ssrSmoke} from "@peakui/testing/helpers";

import {Pagination} from "@/components/pagination";

describe("Pagination SSR", () => {
  it("renders every part without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <Pagination size="sm">
        <Pagination.Summary>1 to 5 of 42</Pagination.Summary>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous aria-label="Previous page">
              <Pagination.PreviousIcon />
            </Pagination.Previous>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link isActive>1</Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Ellipsis />
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Next aria-label="Next page">
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>,
    );

    for (const slot of [
      "pagination",
      "pagination-summary",
      "pagination-content",
      "pagination-item",
      "pagination-link",
      "pagination-previous",
      "pagination-next",
      "pagination-ellipsis",
    ]) {
      expect(html).toContain(`data-slot="${slot}"`);
    }
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("pagination--sm");
  });
});
