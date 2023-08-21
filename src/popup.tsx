import {
  AccountsView,
  CategoriesView,
  PopupLogin,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView,
  TransactionAdd
} from "~components";
import AccountTxsView from "~components/AccountTxsView";
import CategoryTxsView from "~components/CategoryTxsView";
import { AppProvider, useAuthContext, useStorageContext } from "~lib/context";
import { usePopupState } from "~lib/usePopupState";

import "./global.css";

function PopupWrapper() {
  return (
    <AppProvider>
      <PopupView />
    </AppProvider>
  );
}

export function PopupView() {
  const { settings } = useStorageContext();
  const { loggedIn, authLoading } = useAuthContext();
  const { popupState, openAddTransaction, openPopupView, openTxsView } = usePopupState();

  return (
    <div
      style={{
        flexDirection: "column",
        padding: 16,
        minWidth: settings.emojiMode ? "150px" : "240px",
        width: "max-content"
      }}>
      {authLoading ? null : !loggedIn ? (
        <PopupLogin />
      ) : popupState.page === "main" ? (
        <>
          <PopupNav />

          <SavedCategoriesView
            addTx={openAddTransaction}
            listTx={(categoryId) => openTxsView("category", categoryId)}
          />
          <SavedAccountsView
            addTx={openAddTransaction}
            listTx={(accountId) => openTxsView("account", accountId)}
          />

          <CategoriesView addTx={openAddTransaction} />
          <AccountsView addTx={openAddTransaction} />
        </>
      ) : popupState.page === "addTx" ? (
        <TransactionAdd
          initialState={popupState.addTxInitialState}
          closeForm={openPopupView}
        />
      ) : popupState.page === "txView" && popupState.txsViewState?.type === "account" ? (
        <AccountTxsView id={popupState.txsViewState.id} />
      ) : popupState.page === "txView" && popupState.txsViewState?.type === "category" ? (
        <CategoryTxsView id={popupState.txsViewState.id} />
      ) : (
        "Invalid popup state!"
      )}
    </div>
  );
}

export default PopupWrapper;
