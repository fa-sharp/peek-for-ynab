import {
  AccountDetailView,
  CategoryDetailView,
  MoveMoney,
  PopupLogin,
  PopupMain,
  TransactionAdd
} from "~components";
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
      ) : popupState.view === "main" ? (
        <PopupMain />
      ) : popupState.view === "txAdd" ? (
        <TransactionAdd />
      ) : popupState.view === "detail" && popupState.detailState?.type === "account" ? (
        <AccountDetailView />
      ) : popupState.view === "detail" && popupState.detailState?.type === "category" ? (
        <CategoryDetailView />
      ) : popupState.view === "move" ? (
        <MoveMoney />
      ) : (
        <div>Something went wrong 😢!</div>
      )}
    </div>
  );
}

export default PopupWrapper;
