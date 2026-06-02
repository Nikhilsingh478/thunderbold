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
 * This function NEVER throws. All errors are caught and logged so callers
 * (order creation, status updates) are never blocked by notification failures.
 */
export async function sendToUser(db, userId, { title, body, data = {} }) {
  try {
    const messaging = getAdminMessaging();
    if (!messaging) {
      console.warn('[FCM-Send] Firebase Admin Messaging is not initialized. Skipping send.');
      return { sent: 0, failed: 0 };
    }

    const user = await db.collection('users').findOne(
      { email: userId },
      { projection: { fcmTokens: 1 } }
    );

    const tokens = user?.fcmTokens;
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      console.log(`[FCM-Send] No registered FCM tokens found for user: ${userId}. Skipping.`);
      return { sent: 0, failed: 0 };
    }

    console.log(`[FCM-Send] Attempting to send notification to ${userId} (${tokens.length} active token(s))`);
    
    // Build click destination URL
    let clickLink = 'https://thunderbold.shop/';
    if (data.orderId) {
      clickLink = `https://thunderbold.shop/orders?orderId=${data.orderId}`;
    }

    let sent = 0;
    let failed = 0;
    const tokensToRemove = [];

    for (const token of tokens) {
      try {
        const message = {
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
            fcmOptions: {
              link: clickLink,
            },
          },
        };

        const response = await messaging.send(message);
        console.log(`[FCM-Send] Successfully sent to token ${token.slice(0, 10)}... Response: ${response}`);
        sent++;
      } catch (err) {
        failed++;
        const code = err?.errorInfo?.code || err?.code || '';
        console.error(`[FCM-Send] Failed to send to token ${token.slice(0, 10)}... Code: "${code}". Error: ${err.message}`);
        
        if (INVALID_TOKEN_CODES.some((c) => code.includes(c))) {
          console.log(`[FCM-Send] Stale token identified for removal: ${token.slice(0, 10)}...`);
          tokensToRemove.push(token);
        }
      }
    }

    if (tokensToRemove.length > 0) {
      try {
        const updateRes = await db.collection('users').updateOne(
          { email: userId },
          { $pull: { fcmTokens: { $in: tokensToRemove } } }
        );
        console.log(`[FCM-Send] Removed ${tokensToRemove.length} stale tokens for user: ${userId}. Update matched: ${updateRes.matchedCount}`);
      } catch (dbErr) {
        console.error(`[FCM-Send] Database update error while removing stale tokens:`, dbErr.message);
      }
    }

    return { sent, failed };
  } catch (err) {
    console.error(`[FCM-Send] Critical exception caught during sendToUser for ${userId}:`, err.message);
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
  console.log(`[FCM-Multicast] Starting broadcast to ${tokens.length} token(s)`);
  
  let sent = 0;
  let failed = 0;
  const invalidTokens = [];

  const clickLink = data.orderId 
    ? `https://thunderbold.shop/orders?orderId=${data.orderId}`
    : 'https://thunderbold.shop/';

  const batches = [];
  for (let i = 0; i < tokens.length; i += 500) {
    batches.push(tokens.slice(i, i + 500));
  }

  for (const batch of batches) {
    try {
      const response = await messaging.sendEachForMulticast({
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
          fcmOptions: {
            link: clickLink,
          },
        },
      });

      console.log(`[FCM-Multicast] Batch send completed: success=${response.successCount}, failure=${response.failureCount}`);
      sent += response.successCount;
      failed += response.failureCount;

      response.responses.forEach((resp, i) => {
        if (!resp.success) {
          const code = resp.error?.code || '';
          console.warn(`[FCM-Multicast] Token ${batch[i].slice(0, 10)}... failed with error code: "${code}". Error: ${resp.error?.message}`);
          
          if (INVALID_TOKEN_CODES.some((c) => code.includes(c))) {
            invalidTokens.push(batch[i]);
          }
        }
      });
    } catch (batchErr) {
      console.error('[FCM-Multicast] Critical error during batch multicast execution:', batchErr.message);
      failed += batch.length;
    }
  }

  return { sent, failed, invalidTokens };
}
