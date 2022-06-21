import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { StorageProvider, useStorageContext } from "~lib/context/storageContext";

function TestAuthWrapper() {
  return (
    <StorageProvider>
      <TestAuth />
    </StorageProvider>
  );
}

function TestAuth() {
  const router = useRouter();
  const { tokenData, setTokenData } = useStorageContext();
  const [authAttempted, setAuthAttempted] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || authAttempted) return;

    setTokenData(null);
    if (typeof router.query.code !== "string") {
      console.error("No auth code found in URL!");
      setAuthLoading(false);
      return;
    }

    console.log("Fetching new OAuth token!", { code: router.query.code });
    setAuthAttempted(true);
    fetch(
      `/api/auth/initial?code=${router.query.code}&redirectUri=http://localhost:3000/testLogin`
    )
      .then((res) => {
        if (!res.ok) throw { message: "Error fetching token!", status: res.status };
        return res.json();
      })
      .then((tokenData) => {
        console.log("Token fetched!", tokenData);
        setTokenData(tokenData);
        setAuthLoading(false);
      })
      .catch((err) => {
        setAuthLoading(false);
        console.error(err);
      });
  }, [authAttempted, router, setTokenData]);

  return (
    <main>
      <h2>Login Test</h2>
      {authLoading ? (
        <div>Auth loading...</div>
      ) : tokenData ? (
        <div>Login succeeded! See console for more details</div>
      ) : (
        <div>Login failed 😢 See console for more details</div>
      )}
      <div>
        Go to <Link href="/test">test components</Link>
      </div>
    </main>
  );
}

export default TestAuthWrapper;
