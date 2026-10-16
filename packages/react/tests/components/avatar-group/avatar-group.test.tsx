import {render, screen} from "@peakui/testing/helpers";

import {Avatar} from "@/components/avatar/index.ts";
import {AvatarGroup, AvatarGroupCount, AvatarGroupRoot} from "@/components/avatar-group/index.ts";

const letters = (...names: string[]) =>
  names.map((name) => (
    <Avatar key={name}>
      <Avatar.Fallback>{name}</Avatar.Fallback>
    </Avatar>
  ));

const slot = (name: string) => document.querySelectorAll(`[data-slot="${name}"]`);

describe("AvatarGroup", () => {
  describe("layout", () => {
    it("exposes its data-slot and stacks with the clip overlap by default", () => {
      render(<AvatarGroup>{letters("A")}</AvatarGroup>);

      const group = slot("avatar-group")[0];

      expect(group?.className).toContain("avatar-group--clip");
      expect(group?.className).not.toContain("avatar-group--grid");
    });

    it("applies the ring overlap instead of the clip", () => {
      render(<AvatarGroup overlap="ring">{letters("A")}</AvatarGroup>);

      const group = slot("avatar-group")[0];

      expect(group?.className).toContain("avatar-group--ring");
      expect(group?.className).not.toContain("avatar-group--clip");
    });

    it("applies the grid modifier", () => {
      render(<AvatarGroup isGrid>{letters("A")}</AvatarGroup>);

      expect(slot("avatar-group")[0]?.className).toContain("avatar-group--grid");
    });

    it("merges a consumer className and forwards role and aria-label", () => {
      render(
        <AvatarGroup aria-label="Assignees" className="custom" role="group">
          {letters("A")}
        </AvatarGroup>,
      );

      const group = screen.getByRole("group", {name: "Assignees"});

      expect(group.className).toContain("custom");
      expect(group).toHaveAttribute("data-slot", "avatar-group");
    });

    it("keeps the contract data-slot over one a consumer passes", () => {
      render(<AvatarGroup data-slot="mine">{letters("A")}</AvatarGroup>);

      expect(slot("avatar-group")).toHaveLength(1);
      expect(slot("mine")).toHaveLength(0);
    });

    it("renders through the render prop", () => {
      render(
        <AvatarGroup render={(props) => <section {...props} data-testid="custom" />}>
          {letters("A")}
        </AvatarGroup>,
      );

      expect(screen.getByTestId("custom").tagName).toBe("SECTION");
      expect(screen.getByTestId("custom")).toHaveAttribute("data-slot", "avatar-group");
    });
  });

  describe("max and count", () => {
    it("renders every avatar and no count without max", () => {
      render(<AvatarGroup>{letters("A", "B", "C", "D", "E", "F")}</AvatarGroup>);

      for (const name of ["A", "B", "C", "D", "E", "F"]) {
        expect(screen.getByText(name)).toBeInTheDocument();
      }
      expect(slot("avatar-group-count")).toHaveLength(0);
    });

    it("truncates at max and appends a +N count of the rest", () => {
      render(<AvatarGroup max={2}>{letters("A", "B", "C", "D")}</AvatarGroup>);

      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("B")).toBeInTheDocument();
      expect(screen.queryByText("C")).not.toBeInTheDocument();
      expect(screen.queryByText("D")).not.toBeInTheDocument();
      expect(screen.getByText("+2")).toBeInTheDocument();
      expect(slot("avatar-group-count")).toHaveLength(1);
    });

    it("renders no avatars and counts them all when max is 0", () => {
      render(<AvatarGroup max={0}>{letters("A", "B", "C")}</AvatarGroup>);

      expect(screen.queryByText("A")).not.toBeInTheDocument();
      expect(screen.getByText("+3")).toBeInTheDocument();
    });

    it("adds no count when max is at or above the number of avatars", () => {
      const {rerender} = render(<AvatarGroup max={3}>{letters("A", "B", "C")}</AvatarGroup>);

      expect(slot("avatar-group-count")).toHaveLength(0);

      rerender(<AvatarGroup max={10}>{letters("A", "B", "C")}</AvatarGroup>);

      expect(slot("avatar-group-count")).toHaveLength(0);
    });

    it("renders an explicit Count without max, for a total the server knows", () => {
      render(
        <AvatarGroup size="sm">
          {letters("A", "B", "C")}
          <AvatarGroup.Count>+9</AvatarGroup.Count>
        </AvatarGroup>,
      );

      expect(screen.getByText("+9")).toBeInTheDocument();
      expect(slot("avatar-group-count")).toHaveLength(1);
    });

    it("lets an explicit Count replace the automatic one when max is also set", () => {
      render(
        <AvatarGroup max={2}>
          {letters("A", "B", "C", "D")}
          <AvatarGroup.Count>+99</AvatarGroup.Count>
        </AvatarGroup>,
      );

      expect(screen.getByText("+99")).toBeInTheDocument();
      expect(screen.queryByText("+2")).not.toBeInTheDocument();
      expect(slot("avatar-group-count")).toHaveLength(1);
    });

    it("renders the Count last, wherever it sits among the children", () => {
      render(
        <AvatarGroup>
          <AvatarGroup.Count>+4</AvatarGroup.Count>
          {letters("A", "B")}
        </AvatarGroup>,
      );

      expect(slot("avatar-group")[0]?.lastElementChild).toHaveAttribute(
        "data-slot",
        "avatar-group-count",
      );
    });

    it("takes size and color from the group, and its own props over them", () => {
      render(
        <AvatarGroup color="accent" size="sm">
          <AvatarGroup.Count data-testid="inherited">+1</AvatarGroup.Count>
          <AvatarGroup.Count color="danger" data-testid="own" size="lg">
            +2
          </AvatarGroup.Count>
        </AvatarGroup>,
      );

      expect(screen.getByTestId("inherited").className).toContain("avatar--sm");
      expect(screen.getByText("+1").className).toContain("avatar__fallback--accent");
      expect(screen.getByTestId("own").className).toContain("avatar--lg");
      expect(screen.getByText("+2").className).toContain("avatar__fallback--danger");
    });
  });

  describe("inheritance", () => {
    it("passes size, color and variant to its direct children", () => {
      render(
        <AvatarGroup color="accent" size="sm" variant="soft">
          <Avatar data-testid="child">
            <Avatar.Fallback>A</Avatar.Fallback>
          </Avatar>
        </AvatarGroup>,
      );

      const child = screen.getByTestId("child");

      expect(child.className).toContain("avatar--sm");
      expect(child.className).toContain("avatar--soft");
      expect(screen.getByText("A").className).toContain("avatar__fallback--accent");
    });

    it("defaults the children to the md size", () => {
      render(
        <AvatarGroup>
          <Avatar data-testid="child">
            <Avatar.Fallback>A</Avatar.Fallback>
          </Avatar>
        </AvatarGroup>,
      );

      expect(screen.getByTestId("child").className).toContain("avatar--md");
    });

    it("lets a child's own size beat the group's", () => {
      render(
        <AvatarGroup size="sm">
          <Avatar data-testid="child" size="lg">
            <Avatar.Fallback>A</Avatar.Fallback>
          </Avatar>
        </AvatarGroup>,
      );

      expect(screen.getByTestId("child").className).toContain("avatar--lg");
      expect(screen.getByTestId("child").className).not.toContain("avatar--sm");
    });

    it("does not pass the group's props to an avatar nested inside a child", () => {
      render(
        <AvatarGroup size="lg">
          <div>
            <Avatar data-testid="nested">
              <Avatar.Fallback>A</Avatar.Fallback>
            </Avatar>
          </div>
        </AvatarGroup>,
      );

      expect(screen.getByTestId("nested").className).not.toContain("avatar--lg");
    });

    it("leaves a host element child untouched and raises no React warning", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <AvatarGroup>
          <span data-testid="plain">x</span>
        </AvatarGroup>,
      );

      expect(screen.getByTestId("plain").getAttributeNames()).toEqual(["data-testid"]);
      expect(error).not.toHaveBeenCalled();
      error.mockRestore();
    });
  });

  it("behaves identically as AvatarGroup.Root and AvatarGroupRoot", () => {
    render(
      <>
        <AvatarGroup.Root data-testid="namespaced">{letters("A")}</AvatarGroup.Root>
        <AvatarGroupRoot data-testid="flat">{letters("B")}</AvatarGroupRoot>
      </>,
    );

    for (const id of ["namespaced", "flat"]) {
      expect(screen.getByTestId(id)).toHaveAttribute("data-slot", "avatar-group");
    }
    expect(AvatarGroup.Count).toBe(AvatarGroupCount);
  });
});
