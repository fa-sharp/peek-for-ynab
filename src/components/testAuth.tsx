import { useRouter } from "next/router";
import { useEffect } from "react";

import { StorageProvider } from "~lib/storageContext";
import type { TokenData } from "~pages/api/auth/initial";

function TestAuth() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof router.query.code !== "string") router.push("/401");

    console.log("Fetching new OAuth token!");
    fetch(`/api/auth/initial?code=${router.query.code}`)
      .then((res) => res.json())
      .then((tokenData: TokenData) => console.table(tokenData));
  }, [router]);

  return (
    <StorageProvider>
      <div>See console!</div>
    </StorageProvider>
  );
}

export default TestAuth;
