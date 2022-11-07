import { useCombobox } from "downshift";
import { useCallback, useMemo, useState } from "react";
import type { Category } from "ynab";

import { useYNABContext } from "~lib/context";

interface Props {
  categories?: Category[];
  selectCategory: (category: Category) => void;
}

export default function CategorySelect({ categories, selectCategory }: Props) {
  const { categoryGroupsData } = useYNABContext();

  const [categoryList, setCategoryList] = useState(categories ? [...categories] : []);

  /** Ignored categories when adding a transaction (Ready to Assign, CCP categories) */
  const ignoredCategoryIds = useMemo(
    () => categoryGroupsData?.slice(0, 2).flatMap((cg) => cg.categories.map((c) => c.id)),
    [categoryGroupsData]
  );

  const getFilter = useCallback(
    (inputValue?: string) => {
      return (category: Category) =>
        !ignoredCategoryIds?.includes(category.id) &&
        (!inputValue || category.name.toLowerCase().includes(inputValue.toLowerCase()));
    },
    [ignoredCategoryIds]
  );

  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    getComboboxProps,
    highlightedIndex,
    selectedItem
  } = useCombobox<Category | null>({
    items: categoryList,
    itemToString(category) {
      return category ? category.name : "";
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
        <input {...getInputProps()} />
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
                  {category.name}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
