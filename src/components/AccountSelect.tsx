import { useCombobox } from "downshift";
import { useCallback, useState } from "react";
import type { Account } from "ynab";

import { useYNABContext } from "~lib/context";
import { formatCurrency } from "~lib/utils";

interface Props {
  initialAccount?: Account;
  accounts?: Account[];
  selectAccount: (account: Account) => void;
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

  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    getComboboxProps,
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
        <input required {...getInputProps()} disabled={disabled} />
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
