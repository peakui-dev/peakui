import {Pagination} from "@peakui/react";

export function WithEllipsis() {
  return (
    <Pagination>
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
          <Pagination.Ellipsis />
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link isActive>10</Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Ellipsis />
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link>20</Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Next aria-label="Next page">
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}
