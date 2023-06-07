import { useCombobox } from "downshift";
import { useCallback, useRef, useState } from "react";
import { X } from "tabler-icons-react";
import type { Account } from "ynab";

import { useYNABContext } from "~lib/context";
import { formatCurrency } from "~lib/utils";

interface Props {
  initialAccount?: Account | null;
  accounts?: Account[];
  selectAccount: (account: Account | null) => void;
  isTransfer?: boolean;
  disabled?: boolean;
}

export default function AccountSelect({
  initialAccount,
  accounts,
  selectAccount,
  isTransfer = false,
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
    getLabelProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    getComboboxProps,
    reset,
    openMenu,
    highlightedIndex,
    selectedItem
  } = useCombobox<Account | null>({
    items: accountList,
    initialSelectedItem: initialAccount,
    itemToString(account) {
      return account ? account.name : "";
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
      <label {...getLabelProps()}>{isTransfer ? "From" : "Account"}</label>
      <div className="flex-col" {...getComboboxProps()}>
        {selectedItem && (
          <button
            type="button"
            tabIndex={-1}
            className="select-clear-button icon-button"
            aria-label="Clear account"
            onClick={() => {
              reset();
              selectAccount(null);
              openMenu();
              inputRef.current?.focus();
            }}>
            <X color="gray" />
          </button>
        )}
        <input required {...getInputProps({ ref: inputRef })} disabled={disabled} />
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
                  {`${account.name} (${formatCurrency(
                    account.balance,
                    selectedBudgetData?.currencyFormat
                  )})`}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
