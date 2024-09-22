import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import { useEffect } from "react";

import {
  AccountsView,
  CategoriesView,
  NewVersionAlert,
  NotificationsView,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView
} from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import { isDataFreshForDisplay } from "~lib/utils";

export default function PopupMain() {
  const {
    savedCategories,
    savedAccounts,
    saveCategoriesForBudget,
    saveAccountsForBudget,
    setPopupState,
    selectedBudgetId
  } = useStorageContext();
  const {
    categoriesData,
    accountsData,
    savedCategoriesData,
    savedAccountsData,
    categoriesLastUpdated,
    accountsLastUpdated
  } = useYNABContext();
  const { newVersionAlert } = useNotificationsContext();

  // activate edit mode if there are no pinned categories or accounts yet
  useEffect(() => {
    if (
      selectedBudgetId &&
      savedCategories &&
      savedAccounts &&
      !savedCategories[selectedBudgetId]?.length &&
      !savedAccounts[selectedBudgetId]?.length
    )
      setPopupState({ view: "main", editMode: true });
  }, [savedAccounts, savedCategories, selectedBudgetId, setPopupState]);

  const onDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination) return;
    if (
      result.source.droppableId === "savedCategories" &&
      result.destination.droppableId === "savedCategories"
    ) {
      if (!savedCategoriesData) return;
      const savedCategoryIds = savedCategoriesData.map((c) => c.id);
      const [categoryId] = savedCategoryIds.splice(result.source.index, 1);
      savedCategoryIds.splice(result.destination.index, 0, categoryId);
      saveCategoriesForBudget(selectedBudgetId, savedCategoryIds);
    } else if (
      result.source.droppableId === "savedAccounts" &&
      result.destination.droppableId === "savedAccounts"
    ) {
      if (!savedAccountsData) return;
      const savedAccountIds = savedAccountsData.map((a) => a.id);
      const [accountId] = savedAccountIds.splice(result.source.index, 1);
      savedAccountIds.splice(result.destination.index, 0, accountId);
      saveAccountsForBudget(selectedBudgetId, savedAccountIds);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {newVersionAlert && <NewVersionAlert />}
      <PopupNav />
      {categoriesData &&
        accountsData &&
        isDataFreshForDisplay(categoriesLastUpdated) &&
        isDataFreshForDisplay(accountsLastUpdated) && (
          <>
            <NotificationsView />
            <SavedCategoriesView />
            <SavedAccountsView />
            <CategoriesView />
            <AccountsView />
          </>
        )}
    </DragDropContext>
  );
}
