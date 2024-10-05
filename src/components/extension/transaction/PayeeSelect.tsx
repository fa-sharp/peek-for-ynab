import { useVirtualizer } from "@tanstack/react-virtual";
import { clsx } from "clsx";
import { useCombobox } from "downshift";
import {
  type ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import type { CachedPayee } from "~lib/types";
import { searchWithinString } from "~lib/utils";

interface Props {
  payees?: CachedPayee[];
  /** If only name provided, assume new payee */
  selectPayee: (payee: CachedPayee | { name: string }) => void;
  initialPayee?: CachedPayee | { name: string } | null;
  disabled?: boolean;
  required?: boolean;
}

function getFilter(inputValue?: string) {
  return (payee: CachedPayee) =>
    (!inputValue || searchWithinString(payee.name, inputValue)) &&
    payee.transferId == null;
}

function estimateSize() {
  return 22;
}

function PayeeSelect(
  { payees, initialPayee, selectPayee, disabled, required = true }: Props,
  ref: ForwardedRef<HTMLInputElement | null>
) {
  const [payeeList, setPayeeList] = useState<CachedPayee[]>([]);
  useEffect(() => payees && setPayeeList(payees.filter(getFilter())), [payees]);

  const getPayeeKey = useCallback((index: number) => payeeList[index].id, [payeeList]);

  const listRef = useRef<HTMLUListElement>(null);
  const listVirtualizer = useVirtualizer({
    count: payeeList.length,
    estimateSize,
    getScrollElement: () => listRef.current,
    getItemKey: getPayeeKey,
    overscan: 2
  });
  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    inputValue,
    highlightedIndex,
    selectedItem
  } = useCombobox<CachedPayee | { name: string } | null>({
    items: payeeList,
    itemToString(payee) {
      return payee ? payee.name : "";
    },
    initialSelectedItem: initialPayee,
    onInputValueChange({ inputValue, selectedItem }) {
      setPayeeList(payees?.filter(getFilter(inputValue)) || []);
      // If user is inputting a new payee name and it's not a transfer, create a new payee
      if (inputValue !== undefined && (!selectedItem || inputValue !== selectedItem.name))
        selectPayee({ name: inputValue });
    },
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem) selectPayee(selectedItem); // Select existing payee
    },
    onHighlightedIndexChange: ({ highlightedIndex, type }) => {
      if (
        type !== useCombobox.stateChangeTypes.MenuMouseLeave &&
        typeof highlightedIndex === "number"
      )
        listVirtualizer.scrollToIndex(highlightedIndex);
    },
    scrollIntoView: () => {}
  });

  return (
    <div className="form-input">
      <label {...getLabelProps()}>Payee</label>
      <div className="flex-col">
        <input required={required} {...getInputProps({ ref })} disabled={disabled} />
        <ul
          className={clsx("select-dropdown-list", { "rounded shadow": isOpen })}
          {...getMenuProps({ ref: listRef })}>
          {!isOpen ? null : payeeList.length === 0 ? (
            <li className="select-dropdown-item">
              --New payee &apos;{inputValue}&apos;--
            </li>
          ) : (
            <>
              <li key="total-size" style={{ height: listVirtualizer.getTotalSize() }} />
              {listVirtualizer.getVirtualItems().map((virtualItem) => (
                <li
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  className={clsx("select-dropdown-item virtual", {
                    highlighted: highlightedIndex === virtualItem.index,
                    selected:
                      !!selectedItem &&
                      "id" in selectedItem &&
                      selectedItem?.id === virtualItem.key
                  })}
                  {...getItemProps({
                    ref: listVirtualizer.measureElement,
                    item: payeeList[virtualItem.index],
                    index: virtualItem.index
                  })}
                  style={{
                    transform: `translateY(${virtualItem.start}px)`
                  }}>
                  {payeeList[virtualItem.index].name}
                </li>
              ))}
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

export default forwardRef(PayeeSelect);
