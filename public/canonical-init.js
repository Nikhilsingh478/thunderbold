// Canonical URL updater — runs synchronously in <head> before first paint.
// Sets the canonical link and og:url to the current page path.
// Also caches native-app version code and TWA state from query params.
(function () {
  try {
    var path = window.location.pathname;
    var url = 'https://thunderbold.shop' + path;
    if (url.length > 27 && url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', url);
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', url);

    var params = new URLSearchParams(window.location.search);
    var appVersion = params.get('app_version');
    if (appVersion) {
      localStorage.setItem('tb_native_app_version', appVersion);
    }
    if (
      window.location.search.includes('utm_source=twa') ||
      document.referrer.startsWith('android-app://')
    ) {
      localStorage.setItem('tb_is_twa', 'true');
    }
  } catch (e) {}
})();
