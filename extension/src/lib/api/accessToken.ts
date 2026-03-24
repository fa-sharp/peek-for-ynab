/** Fetch the current access token from the server, along with a new auth token if token was refreshed */
export async function fetchAccessToken(authToken: string) {
  const res = await fetch(`${import.meta.env.PUBLIC_MAIN_URL}/api/token`, {
    method: "POST",
    headers: { Authorization: authToken },
  });
  if (res.ok) {
    const data: { accessToken: string; authToken?: string } = await res.json();
    return { data, error: undefined };
  } else {
    return {
      error: {
        status: res.status,
        message: await res.text(),
      },
    };
  }
}
