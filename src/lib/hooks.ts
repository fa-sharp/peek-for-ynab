import JSConfetti from "js-confetti";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import useLocalStorageState from "use-local-storage-state";

/**
 * Sets the theme based on user setting in localStorage and media query.
 * See also [theme.js](../../public/scripts/theme.js) which avoids the 'flash' on load.
 */
export const useSetColorTheme = () => {
  const [themeSetting] = useLocalStorageState<"light" | "dark" | "auto">("theme", {
    defaultValue: "auto"
  });

  useLayoutEffect(() => {
    const prefersDarkModeQuery = window?.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

    if (
      (themeSetting === "auto" && prefersDarkModeQuery?.matches) ||
      themeSetting === "dark"
    )
      document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    const listener = (e: MediaQueryListEvent) => {
      if ((themeSetting === "auto" && e.matches) || themeSetting === "dark")
        document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    };
    prefersDarkModeQuery?.addEventListener("change", listener);

    return () => prefersDarkModeQuery?.removeEventListener("change", listener);
  }, [themeSetting]);
};

export const useConfetti = () => {
  const confetti = useRef<JSConfetti>();
  useEffect(() => {
    confetti.current = new JSConfetti();
    return () => confetti.current?.destroyCanvas();
  }, []);

  const launchConfetti = useCallback((emojis: string[]) => {
    confetti.current?.addConfetti({
      emojis,
      emojiSize: 40
    });
  }, []);

  return {
    launchConfetti
  };
};
