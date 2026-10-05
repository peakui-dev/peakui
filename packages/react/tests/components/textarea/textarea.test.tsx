import type {ComponentProps} from "react";

import {render, screen, setupUser} from "@peakui/testing/helpers";

import {TextArea, TextAreaRoot} from "@/components/textarea/index.ts";
import {TextField} from "@/components/textfield/index.ts";

const renderArea = (props: ComponentProps<typeof TextArea> = {}) =>
  render(<TextArea aria-label="Описание" placeholder="Опишите продукт" {...props} />);

describe("TextArea", () => {
  it("рендерит textbox с доступным именем", () => {
    renderArea();

    expect(screen.getByRole("textbox", {name: "Описание"})).toBeInTheDocument();
  });

  it("несёт data-slot и модификаторы варианта/ширины", () => {
    renderArea({variant: "secondary", fullWidth: true});
    const area = screen.getByRole("textbox", {name: "Описание"});

    expect(area.getAttribute("data-slot")).toBe("textarea");
    expect(area).toHaveClass("textarea--secondary");
    expect(area).toHaveClass("textarea--full-width");
  });

  it("вводит текст и сообщает onChange", async () => {
    const user = setupUser();
    const onChange = vi.fn();

    renderArea({onChange});
    const area = screen.getByRole("textbox", {name: "Описание"});

    await user.type(area, "привет");

    expect(area).toHaveValue("привет");
    expect(onChange).toHaveBeenCalledTimes(6);
  });

  it("наследует вариант из TextField", () => {
    render(
      <TextField variant="secondary">
        <TextArea aria-label="Описание" />
      </TextField>,
    );

    expect(screen.getByRole("textbox", {name: "Описание"})).toHaveClass("textarea--secondary");
  });

  it("собственный вариант бьёт наследуемый", () => {
    render(
      <TextField variant="secondary">
        <TextArea aria-label="Описание" variant="primary" />
      </TextField>,
    );

    expect(screen.getByRole("textbox", {name: "Описание"})).toHaveClass("textarea--primary");
  });

  it("ведёт себя одинаково как TextArea.Root и TextAreaRoot", () => {
    render(
      <>
        <TextArea.Root aria-label="Имена" />
        <TextAreaRoot aria-label="Плоский" />
      </>,
    );

    expect(screen.getByRole("textbox", {name: "Имена"})).toBeInTheDocument();
    expect(screen.getByRole("textbox", {name: "Плоский"})).toBeInTheDocument();
  });
});
