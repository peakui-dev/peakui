import {render, screen, setupUser, ssrSmoke} from "../helpers/index.ts";

/*
 * Хелперы проверяются на голом DOM, без единого компонента PeakUI: пакет обязан быть пригодным
 * сам по себе, иначе его первая настоящая проверка — падение чужого теста по непонятной причине.
 */

describe("testing helpers", () => {
  it("renders and queries by role", () => {
    render(<button type="button">Save</button>);

    expect(screen.getByRole("button", {name: "Save"})).toBeInTheDocument();
  });

  it("drives a pointer press through the RAC pointer map", async () => {
    const user = setupUser();
    const onClick = vi.fn();

    render(
      <button type="button" onClick={onClick}>
        Save
      </button>,
    );

    await user.click(screen.getByRole("button", {name: "Save"}));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("installs the jsdom gaps RAC needs", () => {
    expect(typeof globalThis.ResizeObserver).toBe("function");
    expect(typeof window.matchMedia).toBe("function");
    expect(typeof document.elementFromPoint).toBe("function");
    expect(typeof Element.prototype.getAnimations).toBe("function");
    expect(typeof globalThis.PointerEvent).toBe("function");
  });

  it("hydrates server HTML without a mismatch", async () => {
    const {html} = await ssrSmoke(<button type="button">Save</button>);

    expect(html).toContain("Save");
  });
});
