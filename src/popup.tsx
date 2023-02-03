import {
  AccountsView,
  CategoriesView,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView
} from "~components";
import PopupLogin from "~components/PopupLogin";
import TransactionAdd from "~components/TransactionAdd";
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
        display: "flex",
        flexDirection: "column",
        padding: 16,
        minWidth: "240px",
        width: "max-content",
        maxWidth: "330px"
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
