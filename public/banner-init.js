// Banner detection — hides the APK download banner when running inside a
// WebView, standalone PWA, or TWA context. Runs synchronously in <body>
// immediately after the #apk-banner element so no flash of the banner occurs.
(function () {
  var ua = navigator.userAgent || '';
  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  var isWebView =
    isStandalone ||
    /\bwv\b/i.test(ua) ||
    /Android.*Version\/[\d.]+ /.test(ua) ||
    typeof window.Android !== 'undefined';
  if (isWebView) {
    var banner = document.getElementById('apk-banner');
    if (banner) banner.style.display = 'none';
  }
})();
