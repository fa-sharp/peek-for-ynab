import { useEffect } from "react";

import {
  AccountDetailView,
  AllAccountsView,
  AllCategoriesView,
  CategoryDetailView,
  MoveMoney,
  NewVersionAlert,
  NotificationsView,
  Omnibox,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView,
  TransactionForm,
} from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";

export default function PopupMain() {
  const { popupState } = useStorageContext();
  const { newVersionAlert } = useNotificationsContext();

  return (
    <>
      {newVersionAlert && <NewVersionAlert />}
      <PopupNav />
      {popupState.view === "main" && <MainView />}
      {popupState.view === "txAdd" && <TransactionForm />}
      {popupState.view === "detail" && popupState.detailState?.type === "account" && (
        <AccountDetailView />
      )}
      {popupState.view === "detail" && popupState.detailState?.type === "category" && (
        <CategoryDetailView />
      )}
      {popupState.view === "move" && <MoveMoney />}
    </>
  );
}

const MainView = () => {
  const { pinnedItems, setEditingItems, omniboxInput } = useStorageContext();
  const { categoriesData, accountsData } = useYNABContext();

  // Activate edit mode if there are no pinned categories or accounts yet
  useEffect(() => {
    if (pinnedItems && !pinnedItems.categories.length && !pinnedItems.accounts.length)
      setEditingItems(true);
  }, [pinnedItems, setEditingItems]);

  if (!categoriesData || !accountsData) return null;

  return (
    <>
      <NotificationsView />
      <Omnibox />
      {!omniboxInput && (
        <>
          <SavedCategoriesView />
          <SavedAccountsView />
          <AllCategoriesView />
          <AllAccountsView />
        </>
      )}
    </>
  );
};
