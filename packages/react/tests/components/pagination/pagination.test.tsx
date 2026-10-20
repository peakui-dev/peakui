import {render, screen, setupUser} from "@peakui/testing/helpers";
import {useState} from "react";

import {Pagination, PaginationRoot} from "@/components/pagination/index.ts";

describe("Pagination", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  const renderPages = (props: {size?: "sm" | "md" | "lg"} = {}) =>
    render(
      <Pagination aria-label="Results" {...props}>
        <Pagination.Summary>1 to 5 of 42</Pagination.Summary>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous isDisabled aria-label="Previous page">
              <Pagination.PreviousIcon />
            </Pagination.Previous>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link isActive>1</Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link>2</Pagination.Link>
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

  describe("structure", () => {
    it("renders a navigation landmark with the block class and slot", () => {
      renderPages();

      const nav = screen.getByRole("navigation", {name: "Results"});

      expect(nav).toHaveAttribute("data-slot", "pagination");
      expect(nav.className).toEqual(expect.stringContaining("pagination"));
    });

    it("falls back to an English accessible name", () => {
      render(
        <Pagination>
          <Pagination.Content>{null}</Pagination.Content>
        </Pagination>,
      );

      expect(screen.getByRole("navigation", {name: "Pagination"})).toBeInTheDocument();
    });

    it("renders the items as list items inside a list", () => {
      renderPages();

      expect(screen.getByRole("list")).toHaveAttribute("data-slot", "pagination-content");
      const items = screen.getAllByRole("listitem");

      expect(items).toHaveLength(5);
      for (const item of items) {
        expect(item).toHaveAttribute("data-slot", "pagination-item");
      }
    });

    it("gives the summary its slot and automatic text direction", () => {
      renderPages();

      const summary = screen.getByText("1 to 5 of 42");

      expect(summary).toHaveAttribute("data-slot", "pagination-summary");
      expect(summary).toHaveAttribute("dir", "auto");
    });

    it("hides the ellipsis and the icons from assistive technology", () => {
      renderPages();

      expect(document.querySelector('[data-slot="pagination-ellipsis"]')).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      for (const slot of ["pagination-previous-icon", "pagination-next-icon"]) {
        expect(document.querySelector(`[data-slot="${slot}"]`)).toHaveAttribute(
          "aria-hidden",
          "true",
        );
      }
    });

    it("applies the size modifier to the root only", () => {
      renderPages({size: "lg"});

      expect(screen.getByRole("navigation").className).toEqual(
        expect.stringContaining("pagination--lg"),
      );
    });
  });

  describe("links", () => {
    it("marks only the active link as the current page", () => {
      renderPages();

      expect(screen.getByRole("button", {name: "1"})).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("button", {name: "1"})).toHaveAttribute("data-active", "true");
      expect(screen.getByRole("button", {name: "2"})).not.toHaveAttribute("aria-current");
    });

    it("gives links, previous and next their slots", () => {
      renderPages();

      expect(screen.getByRole("button", {name: "2"})).toHaveAttribute(
        "data-slot",
        "pagination-link",
      );
      expect(screen.getByRole("button", {name: "Previous page"})).toHaveAttribute(
        "data-slot",
        "pagination-previous",
      );
      expect(screen.getByRole("button", {name: "Next page"})).toHaveAttribute(
        "data-slot",
        "pagination-next",
      );
    });

    it("disables a link through isDisabled", () => {
      renderPages();

      expect(screen.getByRole("button", {name: "Previous page"})).toBeDisabled();
    });

    it("keeps the contract data-slot when a consumer passes one", () => {
      render(<Pagination.Link data-slot="custom">3</Pagination.Link>);

      expect(screen.getByRole("button", {name: "3"})).toHaveAttribute(
        "data-slot",
        "pagination-link",
      );
    });

    it("merges a consumer className with the part class", () => {
      render(
        <Pagination>
          <Pagination.Link className="custom">3</Pagination.Link>
        </Pagination>,
      );

      const link = screen.getByRole("button", {name: "3"});

      expect(link.className).toEqual(expect.stringContaining("custom"));
      expect(link.className).toEqual(expect.stringContaining("pagination__link"));
    });

    it("gives previous and next the navigation modifier", () => {
      renderPages();

      expect(screen.getByRole("button", {name: "Next page"}).className).toEqual(
        expect.stringContaining("pagination__link--nav"),
      );
    });
  });

  describe("interaction", () => {
    const Controlled = () => {
      const [page, setPage] = useState(1);

      return (
        <Pagination>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                aria-label="Previous page"
                isDisabled={page === 1}
                onPress={() => setPage((p) => p - 1)}
              >
                <Pagination.PreviousIcon />
              </Pagination.Previous>
            </Pagination.Item>
            {[1, 2, 3].map((p) => (
              <Pagination.Item key={p}>
                <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>
                  {p}
                </Pagination.Link>
              </Pagination.Item>
            ))}
            <Pagination.Item>
              <Pagination.Next
                aria-label="Next page"
                isDisabled={page === 3}
                onPress={() => setPage((p) => p + 1)}
              >
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      );
    };

    it("moves the current page when a link is pressed", async () => {
      render(<Controlled />);

      await user.click(screen.getByRole("button", {name: "3"}));

      expect(screen.getByRole("button", {name: "3"})).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("button", {name: "1"})).not.toHaveAttribute("aria-current");
    });

    it("steps with next and previous, disabling them at the ends", async () => {
      render(<Controlled />);

      expect(screen.getByRole("button", {name: "Previous page"})).toBeDisabled();

      await user.click(screen.getByRole("button", {name: "Next page"}));
      expect(screen.getByRole("button", {name: "2"})).toHaveAttribute("aria-current", "page");

      await user.click(screen.getByRole("button", {name: "Next page"}));
      expect(screen.getByRole("button", {name: "Next page"})).toBeDisabled();
    });

    it("activates a link from the keyboard", async () => {
      render(<Controlled />);

      // Previous is disabled, so the first stop is page 1.
      await user.tab();
      expect(screen.getByRole("button", {name: "1"})).toHaveFocus();
      await user.tab();
      await user.keyboard("{Enter}");

      expect(screen.getByRole("button", {name: "2"})).toHaveAttribute("aria-current", "page");
    });
  });

  describe("composition", () => {
    it("behaves identically as Pagination.Root and PaginationRoot", () => {
      render(
        <>
          <Pagination.Root aria-label="Namespaced">
            <span />
          </Pagination.Root>
          <PaginationRoot aria-label="Flat">
            <span />
          </PaginationRoot>
        </>,
      );

      for (const name of ["Namespaced", "Flat"]) {
        expect(screen.getByRole("navigation", {name})).toHaveAttribute("data-slot", "pagination");
      }
    });

    it("replaces the root element through the render prop", () => {
      render(
        <Pagination aria-label="Custom" render={(props) => <nav {...props} data-custom="true" />}>
          <span />
        </Pagination>,
      );

      expect(screen.getByRole("navigation", {name: "Custom"})).toHaveAttribute(
        "data-custom",
        "true",
      );
    });
  });
});
