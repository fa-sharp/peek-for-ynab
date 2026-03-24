import { defineExtensionMessaging } from "@webext-core/messaging";

import type { CachedBudget } from "./types";

interface DefaultApiOptions {
  /** Whether to fetch cached API data only */
  cache?: boolean;
}

interface ProtocolMap {
  fetchBudgets: (opts?: DefaultApiOptions) => CachedBudget[] | null | void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
