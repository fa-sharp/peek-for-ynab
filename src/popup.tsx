import {
  AccountsView,
  CategoriesView,
  PopupLogin,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView,
  TransactionAdd
} from "~components";
import { AppProvider, useAuthContext } from "~lib/context";
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
  const { loggedIn, authLoading } = useAuthContext();
  const { addTxState, openAddTransaction, closeAddTransaction } = useAddTransaction();

  return (
    <div
      style={{
        flexDirection: "column",
        padding: 16,
        minWidth: "240px",
        width: "max-content"
      }}>
      {authLoading ? null : !loggedIn ? (
        <PopupLogin />
      ) : addTxState.show ? (
        <TransactionAdd
          initialState={addTxState.initialState}
          closeForm={closeAddTransaction}
        />
      ) : (
        <>
          <PopupNav />

          <SavedCategoriesView addTx={openAddTransaction} />
          <SavedAccountsView addTx={openAddTransaction} />

          <CategoriesView addTx={openAddTransaction} />
          <AccountsView addTx={openAddTransaction} />
        </>
      )}
    </div>
  );
}

export default PopupWrapper;
