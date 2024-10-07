import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import { useCallback, useEffect } from "react";

import {
  AllAccountsView,
  AllCategoriesView,
  NewVersionAlert,
  NotificationsView,
  Omnibox,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView,
  TransactionForm
} from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";

export default function PopupMain() {
  const { popupState } = useStorageContext();
  const { newVersionAlert } = useNotificationsContext();

  return (
    <>
      {newVersionAlert && <NewVersionAlert />}
      <PopupNav />
      {popupState?.view === "txAdd" && <TransactionForm />}
      {popupState?.view === "main" && <MainView />}
    </>
  );
}

const MainView = () => {
  const { omniboxInput } = useStorageContext();
  const { categoriesData, accountsData } = useYNABContext();
  const onDragEnd = useDragEndCallback();

  useActivateEditModeIfNoPinnedItems();

  if (!categoriesData || !accountsData) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <NotificationsView />
      <Omnibox />
      {!omniboxInput && (
        <>
          <SavedCategoriesView />
          <SavedAccountsView />
          <AllCategoriesView />
          <AllAccountsView />
        </>
      )}
    </DragDropContext>
  );
};

/** Callback when dragging and dropping pinned categories and accounts */
const useDragEndCallback = (): OnDragEndResponder => {
  const { popupState, saveCategoriesForBudget, saveAccountsForBudget } =
    useStorageContext();
  const { savedAccountsData, savedCategoriesData } = useYNABContext();

  return useCallback(
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
};

/** Activate edit mode if there are no pinned categories or accounts yet */
const useActivateEditModeIfNoPinnedItems = () => {
  const { popupState, setEditingItems, savedCategories, savedAccounts, setPopupState } =
    useStorageContext();

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
};
