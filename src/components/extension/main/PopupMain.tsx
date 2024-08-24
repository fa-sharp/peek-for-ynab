import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import { useEffect } from "react";
import { ExternalLink, Rocket, X } from "tabler-icons-react";

import {
  AccountsView,
  CategoriesView,
  IconButton,
  NotificationsView,
  PopupNav,
  SavedAccountsView,
  SavedCategoriesView
} from "~components";
import { LATEST_VERSION_ALERT_TEXT } from "~lib/constants";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";

export default function PopupMain() {
  const {
    savedCategories,
    savedAccounts,
    saveCategoriesForBudget,
    saveAccountsForBudget,
    setPopupState,
    selectedBudgetId
  } = useStorageContext();
  const { categoriesData, accountsData, savedCategoriesData, savedAccountsData } =
    useYNABContext();
  const { newVersionAlert, resetVersionAlert } = useNotificationsContext();

  // activate edit mode if there are no pinned categories or accounts yet
  useEffect(() => {
    if (
      selectedBudgetId &&
      savedCategories &&
      savedAccounts &&
      !savedCategories[selectedBudgetId]?.length &&
      !savedAccounts[selectedBudgetId]?.length
    )
      setPopupState({ view: "main", editMode: true });
  }, [savedAccounts, savedCategories, selectedBudgetId, setPopupState]);

  const onDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination) return;
    if (
      result.source.droppableId === "savedCategories" &&
      result.destination.droppableId === "savedCategories"
    ) {
      if (!savedCategoriesData) return;
      const savedCategoryIds = savedCategoriesData.map((c) => c.id);
      const [categoryId] = savedCategoryIds.splice(result.source.index, 1);
      savedCategoryIds.splice(result.destination.index, 0, categoryId);
      saveCategoriesForBudget(selectedBudgetId, savedCategoryIds);
    } else if (
      result.source.droppableId === "savedAccounts" &&
      result.destination.droppableId === "savedAccounts"
    ) {
      if (!savedAccountsData) return;
      const savedAccountIds = savedAccountsData.map((a) => a.id);
      const [accountId] = savedAccountIds.splice(result.source.index, 1);
      savedAccountIds.splice(result.destination.index, 0, accountId);
      saveAccountsForBudget(selectedBudgetId, savedAccountIds);
    }
  };

  const onOpenReleaseNotes = async () => {
    await resetVersionAlert();
    window.open(`${process.env.PLASMO_PUBLIC_MAIN_URL}/releases`, "_blank");
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {newVersionAlert && (
        <div className="heading-small flex-row gap-xs justify-center mb-lg">
          <Rocket size={20} color="var(--error)" />
          New update: {LATEST_VERSION_ALERT_TEXT}
          <IconButton
            label="See details"
            icon={<ExternalLink size={20} aria-hidden />}
            onClick={onOpenReleaseNotes}
          />
          <IconButton
            label="Dismiss"
            icon={<X size={20} aria-hidden />}
            onClick={resetVersionAlert}
          />
        </div>
      )}
      <PopupNav />
      {categoriesData && accountsData && (
        <>
          <NotificationsView />
          <SavedCategoriesView />
          <SavedAccountsView />
          <CategoriesView />
          <AccountsView />
        </>
      )}
    </DragDropContext>
  );
}
