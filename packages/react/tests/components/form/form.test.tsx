import {fireEvent, render, screen} from "@peakui/testing/helpers";

import {Button} from "@/components/button/index.ts";
import {Form, FormRoot} from "@/components/form/index.ts";
import {Input} from "@/components/input/index.ts";
import {Label} from "@/components/label/index.ts";
import {TextField} from "@/components/textfield/index.ts";

const renderForm = (props: Parameters<typeof Form>[0] = {}) =>
  render(
    <Form {...props}>
      <TextField isRequired name="email">
        <Label>Почта</Label>
        <Input />
      </TextField>
      <Button type="submit">Отправить</Button>
    </Form>,
  );

describe("Form", () => {
  it("рендерит form с доступным именем", () => {
    renderForm({"aria-label": "Настройки"});

    expect(screen.getByRole("form", {name: "Настройки"})).toBeInTheDocument();
  });

  it("несёт data-slot и блок form", () => {
    renderForm({"aria-label": "Настройки"});

    const form = screen.getByRole("form", {name: "Настройки"});

    expect(form.getAttribute("data-slot")).toBe("form");
    expect(form).toHaveClass("form");
  });

  it("вызывает onSubmit с событием отправки", () => {
    const onSubmit = vi.fn();

    render(
      <Form aria-label="Настройки" onSubmit={onSubmit}>
        <TextField isRequired defaultValue="a@b.c" name="email">
          <Label>Почта</Label>
          <Input />
        </TextField>
        <Button type="submit">Отправить</Button>
      </Form>,
    );

    fireEvent.submit(screen.getByRole("form", {name: "Настройки"}));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect((onSubmit.mock.calls[0]?.[0] as {target: HTMLFormElement}).target.tagName).toBe("FORM");
  });

  it("оставляет нативную валидацию браузера включённой", () => {
    /*
     * Блокировка невалидной отправки — обязанность браузерной constraint validation
     * (noValidate не ставится при native-поведении); jsdom-/fireEvent.submit её обходит,
     * поэтому здесь проверяется контракт: атрибут noValidate отсутствует.
     */
    renderForm({"aria-label": "Настройки"});

    expect(screen.getByRole("form", {name: "Настройки"})).not.toHaveAttribute("novalidate");
  });

  it("отключает нативную валидацию при validationBehavior=aria", () => {
    renderForm({"aria-label": "Настройки", validationBehavior: "aria"});

    expect(screen.getByRole("form", {name: "Настройки"})).toHaveAttribute("novalidate");
  });

  it("ведёт себя одинаково как Form.Root и FormRoot", () => {
    render(
      <>
        <Form.Root aria-label="Имена">
          <input />
        </Form.Root>
        <FormRoot aria-label="Плоский">
          <input />
        </FormRoot>
      </>,
    );

    expect(screen.getByRole("form", {name: "Имена"})).toBeInTheDocument();
    expect(screen.getByRole("form", {name: "Плоский"})).toBeInTheDocument();
  });
});
