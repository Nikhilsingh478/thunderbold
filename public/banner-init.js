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
    return;
  }

  // Reveal the banner after the splash/loader finishes, or immediately if
  // the splash has already been shown this session (so navigating back to
  // the homepage doesn't hide the banner while the loader is skipped).
  function showBanner() {
    var b = document.getElementById('apk-banner');
    if (!b) return;
    b.style.opacity = '1';
    b.style.pointerEvents = 'auto';
  }

  if (sessionStorage.getItem('tb_splash_shown')) {
    // Loader already played — show immediately
    showBanner();
  } else {
    // Wait for the loader to finish before revealing the banner
    document.addEventListener('thunderbold:loaderDone', showBanner, { once: true });
    // Safety fallback: show the banner after 4 s regardless, in case the event
    // never fires (e.g. a JS error in the loader, prefers-reduced-motion path).
    setTimeout(showBanner, 4000);
  }
})();
