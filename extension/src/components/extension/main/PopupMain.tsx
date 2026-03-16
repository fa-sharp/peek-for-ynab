import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import { useCallback, useEffect } from "react";

import {
  AccountDetailView,
  AllAccountsView,
  AllCategoriesView,
  CategoryDetailView,
  MoveMoney,
  NewVersionAlert,
  NotificationsView,
  Omnibox,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView,
  TransactionForm,
} from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";

export default function PopupMain() {
  const { popupState } = useStorageContext();
  const { newVersionAlert } = useNotificationsContext();

  return (
    <>
      {newVersionAlert && <NewVersionAlert />}
      <PopupNav />
      {popupState.view === "txAdd" && <TransactionForm />}
      {popupState.view === "main" && <MainView />}
      {popupState.view === "detail" && popupState.detailState?.type === "account" && (
        <AccountDetailView />
      )}
      {popupState.view === "detail" && popupState.detailState?.type === "category" && (
        <CategoryDetailView />
      )}
      {popupState.view === "move" && <MoveMoney />}
    </>
  );
}

const MainView = () => {
  const { pinnedItems, setEditingItems, omniboxInput } = useStorageContext();
  const { categoriesData, accountsData } = useYNABContext();
  const onDragEnd = useDragEndCallback();

  // Activate edit mode if there are no pinned categories or accounts yet
  useEffect(() => {
    if (pinnedItems && !pinnedItems.categories.length && !pinnedItems.accounts.length)
      setEditingItems(true);
  }, [pinnedItems, setEditingItems]);

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
  const { popupState, setAccounts, setCategories } = useStorageContext();
  const { savedAccountsData, savedCategoriesData } = useYNABContext();

  return useCallback(
    (result) => {
      if (!result.destination || !popupState.budgetId) return;
      if (
        result.source.droppableId === "savedCategories" &&
        result.destination.droppableId === "savedCategories"
      ) {
        if (!savedCategoriesData) return;
        const savedCategoryIds = savedCategoriesData.map((c) => c.id);
        const [categoryId] = savedCategoryIds.splice(result.source.index, 1);
        savedCategoryIds.splice(result.destination.index, 0, categoryId);
        setCategories(savedCategoryIds);
      } else if (
        result.source.droppableId === "savedAccounts" &&
        result.destination.droppableId === "savedAccounts"
      ) {
        if (!savedAccountsData) return;
        const savedAccountIds = savedAccountsData.map((a) => a.id);
        const [accountId] = savedAccountIds.splice(result.source.index, 1);
        savedAccountIds.splice(result.destination.index, 0, accountId);
        setAccounts(savedAccountIds);
      }
    },
    [
      setAccounts,
      setCategories,
      savedAccountsData,
      savedCategoriesData,
      popupState.budgetId,
    ]
  );
};
