import type {ComponentProps} from "react";

import {render, screen, setupUser} from "@peakui/testing/helpers";

import {FieldError} from "@/components/field-error/index.ts";
import {InputOtp, InputOtpRoot} from "@/components/input-otp/index.ts";

const renderOtp = (props: Omit<Partial<ComponentProps<typeof InputOtp>>, "children"> = {}) =>
  render(
    <InputOtp maxLength={6} {...props}>
      <InputOtp.Group>
        <InputOtp.Slot index={0} />
        <InputOtp.Slot index={1} />
        <InputOtp.Slot index={2} />
      </InputOtp.Group>
      <InputOtp.Separator />
      <InputOtp.Group>
        <InputOtp.Slot index={3} />
        <InputOtp.Slot index={4} />
        <InputOtp.Slot index={5} />
      </InputOtp.Group>
    </InputOtp>,
  );

/** Скрытый <input> библиотеки OTP-ввода: пропы Root доходят до него, а не до контейнера. */
const hiddenInput = () => document.querySelector('[data-slot="input-otp"]') as HTMLInputElement;

describe("InputOtp", () => {
  it("части несут свои data-slot", () => {
    renderOtp();

    expect(document.querySelector('[data-slot="input-otp"]')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="input-otp-group"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-slot="input-otp-slot"]')).toHaveLength(6);
    expect(document.querySelector('[data-slot="input-otp-separator"]')).toBeInTheDocument();
  });

  it("контейнер несёт BEM-блок, скрытый input — класс слота input", () => {
    renderOtp({inputClassName: "custom-input"});

    const container = document.querySelector('[data-input-otp-container="true"]');
    const input = hiddenInput();

    expect(container?.className).toEqual(expect.stringContaining("input-otp"));
    expect(input.className).toEqual(expect.stringContaining("input-otp__input"));
    expect(input.className).toEqual(expect.stringContaining("custom-input"));
  });

  it.each([
    ["primary", "input-otp--primary"],
    ["secondary", "input-otp--secondary"],
  ] as const)("вариант %s помечает контейнер классом %s", (variant, modifier) => {
    renderOtp({variant});

    const container = document.querySelector('[data-input-otp-container="true"]');

    expect(container?.className).toEqual(expect.stringContaining(modifier));
  });

  it("вызывает onChange при вводе цифр", async () => {
    const onChange = vi.fn();
    const user = setupUser();

    renderOtp({onChange});

    const input = hiddenInput();

    await user.click(input);
    await user.keyboard("12");

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("12");
  });

  it("вызывает onComplete при заполнении всех слотов", async () => {
    const onComplete = vi.fn();
    const user = setupUser();

    renderOtp({maxLength: 4, onComplete});

    const input = hiddenInput();

    await user.click(input);
    await user.keyboard("1234");

    expect(onComplete).toHaveBeenCalledWith("1234");
  });

  it("заполняет слоты вставкой из буфера обмена", async () => {
    const onChange = vi.fn();
    const user = setupUser();

    renderOtp({onChange});

    const input = hiddenInput();

    await user.click(input);
    await user.paste("654321");

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("654321");
    expect(document.querySelectorAll('[data-filled="true"]')).toHaveLength(6);
  });

  it("дизейблит ввод и помечает слоты", async () => {
    const onChange = vi.fn();
    const user = setupUser();

    renderOtp({isDisabled: true, onChange});

    const input = hiddenInput();

    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("data-disabled", "true");
    expect(document.querySelector('[data-slot="input-otp-slot"]')).toHaveAttribute(
      "data-disabled",
      "true",
    );

    await user.click(input);
    await user.keyboard("1");

    expect(onChange).not.toHaveBeenCalled();
  });

  describe("валидация", () => {
    const renderWithFieldError = (isInvalid: boolean) =>
      render(
        <InputOtp isInvalid={isInvalid} maxLength={6} validationErrors={["Invalid code"]}>
          <InputOtp.Group>
            <InputOtp.Slot index={0} />
            <InputOtp.Slot index={1} />
            <InputOtp.Slot index={2} />
          </InputOtp.Group>
          <FieldError>Invalid code</FieldError>
        </InputOtp>,
      );

    it("показывает FieldError по синтетическому результату валидации", () => {
      renderWithFieldError(true);

      expect(hiddenInput()).toHaveAttribute("data-invalid", "true");
      expect(document.querySelector('[data-slot="input-otp-slot"]')).toHaveAttribute(
        "data-invalid",
        "true",
      );
      expect(screen.getByText("Invalid code")).toBeInTheDocument();
    });

    it("прячет FieldError у валидного поля", () => {
      renderWithFieldError(false);

      expect(screen.queryByText("Invalid code")).not.toBeInTheDocument();
    });
  });

  it("ведёт себя одинаково как InputOtp.Root и InputOtpRoot", () => {
    render(
      <>
        <InputOtp.Root aria-label="Первый код" maxLength={6} value="111">
          <InputOtp.Group>
            <InputOtp.Slot index={0} />
          </InputOtp.Group>
        </InputOtp.Root>
        <InputOtpRoot aria-label="Второй код" maxLength={6} value="22">
          <InputOtp.Group>
            <InputOtp.Slot index={0} />
          </InputOtp.Group>
        </InputOtpRoot>
      </>,
    );

    expect(screen.getByLabelText("Первый код")).toHaveValue("111");
    expect(screen.getByLabelText("Второй код")).toHaveValue("22");
    for (const name of ["Первый код", "Второй код"]) {
      expect(screen.getByLabelText(name)).toHaveAttribute("data-slot", "input-otp");
    }
  });
});
