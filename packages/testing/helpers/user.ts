import {pointerMap} from "@react-aria/test-utils";
import userEvent from "@testing-library/user-event";

export type SetupUserOptions = Parameters<typeof userEvent.setup>[0];

/*
 * userEvent в форме, которую ожидает RAC: delay null, потому что usePress не завязан на таймеры,
 * и pointerMap — без него последовательность указателя не совпадает с той, что слушает RAC.
 */
export const setupUser = (options?: SetupUserOptions) =>
  userEvent.setup({
    delay: null,
    pointerMap,
    ...options,
  });
