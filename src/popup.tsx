import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";

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

  return (
    <div
      style={{
        flexDirection: "column",
        padding: 16,
        minWidth: settings.emojiMode ? "150px" : "240px",
        width: "max-content",
        maxWidth: "340px"
      }}>
      {authLoading ? null : !loggedIn ? (
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
  const { saveCategoriesForBudget, saveAccountsForBudget, selectedBudgetId } =
    useStorageContext();
  const { savedCategoriesData, savedAccountsData } = useYNABContext();

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
