import {renderToStaticMarkup} from "react-dom/server";
import {expect, it} from "vitest";

import {CustomVariants} from "@/demos/button/custom-variants";

function modifiers(html: string, prefix: string): string[] {
  const classes = [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    (match[1] ?? "").split(/\s+/),
  );

  return classes.filter((name) => name.startsWith(prefix));
}

it("renders exactly one size and one variant modifier per button", () => {
  const html = renderToStaticMarkup(<CustomVariants />);
  const buttons = html.match(/<button[^>]*>/g) ?? [];

  expect(buttons).toHaveLength(2);

  for (const button of buttons) {
    expect(
      modifiers(button, "button--").filter((name) => /^button--(sm|md|lg)$/.test(name)),
    ).toHaveLength(1);
    expect(
      modifiers(button, "button--").filter(
        (name) => !/^button--(sm|md|lg|icon-only|full-width)$/.test(name),
      ),
    ).toHaveLength(1);
  }
});
