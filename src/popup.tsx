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
import { useAddTransaction } from "~lib/useAddTransaction";

import "./global.css";

function PopupWrapper() {
  return (
    <AppProvider>
      <PopupView />
    </AppProvider>
  );
}

export function PopupView() {
  const { settings, saveCategoriesForBudget, selectedBudgetId } = useStorageContext();
  const { loggedIn, authLoading } = useAuthContext();
  const { savedCategoriesData } = useYNABContext();
  const { addTxState, openAddTransaction, closeAddTransaction } = useAddTransaction();

  const onDragEnd: OnDragEndResponder = (result) => {
    console.log("onDragEnd:", result);
    if (!savedCategoriesData || !result.destination) return;
    const currentCategoryIds = savedCategoriesData.map((c) => c.id);
    const [toBeReordered] = currentCategoryIds.splice(result.source.index, 1);
    currentCategoryIds.splice(result.destination.index, 0, toBeReordered);
    saveCategoriesForBudget(selectedBudgetId, currentCategoryIds);
  };

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
      ) : addTxState.show ? (
        <TransactionAdd
          initialState={addTxState.initialState}
          closeForm={closeAddTransaction}
        />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <PopupNav />

          <SavedCategoriesView addTx={openAddTransaction} />
          <SavedAccountsView addTx={openAddTransaction} />

          <CategoriesView addTx={openAddTransaction} />
          <AccountsView addTx={openAddTransaction} />
        </DragDropContext>
      )}
    </div>
  );
}

export default PopupWrapper;
