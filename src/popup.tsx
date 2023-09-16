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
  const { saveCategoriesForBudget, selectedBudgetId } = useStorageContext();
  const { savedCategoriesData } = useYNABContext();

  const onDragEnd: OnDragEndResponder = (result) => {
    console.log("onDragEnd:", result);
    if (!savedCategoriesData || !result.destination) return;
    const currentCategoryIds = savedCategoriesData.map((c) => c.id);
    const [toBeReordered] = currentCategoryIds.splice(result.source.index, 1);
    currentCategoryIds.splice(result.destination.index, 0, toBeReordered);
    saveCategoriesForBudget(selectedBudgetId, currentCategoryIds);
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
