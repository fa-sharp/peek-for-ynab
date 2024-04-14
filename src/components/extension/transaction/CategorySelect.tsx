import { clsx } from "clsx";
import { useCombobox } from "downshift";
import {
  type ForwardedRef,
  Fragment,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState
} from "react";
import { ChevronDown, X } from "tabler-icons-react";
import type { Category, CurrencyFormat } from "ynab";

import { useYNABContext } from "~lib/context";
import { formatCurrency, searchWithinString } from "~lib/utils";

interface Props {
  currentCategory?: Category | null;
  categories?: Category[];
  selectCategory: (category: Category | null) => void;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  movingMoney?: boolean;
}

function CategorySelect(
  {
    currentCategory,
    categories,
    selectCategory,
    disabled,
    label,
    placeholder,
    movingMoney
  }: Props,
  ref: ForwardedRef<HTMLInputElement | null>
) {
  const { categoryGroupsData, selectedBudgetData } = useYNABContext();

  /** Ignored categories when adding a transaction (Deferred Income, CCP categories) */
  const ignoredCategoryIds = useMemo(() => {
    if (!categoryGroupsData) return undefined;
    const ignoredIds = new Set(
      categoryGroupsData.slice(0, 2).flatMap((cg) => cg.categories.map((c) => c.id))
    );
    // Only ignore Inflow: RTA category if we're moving money
    if (!movingMoney) ignoredIds.delete(categoryGroupsData[0]?.categories[0]?.id);
    return ignoredIds;
  }, [categoryGroupsData, movingMoney]);

  const getFilter = useCallback(
    (inputValue?: string) => {
      return (category: Category) =>
        !ignoredCategoryIds?.has(category.id) &&
        (!inputValue || searchWithinString(category.name, inputValue));
    },
    [ignoredCategoryIds]
  );

  const [categoryList, setCategoryList] = useState(
    categories ? categories.filter(getFilter()) : []
  );

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
  } = useCombobox<Category | null>({
    items: categoryList,
    selectedItem: currentCategory,
    itemToString(category) {
      if (!category) return "";
      if (category.name === "Inflow: Ready to Assign") return category.name;
      return `${category.name} (${formatCurrency(
        category.balance,
        selectedBudgetData?.currencyFormat
      )})`;
    },
    onInputValueChange({ inputValue }) {
      setCategoryList(categories?.filter(getFilter(inputValue)) || []);
    },
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem) {
        selectCategory(selectedItem);
      }
    }
  });

  return (
    <div className="form-input">
      <label {...getLabelProps()}>{label || "Category"}</label>
      <div className="flex-col">
        <input
          {...getInputProps({
            ref: (node) => {
              inputRef.current = node;
              ref && (ref instanceof Function ? ref(node) : (ref.current = node));
            }
          })}
          className={selectedItem ? "item-selected" : ""}
          placeholder={placeholder ?? "(Leave blank to auto-categorize)"}
          disabled={disabled || !!selectedItem}
        />
        {selectedItem ? (
          <button
            ref={clearButtonRef}
            type="button"
            className="select-button-right icon-button"
            aria-label="Clear category"
            onClick={() => {
              reset();
              selectCategory(null);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}>
            <X />
          </button>
        ) : (
          <button
            type="button"
            className="select-button-right icon-button"
            aria-label="Open category list"
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
          {!isOpen ? null : categoryList.length === 0 ? (
            <li className="select-dropdown-item">--Category not found!--</li>
          ) : (
            categoryGroupsData
              ?.filter((group) =>
                categoryList.find((c) => c.category_group_id === group.id)
              )
              .map((group) => (
                <Fragment key={group.id}>
                  {group.name !== "Internal Master Category" && (
                    <li>
                      <h3 className="select-dropdown-heading">{group.name}</h3>
                    </li>
                  )}
                  {categoryList
                    .filter((c) => c.category_group_id === group.id)
                    .map((category) => {
                      const itemIndex = categoryList.findIndex(
                        (c) => c.id === category.id
                      );
                      return (
                        <li
                          className={clsx("select-dropdown-item", {
                            highlighted: highlightedIndex === itemIndex,
                            selected: selectedItem?.id === category.id
                          })}
                          key={category.id}
                          {...getItemProps({
                            item: category,
                            index: itemIndex
                          })}>
                          {formatCategoryWithBalance(
                            category,
                            selectedBudgetData?.currencyFormat
                          )}
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

function formatCategoryWithBalance(category: Category, currencyFormat?: CurrencyFormat) {
  if (category.name === "Inflow: Ready to Assign") return <>{category.name}</>;

  return (
    <>
      {category.name} (
      <span
        className={clsx("currency", {
          positive: category.balance > 0,
          negative: category.balance < 0
        })}>
        {formatCurrency(category.balance, currencyFormat)}
      </span>
      )
    </>
  );
}

export default forwardRef(CategorySelect);
