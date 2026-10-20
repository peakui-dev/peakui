import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {useState} from "react";

import {Pagination} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  component: Pagination,
  parameters: {
    layout: "padded",
  },
  title: "Components/Pagination",
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <Pagination>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous isDisabled aria-label="Previous page">
              <Pagination.PreviousIcon />
              <span>Previous</span>
            </Pagination.Previous>
          </Pagination.Item>
          {[1, 2, 3].map((page) => (
            <Pagination.Item key={page}>
              <Pagination.Link isActive={page === 1}>{page}</Pagination.Link>
            </Pagination.Item>
          ))}
          <Pagination.Item>
            <Pagination.Next aria-label="Next page">
              <span>Next</span>
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    </Showcase>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Showcase title="Sizes">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Pagination key={size} size={size}>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous aria-label="Previous page">
                <Pagination.PreviousIcon />
              </Pagination.Previous>
            </Pagination.Item>
            {[1, 2, 3].map((page) => (
              <Pagination.Item key={page}>
                <Pagination.Link isActive={page === 2}>{page}</Pagination.Link>
              </Pagination.Item>
            ))}
            <Pagination.Item>
              <Pagination.Next aria-label="Next page">
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      ))}
    </Showcase>
  ),
};

export const WithSummary: Story = {
  render: () => (
    <Showcase title="With summary">
      <Pagination>
        <Pagination.Summary>1 to 5 of 42 results</Pagination.Summary>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous isDisabled aria-label="Previous page">
              <Pagination.PreviousIcon />
              <span>Previous</span>
            </Pagination.Previous>
          </Pagination.Item>
          {[1, 2, 3].map((page) => (
            <Pagination.Item key={page}>
              <Pagination.Link isActive={page === 1}>{page}</Pagination.Link>
            </Pagination.Item>
          ))}
          <Pagination.Item>
            <Pagination.Next aria-label="Next page">
              <span>Next</span>
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    </Showcase>
  ),
};

export const WithEllipsis: Story = {
  render: () => (
    <Showcase title="With ellipsis">
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
          {[9, 10, 11].map((page) => (
            <Pagination.Item key={page}>
              <Pagination.Link isActive={page === 10}>{page}</Pagination.Link>
            </Pagination.Item>
          ))}
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
    </Showcase>
  ),
};

const TOTAL = 10;

const Controlled = () => {
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
            onPress={() => setPage((p) => p - 1)}
          >
            <Pagination.PreviousIcon />
            <span>Previous</span>
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
            onPress={() => setPage((p) => p + 1)}
          >
            <span>Next</span>
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
};

export const Interactive: Story = {
  render: () => (
    <Showcase title="Interactive">
      <Controlled />
    </Showcase>
  ),
};
