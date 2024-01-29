import { clsx } from "clsx";
import { useCombobox } from "downshift";
import {
  type ForwardedRef,
  Fragment,
  forwardRef,
  useCallback,
  useRef,
  useState
} from "react";
import { ChevronDown, X } from "tabler-icons-react";
import type { Account } from "ynab";

import { useYNABContext } from "~lib/context";
import { formatCurrency, searchWithinString } from "~lib/utils";

interface Props {
  currentAccount?: Account | null;
  accounts?: Account[];
  selectAccount: (account: Account | null) => void;
  isTransfer?: "from" | "to";
  disabled?: boolean;
}

function AccountSelect(
  { currentAccount, accounts, isTransfer, disabled, selectAccount }: Props,
  ref: ForwardedRef<HTMLInputElement | null>
) {
  const { selectedBudgetData } = useYNABContext();

  const [accountList, setAccountList] = useState(accounts ? [...accounts] : []);

  const getFilter = useCallback((inputValue?: string) => {
    return (account: Account) =>
      !inputValue || searchWithinString(account.name, inputValue);
  }, []);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);

  const {
    isOpen,
    openMenu,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    setHighlightedIndex,
    reset,
    highlightedIndex,
    selectedItem
  } = useCombobox<Account | null>({
    items: accountList,
    selectedItem: currentAccount,
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
      if (selectedItem) {
        selectAccount(selectedItem);
      }
    }
  });

  return (
    <div className="form-input">
      <label {...getLabelProps()}>
        {!isTransfer
          ? "Account"
          : isTransfer === "from"
            ? "Account (From)"
            : "Payee (To)"}
      </label>
      <div className="flex-col">
        <input
          required
          {...getInputProps({
            ref: (node) => {
              inputRef.current = node;
              ref && (ref instanceof Function ? ref(node) : (ref.current = node));
            }
          })}
          className={selectedItem ? "item-selected" : ""}
          disabled={disabled || !!selectedItem}
        />
        {selectedItem ? (
          <button
            ref={clearButtonRef}
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
            (["Budget", "Tracking"] as const)
              .filter((type) =>
                accountList.find((a) => (type === "Budget" ? a.on_budget : !a.on_budget))
              )
              .map((type) => (
                <Fragment key={type}>
                  <li>
                    <h3 className="heading-medium">{type}</h3>
                  </li>
                  {accountList
                    .filter((a) => (type === "Budget" ? a.on_budget : !a.on_budget))
                    .map((account) => {
                      const itemIndex = accountList.findIndex((a) => a.id === account.id);
                      return (
                        <li
                          className={clsx("select-dropdown-item", {
                            highlighted: highlightedIndex === itemIndex,
                            selected: selectedItem?.id === account.id
                          })}
                          key={account.id}
                          {...getItemProps({ item: account, index: itemIndex })}>
                          {account.name} (
                          <span
                            className={clsx("currency", {
                              positive: account.balance > 0,
                              negative: account.balance < 0
                            })}>
                            {formatCurrency(
                              account.balance,
                              selectedBudgetData?.currencyFormat
                            )}
                          </span>
                          )
                        </li>
                      );
                    })}
                </Fragment>
              ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default forwardRef(AccountSelect);
