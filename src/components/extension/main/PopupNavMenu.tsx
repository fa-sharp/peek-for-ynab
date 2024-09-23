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
  usePopover
} from "@react-aria/overlays";
import { type MenuTriggerProps, useMenuTriggerState } from "@react-stately/menu";
import type { OverlayTriggerState } from "@react-stately/overlays";
import { type TreeState, useTreeState } from "@react-stately/tree";
import type { Node } from "@react-types/shared";
import { clsx } from "clsx";
import { type RefObject, useCallback, useRef, useState } from "react";
import { Menu2 } from "tabler-icons-react";

interface MenuButtonProps<T> extends AriaMenuProps<T>, MenuTriggerProps {
  label?: string;
}

/**
 * Dropdown menu for the popup nav. Parts of this can be refactored into more generic components if needed.
 * See https://react-spectrum.adobe.com/react-aria/useMenu.html.
 */
export default function PopupNavMenu<T extends object>({
  animationsEnabled,
  ...props
}: MenuButtonProps<T> & {
  animationsEnabled?: boolean;
}) {
  const [animatingExit, setAnimatingExit] = useState(false);
  const onOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!animationsEnabled || isOpen) return;
      setAnimatingExit(true);
      setTimeout(() => setAnimatingExit(false), 200);
    },
    [animationsEnabled]
  );

  const state = useMenuTriggerState({ onOpenChange, ...props });
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
        <Menu2 aria-hidden />
      </Button>
      {(state.isOpen || animatingExit) && (
        <Popover
          state={state}
          triggerRef={triggerRef}
          offset={4}
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
    <Overlay isExiting={!state.isOpen}>
      <div {...underlayProps} style={{ position: "fixed", inset: 0 }} />
      <div
        {...popoverProps}
        ref={ref}
        className={clsx("rounded", {
          "slide-up-enter": animationsEnabled && state.isOpen,
          "slide-up-exit": animationsEnabled && !state.isOpen
        })}
        style={{
          ...popoverProps.style,
          overflow: "auto",
          boxShadow: "var(--border-light) 0px 6px 10px 0px"
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
