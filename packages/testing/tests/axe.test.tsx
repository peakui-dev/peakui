import {expectNoAxeViolations, render, screen} from "../helpers/index.ts";

describe("expectNoAxeViolations", () => {
  it("passes on a named button", async () => {
    const {container} = render(<button type="button">Save</button>);

    expect(screen.getByRole("button", {name: "Save"})).toBeInTheDocument();
    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });

  it("fails on a button without a name and names the rule", async () => {
    const {container} = render(<button type="button" />);

    await expect(expectNoAxeViolations(container)).rejects.toThrow(/button-name/);
  });

  it("keeps the default rule set when options are passed", async () => {
    const {container} = render(<img src="x.png" />);

    await expect(
      expectNoAxeViolations(container, {rules: {"color-contrast": {enabled: false}}}),
    ).rejects.toThrow(/image-alt/);
    await expect(expectNoAxeViolations(container)).rejects.toThrow(/image-alt/);
  });

  it("lets caller rules override the defaults", async () => {
    const {container} = render(<button type="button" />);

    await expect(
      expectNoAxeViolations(container, {rules: {"button-name": {enabled: false}}}),
    ).resolves.toBeUndefined();
  });

  it("checks a node outside the container when document.body is passed", async () => {
    const {container} = render(<button type="button">Save</button>);
    const stray = document.createElement("button");

    document.body.appendChild(stray);

    try {
      await expect(expectNoAxeViolations(document.body)).rejects.toThrow(/button-name/);
      await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
    } finally {
      stray.remove();
    }
  });
});
