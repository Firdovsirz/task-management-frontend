export const THEME_STORAGE_KEY = 'theme';

/**
 * Runs in <head> before first paint, so a dark-mode visitor never sees a white flash.
 * Same key, same default (light) and same rules as firdovsirzaev.online.
 */
export const THEME_INIT_SCRIPT = `
(function(){
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var mode = stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'light';
    var effective = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    document.documentElement.setAttribute('data-theme', effective);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;
