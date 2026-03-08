import { useQuery } from "@tanstack/react-query";
import { use, useCallback } from "react";

import { storage } from "#imports";
import { DEFAULT_POPUP_STATE, STORAGE_KEYS } from "~lib/constants";
import type {
  DetailViewState,
  MoveMoneyInitialState,
  PopupState,
  TxAddState,
} from "~lib/types";
import { txStore } from "./txStore";
import { safeMigrateJsonString, useChromeStorage } from "./utils";

export const popupStateStorage = storage.defineItem<PopupState>(
  `local:${STORAGE_KEYS.PopupState}`,
  {
    fallback: DEFAULT_POPUP_STATE,
    version: 2,
    migrations: {
      2: safeMigrateJsonString<PopupState>(DEFAULT_POPUP_STATE),
    },
  }
);

export const usePopupState = () => {
  // `React.use` allows us to fetch the initial popup state on render
  const popupStateQuery = useQuery({
    queryKey: [STORAGE_KEYS.PopupState],
    queryFn: popupStateStorage.getValue,
    staleTime: Infinity,
  });
  const initialPopupState = use(popupStateQuery.promise);

  // We can now render with synchronous access to the initial popup state
  const [popupState, _setPopupState] = useChromeStorage(
    popupStateStorage,
    initialPopupState
  );

  const setPopupState = useCallback(
    (newState: OpenPopupView) => {
      const currentBudgetId = popupState.budgetId ?? "";
      switch (newState.view) {
        case "main":
          txStore.getState().reset(); // reset transaction form
          _setPopupState({
            budgetId: newState.budgetId ?? currentBudgetId,
            view: "main",
          });
          break;
        case "txAdd":
          if (newState.txState) {
            txStore.getState().replace(newState.txState); // update transaction form before switching to page
          }
          _setPopupState({
            budgetId: newState.budgetId ?? currentBudgetId,
            view: "txAdd",
          });
          break;
        case "detail":
          _setPopupState({
            budgetId: currentBudgetId,
            view: "detail",
            detailState: newState.detailState,
          });
          break;
        case "move":
          _setPopupState({
            budgetId: currentBudgetId,
            view: "move",
            moveMoneyState: newState.moveMoneyState,
          });
          break;
      }
    },
    [_setPopupState, popupState]
  );

  return [popupState, setPopupState] as const;
};

/** Possible popup states */
type OpenPopupView =
  | {
      view: "main";
      budgetId?: string;
    }
  | {
      view: "txAdd";
      txState?: TxAddState;
      budgetId?: string;
    }
  | {
      view: "detail";
      detailState: DetailViewState;
    }
  | {
      view: "move";
      moveMoneyState: MoveMoneyInitialState;
    };
