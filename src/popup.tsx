import {
  AccountsView,
  CategoriesView,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView
} from "~components";
import { AppProvider, useAuthContext } from "~lib/context";

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
          <button className="button rounded accent">🔒 Privacy Policy</button>
        </div>
      ) : (
        <>
          <PopupNav />

          <SavedCategoriesView />
          <SavedAccountsView />

          <CategoriesView />
          <AccountsView />
        </>
      )}
    </div>
  );
}

export default PopupWrapper;
