import { type AriaButtonProps, useButton } from "@react-aria/button";
import type { RefObject } from "react";

export default function ReactAriaButton({
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
