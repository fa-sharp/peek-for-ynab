import { PopupLogin, PopupMain, TransactionAdd } from "~components";
import MoveMoney from "~components/extension/transaction/MoveMoney";
import { AppProvider, useAuthContext, useStorageContext } from "~lib/context";
import { useSetColorTheme } from "~lib/utils";

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

  if (authLoading || !settings) return null;

  return (
    <div
      style={{
        padding: "1em",
        minWidth: settings.emojiMode ? "150px" : "280px",
        maxWidth: "360px"
      }}>
      {!loggedIn ? (
        <PopupLogin />
      ) : popupState.view === "txAdd" ? (
        <TransactionAdd />
      ) : popupState.view === "move" ? (
        <MoveMoney />
      ) : (
        <PopupMain />
      )}
    </div>
  );
}

export default PopupWrapper;
