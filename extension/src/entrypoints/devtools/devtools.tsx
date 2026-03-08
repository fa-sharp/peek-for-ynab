import type { DehydratedState } from "@tanstack/react-query";
import { clear, get, keys } from "idb-keyval";
import JSONFormatter from "json-formatter-js";
import { useCallback, useEffect, useRef, useState } from "react";

import { type Browser, browser } from "#imports";
import { BACKGROUND_ALARM_NAME } from "~lib/constants";
import { AppProvider } from "~lib/context";
import { useStorageContext } from "~lib/context/storageContext";
import { sendMessage } from "~lib/messaging";

/** Devtools page for inspecting auth state, storage, etc. */
function Devtools() {
  const { token } = useStorageContext();

  const [area, setArea] = useState<"local" | "sync">("local");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [cache, setCache] = useState<DehydratedState["queries"] | undefined>();
  const [permissions, setPermissions] = useState("");
  const [backgroundAlarm, setBackgroundAlarm] = useState<Browser.alarms.Alarm | null>(
    null
  );

  // Get permissions
  useEffect(() => {
    browser.permissions
      .getAll()
      .then((val) => setPermissions(val.permissions?.join(", ") || ""));
  }, []);

  // Get background alarm
  useEffect(() => {
    browser.alarms.get(BACKGROUND_ALARM_NAME).then((alarm) => {
      if (alarm) setBackgroundAlarm(alarm);
    });
  }, []);

  // Get storage and listen for storage events
  useEffect(() => {
    const storageListener = (changes: {
      [key: string]: Browser.storage.StorageChange;
    }) => {
      setData((prevData) => {
        const newData = { ...prevData };
        Object.entries(changes).forEach(([key, change]) => {
          newData[key] = change.newValue as string;
        });
        return newData;
      });
    };

    browser.storage[area].get().then(setData);
    browser.storage[area].onChanged.addListener(storageListener);

    return () => {
      browser.storage[area].onChanged.removeListener(storageListener);
    };
  }, [area]);

  const loadCache = useCallback(() => {
    keys()
      .then(async (keys) => {
        const entries = await Promise.all(keys.map(async (key) => [key, await get(key)]));
        return Object.fromEntries(entries);
      })
      .then(setCache);
  }, []);

  const clearCache = () => clear().then(() => loadCache());

  useEffect(() => {
    loadCache();
  }, [loadCache]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: 4,
      }}>
      <h2>Peek for YNAB Devtools</h2>
      <h3>Authentication</h3>
      {!token.tokenData ? (
        <div>No token data</div>
      ) : (
        <>
          <div>
            Access token: <SensitiveString data={token.tokenData.accessToken} />
          </div>
          <div>
            Refresh token: <SensitiveString data={token.tokenData.refreshToken} />
          </div>
          <div>Token expires: {new Date(token.tokenData.expires).toLocaleString()}</div>
          <div>
            {!token.isRefreshing ? (
              <button
                onClick={() =>
                  sendMessage("tokenRefreshNeeded", token.tokenData!.refreshToken)
                }>
                Force refresh
              </button>
            ) : (
              <button disabled>Refreshing...</button>
            )}
            <button onClick={() => token.setTokenData(null)}>Clear token</button>
          </div>
        </>
      )}
      <h3>Browser Permissions</h3>
      {permissions}
      <h3>Background Refresh</h3>
      {!backgroundAlarm ? (
        <div>No alarm found.</div>
      ) : (
        <div>
          Next refresh at {new Date(backgroundAlarm.scheduledTime).toLocaleTimeString()}.{" "}
          Repeats every {backgroundAlarm.periodInMinutes} minutes.
        </div>
      )}
      <div>
        <button
          onClick={() => browser.alarms.clearAll().then(() => setBackgroundAlarm(null))}>
          Clear alarm
        </button>
      </div>
      <h3>Browser Storage</h3>
      <div>
        Storage Area:{" "}
        <select
          value={area}
          onChange={(e) => setArea(e.target.value as "local" | "sync")}>
          <option>local</option>
          <option>sync</option>
        </select>
      </div>
      <br />
      <div
        style={{
          display: "flex",
          paddingBottom: 4,
          borderBottom: "solid 2px lightgray",
        }}>
        <div style={{ width: 110 }}>
          <b>Key</b>
        </div>
        <div>
          <b>Value</b>
        </div>
      </div>
      {Object.entries(data)
        .sort(([key1], [key2]) => key1.localeCompare(key2))
        .filter(([key]) => key !== "tokenData")
        .map(([key, value]) => (
          <div
            key={key}
            style={{
              display: "flex",
              paddingBlock: 3,
              borderBottom: "solid 1px lightgray",
            }}>
            <b
              style={{
                width: 110,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}>
              {key}
            </b>
            <div>
              {value == undefined ? (
                value
              ) : typeof value === "object" ? (
                <FormattedJSON value={value} />
              ) : typeof value === "string" ? (
                <FormattedJSON value={JSON.parse(value)} />
              ) : (
                value.toString()
              )}
            </div>
          </div>
        ))}
      <h3>API Cache</h3>
      <div>
        <button onClick={loadCache}>Refresh</button>
        <button onClick={clearCache}>Clear cache</button>
      </div>
      {cache && <FormattedJSON value={cache} />}
    </div>
  );
}

function DevtoolsWrapper() {
  return (
    <AppProvider>
      <Devtools />
    </AppProvider>
  );
}

export default DevtoolsWrapper;

const FormattedJSON = ({ value }: { value: object }) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const spanElement = spanRef.current;
    const formattedJson = new JSONFormatter(value, 2).render();
    spanElement?.appendChild(formattedJson);

    return () => {
      spanElement?.removeChild(formattedJson);
    };
  }, [value]);

  return <span ref={spanRef} />;
};

/** Sensitive string, has a button to reveal the data */
const SensitiveString = ({ data }: { data: string }) => {
  const [revealed, setRevealed] = useState(false);

  return !revealed ? (
    <button onClick={() => setRevealed(true)}>Click to reveal</button>
  ) : (
    data
  );
};
