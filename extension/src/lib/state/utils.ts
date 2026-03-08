import { type SetStateAction, useEffect, useState } from "react";
import type { Mutate, StoreApi } from "zustand";
import { createJSONStorage } from "zustand/middleware";

import { storage, type WxtStorageItem } from "#imports";

/** Hook to subscribe, read, and write to Chrome storage items */
export const useChromeStorage = <T, I extends T | undefined>(
  item: WxtStorageItem<T, {}>,
  initialValue?: I
) => {
  // Displayed value
  const [renderedValue, setRenderedValue] = useState<T | undefined>(initialValue);

  // Initial load
  useEffect(() => {
    item.getValue().then((value) => {
      setRenderedValue(value);
    });
  }, [item]);

  // Subscribe to changes
  useEffect(() => {
    const unwatch = item.watch((value) => {
      setRenderedValue(value);
    });
    return () => {
      unwatch();
      // setRenderedValue(initialValue); // not sure if this is needed
    };
  }, [item]);

  /** Set the value of the storage item, updating the displayed value optimistically */
  const setValue = async (value: SetStateAction<T>) => {
    if (typeof value === "function") {
      const newValue = (value as (prev: T) => T)(await item.getValue());
      setRenderedValue(newValue);
      await item.setValue(newValue);
    } else {
      setRenderedValue(value);
      return item.setValue(value);
    }
  };

  return [renderedValue, setValue] as [I, typeof setValue];
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
