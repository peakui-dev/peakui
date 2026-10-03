import {render, screen} from "@peakui/testing/helpers";
import {createRef} from "react";

import {Button} from "@/components/button/index.ts";
import {
  Fieldset,
  FieldsetActions,
  FieldsetGroup,
  FieldsetLegend,
} from "@/components/fieldset/index.ts";
import {Input} from "@/components/input/index.ts";
import {Label} from "@/components/label/index.ts";
import {TextField} from "@/components/textfield/index.ts";

describe("Fieldset", () => {
  it("names the group with its legend", () => {
    render(
      <Fieldset>
        <Fieldset.Legend>Address</Fieldset.Legend>
      </Fieldset>,
    );

    expect(screen.getByRole("group", {name: "Address"})).toBeInTheDocument();
  });

  it("exposes a data-slot on all four parts", () => {
    render(
      <Fieldset>
        <Fieldset.Legend>Address</Fieldset.Legend>
        <Fieldset.Group>
          <TextField>
            <Label>City</Label>
            <Input />
          </TextField>
        </Fieldset.Group>
        <Fieldset.Actions>
          <Button>Save</Button>
        </Fieldset.Actions>
      </Fieldset>,
    );

    for (const slot of ["fieldset", "fieldset-legend", "fieldset-group", "fieldset-actions"]) {
      expect(document.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
  });

  it("mirrors native disabled as data-disabled on the root", () => {
    render(
      <Fieldset disabled>
        <Fieldset.Legend>Address</Fieldset.Legend>
      </Fieldset>,
    );

    expect(screen.getByRole("group", {name: "Address"})).toHaveAttribute("data-disabled", "true");
  });

  it("reports isDisabled through a child Button's render prop when disabled", () => {
    render(
      <Fieldset disabled>
        <Fieldset.Legend>Address</Fieldset.Legend>
        <Button>{({isDisabled}) => <span>{String(isDisabled)}</span>}</Button>
      </Fieldset>,
    );

    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("leaves a child Button enabled when the fieldset is not disabled", () => {
    render(
      <Fieldset>
        <Fieldset.Legend>Address</Fieldset.Legend>
        <Button>{({isDisabled}) => <span>{String(isDisabled)}</span>}</Button>
      </Fieldset>,
    );

    expect(screen.getByText("false")).toBeInTheDocument();
  });

  it("natively disables a field's input when disabled", () => {
    render(
      <Fieldset disabled>
        <Fieldset.Legend>Address</Fieldset.Legend>
        <TextField>
          <Label>City</Label>
          <Input />
        </TextField>
      </Fieldset>,
    );

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("replaces the element through the render prop", () => {
    render(
      <Fieldset data-testid="root" render={(props) => <section {...props} />}>
        <FieldsetLegend>Address</FieldsetLegend>
      </Fieldset>,
    );

    expect(screen.getByTestId("root").tagName).toBe("SECTION");
  });

  it("forwards ref to each part's element", () => {
    const root = createRef<HTMLFieldSetElement>();
    const legend = createRef<HTMLLegendElement>();
    const group = createRef<HTMLDivElement>();
    const actions = createRef<HTMLDivElement>();

    render(
      <Fieldset ref={root}>
        <Fieldset.Legend ref={legend}>Address</Fieldset.Legend>
        <Fieldset.Group ref={group} />
        <Fieldset.Actions ref={actions} />
      </Fieldset>,
    );

    expect(root.current).toBeInstanceOf(HTMLFieldSetElement);
    expect(legend.current).toBeInstanceOf(HTMLLegendElement);
    expect(group.current).toBeInstanceOf(HTMLDivElement);
    expect(actions.current).toBeInstanceOf(HTMLDivElement);
  });

  it("behaves identically as Fieldset.Group and FieldsetGroup", () => {
    render(
      <>
        <Fieldset>
          <Fieldset.Legend>One</Fieldset.Legend>
          <Fieldset.Group data-testid="namespaced" />
          <Fieldset.Actions data-testid="namespaced-actions" />
        </Fieldset>
        <Fieldset>
          <FieldsetLegend>Two</FieldsetLegend>
          <FieldsetGroup data-testid="flat" />
          <FieldsetActions data-testid="flat-actions" />
        </Fieldset>
      </>,
    );

    expect(screen.getByTestId("namespaced")).toHaveAttribute("data-slot", "fieldset-group");
    expect(screen.getByTestId("flat")).toHaveAttribute("data-slot", "fieldset-group");
    expect(screen.getByTestId("namespaced-actions")).toHaveAttribute(
      "data-slot",
      "fieldset-actions",
    );
    expect(screen.getByTestId("flat-actions")).toHaveAttribute("data-slot", "fieldset-actions");
  });
});
