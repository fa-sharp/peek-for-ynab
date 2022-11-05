import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

import { IS_PRODUCTION } from "./utils";

const IDB_CACHE_KEY = "ynabCache";

/** Creates an Indexed DB persister for React Query */
export function createIDBPersister(
  idbValidKey: IDBValidKey = IDB_CACHE_KEY,
  throttleTime = 200
) {
  return {
    persistClient: asyncThrottle(
      async (client: PersistedClient) => {
        !IS_PRODUCTION && console.log("Persisting cache!");
        set(idbValidKey, client);
      },
      {
        interval: throttleTime,
        onError: (err) => console.error("Error persisting cache to IndexedDB", err)
      }
    ),
    restoreClient: async () => {
      return await get<PersistedClient>(idbValidKey);
    },
    removeClient: async () => {
      !IS_PRODUCTION && console.log("Removing cache!");
      await del(idbValidKey);
    }
  } as Persister;
}

/** Throttle for async functions.
 * From https://github.com/TanStack/query/blob/main/packages/query-async-storage-persister/src/asyncThrottle.ts */
function asyncThrottle<Args extends readonly unknown[]>(
  func: (...args: Args) => Promise<void>,
  { interval = 1000, onError = () => null }: AsyncThrottleOptions = {}
) {
  if (typeof func !== "function") throw new Error("argument is not function.");

  let running = false;
  let lastTime = 0;
  let timeout: ReturnType<typeof setTimeout>;
  let currentArgs: Args | null = null;

  const execFunc = async () => {
    if (currentArgs) {
      const args = currentArgs;
      currentArgs = null;
      try {
        running = true;
        await func(...args);
      } catch (error) {
        onError(error);
      } finally {
        lastTime = Date.now(); // this line must after 'func' executed to avoid two 'func' running in concurrent.
        running = false;
      }
    }
  };

  const delayFunc = async () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (running) {
        delayFunc(); // Will come here when 'func' execution time is greater than the interval.
      } else {
        execFunc();
      }
    }, interval);
  };

  return (...args: Args) => {
    currentArgs = args;

    const tooSoon = Date.now() - lastTime < interval;
    if (running || tooSoon) {
      delayFunc();
    } else {
      execFunc();
    }
  };
}

export interface AsyncThrottleOptions {
  interval?: number;
  onError?: (error: unknown) => void;
}
