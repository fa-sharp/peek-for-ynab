import { type AriaToolbarProps, useToolbar } from "@react-aria/toolbar";
import { type ReactNode, useRef } from "react";

interface Props extends AriaToolbarProps {
  children: ReactNode;
  className?: string;
}

export default function Toolbar(props: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { toolbarProps } = useToolbar(props, ref);

  return (
    <div ref={ref} {...toolbarProps} className={props.className}>
      {props.children}
    </div>
  );
}
