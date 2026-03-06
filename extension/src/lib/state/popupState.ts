import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { DEFAULT_POPUP_STATE, STORAGE_KEYS } from "~lib/constants";
import type {
  DetailViewState,
  MoveMoneyInitialState,
  PopupState,
  TxAddState,
} from "~lib/types";
import { txStore } from "./txStore";
import { createJotaiChromeStorage } from "./utils";

/**
 * Internal Jotai atom that holds the popup state (e.g. current view, budget ID), and
 * persists/syncs to local Chrome storage
 */
const POPUP_STATE_ATOM = atomWithStorage<PopupState>(
  STORAGE_KEYS.PopupState,
  DEFAULT_POPUP_STATE,
  createJotaiChromeStorage("local"),
  { getOnInit: true }
);

/** Jotai atom for getting and updating the popup state / view */
export const popupStateAtom = atom(
  (get) => get(POPUP_STATE_ATOM),
  (_get, set, newState: OpenPopupView) => {
    set(POPUP_STATE_ATOM, async (prev) => {
      const budgetId = (await prev).budgetId;
      switch (newState.view) {
        case "main":
          txStore.getState().reset(); // reset transaction form
          return {
            budgetId: newState.budgetId ?? budgetId,
            view: "main",
          };
        case "txAdd":
          // Update transaction form before switching to page
          if (newState.txState) {
            txStore.getState().replace(newState.txState);
          }
          return {
            budgetId,
            view: "txAdd",
          };
        case "detail":
          return {
            budgetId,
            view: "detail",
            detailState: newState.detailState,
          };
        case "move":
          return {
            budgetId,
            view: "move",
            moveMoneyState: newState.moveMoneyState,
          };
      }
    });
  }
);

/** Possible popup states */
type OpenPopupView =
  | {
      view: "main";
      budgetId?: string;
    }
  | {
      view: "txAdd";
      txState?: TxAddState;
    }
  | {
      view: "detail";
      detailState: DetailViewState;
    }
  | {
      view: "move";
      moveMoneyState: MoveMoneyInitialState;
    };
