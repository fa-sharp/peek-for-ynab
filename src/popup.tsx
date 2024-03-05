import {
  AccountTxsView,
  CategoryTxsView,
  PopupLogin,
  PopupMain,
  TransactionAdd
} from "~components";
import { AppProvider, useAuthContext, useStorageContext } from "~lib/context";
import { useSetColorTheme } from "~lib/utils";

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

  useSetColorTheme();

  if (authLoading || !settings) return null;

  return (
    <div
      style={{
        padding: "1em",
        minWidth: settings.emojiMode ? "150px" : "240px",
        width: "max-content",
        maxWidth: "320px"
      }}>
      {!loggedIn ? (
        <PopupLogin />
      ) : popupState.view === "main" ? (
        <PopupMain />
      ) : popupState.view === "txAdd" ? (
        <TransactionAdd />
      ) : popupState.view === "detail" && popupState.detailState?.type === "account" ? (
        <AccountTxsView />
      ) : popupState.view === "detail" && popupState.detailState?.type === "category" ? (
        <CategoryTxsView />
      ) : (
        <div>Something went wrong 😢!</div>
      )}
    </div>
  );
}

export default PopupWrapper;
