import { defineExtensionMessaging } from "@webext-core/messaging";

interface ProtocolMap {}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
