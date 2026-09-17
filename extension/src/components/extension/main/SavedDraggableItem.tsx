import { useSortable } from "@dnd-kit/react/sortable";
import { type RefObject, useRef } from "react";

/** A draggable item for the saved categories and accounts views */
export default function SavedDraggableItem({
  id,
  index,
  children,
  isDragDisabled,
}: {
  id: string;
  index: number;
  children?: (handleRef: RefObject<HTMLButtonElement | null>) => React.ReactNode;
  isDragDisabled?: boolean;
}) {
  const itemRef = useRef<HTMLLIElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);

  useSortable({
    id,
    index,
    element: itemRef,
    handle: handleRef,
    disabled: isDragDisabled,
  });

  return (
    <li ref={itemRef} tabIndex={-1}>
      {children?.(handleRef)}
    </li>
  );
}
