/**
 * Shared CORS helper for Vercel serverless API functions.
 *
 * In production Vercel executes each api/*.js file as an isolated serverless
 * function — server.js Express middleware never runs. This helper must be
 * imported and called at the top of every handler so CORS headers are set
 * correctly on every response, including OPTIONS preflight requests.
 *
 * Allowed origins:
 *   - https://thunderbold.shop       (production)
 *   - https://www.thunderbold.shop   (www redirect target)
 *   - http://localhost:5000          (Vite dev server)
 *   - http://localhost:3000          (alternative dev port)
 *
 * If the request comes from any other origin, the header is set to the
 * production origin so the browser CORS check fails and the response is
 * blocked (rather than reflecting the attacker origin).
 */

const ALLOWED_ORIGINS = [
  'https://thunderbold.shop',
  'https://www.thunderbold.shop',
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:3000',
];

/**
 * Sets all required CORS headers on `res`.
 * Call this as the very first thing in every serverless handler, before the
 * OPTIONS method check so that preflight responses also carry CORS headers.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 * @param {string} [methods='GET, POST, PUT, PATCH, DELETE, OPTIONS']
 */
export function setCorsHeaders(req, res, methods = 'GET, POST, PUT, PATCH, DELETE, OPTIONS') {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Do not reflect unknown origins — fall back to production origin so the
    // browser CORS check fails for cross-origin requests from untrusted sources.
    res.setHeader('Access-Control-Allow-Origin', 'https://thunderbold.shop');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
