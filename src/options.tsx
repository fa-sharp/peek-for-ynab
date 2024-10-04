import { useCallback, useEffect, useState } from "react";
import { Help, Refresh } from "tabler-icons-react";

import { BudgetSettings, Dialog, Tooltip } from "~components";
import {
  AppProvider,
  useAuthContext,
  useStorageContext,
  useYNABContext
} from "~lib/context";
import { useSetColorTheme } from "~lib/hooks";
import { checkPermissions, removePermissions, requestPermissions } from "~lib/utils";

import "./styles/global.css";

const OptionsWrapper = () => (
  <AppProvider>
    <OptionsView />
  </AppProvider>
);

export function OptionsView() {
  const { settings, syncEnabled, changeSetting } = useStorageContext();
  const { budgetsData, refreshBudgets, isRefreshingBudgets } = useYNABContext();
  const { loginWithOAuth, loggedIn, logout } = useAuthContext();

  useSetColorTheme();

  const [loggingIn, setLoggingIn] = useState(false);

  const {
    enabled: notificationEnabled,
    request: requestNotificationPermission,
    remove: removeNotificationPermission
  } = useNotificationPermission();

  if (!settings) return null;

  return (
    <section
      style={{
        padding: "0 16px 16px",
        maxWidth: "700px",
        width: "max-content"
      }}>
      {!loggedIn ? (
        <>
          <h1>Peek for YNAB</h1>
          <button
            className={"button rounded accent"}
            disabled={loggingIn}
            onClick={async () => {
              setLoggingIn(true);
              await loginWithOAuth();
              setLoggingIn(false);
            }}>
            {!loggingIn ? "🔑 Login to YNAB" : "🔑 Logging in..."}
          </button>
        </>
      ) : (
        <div className="flex-col">
          <h1>Peek for YNAB</h1>
          <div className="flex-col gap-sm">
            <h2 className="heading-big" style={{ marginTop: "0" }}>
              Settings
            </h2>
            <label
              className="flex-row"
              title="Sync settings and pinned categories/accounts to your browser profile">
              <input
                type="checkbox"
                checked={syncEnabled}
                onChange={(e) => {
                  const confirmMessage = syncEnabled
                    ? "Are you sure? This will reset your pinned categories, accounts, & budgets and stop syncing with your browser profile."
                    : "Are you sure? This will reset any currently pinned categories, accounts, & budgets and start syncing with your browser profile.";
                  const confirmed = confirm(confirmMessage);
                  if (confirmed) {
                    changeSetting("sync", e.target.checked);
                    location.reload();
                  }
                }}
              />
              🔄 Sync settings
            </label>
            <label
              className="flex-row"
              title="Enable animations of changing balances and other elements">
              <input
                type="checkbox"
                checked={!!settings.animations}
                onChange={(e) => changeSetting("animations", e.target.checked)}
              />
              🪄 Animations
            </label>
            <label className="flex-row">
              Theme:
              <select
                className="select rounded"
                value={settings.theme || "auto"}
                onChange={(e) =>
                  changeSetting("theme", e.target.value as "dark" | "light" | "auto")
                }>
                <option value="auto">Auto</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </div>

          <div className="flex-col gap-sm">
            <h2 className="heading-big">Permissions</h2>
            <div className="flex-row">
              <input
                id="tab-permission"
                type="checkbox"
                checked={settings.currentTabAccess}
                onChange={async (e) => {
                  if (e.target.checked) {
                    const granted = await requestPermissions(["activeTab", "scripting"]);
                    if (granted) changeSetting("currentTabAccess", true);
                  } else {
                    await removePermissions(["activeTab", "scripting"]);
                    changeSetting("currentTabAccess", false);
                  }
                }}
              />
              <label htmlFor="tab-permission">
                Allow access to the current tab, to enable more transaction entry features
              </label>
              <Tooltip
                label="More info"
                icon={<Help size={18} aria-hidden />}
                placement="top">
                <Dialog>
                  <div>Features include:</div>
                  <ol
                    className="list"
                    style={{ listStyle: "numeric", paddingLeft: "2em" }}>
                    <li>
                      Automatically copy the selected amount into the transaction form.
                    </li>
                    <li>Copy the current URL into the memo field of the transaction.</li>
                  </ol>
                </Dialog>
              </Tooltip>
            </div>
            <div className="flex-row mb-sm">
              <input
                id="notification-permission"
                type="checkbox"
                checked={notificationEnabled}
                onChange={async (e) => {
                  if (e.target.checked) {
                    requestNotificationPermission();
                  } else {
                    removeNotificationPermission();
                  }
                }}
              />
              <label htmlFor="notification-permission">
                Enable system notifications (⚠️ Experimental ⚠️)
              </label>
              <Tooltip
                label="More info"
                icon={<Help size={18} aria-hidden />}
                placement="top">
                <Dialog>
                  Enable system notifications based on the notifications you setup for
                  each budget below. Keep in mind you may also need to enable
                  notifications for your browser in your system settings.
                </Dialog>
              </Tooltip>
            </div>
          </div>

          <h2 className="heading-big">Budgets</h2>
          <ul className="list flex-col">
            {budgetsData?.map((budget) => (
              <BudgetSettings key={budget.id} budget={budget} />
            ))}
          </ul>
          <div>
            <button
              title="Refresh the list of budgets from YNAB"
              className="button rounded accent flex-row mb-lg"
              onClick={() => refreshBudgets()}
              disabled={isRefreshingBudgets}>
              <Refresh size={14} aria-hidden />
              {isRefreshingBudgets ? "Refreshing..." : "Refresh budgets"}
            </button>
            <button
              className="button rounded gray flex-row mb-lg"
              onClick={() =>
                window.open(`${process.env.PLASMO_PUBLIC_MAIN_URL}/help`, "_blank")
              }>
              Help/FAQ
            </button>
            <button
              className="button rounded warn"
              onClick={async () => {
                const confirmed = confirm(
                  "Are you sure? Logging out will clear all settings and data stored in your browser."
                );
                if (confirmed) {
                  await logout();
                }
              }}>
              Logout
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default OptionsWrapper;

const useNotificationPermission = () => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    checkPermissions(["notifications"]).then(setEnabled);
  }, []);

  const request = useCallback(() => {
    requestPermissions(["notifications"]).then(setEnabled);
  }, []);

  const remove = useCallback(() => {
    removePermissions(["notifications"]).then((removed) => {
      if (removed) setEnabled(false);
    });
  }, []);

  return { enabled, request, remove };
};
