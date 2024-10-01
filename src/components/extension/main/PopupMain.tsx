import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import { useCallback, useEffect } from "react";

import {
  AccountsView,
  CategoriesView,
  NewVersionAlert,
  NotificationsView,
  Omnibox,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView
} from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";

export default function PopupMain() {
  const {
    popupState,
    setEditingItems,
    omniboxInput,
    savedCategories,
    savedAccounts,
    saveCategoriesForBudget,
    saveAccountsForBudget,
    setPopupState
  } = useStorageContext();
  const { categoriesData, accountsData, savedCategoriesData, savedAccountsData } =
    useYNABContext();
  const { newVersionAlert } = useNotificationsContext();

  // activate edit mode if there are no pinned categories or accounts yet
  useEffect(() => {
    if (
      popupState &&
      savedCategories &&
      savedAccounts &&
      !savedCategories[popupState.budgetId]?.length &&
      !savedAccounts[popupState.budgetId]?.length
    )
      setEditingItems(true);
  }, [popupState, savedAccounts, savedCategories, setEditingItems, setPopupState]);

  /** Callback when dragging and dropping pinned categories and accounts */
  const onDragEnd: OnDragEndResponder = useCallback(
    (result) => {
      if (!result.destination || !popupState?.budgetId) return;
      if (
        result.source.droppableId === "savedCategories" &&
        result.destination.droppableId === "savedCategories"
      ) {
        if (!savedCategoriesData) return;
        const savedCategoryIds = savedCategoriesData.map((c) => c.id);
        const [categoryId] = savedCategoryIds.splice(result.source.index, 1);
        savedCategoryIds.splice(result.destination.index, 0, categoryId);
        saveCategoriesForBudget(popupState.budgetId, savedCategoryIds);
      } else if (
        result.source.droppableId === "savedAccounts" &&
        result.destination.droppableId === "savedAccounts"
      ) {
        if (!savedAccountsData) return;
        const savedAccountIds = savedAccountsData.map((a) => a.id);
        const [accountId] = savedAccountIds.splice(result.source.index, 1);
        savedAccountIds.splice(result.destination.index, 0, accountId);
        saveAccountsForBudget(popupState.budgetId, savedAccountIds);
      }
    },
    [
      saveAccountsForBudget,
      saveCategoriesForBudget,
      savedAccountsData,
      savedCategoriesData,
      popupState?.budgetId
    ]
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {newVersionAlert && <NewVersionAlert />}
      <PopupNav />
      {categoriesData && accountsData && (
        <>
          <NotificationsView />
          <Omnibox />
          {!omniboxInput && (
            <>
              <SavedCategoriesView />
              <SavedAccountsView />
              <CategoriesView />
              <AccountsView />
            </>
          )}
        </>
      )}
    </DragDropContext>
  );
}
