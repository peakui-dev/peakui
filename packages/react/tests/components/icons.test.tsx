import type {ComponentProps, ComponentType} from "react";

import {render, screen} from "@peakui/testing/helpers";

import * as Components from "@/components";
import {
  CircleDashedIcon,
  CloseIcon,
  DangerIcon,
  ExternalLinkIcon,
  IconCalendar,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconMinus,
  IconPlus,
  IconSearch,
  InfoIcon,
  SuccessIcon,
  WarningIcon,
} from "@/components/icons";

/*
 * The icon module is internal: components import the glyphs by these names, but none of them is
 * part of the package's public API. The names mirror the reference module verbatim so ported
 * components keep importing them unchanged.
 */
type Glyph = [name: string, Icon: ComponentType<ComponentProps<"svg">>];

const glyphs: Glyph[] = [
  ["IconChevronDown", IconChevronDown],
  ["IconChevronUp", IconChevronUp],
  ["IconChevronLeft", IconChevronLeft],
  ["IconChevronRight", IconChevronRight],
  ["CloseIcon", CloseIcon],
  ["IconPlus", IconPlus],
  ["IconMinus", IconMinus],
  ["IconSearch", IconSearch],
  ["IconCalendar", IconCalendar],
  ["ExternalLinkIcon", ExternalLinkIcon],
  ["InfoIcon", InfoIcon],
  ["WarningIcon", WarningIcon],
  ["DangerIcon", DangerIcon],
  ["SuccessIcon", SuccessIcon],
  ["CircleDashedIcon", CircleDashedIcon],
];

const glyphs16 = glyphs.filter(([name]) => name !== "ExternalLinkIcon");

describe("внутренний модуль иконок", () => {
  it.each(glyphs)("рендерит %s как svg-глиф на сетке 16×16", (_name, Icon) => {
    const {container} = render(<Icon data-testid="glyph" />);
    const svg = screen.getByTestId("glyph");

    expect(svg.tagName).toBe("svg");
    expect(svg).toHaveAttribute("viewBox", "0 0 16 16");
    expect(svg).toHaveAttribute("fill", "none");
    expect(container.querySelector("svg path")).toBeInTheDocument();
  });

  it.each(glyphs)("%s скрыт от скринридеров", (_name, Icon) => {
    render(<Icon data-testid="glyph" />);

    expect(screen.getByTestId("glyph")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("glyph")).toHaveAttribute("role", "presentation");
  });

  it.each(glyphs)("%s наследует текущий цвет текста", (_name, Icon) => {
    render(<Icon data-testid="glyph" />);
    const path = screen.getByTestId("glyph").querySelector("path");

    expect(path).toHaveAttribute("fill", "currentColor");
    expect(path).toHaveAttribute("fill-rule", "evenodd");
  });

  it.each(glyphs16)("%s по умолчанию 16×16 пикселей", (_name, Icon) => {
    render(<Icon data-testid="glyph" />);

    expect(screen.getByTestId("glyph")).toHaveAttribute("width", "16");
    expect(screen.getByTestId("glyph")).toHaveAttribute("height", "16");
  });

  it("ExternalLinkIcon по умолчанию 9×9 пикселей", () => {
    render(<ExternalLinkIcon data-testid="glyph" />);

    expect(screen.getByTestId("glyph")).toHaveAttribute("width", "9");
    expect(screen.getByTestId("glyph")).toHaveAttribute("height", "9");
  });

  it("распространяет пропсы поверх значений по умолчанию", () => {
    render(<IconPlus aria-label="plus" data-testid="glyph" height={32} width={32} />);

    expect(screen.getByTestId("glyph")).toHaveAttribute("width", "32");
    expect(screen.getByTestId("glyph")).toHaveAttribute("height", "32");
    expect(screen.getByTestId("glyph")).toHaveAttribute("aria-label", "plus");
  });

  it.each(glyphs)("бочка компонентов не экспортирует %s", (name) => {
    expect(Object.keys(Components)).not.toContain(name);
  });
});
