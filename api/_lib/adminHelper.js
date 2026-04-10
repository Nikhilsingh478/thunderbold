const ADMIN_EMAIL_FALLBACK = process.env.ADMIN_EMAIL || 'adminthunderbolt@gmail.com';

/**
 * Check if an email belongs to an admin user.
 * Checks DB role first, falls back to ADMIN_EMAIL env var.
 */
export async function isAdmin(email, db) {
  if (!email) return false;
  try {
    const user = await db.collection('users').findOne({ email }, { projection: { role: 1 } });
    if (user?.role === 'admin') return true;
  } catch {
    // DB check failed — fall back silently
  }
  return email === ADMIN_EMAIL_FALLBACK;
}
