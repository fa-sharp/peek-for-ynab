import { type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import type { Mutate, StoreApi } from "zustand";
import { createJSONStorage } from "zustand/middleware";

import { type StorageItemKey, storage, type WxtStorageItem } from "#imports";

/** Hook to subscribe, read, and write to Chrome storage items */
export const useChromeStorage = <T, I extends T | undefined>(
  item: WxtStorageItem<T, {}>,
  opts?: {
    /** Initial displayed value. If set, the rendered value
     * will not have an initial type of `undefined` on loading. */
    initialValue?: I;
    /** Additional items of the same type that should be kept in cache,
     * to prevent rendering flashes when switching between the items. Make sure this
     * is a stable value (e.g. wrapped in `useMemo` if defined within React) */
    cacheItems?: WxtStorageItem<T, {}>[];
  }
) => {
  // Displayed value
  const [renderedValue, setRenderedValue] = useState<T | undefined>(opts?.initialValue);

  // Items retrieved from storage on load and cached to avoid flashes
  const cache = useRef<Record<StorageItemKey, T>>({});
  useEffect(() => {
    if (!opts?.cacheItems) return;
    Promise.all(
      opts?.cacheItems.map(async (item) => [item.key, await item.getValue()] as const)
    ).then((entries) => {
      cache.current = Object.fromEntries(entries);
    });
  }, [opts?.cacheItems]);

  // Initial load
  useEffect(() => {
    if (cache.current[item.key]) setRenderedValue(cache.current[item.key]);
    item.getValue().then(setRenderedValue);
  }, [item]);

  // Subscribe to changes
  useEffect(() => {
    const unwatch = item.watch(setRenderedValue);
    return () => unwatch();
  }, [item]);

  /** Set the value of the storage item, updating the displayed value optimistically */
  const setValue = useCallback(
    async (value: SetStateAction<I extends T ? T : T | undefined>) => {
      //@ts-expect-error forcing the custom generic typing here
      setRenderedValue(value);
      if (typeof value === "function") {
        const newValue = (value as (prev: T) => T)(await item.getValue());
        return item.setValue(newValue);
      } else {
        return value !== undefined ? item.setValue(value) : item.removeValue();
      }
    },
    [item]
  );

  return [renderedValue, setValue] as [I extends T ? T : T | undefined, typeof setValue];
};

/** Safely migrate a stored JSON string value (from old storage library) to an object. */
export const safeMigrateJsonString =
  <F>(fallback: F) =>
  (oldValue: unknown) => {
    if (oldValue === undefined) return fallback;
    try {
      return JSON.parse(oldValue as string) as F;
    } catch {
      return fallback;
    }
  };

/** Create a Chrome storage adapter for a Zustand store */
export const createZustandChromeStorage = <T>(area: "local" | "sync") =>
  createJSONStorage<T>(() => ({
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
