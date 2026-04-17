import { defineExtensionMessaging } from "@webext-core/messaging";

interface ProtocolMap {
  fetchToken(data: {
    authToken: string;
  }): { success: true; accessToken: string } | { success: false; error: string };
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
