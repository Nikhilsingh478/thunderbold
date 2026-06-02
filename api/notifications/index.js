/**
 * Admin broadcast notification endpoint.
 *
 * POST /api/notifications/broadcast
 * Body: { title: string, body: string }
 * Auth: admin only
 *
 * Sends a push notification to every user who has at least one registered FCM token.
 * Invalid tokens discovered during the send are silently removed from the DB.
 * Returns { sent, failed, usersReached }.
 */
import { getDb } from '../_lib/mongodb.js';
import { verifyFirebaseToken } from '../_lib/firebaseAdmin.js';
import { getAdminMessaging } from '../_lib/firebaseAdmin.js';
import { isAdmin } from '../_lib/adminHelper.js';
import { sendMulticast } from '../_lib/fcm.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sub = (req.url || '/').split('?')[0].replace(/^\/+|\/+$/g, '').split('/').pop() || '';

  if (sub !== 'broadcast') {
    return res.status(404).json({ error: 'Not found' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let db;
  try {
    db = await getDb();
  } catch (err) {
    console.error('[notifications] DB error:', err.message);
    return res.status(500).json({ error: 'Database unavailable' });
  }

  let decoded;
  try {
    decoded = await verifyFirebaseToken(authHeader.split(' ')[1]);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!(await isAdmin(decoded.email, db))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const messaging = getAdminMessaging();
  if (!messaging) {
    return res.status(503).json({ error: 'Messaging service unavailable' });
  }

  const body = req.body || {};
  const { title, body: msgBody } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (!msgBody || typeof msgBody !== 'string' || !msgBody.trim()) {
    return res.status(400).json({ error: 'body is required' });
  }

  try {
    const usersWithTokens = await db
      .collection('users')
      .find(
        { fcmTokens: { $exists: true, $ne: [] } },
        { projection: { email: 1, fcmTokens: 1 } }
      )
      .toArray();

    if (usersWithTokens.length === 0) {
      return res.status(200).json({ sent: 0, failed: 0, usersReached: 0 });
    }

    const allTokens = usersWithTokens.flatMap((u) => u.fcmTokens || []);
    const usersReached = usersWithTokens.length;

    const { sent, failed, invalidTokens } = await sendMulticast(messaging, allTokens, {
      title: title.trim(),
      body: msgBody.trim(),
    });

    if (invalidTokens.length > 0) {
      for (const user of usersWithTokens) {
        const stale = (user.fcmTokens || []).filter((t) => invalidTokens.includes(t));
        if (stale.length > 0) {
          db.collection('users')
            .updateOne({ email: user.email }, { $pull: { fcmTokens: { $in: stale } } })
            .catch(() => {});
        }
      }
    }

    return res.status(200).json({ sent, failed, usersReached });
  } catch (err) {
    console.error('[notifications/broadcast] Error:', err.message);
    return res.status(500).json({ error: 'Failed to send notifications' });
  }
}
