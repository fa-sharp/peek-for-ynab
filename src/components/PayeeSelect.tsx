import { useCombobox } from "downshift";
import { useState } from "react";

import type { CachedPayee } from "~lib/context/ynabContext";

interface Props {
  payees?: CachedPayee[];
  /** If only name provided, assume new payee */
  selectPayee: (payee: CachedPayee | { name: string }) => void;
  disabled?: boolean;
  isTransfer?: boolean;
}

function getFilter(inputValue?: string, isTransfer?: boolean) {
  return (payee: CachedPayee) =>
    (!inputValue || payee.name.toLowerCase().includes(inputValue.toLowerCase())) &&
    (isTransfer ? payee.transferId != null : payee.transferId == null);
}

export default function PayeeSelect({
  payees,
  selectPayee,
  isTransfer = false,
  disabled
}: Props) {
  const [payeeList, setPayeeList] = useState(() => {
    if (!payees) return [];
    return [
      ...payees.filter((payee) =>
        isTransfer ? payee.transferId != null : payee.transferId == null
      )
    ];
  });
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
      setPayeeList(payees?.filter(getFilter(inputValue, isTransfer)) || []);
      // If user is inputting a new payee name and it's not a transfer, create a new payee
      if (
        !isTransfer &&
        inputValue &&
        (!selectedItem || inputValue !== selectedItem.name)
      )
        selectPayee({ name: inputValue });
    },
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem) selectPayee(selectedItem); // Select existing payee
    }
  });

  return (
    <div className="form-input">
      <label {...getLabelProps()}>{isTransfer ? "To" : "Payee"}</label>
      <div className="flex-col" {...getComboboxProps()}>
        <input required {...getInputProps()} disabled={disabled} />
        <ul
          className={`select-dropdown-list ${isOpen ? "rounded" : ""}`}
          {...getMenuProps()}>
          {!isOpen ? null : payeeList.length === 0 ? (
            isTransfer ? (
              <li className="select-dropdown-item">--Transfer account not found!--</li>
            ) : (
              <li className="select-dropdown-item">
                --New payee &apos;{inputValue}&apos;--
              </li>
            )
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
