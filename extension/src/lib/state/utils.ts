import { createJSONStorage as createJSONStorageJotai } from "jotai/utils";
import { useEffect } from "react";
import type { Mutate, StoreApi } from "zustand";
import { createJSONStorage as createJSONStorageZustand } from "zustand/middleware";

import { storage } from "#imports";

/** Create a Chrome storage adapter for Jotai, that handles persisting/syncing a Jotai atom. */
export const createJotaiChromeStorage = <T>(area: "local" | "sync") =>
  createJSONStorageJotai<T>(() => ({
    getItem: async (key) => storage.getItem(`${area}:${key}`),
    setItem: (key, value) => storage.setItem(`${area}:${key}`, value),
    removeItem: (key) => storage.removeItem(`${area}:${key}`),
    subscribe: (key, callback) => storage.watch(`${area}:${key}`, callback),
  }));

/** Create a Chrome storage adapter for a Zustand store */
export const createZustandChromeStorage = <T>(area: "local" | "sync") =>
  createJSONStorageZustand<T>(() => ({
    getItem: async (key) => storage.getItem(`${area}:${key}`),
    setItem: (key, value) => storage.setItem(`${area}:${key}`, value),
    removeItem: (key) => storage.removeItem(`${area}:${key}`),
  }));

/** Subscribe to Chrome storage events for a Zustand store, rehydrating on change. */
export const useZustandChromeStorageEvents = <S>(
  store: Mutate<StoreApi<S>, [["zustand/persist", unknown]]>,
  area: "local" | "sync"
) => {
  useEffect(() => {
    const storageEventCallback = () => {
      store.persist.rehydrate();
    };

    const unwatch = storage.watch(
      `${area}:${store.persist.getOptions().name}`,
      storageEventCallback
    );
    return () => {
      unwatch();
    };
  }, [area, store]);
};
