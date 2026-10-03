import {render, screen} from "@peakui/testing/helpers";
import {TextContext} from "react-aria-components/Text";

import {FieldSlotsGateContext, useHasTextSlot} from "@/hooks/use-has-text-slot.ts";

/*
 * Зонд, а не компонент библиотеки: хук проверяется через то, что он возвращает в реальном дереве
 * с реальным TextContext, а не через возвращаемое значение в вакууме — см. references/testing.md.
 */
const Probe = ({slot = "description"}: {slot?: string}) => (
  <span>{String(useHasTextSlot(slot))}</span>
);

describe("useHasTextSlot", () => {
  it("reports the slot available outside a gate", () => {
    render(<Probe />);

    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("reports the slot unavailable inside a gate with no TextContext slots", () => {
    render(
      <FieldSlotsGateContext value>
        <Probe />
      </FieldSlotsGateContext>,
    );

    expect(screen.getByText("false")).toBeInTheDocument();
  });

  it("reports the slot available inside a gate once TextContext publishes it", () => {
    render(
      <FieldSlotsGateContext value>
        <TextContext value={{slots: {description: {}}}}>
          <Probe />
        </TextContext>
      </FieldSlotsGateContext>,
    );

    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("reports an unrelated slot unavailable inside a gate", () => {
    render(
      <FieldSlotsGateContext value>
        <TextContext value={{slots: {errorMessage: {}}}}>
          <Probe />
        </TextContext>
      </FieldSlotsGateContext>,
    );

    expect(screen.getByText("false")).toBeInTheDocument();
  });
});
