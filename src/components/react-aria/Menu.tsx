import {
  type AriaMenuProps,
  useMenu,
  useMenuItem,
  useMenuTrigger
} from "@react-aria/menu";
import { type Placement } from "@react-aria/overlays";
import { type MenuTriggerProps, useMenuTriggerState } from "@react-stately/menu";
import { type TreeState, useTreeState } from "@react-stately/tree";
import type { Node } from "@react-types/shared";
import { type ReactElement, useRef } from "react";

import Button from "./Button";
import Popover from "./Popover";

interface MenuButtonProps<T> extends AriaMenuProps<T>, MenuTriggerProps {
  label?: string;
}

/**
 * A popup menu, rendered in a popover.
 * See https://react-spectrum.adobe.com/react-aria/useMenu.html.
 */
export default function Menu<T extends object>({
  icon,
  placement,
  ...props
}: MenuButtonProps<T> & {
  icon: ReactElement;
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
        <Popover state={state} triggerRef={triggerRef} placement={placement}>
          <PopupMenu {...props} {...menuProps} />
        </Popover>
      )}
    </>
  );
}

function PopupMenu<T extends object>(props: AriaMenuProps<T>) {
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
