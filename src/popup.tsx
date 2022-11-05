import {
  AccountsView,
  CategoriesView,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView
} from "~components";
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
  const { loggedIn, loginWithOAuth } = useAuthContext();
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
      {!loggedIn ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="button rounded accent"
            onClick={
              chrome?.runtime
                ? () => chrome.runtime.openOptionsPage()
                : () => loginWithOAuth()
            }>
            🔑 Login
          </button>
          <button
            className="button rounded accent"
            onClick={() =>
              window.open(`${process.env.NEXT_PUBLIC_MAIN_URL}/privacy`, "_blank")
            }>
            🔒 Privacy Policy
          </button>
        </div>
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
