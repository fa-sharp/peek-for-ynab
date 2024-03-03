import type { AppSettings } from "./context/storageContext";

export const TOKEN_STORAGE_KEY = "tokenData";
export const REFRESH_NEEDED_KEY = "tokenRefreshing";

export const DEFAULT_SETTINGS = Object.freeze<AppSettings>({
  txApproved: true,
  txCleared: false,
  privateMode: false,
  emojiMode: false,
  currentTabAccess: false,
  theme: "auto"
});
