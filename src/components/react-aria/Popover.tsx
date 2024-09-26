import {
  type AriaPopoverProps,
  DismissButton,
  Overlay,
  usePopover
} from "@react-aria/overlays";
import type { OverlayTriggerState } from "@react-stately/overlays";
import { clsx } from "clsx";
import { useRef } from "react";

interface PopoverProps extends Omit<AriaPopoverProps, "popoverRef"> {
  children: React.ReactNode;
  state: OverlayTriggerState;
}

/**
 * See https://react-spectrum.adobe.com/react-aria/usePopover.html.
 */
export default function Popover({ children, state, ...props }: PopoverProps) {
  const ref = useRef(null);
  const { popoverProps, underlayProps } = usePopover(
    { ...props, popoverRef: ref },
    state
  );

  return (
    <Overlay>
      <div {...underlayProps} style={{ position: "fixed", inset: 0 }} />
      <div
        {...popoverProps}
        ref={ref}
        className={clsx("rounded", {
          "slide-up": state.isOpen
        })}
        style={{
          ...popoverProps.style,
          overflow: "auto",
          boxShadow: "var(--border-light) 0px 2px 7px 1px"
        }}>
        <DismissButton onDismiss={state.close} />
        {children}
        <DismissButton onDismiss={state.close} />
      </div>
    </Overlay>
  );
}
