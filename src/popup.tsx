import {
  AccountsView,
  CategoriesView,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView
} from "~components";
import { AppProvider, useAuthContext } from "~lib/context";

function PopupComponent() {
  return (
    <AppProvider>
      <PopupView />
    </AppProvider>
  );
}

function PopupView() {
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
        <div>
          <button
            onClick={
              chrome?.runtime
                ? () => chrome.runtime.openOptionsPage()
                : () => loginWithOAuth()
            }>
            Login via Settings page
          </button>
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

export default PopupComponent;
