import { useCombobox } from "downshift";
import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "tabler-icons-react";
import type { Category, CurrencyFormat } from "ynab";

import { useYNABContext } from "~lib/context";
import { formatCurrency } from "~lib/utils";

interface Props {
  initialCategory?: Category | null;
  categories?: Category[];
  selectCategory: (category: Category | null) => void;
  disabled?: boolean;
}

export default function CategorySelect({
  initialCategory,
  categories,
  selectCategory,
  disabled
}: Props) {
  const { categoryGroupsData, selectedBudgetData } = useYNABContext();

  /** Ignored categories when adding a transaction (Deferred Income, CCP categories) */
  const ignoredCategoryIds = useMemo(() => {
    if (!categoryGroupsData) return undefined;
    const ignoredIds = new Set(
      categoryGroupsData.slice(0, 2).flatMap((cg) => cg.categories.map((c) => c.id))
    );
    ignoredIds.delete(categoryGroupsData[0]?.categories[0]?.id); // Don't ignore Inflow: RTA category
    return ignoredIds;
  }, [categoryGroupsData]);

  const getFilter = useCallback(
    (inputValue?: string) => {
      return (category: Category) =>
        !ignoredCategoryIds?.has(category.id) &&
        (!inputValue || category.name.toLowerCase().includes(inputValue.toLowerCase()));
    },
    [ignoredCategoryIds]
  );

  const [categoryList, setCategoryList] = useState(
    categories ? categories.filter(getFilter()) : []
  );

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
  } = useCombobox<Category | null>({
    items: categoryList,
    initialSelectedItem: initialCategory,
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
      if (selectedItem) selectCategory(selectedItem);
    }
  });

  return (
    <div className="form-input">
      <label {...getLabelProps()}>Category</label>
      <div className="flex-col" {...getComboboxProps()}>
        <input
          {...getInputProps({ ref: inputRef })}
          className={selectedItem ? "item-selected" : ""}
          placeholder="(Leave blank to auto-categorize)"
          readOnly={selectedItem}
          disabled={disabled}
        />
        {selectedItem ? (
          <button
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
            categoryList.map((category, index) => {
              let itemClassName = "select-dropdown-item";
              if (highlightedIndex === index) itemClassName += " highlighted";
              if (selectedItem?.id === category.id) itemClassName += " selected";
              return (
                <li
                  className={itemClassName}
                  key={category.id}
                  {...getItemProps({ item: category, index })}>
                  {formatCategoryWithBalance(
                    category,
                    selectedBudgetData?.currencyFormat
                  )}
                </li>
              );
            })
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
        className={
          "currency " +
          (category.balance < 0 ? "negative" : category.balance > 0 ? "positive" : "")
        }>
        {formatCurrency(category.balance, currencyFormat)}
      </span>
      )
    </>
  );
}
