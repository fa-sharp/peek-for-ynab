import { clsx } from "clsx";
import { useCombobox } from "downshift";
import { useState } from "react";

import type { CachedPayee } from "~lib/context/ynabContext";
import { searchWithinString } from "~lib/utils";

interface Props {
  payees?: CachedPayee[];
  /** If only name provided, assume new payee */
  selectPayee: (payee: CachedPayee | { name: string }) => void;
  disabled?: boolean;
}

function getFilter(inputValue?: string) {
  return (payee: CachedPayee) =>
    (!inputValue || searchWithinString(payee.name, inputValue)) &&
    payee.transferId == null;
}

export default function PayeeSelect({ payees, selectPayee, disabled }: Props) {
  const [payeeList, setPayeeList] = useState(() => {
    if (!payees) return [];
    return [...payees.filter((payee) => payee.transferId == null)];
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
  } = useCombobox<CachedPayee | null>({
    items: payeeList,
    itemToString(payee) {
      return payee ? payee.name : "";
    },
    onInputValueChange({ inputValue, selectedItem }) {
      setPayeeList(payees?.filter(getFilter(inputValue)) || []);
      // If user is inputting a new payee name and it's not a transfer, create a new payee
      if (inputValue && (!selectedItem || inputValue !== selectedItem.name))
        selectPayee({ name: inputValue });
    },
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem) selectPayee(selectedItem); // Select existing payee
    }
  });

  return (
    <div className="form-input">
      <label {...getLabelProps()}>Payee</label>
      <div className="flex-col">
        <input required {...getInputProps()} disabled={disabled} />
        <ul
          className={`select-dropdown-list ${isOpen ? "rounded" : ""}`}
          {...getMenuProps()}>
          {!isOpen ? null : payeeList.length === 0 ? (
            <li className="select-dropdown-item">
              --New payee &apos;{inputValue}&apos;--
            </li>
          ) : (
            payeeList.map((payee, index) => (
              <li
                className={clsx("select-dropdown-item", {
                  highlighted: highlightedIndex === index,
                  selected: selectedItem?.id === payee.id
                })}
                key={payee.id}
                {...getItemProps({ item: payee, index })}>
                {payee.name}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
