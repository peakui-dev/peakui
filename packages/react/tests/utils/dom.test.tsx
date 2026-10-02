import {render, screen} from "@peakui/testing/helpers";
import {createRef} from "react";

import {dom} from "@/utils/dom";

describe("dom", () => {
  it("renders the intrinsic element it is addressed as", () => {
    render(<dom.span data-testid="el">text</dom.span>);

    expect(screen.getByTestId("el").tagName).toBe("SPAN");
  });

  it("caches the component per element type", () => {
    expect(dom.span).toBe(dom.span);
    expect(dom.span).not.toBe(dom.div);
  });

  it("lets a render prop replace the element and receive the props", () => {
    render(
      <dom.span data-testid="el" render={(props) => <em {...props} data-rendered="true" />}>
        text
      </dom.span>,
    );
    const el = screen.getByTestId("el");

    expect(el.tagName).toBe("EM");
    expect(el).toHaveAttribute("data-rendered", "true");
  });

  it("forwards ref to the default element", () => {
    const ref = createRef<HTMLSpanElement>();

    render(<dom.span ref={ref}>text</dom.span>);

    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("forwards ref through a render prop that passes props through", () => {
    const ref = createRef<HTMLElement>();

    render(
      <dom.span ref={ref} render={(props) => <em {...props} />}>
        text
      </dom.span>,
    );

    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
