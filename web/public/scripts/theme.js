detectAndApplyTheme();

/** Detects the user's preferred color theme and applies it to the document. */
function detectAndApplyTheme() {
  if (!window?.localStorage || !window?.matchMedia) return;

  const themeSetting = JSON.parse(window.localStorage.getItem("theme") || '"auto"');
  const prefersDarkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const shouldEnableDark =
    (themeSetting === "auto" && prefersDarkModeQuery.matches) || themeSetting === "dark";

  if (shouldEnableDark) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}
