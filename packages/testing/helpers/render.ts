import type {RenderOptions} from "@testing-library/react";
import type {ReactElement, ReactNode} from "react";

import {render as rtlRender} from "@testing-library/react";

export type PeakUIRenderOptions = Omit<RenderOptions, "wrapper"> & {
  wrapper?: (props: {children: ReactNode}) => ReactNode;
};

/** render из @testing-library/react с обёрткой, принимающей обычную функцию, а не компонент. */
export const render = (ui: ReactElement, options: PeakUIRenderOptions = {}) => {
  const {wrapper, ...rest} = options;

  return rtlRender(ui, {
    ...rest,
    wrapper: wrapper ? ({children}) => wrapper({children}) as ReactElement : undefined,
  });
};
