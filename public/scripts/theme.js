/** Script to detect and set color theme before React loads, to avoid the infamous 'flash' */
(function () {
  if (!window?.localStorage || !window?.matchMedia) return;

  const themeSetting = JSON.parse(window.localStorage.getItem("theme") || '"auto"');
  const prefersDarkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

  if (
    (themeSetting === "auto" && prefersDarkModeQuery.matches) ||
    themeSetting === "dark"
  )
    document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
})();
