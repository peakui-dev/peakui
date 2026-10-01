# Testing

Three tiers, assigned by risk. Coverage is a floor, never the goal.

## The tiers

| Tier    | File                             | Runs in   | Scope                                                      |
| ------- | -------------------------------- | --------- | ---------------------------------------------------------- |
| jsdom   | `<component-name>.test.tsx`      | vitest    | The bulk of behaviour contracts. Always present.           |
| SSR     | `<component-name>.ssr.test.tsx`  | vitest    | Client SSR smoke — `renderToString` → `hydrateRoot`. Risk-based. |
| browser | `apps/storybook/e2e/<Name>.spec.ts` | Playwright | Real layout, pointer capture, portal focus containment, transitions. Risk-based. |

**jsdom is mandatory. The other two are added when the risk exists**, not for coverage:

- Add an **SSR** suite when the component generates ids, formats dates, or has a client-only branch.
  A client-only portal (toast, tooltip) does not need one.
- Add a **browser** suite when correctness depends on something jsdom fakes: measured geometry,
  pointer capture, focus containment inside a portal, or a transition. Never fake geometry in jsdom
  to chase a number.

## What to query

Role, label, then text — in that order.

```tsx
screen.getByRole("button", {name: "Удалить"});
screen.getByLabelText("Город");
```

Fall back to `data-slot` only when none of those can identify the element. `getByTestId` is a last
resort and needs a reason in a comment.

## What never to assert

- **Colours or computed styles.** They live in CSS and change with the theme.
- **Full class lists.** Assert one meaningful BEM modifier at most; prefer the `data-*` attribute.
- **RAC internals** — its generated ids, its private data attributes, its DOM nesting.
- **Hook internals.** Test the component's behaviour, not a hook's return value.

Assert instead on: rendered roles and names, `data-*` state attributes, what the user can do, and
what handlers receive.

```tsx
// ✅ behaviour and public state
expect(screen.getByRole("button")).toHaveAttribute("data-disabled");

// ❌ implementation
expect(container.firstChild).toHaveClass("chip chip--md chip--solid");
```

## Structure and naming

```tsx
describe("Chip", () => {
  describe("dismiss", () => {
    it("вызывает onDismiss по клику", async () => {
      const onDismiss = vi.fn();
      const user = setupUser();
      render(<Chip onDismiss={onDismiss}>Тег</Chip>);

      await user.click(screen.getByRole("button", {name: /удалить/i}));

      expect(onDismiss).toHaveBeenCalledOnce();
    });
  });
});
```

- `describe("Component")`, nested `describe` per concern.
- SSR suites: `describe("Component SSR")`. Browser: `describe("Component (browser)")`.
- Test names in Russian, stating the behaviour.
- Fake timers per-suite only, and wire `advanceTimers` into the user-event setup when you use them.

## The minimum a jsdom suite covers

| Area          | What                                                        |
| ------------- | ----------------------------------------------------------- |
| Render        | default props produce the expected role and content          |
| Variants      | each variant and size applies its modifier / `data-*`         |
| States        | disabled, invalid, loading, selected — including that a disabled control does not fire handlers |
| Interaction   | click, keyboard, typing, focus movement                      |
| Accessibility | accessible name present, roles correct, keyboard path works   |
| Parts         | both call styles (`<Chip.Root>` and `<ChipRoot>`) behave identically |
| Edge cases    | empty collection, missing optional part, very long content    |

## Visual regression

VRT runs against Storybook stories in `apps/storybook`. A new variant means a new story; a story is
how a visual state becomes testable. Snapshots cover light, dark, and forced-colors.

## Not tested here

No data-fetching tests — `@peakui/react` does no I/O. A component that appears to need one is taking
on a responsibility that belongs to the consumer.
