import { useCombobox } from "downshift";
import { useState } from "react";

import type { CachedPayee } from "~lib/context/ynabContext";

interface Props {
  payees?: CachedPayee[];
  /** If only name provided, assume new payee */
  selectPayee: (payee: CachedPayee | { name: string }) => void;
  disabled?: boolean;
}

function getFilter(inputValue?: string) {
  return (payee: CachedPayee) =>
    !inputValue || payee.name.toLowerCase().includes(inputValue.toLowerCase());
}

export default function PayeeSelect({ payees, selectPayee, disabled }: Props) {
  const [payeeList, setPayeeList] = useState(payees ? [...payees] : []);
  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    getComboboxProps,
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
      if (inputValue && (!selectedItem || inputValue !== selectedItem.name))
        selectPayee({ name: inputValue }); // New payee
    },
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem) selectPayee(selectedItem); // Existing payee
    }
  });

  return (
    <div className="form-input">
      <label {...getLabelProps()}>Payee</label>
      <div className="flex-col" {...getComboboxProps()}>
        <input required {...getInputProps()} disabled={disabled} />
        <ul
          className={`select-dropdown-list ${isOpen ? "rounded" : ""}`}
          {...getMenuProps()}>
          {!isOpen ? null : payeeList.length === 0 ? (
            <li className="select-dropdown-item">
              --New payee &apos;{inputValue}&apos;--
            </li>
          ) : (
            payeeList.map((payee, index) => {
              let itemClassName = "select-dropdown-item";
              if (highlightedIndex === index) itemClassName += " highlighted";
              if (selectedItem?.id === payee.id) itemClassName += " selected";
              return (
                <li
                  className={itemClassName}
                  key={payee.id}
                  {...getItemProps({ item: payee, index })}>
                  {payee.name}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
