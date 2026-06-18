# Thunderbold — Database Architecture & Complete Schema Reference

> MongoDB Atlas · Database: `thunderbold` · 9 collections · Node.js Native Driver

---

## Table of Contents

1. [Database Overview](#1-database-overview)
2. [Collection Schemas](#2-collection-schemas)
   - [2.1 users](#21-users)
   - [2.2 products](#22-products)
   - [2.3 orders](#23-orders)
   - [2.4 returns](#24-returns)
   - [2.5 cart](#25-cart)
   - [2.6 wishlist](#26-wishlist)
   - [2.7 reviews](#27-reviews)
   - [2.8 categories](#28-categories)
   - [2.9 brands](#29-brands)
   - [2.10 config](#210-config)
3. [Indexes](#3-indexes)
4. [Relationships & Access Patterns](#4-relationships--access-patterns)
5. [Key Query Patterns](#5-key-query-patterns)
6. [Data Integrity Mechanisms](#6-data-integrity-mechanisms)
7. [Migration Readiness — PostgreSQL / Supabase](#7-migration-readiness--postgresql--supabase)

---

## 1. Database Overview

| Property | Value |
|---|---|
| Engine | MongoDB Atlas (M0 free tier compatible) |
| Database name | `thunderbold` |
| Driver | `mongodb` (official Node.js native driver) |
| Connection pool | `minPoolSize: 2`, `maxPoolSize: 10`, `serverSelectionTimeoutMS: 5000` |
| Pool caching | Singleton cached in `global.mongo` — survives serverless warm-starts |
| Collections | 9 |

MongoDB was chosen for its flexible document model — particularly valuable during early product iteration when schema fields changed frequently (e.g. the `highlights` sub-object, `topwear`/`bottomwear` outfit variant, `section` classification, `orderNumber` generation, and the `returns` collection all added iteratively without schema migrations).

### Connection Bootstrap (`api/_lib/mongodb.js`)

On first connection, the module bootstraps all required indexes asynchronously. Index creation is non-blocking and non-fatal — any index creation failure is logged as a warning but does not crash the server.

---

## 2. Collection Schemas

All documents use MongoDB's auto-generated `_id` (ObjectId) as the primary key unless otherwise noted.

---

### 2.1 `users`

One document per registered user. Created or updated on every login via `POST /api/users`. The upsert is keyed on `email` (not UID) to handle account re-linking.

```json
{
  "_id":       "ObjectId",
  "uid":       "string",             // Firebase UID — used as lookup key for profile GET/PATCH/DELETE
  "email":     "string",             // Used as userId in cart / wishlist / orders / reviews
  "name":      "string",
  "phone":     "string | null",      // 10 digits; non-digit characters stripped before storage
  "role":      "\"user\" | \"admin\"", // Default: "user"
  "addresses": [
    {
      "id":           "string",      // Client-generated: Date.now().toString(36) + random suffix
      "fullName":     "string",
      "phone":        "string",      // 10 digits
      "addressLine1": "string",
      "addressLine2": "string",
      "city":         "string",
      "state":        "string",
      "pincode":      "string",      // 6 digits; non-digit chars stripped before storage
      "landmark":     "string",
      "isDefault":    "boolean",
      "createdAt":    "ISO 8601 string"
    }
  ],
  "fcmTokens": [
    {
      "token":     "string",         // FCM registration token from Firebase Messaging SDK
      "deviceId":  "string",         // Persistent random ID generated in browser localStorage
      "updatedAt": "Date"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Design notes:**

- `uid` is the Firebase UID. Profile `GET`, `PATCH`, and `DELETE` operations look up by `uid`.
- `email` is used as the foreign key across orders, cart, wishlist, and reviews. Firebase UIDs can change on account re-linking; email is stable — critical for COD order history.
- `addresses` is an embedded array (not a separate collection). Users typically have fewer than 10 addresses; always fetched as a unit; no cross-user address queries exist. At most one address can have `isDefault: true` — enforced at the application layer.
- `fcmTokens` stores one entry per device/browser. The backend enforces a 1-to-1 mapping between `deviceId` and active FCM token: before inserting a new token, any existing entry with the same `deviceId` or same `token` string is removed. This completely prevents duplicate notification delivery to a single device.

**Unique constraints** (application-enforced): `uid`, `email`

---

### 2.2 `products`

The product catalogue. Supports two structural variants depending on `section`.

#### Standard Product

Applies to `section: "denim" | "shirts" | "t-shirts" | "kurtas" | "live-sale"`

```json
{
  "_id":          "ObjectId",
  "name":         "string",
  "price":        "number",          // Actual selling price (INR)
  "mrp":          "number | null",   // Customer-facing crossed-out price (optional)
  "purchasePrice":"number | null",   // Internal cost price — NEVER exposed to public API
  "image":        "string",          // Primary image URL (Cloudinary)
  "images":       ["string"],        // All product images (Cloudinary URLs)
  "description":  "string",
  "categoryId":   "string",          // References categories._id (stored as string, not ObjectId)
  "brandId":      "string | null",   // References brands._id (stored as string, optional)
  "section":      "\"denim\" | \"shirts\" | \"t-shirts\" | \"kurtas\" | \"live-sale\"",
  "sizeStock": {
    "28": "number",                  // Jeans / bottomwear sizes
    "30": "number",
    "32": "number",
    "34": "number",
    "36": "number"
    // OR apparel sizes: S, M, L, XL, XXL
  },
  "stock":        "number",          // Sum of all sizeStock values — kept in sync on every write
  "highlights": {
    "color":          "string",
    "length":         "string",
    "printsPattern":  "string",
    "waistRise":      "string",
    "shade":          "string",
    "lengthInches":   "string"
  },
  "createdAt":    "Date",
  "updatedAt":    "Date | null"
}
```

#### Outfit Product

Applies to `section: "outfits"`. Contains a bifurcated stock structure — one for the topwear piece, one for the bottomwear piece.

```json
{
  "_id":     "ObjectId",
  "name":    "string",
  "price":   "number",
  "mrp":     "number | null",
  "section": "\"outfits\"",
  "topwear": {
    "sizeStock": { "S": 5, "M": 3, "L": 2, "XL": 0, "XXL": 0 },
    "stock":     10,
    "highlights": {
      "color": "string",
      "length": "string"
    }
  },
  "bottomwear": {
    "sizeStock": { "28": 4, "30": 6, "32": 2, "34": 0, "36": 0 },
    "stock":     12,
    "highlights": {
      "color": "string",
      "waistRise": "string"
    }
  },
  "stock":  "number",                // min(topwear.stock, bottomwear.stock) — bottleneck determines availability
  "image":  "string",
  "images": ["string"],
  "description": "string",
  "createdAt": "Date",
  "updatedAt": "Date | null"
}
```

**Valid size sets:**
- Jeans / bottomwear: `28`, `30`, `32`, `34`, `36`
- Apparel / topwear: `S`, `M`, `L`, `XL`, `XXL`

**Pricing field rules:**
- `price` — always present; the actual selling price
- `mrp` — optional; the crossed-out original price shown to customers
- `purchasePrice` — internal cost; **stripped from all non-admin API responses** via MongoDB projection `{ purchasePrice: 0 }`. It never reaches a non-admin client.

**MRP backward-compatibility:** Old products stored `purchasePrice` where `mrp` should be. The API handles this via: `mrp: doc.mrp ?? doc.purchasePrice ?? null` — no data migration required.

---

### 2.3 `orders`

One document per order. `products` and `address` are embedded snapshots — prices, names, and the delivery address are frozen at order creation time. Product catalogue changes or address book updates do not affect historical orders.

```json
{
  "_id":           "ObjectId",
  "userId":        "string",         // User's email address (not Firebase UID)
  "orderNumber":   "string",         // "TB-XXXXXX" — 6-char uppercase alphanumeric, collision-checked
  "clientOrderId": "string | null",  // Client-generated idempotency key (optional)
  "products": [
    {
      "productId":      "string",    // References products._id (as string — snapshot only)
      "name":           "string",    // Snapshot of name at order time
      "price":          "number",    // Snapshot of price at order time
      "image":          "string",    // Snapshot of primary image at order time
      "size":           "string",    // e.g. "32" or "M"
      "quantity":       "number",
      "topwearSize":    "string | undefined",   // Outfit products only
      "bottomwearSize": "string | undefined"    // Outfit products only
    }
  ],
  "address": {
    "fullName":     "string",
    "phone":        "string",
    "addressLine1": "string",
    "addressLine2": "string | undefined",
    "city":         "string",
    "state":        "string",
    "pincode":      "string"
  },
  "paymentMethod":  "\"COD\"",
  "status":         "\"pending\" | \"confirmed\" | \"packed\" | \"shipped\" | \"delivered\" | \"cancelled\" | \"return_requested\" | \"return_approved\" | \"return_rejected\" | \"refund_issued\"",
  "totalAmount":    "number",        // Sum of (price × quantity) for all products at order time
  "giftMessage":    "string | undefined",  // HTML-stripped, trimmed, max 300 chars
  "returnShippingCharges": "number | undefined", // Set on return_approved — ₹ deducted from refund
  "returnRefundAmount":    "number | undefined", // Set on return_approved — final refund amount
  "adminNotes":            "string | null",       // Written by admin on return_approved or return_rejected
                                                  // Propagated from the returns doc to this order doc so
                                                  // the customer sees the message via GET /api/orders alone
  "createdAt":      "Date",
  "updatedAt":      "Date | null"
}
```

**Key design decisions:**
- `address` is embedded as a snapshot. The user may change their saved addresses later, but the delivery address is frozen at order time.
- `products` array is a snapshot. Historical orders remain accurate even if a product is deleted or repriced.
- `userId` is the user's email (not Firebase UID). Stable across account re-linking.
- `orderNumber` uses 6 uppercase alphanumeric characters prefixed with `TB-`, excluding ambiguous characters (`I`, `O`, `0`, `1`). Uniqueness is checked at write time. Legacy orders without `orderNumber` fall back to the last 6 characters of the MongoDB `_id` string, displayed as `TB-XXXXXX`.
- `clientOrderId` has a sparse unique index — enables idempotent order creation. Any retry with the same `clientOrderId` returns the existing order without inserting a duplicate.
- Return-related status values (`return_requested`, `return_approved`, `return_rejected`, `refund_issued`) are set by the returns system when a `returns` document is created or updated.

---

### 2.4 `returns`

One document per return request. Created when a customer submits `POST /api/returns` for a delivered order. Managed by admin via `PATCH /api/returns?id=`.

```json
{
  "_id":                  "ObjectId",
  "orderId":              "string",        // References orders._id (as string)
  "orderNumber":          "string | null", // Snapshot of the order's TB-XXXXXX number
  "userId":               "string",        // User's email — ownership check key
  "products":             [                // Snapshot of the order's products array at request time
    {
      "productId":        "string",
      "name":             "string",
      "price":            "number",
      "image":            "string",
      "size":             "string",
      "quantity":         "number",
      "topwearSize":      "string | undefined",
      "bottomwearSize":   "string | undefined"
    }
  ],
  "totalAmount":          "number",        // Snapshot of order's totalAmount at request time
  "shippingCharges":      "number",        // ₹ to deduct from refund; default ₹50, admin-overridable
  "suggestedRefundAmount":"number",        // Pre-computed: max(0, totalAmount − shippingCharges)
  "reason":               "\"defective\" | \"wrong_item\" | \"size_issue\" | \"not_as_described\" | \"other\"",
  "description":          "string",        // Customer's explanation; HTML-stripped; 10–500 chars
  "status":               "\"pending\" | \"approved\" | \"rejected\" | \"refund_issued\"",
  "refundAmount":         "number | null", // Set by admin on approval; null until then
  "adminNotes":           "string | null", // Admin's notes on approval or rejection; HTML-stripped
  "refundIssuedAt":       "Date | undefined", // Set when action: "issue_refund" is called
  "createdAt":            "Date",
  "updatedAt":            "Date"
}
```

**Status lifecycle:**

```
pending → approved → refund_issued
        → rejected
```

**Business rules:**
- Return can only be submitted for `status: "delivered"` orders
- One return per order — duplicate `POST` returns `409 Conflict` with the existing return ID and status
- On approval: `refundAmount` is set, stock is restored (size-aware and outfit-aware), and the parent order's status is updated to `return_approved`
- On rejection: `adminNotes` are stored; order status updated to `return_rejected`
- On refund issued: both the return and the order status are updated to `refund_issued`
- Stock restore on approval mirrors the order creation logic: outfit products restore both topwear and bottomwear sizeStock; standard products restore the specific size + aggregate stock

---

### 2.5 `cart`

One document per user. The entire `items` array is replaced on every write (no incremental item PATCH).

```json
{
  "_id":    "ObjectId",
  "userId": "string",    // User's email — unique per user; upsert key
  "items": [
    {
      "productId": "string",
      "name":      "string",
      "price":     "number",
      "image":     "string",
      "size":      "string",
      "quantity":  "number"
    }
  ],
  "updatedAt": "Date"
}
```

**Notes:** The `{ userId: 1 }` index has `unique: true`. There is exactly one cart document per user. All writes use `upsert: true` to create the document on first save.

---

### 2.6 `wishlist`

Structurally identical to `cart`, minus `size` and `quantity` (wishlisted items are not size-committed).

```json
{
  "_id":    "ObjectId",
  "userId": "string",    // User's email — unique per user; upsert key
  "items": [
    {
      "productId": "string",
      "name":      "string",
      "price":     "number",
      "image":     "string"
    }
  ],
  "updatedAt": "Date"
}
```

---

### 2.7 `reviews`

One document per submitted review. Deleted reviews are soft-deleted (`isDeleted: true`) rather than permanently removed, preserving the record for admin audit.

```json
{
  "_id":       "ObjectId",
  "userId":    "string",    // Reviewer's email
  "productId": "string",    // References products._id (as string)
  "orderId":   "string",    // References orders._id (as string) — the qualifying delivered order
  "rating":    "number",    // Integer 1–5 (validated server-side)
  "comment":   "string",    // Trimmed, max 1000 chars
  "isDeleted": "boolean",   // Soft delete flag (default: false)
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Business rules:**
- A user can only review a product if they have a `delivered` order containing that `productId`. Verified server-side on every `POST`.
- One active (non-deleted) review per `(userId, productId)` — enforced at application layer. Duplicate `POST` returns `409` with the existing review so the client can switch to edit mode.
- `DELETE` sets `isDeleted: true`. All public and user-scoped `GET` queries filter `{ isDeleted: { $ne: true } }`.
- Admins can soft-delete any review; users can only delete their own.

---

### 2.8 `categories`

Lookup table for product category groupings. Admin-managed.

```json
{
  "_id":       "ObjectId",
  "name":      "string",
  "image":     "string",    // Cloudinary URL (category tile image)
  "section":   "string",    // e.g. "denim" — groups categories under a product section
  "createdAt": "Date"
}
```

**Notes:** Products reference categories via `categoryId` stored as a string (not an ObjectId reference). Category names are resolved client-side from the cached categories list. The `CategoriesSection` component fetches both products and categories in parallel via `apiCache.ts` and cross-references them in the render.

---

### 2.9 `brands`

Lookup table for brand pages. Admin-managed.

```json
{
  "_id":       "ObjectId",
  "name":      "string",
  "image":     "string",    // Brand logo (Cloudinary URL)
  "createdAt": "Date",
  "updatedAt": "Date | null"
}
```

**Notes:** Products optionally reference brands via `brandId` (stored as string). The `BrandsPage` and `BrandView` pages list brands and filter products by `brandId` respectively.

---

### 2.10 `config`

Site-wide configuration. Uses fixed string `_id` values (not ObjectIds). Currently holds exactly two documents.

#### ThunderboltSlider — `_id: "slider"`

```json
{
  "_id": "slider",
  "slides": [
    {
      "imageUrl":     "string",         // Cloudinary or external URL for editorial card image
      "heading":      "string",         // Large ghost heading e.g. "SHARP", "REBEL", "WILD", "NOIR"
      "productId":    "string | null",  // Links slide to /product/:id on click; null = no link
      "productName":  "string | null",
      "productImage": "string | null"
    }
    // × 4 — always exactly 4 elements; admin UI enforces this
  ],
  "updatedAt": "Date"
}
```

#### Hero Banner — `_id: "hero-banner"`

```json
{
  "_id": "hero-banner",
  "images": ["string", "string", "string"],  // Up to 3 full-width banner image URLs
  "updatedAt": "Date"
}
```

**Access pattern:**
- `GET /api/slider` — public; returns both documents (client picks `_id` to determine type)
- `GET /api/slider?type=hero` — public; returns only `_id: "hero-banner"` doc
- `PUT /api/slider` — admin only; upserts by `_id`

**Notes:**
- All banner images are served via Cloudinary and transformed through `optimizeCloudinaryUrl()` on the frontend.
- `HeroBanner.tsx` falls back to hardcoded default images if the API returns an empty array or errors — the homepage is never blank.
- A legacy `slider` collection may still exist in Atlas. The application reads exclusively from `config`.

---

## 3. Indexes

All indexes are bootstrapped asynchronously in `api/_lib/mongodb.js` on first connection. Non-blocking and non-fatal.

| Collection | Fields | Options | Purpose |
|---|---|---|---|
| `orders` | `{ userId: 1 }` | | User's order list fetch |
| `orders` | `{ createdAt: -1 }` | | Admin listing (newest first) |
| `orders` | `{ clientOrderId: 1 }` | sparse + unique | Idempotency key deduplication |
| `products` | `{ categoryId: 1 }` | | Products by category |
| `cart` | `{ userId: 1 }` | unique | One cart per user; fast lookup |
| `wishlist` | `{ userId: 1 }` | unique | One wishlist per user; fast lookup |
| `reviews` | `{ productId: 1, isDeleted: 1, createdAt: -1 }` | | Public product review listing with sort |
| `reviews` | `{ userId: 1, isDeleted: 1 }` | | User's own reviews |
| `reviews` | `{ userId: 1, productId: 1 }` | | Duplicate review check + eligibility lookup |

**Recommended additions** (not currently created — collection-scan acceptable at current scale):

| Collection | Recommended Index | Reason |
|---|---|---|
| `products` | `{ section: 1, createdAt: -1 }` | Section-filtered product listings currently scan the full collection |
| `products` | `{ stock: 1 }` | Stock alert queries in admin analytics currently scan the full collection |
| `orders` | `{ userId: 1, createdAt: -1 }` | Compound for user order listing with sort in one index |
| `orders` | `{ status: 1 }` | Admin status-filtered views |
| `returns` | `{ userId: 1 }` | Customer's own return list |
| `returns` | `{ orderId: 1 }` | Idempotency check (one return per order) |
| `returns` | `{ status: 1, createdAt: -1 }` | Admin return queue sorted by date |
| `reviews` | `{ userId: 1, productId: 1, isDeleted: 1 }` | Compound partial index for deduplication |

---

## 4. Relationships & Access Patterns

MongoDB's flexible document model avoids most joins by embedding related data at write time. The following diagram shows the logical relationships:

```
users (uid, email)
  │
  ├──[email as userId]──► orders
  │                         ├── products[]  (snapshot — no live join needed)
  │                         └── address     (snapshot — frozen at order time)
  │
  ├──[email as userId]──► returns
  │                         ├── orderId     → orders (checked at write time; snapshot also stored)
  │                         └── products[]  (snapshot from the qualifying order)
  │
  ├──[email as userId]──► cart
  │                         └── items[]     (live product data embedded at add time)
  │
  ├──[email as userId]──► wishlist
  │                         └── items[]     (live product data embedded at add time)
  │
  └──[email as userId]──► reviews
                            ├── productId → products (checked at write time)
                            └── orderId   → orders   (checked at write time; eligibility gate)

products
  ├── categoryId → categories  (string reference; resolved client-side)
  └── brandId    → brands      (string reference; optional)
```

**Embedding vs. referencing decisions:**

| Data | Strategy | Reason |
|---|---|---|
| User addresses | Embedded | Always fetched with user; small set (<10 per user); no cross-user queries |
| Order products | Embedded snapshot | Prices/names must be frozen at order time |
| Order delivery address | Embedded snapshot | Address may change after order; must be frozen |
| Return products | Embedded snapshot | Copied from the qualifying order at request time |
| Cart items | Embedded | Always fetched as a unit; no partial updates |
| Wishlist items | Embedded | Same as cart |
| User FCM tokens | Embedded array | Always fetched/updated with user document |
| Product category name | Referenced | Categories change infrequently; resolved client-side from cached list |
| Review → order validation | Referenced (checked at write only) | One-time eligibility check; no ongoing join |

---

## 5. Key Query Patterns

### 5.1 Product Listing (public)

```javascript
db.collection('products').find(
  { section: 'denim' },                       // optional section filter
  { projection: { purchasePrice: 0 } }        // strip internal cost — never reaches client
).sort({ createdAt: -1 })
```

### 5.2 User Order History

```javascript
db.collection('orders').find(
  { userId: userEmail }
).sort({ createdAt: -1 })
```

### 5.3 Idempotent Order Creation Check

```javascript
const existing = await db.collection('orders').findOne({ clientOrderId: clientOrderId });
// If found → return existing order immediately (no duplicate insert)
```

### 5.4 Atomic Stock Decrement (race-condition safe)

```javascript
const result = await db.collection('products').updateOne(
  {
    _id: productObjectId,
    [`sizeStock.${size}`]: { $gte: quantity }   // guard: only update if stock is sufficient
  },
  {
    $inc: {
      [`sizeStock.${size}`]: -quantity,
      stock: -quantity
    }
  }
);
// If result.modifiedCount === 0 → race condition (stock changed between check and decrement)
// → rollback all previously decremented items + delete the order document → 409 Conflict
```

### 5.5 Return Idempotency Check

```javascript
const existing = await db.collection('returns').findOne({ orderId: orderId });
// If found → 409 Conflict with existing return ID and status
```

### 5.6 Admin Analytics — Revenue Over Time

```javascript
db.collection('orders').aggregate([
  {
    $match: {
      createdAt: { $gte: rangeFrom, $lte: rangeTo },
      status: { $nin: ['cancelled', 'canceled', 'refunded'] }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
      revenue: { $sum: '$totalAmount' }
    }
  }
])
```

### 5.7 Profit Calculation (aggregation with lookup)

```javascript
db.collection('orders').aggregate([
  { $match: { status: { $in: ['delivered', 'completed'] }, createdAt: { $gte: from, $lte: to } } },
  { $unwind: '$products' },
  {
    $lookup: {
      from: 'products',
      let: { pid: '$products.productId' },
      pipeline: [
        { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$pid'] } } },
        { $project: { purchasePrice: 1 } }
      ],
      as: 'productData'
    }
  },
  { $match: { 'productData.0.purchasePrice': { $ne: null } } },
  {
    $group: {
      _id: null,
      profit: {
        $sum: {
          $multiply: [
            { $subtract: ['$products.price', { $arrayElemAt: ['$productData.purchasePrice', 0] }] },
            '$products.quantity'
          ]
        }
      }
    }
  }
])
```

### 5.8 Review Eligibility Check

```javascript
const qualifyingOrder = await db.collection('orders').findOne({
  userId: userEmail,
  status: 'delivered',
  'products.productId': productId    // MongoDB searches the embedded array
});
// If null → user has not received this product → block review with 403
```

### 5.9 FCM Broadcast — All Users with Tokens

```javascript
const usersWithTokens = await db.collection('users').find(
  { fcmTokens: { $exists: true, $ne: [] } },
  { projection: { email: 1, fcmTokens: 1 } }
).toArray();
```

### 5.10 Stock Alerts (Admin Dashboard)

```javascript
const lowStockProducts = await db.collection('products').find(
  { stock: { $gt: 0, $lte: 5 } },
  { projection: { name: 1, stock: 1, image: 1 } }
).toArray();

const outOfStockProducts = await db.collection('products').find(
  { stock: { $lte: 0 } },
  { projection: { name: 1, stock: 1, image: 1 } }
).toArray();
```

---

## 6. Data Integrity Mechanisms

MongoDB does not support foreign key constraints or multi-document ACID transactions by default. The following mechanisms preserve data integrity at the application layer.

### 6.1 Idempotent Order Creation

Client-generated `clientOrderId` + sparse unique index prevents duplicate orders from network retries or double-taps. Any second `POST` with the same `clientOrderId` returns the existing order without inserting a new document.

### 6.2 Optimistic Stock Locking

The `$gte` guard in the stock decrement `updateOne` filter implements optimistic locking without a transaction. If another request decremented stock between the pre-flight check and the actual decrement, `modifiedCount === 0` signals a conflict. The handler triggers a full compensation rollback — all previously decremented items are restored, and the newly-inserted order document is deleted. Returns `409 Conflict`.

### 6.3 Return Idempotency

One return per order enforced by `findOne({ orderId })` check before insert. Duplicate `POST` returns `409 Conflict` with the existing return ID and current status.

### 6.4 Return Stock Restore on Approval

Approval restores stock for every embedded product item using size-aware logic (same path as order creation reversal). Outfit products restore both `topwear.sizeStock[topwearSize]` and `bottomwear.sizeStock[bottomwearSize]`. Individual item failures are logged but do not block the approval.

### 6.5 Order Cancellation Stock Restore

Cancellation restores stock per-item with the same size-aware logic. Best-effort — individual item failures are logged but do not block the cancellation (partial stock discrepancy is less harmful than a stuck cancellation).

### 6.6 Review Deduplication

One active review per `(userId, productId)` enforced at application layer. Duplicate `POST` returns the existing review document so the client can switch to edit mode without confusion.

### 6.7 Price Snapshot on Order

Order documents embed product name, price, and image at creation time. Future price changes or product deletions do not corrupt historical order records.

### 6.8 FCM Token Deduplication

Before inserting a new FCM token, the backend removes any existing entry for the same `deviceId` or same `token` string. Guarantees exactly one active token per physical device/browser — completely prevents duplicate notification delivery.

### 6.9 Admin Notes Propagation to Order Document

When admin approves or rejects a return via `PATCH /api/returns?id=`, `adminNotes` is written to **both** documents simultaneously:

1. **`returns` document** — `adminNotes` stored on the return record as part of the admin review audit trail.
2. **`orders` document** — `adminNotes` (and, on approval, `returnShippingCharges` + `returnRefundAmount`) are written to the parent order document using `updateOne({ _id: orderId }, { $set: { adminNotes, ... } })`.

**Why two writes?** The customer fetches their order history via `GET /api/orders` — they never call `GET /api/returns` directly. Writing `adminNotes` to the order document means the customer sees the rejection reason or approval note immediately in `My Orders` without any extra API call. The `Orders.tsx` page renders the note in a colour-matched banner on the return status block.

If the order document update fails (e.g. network error), the error is logged but does not block the returns API response — the return status is authoritative. The note will simply be absent from the order view.

---

## 7. Migration Readiness — PostgreSQL / Supabase

This section assesses the effort and risk of migrating from MongoDB Atlas to a relational database (PostgreSQL — specifically Supabase).

### 7.1 Migration Complexity Rating

| Collection | Complexity | Notes |
|---|---|---|
| `categories` | Low | Simple flat document → table |
| `brands` | Low | Simple flat document → table |
| `users` | Medium | `addresses[]` embedded array → separate `user_addresses` table |
| `cart` | Medium | `items[]` embedded → `cart` table with JSONB items column |
| `wishlist` | Medium | Same as cart |
| `reviews` | Medium | Mostly flat; soft-delete pattern translates directly |
| `products` | High | Two schema variants (standard vs. outfit); `sizeStock` dynamic map → JSONB or junction table |
| `orders` | High | Nested address + products snapshots; snapshot pattern must be preserved |
| `returns` | Medium | Mostly flat; products snapshot as JSONB; status enum translates directly |

**Overall: Medium–High effort.** The dynamic `sizeStock` map and the outfit bifurcation (topwear/bottomwear sub-objects) are the most structurally challenging parts.

---

### 7.2 Proposed Relational Schema

```sql
-- Users
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  phone        TEXT,
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User addresses (extracted from embedded array)
CREATE TABLE user_addresses (
  id            TEXT PRIMARY KEY,               -- client-generated ID preserved
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  pincode       TEXT NOT NULL,
  landmark      TEXT,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FCM device tokens (extracted from embedded array)
CREATE TABLE user_fcm_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  device_id  TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (device_id),   -- one token per device
  UNIQUE (token)        -- no duplicate tokens across users
);

-- Categories
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  image      TEXT NOT NULL,
  section    TEXT NOT NULL DEFAULT 'denim',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Brands
CREATE TABLE brands (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  image      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Products
CREATE TABLE products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  price          NUMERIC(10,2) NOT NULL,
  mrp            NUMERIC(10,2),
  purchase_price NUMERIC(10,2),             -- admin-only; never exposed publicly
  image          TEXT NOT NULL,
  images         TEXT[] NOT NULL DEFAULT '{}',
  description    TEXT NOT NULL DEFAULT '',
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand_id       UUID REFERENCES brands(id) ON DELETE SET NULL,
  section        TEXT NOT NULL DEFAULT 'denim',
  stock          INTEGER NOT NULL DEFAULT 0,
  size_stock     JSONB,                     -- { "32": 5, "34": 3 } for standard products
  outfit_data    JSONB,                     -- { topwear: { sizeStock: {...}, stock: N }, bottomwear: {...} }
  highlights     JSONB,                     -- { color, length, printsPattern, waistRise, ... }
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ
);

-- Orders
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email      TEXT NOT NULL,            -- denormalised email (userId pattern preserved)
  order_number    TEXT UNIQUE,              -- TB-XXXXXX
  client_order_id TEXT,                     -- idempotency key
  products        JSONB NOT NULL,           -- snapshot array (prices/names frozen at order time)
  address         JSONB NOT NULL,           -- snapshot (delivery address frozen at order time)
  payment_method  TEXT NOT NULL DEFAULT 'COD',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                      'pending','confirmed','packed','shipped','delivered','cancelled',
                      'return_requested','return_approved','return_rejected','refund_issued'
                    )),
  total_amount    NUMERIC(10,2) NOT NULL,
  gift_message    TEXT,
  return_shipping_charges NUMERIC(10,2),
  return_refund_amount    NUMERIC(10,2),
  admin_notes             TEXT,                    -- propagated from returns on approve/reject
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ,
  CONSTRAINT orders_client_order_id_unique UNIQUE NULLS NOT DISTINCT (client_order_id)
);

-- Returns
CREATE TABLE returns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number          TEXT,
  user_email            TEXT NOT NULL,
  products              JSONB NOT NULL,         -- snapshot from the qualifying order
  total_amount          NUMERIC(10,2) NOT NULL,
  shipping_charges      NUMERIC(10,2) NOT NULL DEFAULT 50,
  suggested_refund_amount NUMERIC(10,2) NOT NULL,
  reason                TEXT NOT NULL
                          CHECK (reason IN (
                            'defective','wrong_item','size_issue','not_as_described','other'
                          )),
  description           TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected','refund_issued')),
  refund_amount         NUMERIC(10,2),          -- set by admin on approval
  admin_notes           TEXT,
  refund_issued_at      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id)                             -- one return per order
);

-- Cart (one row per user)
CREATE TABLE cart (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  items      JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wishlist (one row per user)
CREATE TABLE wishlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  items      JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email  TEXT NOT NULL,
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT NOT NULL DEFAULT '',
  is_deleted  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 7.3 JSONB Strategy for Complex Fields

Rather than fully normalising every embedded structure, certain fields stay as JSONB columns. This balances migration effort against query flexibility:

| Field | Strategy | Rationale |
|---|---|---|
| `orders.products` | JSONB | Price snapshot must be preserved exactly; never queried by individual sub-fields in current app |
| `orders.address` | JSONB | Address snapshot; not queried by sub-field |
| `returns.products` | JSONB | Snapshot; low query frequency |
| `products.size_stock` | JSONB | Dynamic keys (size names vary by product type); GIN index enables `?` key lookups |
| `products.outfit_data` | JSONB | Outfit sub-structure; low query frequency |
| `products.highlights` | JSONB | Display metadata; never filtered on |
| `cart.items` | JSONB | Always fetched as a unit; never partially queried |
| `wishlist.items` | JSONB | Same as cart |

**Example analytics query using JSONB path expressions** (replaces MongoDB `$unwind`):

```sql
SELECT
  p->>'productId' AS product_id,
  SUM((p->>'quantity')::int) AS total_sold
FROM orders,
     jsonb_array_elements(products) AS p
WHERE status NOT IN ('cancelled', 'refunded')
  AND created_at BETWEEN :from AND :to
GROUP BY p->>'productId'
ORDER BY total_sold DESC
LIMIT 5;
```

---

### 7.4 Index Equivalents

| MongoDB Index | PostgreSQL Equivalent |
|---|---|
| `orders: { userId: 1 }` | `CREATE INDEX ON orders (user_email);` |
| `orders: { createdAt: -1 }` | `CREATE INDEX ON orders (created_at DESC);` |
| `orders: { clientOrderId: 1 }` (sparse+unique) | `UNIQUE NULLS NOT DISTINCT (client_order_id)` |
| `products: { categoryId: 1 }` | `CREATE INDEX ON products (category_id);` |
| `cart: { userId: 1 }` (unique) | `UNIQUE` constraint on `cart.user_email` |
| `wishlist: { userId: 1 }` (unique) | `UNIQUE` constraint on `wishlist.user_email` |
| `reviews: { productId, isDeleted, createdAt }` | `CREATE INDEX ON reviews (product_id, is_deleted, created_at DESC);` |
| `reviews: { userId, isDeleted }` | `CREATE INDEX ON reviews (user_email, is_deleted);` |
| `reviews: { userId, productId }` | `CREATE INDEX ON reviews (user_email, product_id);` |
| `returns: { orderId }` | `UNIQUE (order_id)` constraint on `returns` table |
| `user_fcm_tokens: { deviceId }` | `UNIQUE (device_id)` constraint |

---

### 7.5 Migration Steps (Recommended Approach)

1. **Dual-write phase** — write to both MongoDB and PostgreSQL simultaneously. Read from MongoDB. Validate that written data is consistent across both databases.

2. **Backfill** — migrate all historical data (products, orders, users, reviews, returns) from MongoDB to PostgreSQL. Use a one-time migration script with batch processing to avoid connection timeouts. Address the ObjectId → UUID conversion and the `categoryId`/`brandId` string → UUID reference updates.

3. **Shadow read validation** — for a period, read from both databases and compare results. Log any discrepancies. Focus on the complex JSONB fields (order products snapshots, size_stock).

4. **Read cutover** — switch reads to PostgreSQL. Keep writes going to both.

5. **Write cutover** — stop writing to MongoDB. Monitor PostgreSQL closely.

6. **MongoDB decommission** — once stable, remove all MongoDB code and shut down the Atlas cluster.

---

### 7.6 Breaking Changes to Anticipate

| Current Behaviour | Change Required |
|---|---|
| MongoDB ObjectId as `_id` | Switch to UUID; update all frontend `_id` references |
| `userId` stored as email string | Keep as `user_email` (denorm) or add FK to `users.id` |
| `categoryId` / `brandId` stored as strings | Convert to UUID references; update admin create/edit forms |
| `sizeStock` dynamic object keys | JSONB column or dedicated `product_sizes` junction table |
| `$inc` atomic stock decrement | `UPDATE ... WHERE (size_stock->>'key')::int >= qty FOR UPDATE` (row-level lock) |
| Idempotency via sparse unique index | `UNIQUE NULLS NOT DISTINCT` (PostgreSQL 15+) or partial unique index |
| In-memory rate limiter | No change required (stays in Node.js process or Redis) |
| Soft delete on reviews (`isDeleted: true`) | Keep `is_deleted BOOLEAN` or migrate to `deleted_at TIMESTAMPTZ` |
| FCM tokens in `users.fcmTokens[]` | Separate `user_fcm_tokens` table with `UNIQUE(device_id)` and `UNIQUE(token)` |
| Return `orderId` stored as string | Becomes a proper UUID FK to `orders(id)` with `UNIQUE` constraint |

---

*Thunderbold — Premium Indian Fashion. Built for the Bold.*

> Last updated: June 19, 2026
