import { getAdminMessaging } from './firebaseAdmin.js';

/**
 * FCM error codes that mean the token is permanently invalid.
 * When these are returned, the token is removed from the user's DB record.
 */
const INVALID_TOKEN_CODES = [
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
];

/**
 * Send a push notification to all FCM tokens registered for a given user.
 *
 * @param {object} db       - MongoDB db instance
 * @param {string} userId   - User's email (used as userId in the users collection)
 * @param {object} payload  - { title, body, data? }
 * @returns {{ sent: number, failed: number }}
 *
 * This function NEVER throws. All errors are caught and swallowed so callers
 * (order creation, status updates) are never blocked by notification failures.
 */
export async function sendToUser(db, userId, { title, body, data = {} }) {
  try {
    const messaging = getAdminMessaging();
    if (!messaging) return { sent: 0, failed: 0 };

    const user = await db.collection('users').findOne(
      { email: userId },
      { projection: { fcmTokens: 1 } }
    );

    const tokens = user?.fcmTokens;
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const tokensToRemove = [];

    for (const token of tokens) {
      try {
        await messaging.send({
          token,
          notification: { title, body },
          data: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
          ),
          webpush: {
            notification: {
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-96x96.png',
              vibrate: [200, 100, 200],
            },
          },
        });
        sent++;
      } catch (err) {
        failed++;
        const code = err?.errorInfo?.code || err?.code || '';
        if (INVALID_TOKEN_CODES.some((c) => code.includes(c))) {
          tokensToRemove.push(token);
        }
      }
    }

    if (tokensToRemove.length > 0) {
      try {
        await db.collection('users').updateOne(
          { email: userId },
          { $pull: { fcmTokens: { $in: tokensToRemove } } }
        );
      } catch {}
    }

    return { sent, failed };
  } catch {
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send a push notification to a flat list of tokens in batches of 500 (FCM limit).
 * Used by the admin broadcast endpoint.
 *
 * @param {object} messaging  - Firebase Admin Messaging instance
 * @param {string[]} tokens   - All FCM tokens to send to
 * @param {{ title, body, data? }} payload
 * @returns {{ sent: number, failed: number, invalidTokens: string[] }}
 */
export async function sendMulticast(messaging, tokens, { title, body, data = {} }) {
  let sent = 0;
  let failed = 0;
  const invalidTokens = [];

  const batches = [];
  for (let i = 0; i < tokens.length; i += 500) {
    batches.push(tokens.slice(i, i + 500));
  }

  for (const batch of batches) {
    const result = await messaging.sendEachForMulticast({
      tokens: batch,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
        },
      },
    });

    sent += result.successCount;
    failed += result.failureCount;

    result.responses.forEach((resp, i) => {
      if (!resp.success) {
        const code = resp.error?.code || '';
        if (INVALID_TOKEN_CODES.some((c) => code.includes(c))) {
          invalidTokens.push(batch[i]);
        }
      }
    });
  }

  return { sent, failed, invalidTokens };
}
