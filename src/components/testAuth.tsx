import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { StorageProvider, useStorageContext } from "~lib/storageContext";

function TestAuthWrapper() {
  return (
    <StorageProvider>
      <TestAuth />
    </StorageProvider>
  );
}

function TestAuth() {
  const router = useRouter();
  const { token, setToken } = useStorageContext();
  const [authAttempted, setAuthAttempted] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || authAttempted) return;

    setToken("");
    if (typeof router.query.code !== "string") {
      console.error("No auth code found in URL!");
      setAuthLoading(false);
      return;
    }

    console.log("Fetching new OAuth token!", { code: router.query.code });
    setAuthAttempted(true);
    fetch(
      `/api/auth/initial?code=${router.query.code}&redirectUri=${process.env.NEXT_PUBLIC_TEST_REDIRECT_URI}`
    )
      .then((res) => {
        if (!res.ok) throw { message: "Error fetching token!", status: res.status };
        return res.json();
      })
      .then((tokenData) => {
        console.log("Token fetched!", tokenData);
        setToken(tokenData.accessToken);
        setAuthLoading(false);
      })
      .catch((err) => {
        setAuthLoading(false);
        console.error(err);
      });
  }, [authAttempted, router, setToken]);

  return (
    <main>
      <h2>Login Test</h2>
      {authLoading ? (
        <div>Auth loading...</div>
      ) : token ? (
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
