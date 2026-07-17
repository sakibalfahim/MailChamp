/** Blocking FOUC script — must stay in sync with ThemeProvider storageKey/attribute. */
export const THEME_STORAGE_KEY = "theme";

export const themeInitScript = `(function(){try{var s="${THEME_STORAGE_KEY}";var t=localStorage.getItem(s)||"system";var d=document.documentElement;var m=window.matchMedia("(prefers-color-scheme: dark)");var r=t==="system"?(m.matches?"dark":"light"):t;d.classList.remove("light","dark");d.classList.add(r);d.style.colorScheme=r}catch(e){}})();`;
