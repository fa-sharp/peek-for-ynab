import { type AriaButtonProps, useButton } from "@react-aria/button";
import {
  type AriaMenuProps,
  useMenu,
  useMenuItem,
  useMenuTrigger
} from "@react-aria/menu";
import {
  type AriaPopoverProps,
  DismissButton,
  Overlay,
  type Placement,
  usePopover
} from "@react-aria/overlays";
import { type MenuTriggerProps, useMenuTriggerState } from "@react-stately/menu";
import type { OverlayTriggerState } from "@react-stately/overlays";
import { type TreeState, useTreeState } from "@react-stately/tree";
import type { Node } from "@react-types/shared";
import { clsx } from "clsx";
import { type ReactElement, type RefObject, useRef } from "react";

interface MenuButtonProps<T> extends AriaMenuProps<T>, MenuTriggerProps {
  label?: string;
}

/**
 * Dropdown menu for the popup nav. Parts of this can be refactored into more generic components if needed.
 * See https://react-spectrum.adobe.com/react-aria/useMenu.html.
 */
export default function PopupNavMenu<T extends object>({
  animationsEnabled,
  icon,
  placement,
  ...props
}: MenuButtonProps<T> & {
  icon: ReactElement;
  animationsEnabled?: boolean;
  placement?: Placement;
}) {
  const state = useMenuTriggerState(props);
  const triggerRef = useRef(null);
  const { menuTriggerProps, menuProps } = useMenuTrigger<T>({}, state, triggerRef);

  return (
    <>
      <Button
        {...menuTriggerProps}
        buttonRef={triggerRef}
        aria-label={props.label}
        title={props.label}
        className="icon-button">
        {icon}
      </Button>
      {state.isOpen && (
        <Popover
          state={state}
          triggerRef={triggerRef}
          placement={placement}
          animationsEnabled={animationsEnabled}>
          <Menu {...props} {...menuProps} />
        </Popover>
      )}
    </>
  );
}

function Menu<T extends object>(props: AriaMenuProps<T>) {
  const state = useTreeState(props);
  const ref = useRef(null);
  const { menuProps } = useMenu(props, state, ref);

  return (
    <menu {...menuProps} ref={ref} className="menu">
      {[...state.collection].map((item) => (
        <MenuItem key={item.key} item={item} state={state} />
      ))}
    </menu>
  );
}

function MenuItem<T>({ item, state }: { item: Node<T>; state: TreeState<T> }) {
  const ref = useRef(null);
  const { menuItemProps, isDisabled } = useMenuItem({ key: item.key }, state, ref);

  if (isDisabled) return null;

  return (
    <li {...menuItemProps} ref={ref}>
      {item.rendered}
    </li>
  );
}

interface PopoverProps extends Omit<AriaPopoverProps, "popoverRef"> {
  children: React.ReactNode;
  state: OverlayTriggerState;
  animationsEnabled?: boolean;
}

function Popover({ children, state, animationsEnabled, ...props }: PopoverProps) {
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
          "slide-up": animationsEnabled && state.isOpen
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

function Button({
  buttonRef,
  children,
  className,
  title,
  ...props
}: AriaButtonProps<"button"> & {
  buttonRef: RefObject<HTMLButtonElement>;
  className?: string;
  title?: string;
}) {
  const { buttonProps } = useButton(props, buttonRef);
  return (
    <button {...buttonProps} ref={buttonRef} className={className} title={title}>
      {children}
    </button>
  );
}
