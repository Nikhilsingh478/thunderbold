const ADMIN_EMAILS = [
  'adminthunderbolt@gmail.com',
  'neelsingh45940s@gmail.com',
  'thepavanartt@gmail.com',
];

/**
 * Check if an email belongs to an admin user.
 * Checks DB role first, falls back to hardcoded admin list.
 */
export async function isAdmin(email, db) {
  if (!email) return false;
  try {
    const user = await db.collection('users').findOne({ email }, { projection: { role: 1 } });
    if (user?.role === 'admin') return true;
  } catch {
    // DB check failed — fall back silently
  }
  return ADMIN_EMAILS.includes(email);
}
