// Service worker registration — deferred to window load so it does not
// compete with critical page resources. Failure is silently swallowed
// because SW is a progressive enhancement (app works without it).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
  });
}
