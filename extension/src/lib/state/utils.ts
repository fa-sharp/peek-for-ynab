import { type SetStateAction, useEffect, useState } from "react";
import type { Mutate, StoreApi } from "zustand";
import { createJSONStorage as createJSONStorageZustand } from "zustand/middleware";

import { storage, type WxtStorageItem } from "#imports";

/** Hook to subscribe, read, and write to Chrome storage items */
export const useChromeStorage = <T>(item: WxtStorageItem<T, {}>, initialValue?: T) => {
  // Displayed value
  const [renderedValue, setRenderedValue] = useState(initialValue);

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

  return [renderedValue, setValue] as const;
};

/** Safely migrate a stored JSON string value (from old storage library) to an object. */
export const safeMigrateJsonString = (fallback: unknown) => (oldValue: unknown) => {
  try {
    return JSON.parse(oldValue as string);
  } catch {
    return fallback;
  }
};

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
