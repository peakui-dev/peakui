"use client";

import {Pagination} from "@peakui/react";
import {useState} from "react";

const TOTAL = 5;

export function Controlled() {
  const [page, setPage] = useState(1);

  return (
    <Pagination>
      <Pagination.Summary>
        Page {page} of {TOTAL}
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous
            aria-label="Previous page"
            isDisabled={page === 1}
            onPress={() => setPage(page - 1)}
          >
            <Pagination.PreviousIcon />
          </Pagination.Previous>
        </Pagination.Item>
        {Array.from({length: TOTAL}, (_, i) => i + 1).map((p) => (
          <Pagination.Item key={p}>
            <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>
              {p}
            </Pagination.Link>
          </Pagination.Item>
        ))}
        <Pagination.Item>
          <Pagination.Next
            aria-label="Next page"
            isDisabled={page === TOTAL}
            onPress={() => setPage(page + 1)}
          >
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}
