import {Pagination} from "@peakui/react";

export function Sizes() {
  return (
    <div className="flex flex-col gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Pagination key={size} size={size}>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous aria-label="Previous page">
                <Pagination.PreviousIcon />
              </Pagination.Previous>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Link>1</Pagination.Link>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Link isActive>2</Pagination.Link>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Next aria-label="Next page">
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      ))}
    </div>
  );
}
