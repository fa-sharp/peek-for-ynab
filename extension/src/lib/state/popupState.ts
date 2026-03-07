import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
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

/** Internal persisted Jotai atom that holds the popup state (e.g. current view, budget ID) */
const POPUP_STATE_ATOM = atomWithStorage<PopupState>(
  STORAGE_KEYS.PopupState,
  DEFAULT_POPUP_STATE,
  createJotaiChromeStorage("local"),
  { getOnInit: true }
);

/** Jotai atom for getting and updating the popup state / view */
export const popupStateAtom = atom(
  (get) => get(POPUP_STATE_ATOM),
  async (_get, set, newState: OpenPopupView) => {
    await set(POPUP_STATE_ATOM, async (prev) => {
      const budgetId = (await prev).budgetId;
      switch (newState.view) {
        case "main":
          txStore.getState().reset(); // reset transaction form
          return {
            budgetId: newState.budgetId ?? budgetId,
            view: "main",
          };
        case "txAdd":
          if (newState.txState) {
            txStore.getState().replace(newState.txState); // update transaction form before switching to page
          }
          return {
            budgetId: newState.budgetId ?? budgetId,
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

/** React hook for accessing and updating the popup state */
export const usePopupState = () => useAtom(popupStateAtom);
/** React hook for getting the popup state */
export const useGetPopupState = () => useAtomValue(popupStateAtom);
/** React hook for updating the popup state */
export const useSetPopupState = () => useSetAtom(popupStateAtom);

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
