import { type Placement, useOverlayTrigger } from "@react-aria/overlays";
import {
  type OverlayTriggerProps,
  useOverlayTriggerState
} from "@react-stately/overlays";
import { cloneElement, useRef } from "react";

import Button from "./Button";
import Popover from "./Popover";

interface TooltipProps extends OverlayTriggerProps {
  label: string;
  icon?: React.ReactNode;
  placement?: Placement;
  children: React.ReactElement;
}

export default function Tooltip({
  label,
  icon,
  placement,
  children,
  ...props
}: TooltipProps) {
  const ref = useRef(null);
  const state = useOverlayTriggerState(props);
  const { triggerProps, overlayProps } = useOverlayTrigger(
    { type: "dialog" },
    state,
    ref
  );

  return (
    <>
      <Button
        {...triggerProps}
        aria-label={label}
        title={label}
        buttonRef={ref}
        className="icon-button">
        {icon}
      </Button>
      {state.isOpen && (
        <Popover {...props} triggerRef={ref} state={state} placement={placement}>
          {cloneElement(children, overlayProps)}
        </Popover>
      )}
    </>
  );
}
