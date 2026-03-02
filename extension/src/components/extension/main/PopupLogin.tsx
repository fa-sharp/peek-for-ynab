import { browser } from "#imports";

import { useAuthContext } from "~lib/context";

const PopupLogin = () => {
  const { loginWithOAuth } = useAuthContext();
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        className="button rounded accent"
        onClick={
          browser?.runtime
            ? () => browser.runtime.openOptionsPage()
            : () => loginWithOAuth()
        }>
        🔑 Login
      </button>
      <button
        className="button rounded accent"
        onClick={() =>
          window.open(`${import.meta.env.PUBLIC_MAIN_URL}/privacy`, "_blank")
        }>
        🔒 Privacy Policy
      </button>
    </div>
  );
};

export default PopupLogin;
