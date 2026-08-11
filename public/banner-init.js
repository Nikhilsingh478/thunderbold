(function () {
  var ua = navigator.userAgent || '';
  var href = window.location.href || '';
  var isTwa = href.indexOf('app_version=') !== -1 || href.indexOf('twa=') !== -1;
  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true ||
    isTwa;
  var isWebView =
    isStandalone ||
    /\bwv\b/i.test(ua) ||
    /Android.*Version\/[\d.]+ /.test(ua) ||
    typeof window.Android !== 'undefined';

  if (isWebView) {
    document.documentElement.style.setProperty('--tb-banner-h', '0px');
    var banner = document.getElementById('apk-banner');
    if (banner) banner.style.display = 'none';
  }
})();
