import { defineExtensionMessaging } from "@webext-core/messaging";

interface ProtocolMap {
  /** Signal the background script to refresh the token */
  tokenRefreshNeeded(refreshToken: string): void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
