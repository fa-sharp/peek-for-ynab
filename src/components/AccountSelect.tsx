import { useCombobox } from "downshift";
import { useCallback, useRef, useState } from "react";
import { ChevronDown, X } from "tabler-icons-react";
import type { Account } from "ynab";

import { useYNABContext } from "~lib/context";
import { formatCurrency } from "~lib/utils";

interface Props {
  initialAccount?: Account | null;
  accounts?: Account[];
  selectAccount: (account: Account | null) => void;
  isTransfer?: "from" | "to";
  disabled?: boolean;
}

export default function AccountSelect({
  initialAccount,
  accounts,
  selectAccount,
  isTransfer,
  disabled
}: Props) {
  const { selectedBudgetData } = useYNABContext();

  const [accountList, setAccountList] = useState(accounts ? [...accounts] : []);

  const getFilter = useCallback((inputValue?: string) => {
    return (account: Account) =>
      !inputValue || account.name.toLowerCase().includes(inputValue.toLowerCase());
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isOpen,
    openMenu,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    getComboboxProps,
    setHighlightedIndex,
    reset,
    highlightedIndex,
    selectedItem
  } = useCombobox<Account | null>({
    items: accountList,
    initialSelectedItem: initialAccount,
    itemToString(account) {
      if (!account) return "";
      return `${account.name} (${formatCurrency(
        account.balance,
        selectedBudgetData?.currencyFormat
      )})`;
    },
    onInputValueChange({ inputValue }) {
      setAccountList(accounts?.filter(getFilter(inputValue)) || []);
    },
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem) selectAccount(selectedItem);
    }
  });

  return (
    <div className="form-input">
      <label {...getLabelProps()}>
        {!isTransfer ? "Account" : isTransfer === "from" ? "From" : "To"}
      </label>
      <div className="flex-col" {...getComboboxProps()}>
        <input
          required
          {...getInputProps({ ref: inputRef })}
          className={selectedItem ? "item-selected" : ""}
          readOnly={selectedItem}
          disabled={disabled}
        />
        {selectedItem ? (
          <button
            type="button"
            className="select-button-right icon-button"
            aria-label="Clear account"
            onClick={() => {
              reset();
              selectAccount(null);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}>
            <X />
          </button>
        ) : (
          <button
            type="button"
            className="select-button-right icon-button"
            aria-label="Open account list"
            tabIndex={-1}
            onClick={() => {
              openMenu();
              setHighlightedIndex(0);
              inputRef.current?.focus();
            }}>
            <ChevronDown />
          </button>
        )}

        <ul
          className={`select-dropdown-list ${isOpen ? "rounded" : ""}`}
          {...getMenuProps()}>
          {!isOpen ? null : accountList.length === 0 ? (
            <li className="select-dropdown-item">--Account not found!--</li>
          ) : (
            accountList.map((account, index) => {
              let itemClassName = "select-dropdown-item";
              if (highlightedIndex === index) itemClassName += " highlighted";
              if (selectedItem?.id === account.id) itemClassName += " selected";
              return (
                <li
                  className={itemClassName}
                  key={account.id}
                  {...getItemProps({ item: account, index })}>
                  {account.name} (
                  <span
                    className={
                      "currency " +
                      (account.balance < 0
                        ? "negative"
                        : account.balance > 0
                        ? "positive"
                        : "")
                    }>
                    {formatCurrency(account.balance, selectedBudgetData?.currencyFormat)}
                  </span>
                  )
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
