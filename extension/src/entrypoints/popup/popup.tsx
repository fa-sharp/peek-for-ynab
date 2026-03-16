import { PopupLogin, PopupMain } from "~components";
import { AppProvider, useAuthContext } from "~lib/context";
import { useSetColorTheme } from "~lib/hooks";

function PopupWrapper() {
  return (
    <AppProvider>
      <PopupView />
    </AppProvider>
  );
}

export function PopupView() {
  const { loggedIn } = useAuthContext();

  useSetColorTheme();

  return (
    <div
      style={{
        padding: "1em",
        minWidth: "260px",
        maxWidth: "360px",
        minHeight: "50px",
      }}>
      {!loggedIn ? <PopupLogin /> : <PopupMain />}
    </div>
  );
}

export default PopupWrapper;
