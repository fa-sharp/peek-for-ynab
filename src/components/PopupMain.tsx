import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import { useEffect } from "react";

import {
  AccountsView,
  CategoriesView,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView
} from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";

export default function PopupMain() {
  const {
    savedCategories,
    savedAccounts,
    saveCategoriesForBudget,
    saveAccountsForBudget,
    setPopupState,
    selectedBudgetId
  } = useStorageContext();
  const { categoriesData, accountsData, savedCategoriesData, savedAccountsData } =
    useYNABContext();

  // activate edit mode if there are no pinned categories or accounts yet
  useEffect(() => {
    if (
      savedCategories &&
      savedAccounts &&
      !savedCategories[selectedBudgetId]?.length &&
      !savedAccounts[selectedBudgetId]?.length
    )
      setPopupState({ view: "main", editMode: true });
  }, [savedAccounts, savedCategories, selectedBudgetId, setPopupState]);

  const onDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination) return;
    if (result.source.droppableId === "savedCategories") {
      if (!savedCategoriesData) return;
      const savedCategoryIds = savedCategoriesData.map((c) => c.id);
      const [categoryId] = savedCategoryIds.splice(result.source.index, 1);
      savedCategoryIds.splice(result.destination.index, 0, categoryId);
      saveCategoriesForBudget(selectedBudgetId, savedCategoryIds);
    } else if (result.source.droppableId === "savedAccounts") {
      if (!savedAccountsData) return;
      const savedAccountIds = savedAccountsData.map((a) => a.id);
      const [accountId] = savedAccountIds.splice(result.source.index, 1);
      savedAccountIds.splice(result.destination.index, 0, accountId);
      saveAccountsForBudget(selectedBudgetId, savedAccountIds);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <PopupNav />
      {categoriesData && accountsData && (
        <>
          <SavedCategoriesView />
          <SavedAccountsView />
          <CategoriesView />
          <AccountsView />
        </>
      )}
    </DragDropContext>
  );
}
