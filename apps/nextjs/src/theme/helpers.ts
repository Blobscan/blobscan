import type { SystemProps } from "@chakra-ui/styled-system";

/**
 * Styles to disable the native focus ring on chakra components.
 * See https://github.com/chakra-ui/chakra-ui/issues/708
 */
export function chakraFocusRingDisabledStyles(): SystemProps {
  return {
    _focusVisible: { boxShadow: "none", outline: "none" },
  };
}
