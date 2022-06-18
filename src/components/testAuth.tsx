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
  const { setToken } = useStorageContext();
  const [fetchAttempted, setFetchAttempted] = useState(false);

  useEffect(() => {
    if (!router.isReady || fetchAttempted) return;
    if (typeof router.query.code !== "string") {
      router.push("/401");
      return;
    }

    console.log("Fetching new OAuth token!", { code: router.query.code });
    setFetchAttempted(true);
    fetch(
      `/api/auth/initial?code=${router.query.code}&redirectUri=${process.env.NEXT_PUBLIC_TEST_REDIRECT_URI}`
    )
      .then((res) => {
        if (!res.ok) throw { message: "Error fetching token!" };
        return res.json();
      })
      .then((tokenData) => {
        console.log("Token fetched!", tokenData);
        setToken(tokenData.accessToken);
      })
      .catch((err) => console.error(err));
  }, [fetchAttempted, router, setToken]);

  return <div>See console!</div>;
}

export default TestAuthWrapper;
