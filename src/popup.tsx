import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import { useEffect } from "react";

import {
  AccountsView,
  CategoriesView,
  PopupLogin,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView,
  TransactionAdd
} from "~components";
import {
  AppProvider,
  useAuthContext,
  useStorageContext,
  useYNABContext
} from "~lib/context";

import "./global.css";

function PopupWrapper() {
  return (
    <AppProvider>
      <PopupView />
    </AppProvider>
  );
}

export function PopupView() {
  const { settings, popupState } = useStorageContext();
  const { loggedIn, authLoading } = useAuthContext();

  if (authLoading || !settings) return null;

  return (
    <div
      style={{
        flexDirection: "column",
        padding: 16,
        minWidth: settings.emojiMode ? "150px" : "240px",
        width: "max-content",
        maxWidth: "320px"
      }}>
      {!loggedIn ? (
        <PopupLogin />
      ) : popupState.view === "txAdd" ? (
        <TransactionAdd />
      ) : (
        <MainPopup />
      )}
    </div>
  );
}

function MainPopup() {
  const {
    savedCategories,
    savedAccounts,
    saveCategoriesForBudget,
    saveAccountsForBudget,
    setPopupState,
    selectedBudgetId
  } = useStorageContext();
  const { savedCategoriesData, savedAccountsData } = useYNABContext();

  // activate edit mode if there are no pinned categories or accounts
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

      <SavedCategoriesView />
      <SavedAccountsView />

      <CategoriesView />
      <AccountsView />
    </DragDropContext>
  );
}

export default PopupWrapper;
