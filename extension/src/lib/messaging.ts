import { defineExtensionMessaging } from "@webext-core/messaging";

interface ProtocolMap {
  /** Signal that the token needs to be refreshed */
  tokenRefreshNeeded(): void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
