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
import { type RefObject, useRef } from "react";
import { Menu2 } from "tabler-icons-react";

interface MenuButtonProps<T> extends AriaMenuProps<T>, MenuTriggerProps {
  label?: string;
}

/**
 * Menu for the popup navigation. Parts of this can be refactored into a more generic component if needed.
 * See https://react-spectrum.adobe.com/react-aria/useMenu.html.
 */
export default function PopupNavMenu<T extends object>(props: MenuButtonProps<T>) {
  const state = useMenuTriggerState(props);
  const triggerRef = useRef(null);
  const { menuTriggerProps, menuProps } = useMenuTrigger<T>({}, state, triggerRef);

  return (
    <>
      <Button
        {...menuTriggerProps}
        buttonRef={triggerRef}
        aria-label={props.label}
        className="icon-button">
        <Menu2 aria-hidden />
      </Button>
      {state.isOpen && (
        <Popover state={state} triggerRef={triggerRef} offset={4}>
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
    <li {...menuItemProps} ref={ref} className="flex-row gap-sm">
      {item.rendered}
    </li>
  );
}

interface PopoverProps extends Omit<AriaPopoverProps, "popoverRef"> {
  children: React.ReactNode;
  state: OverlayTriggerState;
}

function Popover({ children, state, ...props }: PopoverProps) {
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
        className="rounded"
        style={{
          ...popoverProps.style,
          overflow: "auto",
          boxShadow: "var(--border-light) 0px 6px 12px 0px"
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
  ...props
}: AriaButtonProps<"button"> & {
  buttonRef: RefObject<HTMLButtonElement>;
  className?: string;
}) {
  const { buttonProps } = useButton(props, buttonRef);
  return (
    <button {...buttonProps} ref={buttonRef} className={className}>
      {children}
    </button>
  );
}
