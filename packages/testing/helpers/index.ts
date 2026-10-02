export {render, type PeakUIRenderOptions} from "./render.ts";
export {setupUser, type SetupUserOptions} from "./user.ts";
export {ssrSmoke, type SsrSmokeOptions} from "./ssr.ts";

export {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
  type RenderResult,
} from "@testing-library/react";

export {installPointerEvent, pointerMap, User} from "@react-aria/test-utils";
