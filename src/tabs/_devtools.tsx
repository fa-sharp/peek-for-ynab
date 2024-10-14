import { type DehydratedState } from "@tanstack/react-query";
import { clear, get, keys } from "idb-keyval";
import JSONFormatter from "json-formatter-js";
import { useEffect, useRef, useState } from "react";

import { Storage, type StorageAreaName } from "@plasmohq/storage";

import { BACKGROUND_ALARM_NAME } from "~lib/constants";
import { StorageProvider, useStorageContext } from "~lib/context/storageContext";

/** Devtools page for inspecting auth state, storage, etc. */
function Devtools() {
  const { tokenData, setTokenData, tokenRefreshNeeded, setTokenRefreshNeeded } =
    useStorageContext();

  const [area, setArea] = useState<StorageAreaName>("local");
  const [data, setData] = useState<Record<string, string>>({});
  const [cache, setCache] = useState<DehydratedState["queries"] | undefined>();
  const [permissions, setPermissions] = useState("");
  const [backgroundAlarm, setBackgroundAlarm] = useState<chrome.alarms.Alarm | null>(
    null
  );

  // Get permissions
  useEffect(() => {
    chrome.permissions
      .getAll()
      .then((val) => setPermissions(val.permissions?.join(", ") || ""));
  }, []);

  // Get background alarm
  useEffect(() => {
    chrome.alarms.get(BACKGROUND_ALARM_NAME).then((alarm) => setBackgroundAlarm(alarm));
  }, []);

  // Get storage and listen for storage events
  useEffect(() => {
    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      setData((prevData) => {
        const newData = { ...prevData };
        Object.entries(changes).forEach(([key, change]) => {
          newData[key] = change.newValue;
        });
        return newData;
      });
    };

    const storage = new Storage({ area });
    storage.getAll().then(setData);
    storage.primaryClient.onChanged.addListener(storageListener);

    return () => {
      storage.primaryClient.onChanged.removeListener(storageListener);
    };
  }, [area]);

  const loadCache = () =>
    keys()
      .then(async (keys) => {
        const entries = await Promise.all(keys.map(async (key) => [key, await get(key)]));
        return Object.fromEntries(entries);
      })
      .then(setCache);

  const clearCache = () => clear().then(() => loadCache());

  useEffect(() => {
    loadCache();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: 4
      }}>
      <h2>Peek for YNAB Devtools</h2>
      <h3>Authentication</h3>
      {!tokenData ? (
        <div>No token data</div>
      ) : (
        <>
          <div>
            Access token: <SensitiveString data={tokenData.accessToken} />
          </div>
          <div>
            Refresh token: <SensitiveString data={tokenData.refreshToken} />
          </div>
          <div>
            Token expires: {tokenData && new Date(tokenData.expires).toLocaleString()}
          </div>
          <div>
            {!tokenRefreshNeeded ? (
              <button onClick={() => setTokenRefreshNeeded(true)}>Force refresh</button>
            ) : (
              <button disabled>Refreshing...</button>
            )}
            <button onClick={() => setTokenData(null)}>Clear token</button>
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
          onClick={() => chrome.alarms.clearAll().then(() => setBackgroundAlarm(null))}>
          Clear alarm
        </button>
      </div>
      <h3>Browser Storage</h3>
      <div>
        Storage Area:{" "}
        <select value={area} onChange={(e) => setArea(e.target.value as StorageAreaName)}>
          <option>local</option>
          <option>sync</option>
        </select>
      </div>
      <br />
      <div
        style={{
          display: "flex",
          paddingBottom: 4,
          borderBottom: "solid 2px lightgray"
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
        .map(
          ([key, value]) =>
            key !== "tokenData" && (
              <div
                key={key}
                style={{
                  display: "flex",
                  paddingBlock: 3,
                  borderBottom: "solid 1px lightgray"
                }}>
                <b
                  style={{
                    width: 110,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis"
                  }}>
                  {key}
                </b>
                <div>
                  {value === undefined || typeof JSON.parse(value) !== "object" ? (
                    value
                  ) : (
                    <FormattedJSON value={JSON.parse(value)} />
                  )}
                </div>
              </div>
            )
        )}
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
    <StorageProvider>
      <Devtools />
    </StorageProvider>
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
