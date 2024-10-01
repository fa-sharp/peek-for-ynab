import { PopupLogin, PopupMain, TransactionForm } from "~components";
import { AppProvider, useAuthContext, useStorageContext } from "~lib/context";
import { useSetColorTheme } from "~lib/hooks";

import "./styles/global.css";

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

  useSetColorTheme();

  // check if auth and storage are hydrated to avoid flashes
  if (authLoading || !settings || !popupState) return null;

  return (
    <div
      style={{
        padding: "1em",
        minWidth: "270px",
        maxWidth: "360px",
        minHeight: "50px"
      }}>
      {!loggedIn ? (
        <PopupLogin />
      ) : popupState.view === "txAdd" ? (
        <TransactionForm />
      ) : (
        <PopupMain />
      )}
    </div>
  );
}

export default PopupWrapper;
