# Thunderbold — Database Architecture & Migration Readiness

> MongoDB Atlas · Database: `thunderbold` · 8 collections

---

## Table of Contents

1. [Database Overview](#1-database-overview)
2. [Collection Schemas](#2-collection-schemas)
   - [users](#21-users)
   - [products](#22-products)
   - [orders](#23-orders)
   - [cart](#24-cart)
   - [wishlist](#25-wishlist)
   - [reviews](#26-reviews)
   - [categories](#27-categories)
   - [brands](#28-brands)
3. [Indexes](#3-indexes)
4. [Relationships & Access Patterns](#4-relationships--access-patterns)
5. [Key Query Patterns](#5-key-query-patterns)
6. [Data Integrity Mechanisms](#6-data-integrity-mechanisms)
7. [Migration Readiness — PostgreSQL / Supabase](#7-migration-readiness--postgresql--supabase)

---

## 1. Database Overview

| Property         | Value                          |
|------------------|--------------------------------|
| Engine           | MongoDB Atlas (M0 free tier)   |
| Database name    | `thunderbold`                  |
| Driver           | `mongodb` (official Node.js)   |
| Connection pool  | min 2, max 10                  |
| Collections      | 8                              |

MongoDB was chosen for its flexible document model — particularly valuable during early product iteration when schema fields change frequently (e.g., the `highlights`, `topwear`/`bottomwear` outfit sub-objects, and the `section` classification added iteratively).

---

## 2. Collection Schemas

All documents use MongoDB's auto-generated `_id` (ObjectId) as the primary key unless otherwise noted.

---

### 2.1 `users`

One document per registered user. Created/updated on every login via `POST /api/users`.

```json
{
  "_id":       ObjectId,
  "uid":       "string",           // Firebase UID — primary lookup key for profile ops
  "email":     "string",           // Used as userId in cart/wishlist/orders
  "name":      "string",
  "phone":     "string | null",    // 10 digits, stored without formatting
  "role":      "user | admin",     // Default: "user"
  "addresses": [
    {
      "id":          "string",     // Client-generated: Date.now().toString(36) + random
      "fullName":    "string",
      "phone":       "string",     // 10 digits
      "addressLine1":"string",
      "addressLine2":"string",
      "city":        "string",
      "state":       "string",
      "pincode":     "string",     // 6 digits
      "landmark":    "string",
      "isDefault":   "boolean",
      "createdAt":   "ISO string"
    }
  ],
  "createdAt": Date,
  "updatedAt": Date
}
```

**Notes**:
- `uid` is the Firebase UID. Profile GET/PATCH/DELETE operations look up by `uid`
- `email` is used as the foreign key across orders, cart, and wishlist (not `uid`). This is because Firebase UIDs can change on account re-linking, while email is stable
- `addresses` is an embedded array (not a separate collection). Up to a reasonable number (typically <10 per user) this is efficient and avoids joins
- At most one address can have `isDefault: true` — enforced at the application layer

**Unique constraints** (application-enforced): `uid`, `email`

---

### 2.2 `products`

The product catalogue. Supports two structural variants: standard products and outfit products.

#### Standard Product (denim / shirts / t-shirts / kurtas / live-sale)

```json
{
  "_id":         ObjectId,
  "name":        "string",
  "price":       "number",         // Selling price (INR)
  "mrp":         "number | null",  // Customer-facing crossed-out price (optional)
  "purchasePrice":"number | null", // Internal cost price — NEVER exposed to public API
  "image":       "string",         // Primary image URL (Cloudinary)
  "images":      ["string"],       // All images array (Cloudinary URLs)
  "description": "string",
  "categoryId":  "string",         // References categories._id (as string)
  "brandId":     "string | null",  // References brands._id (as string)
  "section":     "denim | shirts | t-shirts | kurtas | live-sale",
  "sizeStock": {
    "28": "number",  // Jeans sizes
    "30": "number",
    "32": "number",
    "34": "number",
    "36": "number"
    // OR apparel sizes: S, M, L, XL, XXL
  },
  "stock":       "number",         // Sum of all sizeStock values
  "highlights": {
    "color":         "string",
    "length":        "string",
    "printsPattern": "string",
    "waistRise":     "string",
    "shade":         "string",
    "lengthInches":  "string"
  },
  "createdAt":   Date,
  "updatedAt":   Date | null
}
```

#### Outfit Product (`section: "outfits"`)

```json
{
  "_id":    ObjectId,
  "name":   "string",
  "price":  "number",
  "section":"outfits",
  "topwear": {
    "sizeStock": { "S": 5, "M": 3, "L": 2, "XL": 0, "XXL": 0 },
    "stock":     10,
    "highlights": { ... }
  },
  "bottomwear": {
    "sizeStock": { "28": 4, "30": 6, "32": 2, "34": 0, "36": 0 },
    "stock":     12,
    "highlights": { ... }
  },
  "stock":  10,       // min(topwear.stock, bottomwear.stock) — bottleneck determines availability
  "image":  "string",
  "images": ["string"],
  "createdAt": Date
}
```

**Valid size sets**:
- Jeans / bottomwear: `28`, `30`, `32`, `34`, `36`
- Apparel / topwear: `S`, `M`, `L`, `XL`, `XXL`

**Pricing fields**:
- `price` — the actual selling price (always present)
- `mrp` — optional crossed-out original price shown to customers
- `purchasePrice` — internal cost; stripped from all non-admin API responses via projection

---

### 2.3 `orders`

One document per order. `products` is an embedded snapshot (prices/names are frozen at order time — product catalogue changes do not affect historical orders).

```json
{
  "_id":          ObjectId,
  "userId":       "string",       // User's email address
  "clientOrderId":"string | null",// Client-generated idempotency key (optional)
  "products": [
    {
      "productId":     "string",  // References products._id (as string)
      "name":          "string",  // Snapshot of name at order time
      "price":         "number",  // Snapshot of price at order time
      "image":         "string",  // Snapshot of image at order time
      "size":          "string",  // e.g. "32" or "M"
      "quantity":      "number",
      // Outfit-only:
      "topwearSize":   "string | undefined",
      "bottomwearSize":"string | undefined"
    }
  ],
  "address": {
    "fullName":    "string",
    "phone":       "string",
    "addressLine1":"string",
    "addressLine2":"string | undefined",
    "city":        "string",
    "state":       "string",
    "pincode":     "string"
  },
  "paymentMethod": "COD",
  "status":        "pending | confirmed | shipped | delivered | cancelled",
  "totalAmount":   "number",      // Sum of price * quantity across all products
  "giftMessage":   "string | undefined",  // HTML-stripped, max 300 chars
  "createdAt":     Date,
  "updatedAt":     Date | null
}
```

**Key design decisions**:
- `address` is embedded (snapshot). The user may change their saved addresses later, but the delivery address is frozen at order time
- `products` array is a snapshot. Historical orders remain accurate even if a product is deleted or repriced
- `userId` is the user's email (not Firebase UID) for the reasons described in the users schema
- `clientOrderId` has a sparse unique index — enables idempotent order creation from the frontend

---

### 2.4 `cart`

One document per user. The entire cart is replaced on every write (no incremental item PATCH).

```json
{
  "_id":    ObjectId,
  "userId": "string",    // User's email address — unique per user
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
  "updatedAt": Date
}
```

**Notes**: The `{ userId: 1 }` index has `unique: true`. There is exactly one cart document per user. `upsert: true` is used on all writes.

---

### 2.5 `wishlist`

Identical structure to `cart`, minus `size` and `quantity` on items.

```json
{
  "_id":    ObjectId,
  "userId": "string",
  "items": [
    {
      "productId": "string",
      "name":      "string",
      "price":     "number",
      "image":     "string"
    }
  ],
  "updatedAt": Date
}
```

---

### 2.6 `reviews`

One document per submitted review. Deleted reviews are soft-deleted (`isDeleted: true`) rather than removed.

```json
{
  "_id":       ObjectId,
  "userId":    "string",    // Reviewer's email
  "productId": "string",    // References products._id (as string)
  "orderId":   "string",    // References orders._id (as string) — the qualifying delivered order
  "rating":    "number",    // Integer 1–5
  "comment":   "string",    // Max 1000 chars
  "isDeleted": "boolean",   // Soft delete flag
  "createdAt": Date,
  "updatedAt": Date
}
```

**Business rule**: A user can only review a product if they have a `delivered` order containing that `productId`. Enforced server-side on every `POST`.

**Uniqueness**: One active (non-deleted) review per `(userId, productId)` enforced at application layer. Duplicate `POST` returns `409` with the existing review.

---

### 2.7 `categories`

Lookup table for product sections (denim categories, etc.). Admin-managed.

```json
{
  "_id":       ObjectId,
  "name":      "string",
  "image":     "string",    // Cloudinary URL
  "section":   "string",    // e.g. "denim"
  "createdAt": Date
}
```

Products reference categories via `categoryId` (stored as a string, not ObjectId reference). The app resolves category names client-side from the cached categories list.

---

### 2.8 `brands`

Lookup table for brand pages. Admin-managed.

```json
{
  "_id":       ObjectId,
  "name":      "string",
  "image":     "string",    // Brand logo (Cloudinary URL)
  "createdAt": Date,
  "updatedAt": Date | null
}
```

Products optionally reference brands via `brandId` (stored as string).

---

## 3. Indexes

All indexes are bootstrapped asynchronously in `api/_lib/mongodb.js` on the first connection. Index creation is non-blocking and non-fatal (warnings logged on failure).

| Collection | Fields                                              | Options         | Purpose                                    |
|------------|-----------------------------------------------------|-----------------|---------------------------------------------|
| `orders`   | `{ userId: 1 }`                                     |                 | User's order list fetch                     |
| `orders`   | `{ createdAt: -1 }`                                 |                 | Admin listing (newest first)                |
| `orders`   | `{ clientOrderId: 1 }`                              | sparse + unique | Idempotency key deduplication               |
| `products` | `{ categoryId: 1 }`                                 |                 | Products by category                        |
| `cart`     | `{ userId: 1 }`                                     | unique          | One cart per user; fast lookup              |
| `wishlist` | `{ userId: 1 }`                                     | unique          | One wishlist per user; fast lookup          |
| `reviews`  | `{ productId: 1, isDeleted: 1, createdAt: -1 }`     |                 | Public product review listing               |
| `reviews`  | `{ userId: 1, isDeleted: 1 }`                       |                 | User's own reviews                          |
| `reviews`  | `{ userId: 1, productId: 1 }`                       |                 | Duplicate review check; eligibility lookup  |

**Recommended additions** (not currently created):
- `products`: `{ section: 1, createdAt: -1 }` — for section-filtered product listings
- `products`: `{ stock: 1 }` — for stock alert queries (currently uses collection scan)
- `orders`: `{ userId: 1, createdAt: -1 }` — compound for user order listing with sort
- `orders`: `{ status: 1 }` — for admin status-filtered views
- `reviews`: `{ userId: 1, productId: 1, isDeleted: 1 }` — compound unique partial index for deduplication

---

## 4. Relationships & Access Patterns

MongoDB's flexible document model means most "joins" are avoided by embedding related data. The following diagram shows the logical relationships:

```
users (uid, email)
  │
  ├──[email as userId]──► orders
  │                         └── products[] (snapshot — no live join)
  │                         └── address (snapshot)
  │
  ├──[email as userId]──► cart
  │                         └── items[] (live product data embedded)
  │
  ├──[email as userId]──► wishlist
  │                         └── items[] (live product data embedded)
  │
  └──[email as userId]──► reviews
                            └── productId → products (checked at write time)
                            └── orderId   → orders   (checked at write time)

products
  ├── categoryId → categories (string reference)
  └── brandId    → brands     (string reference, optional)
```

**Embedding vs. referencing decisions**:

| Data                          | Strategy   | Reason                                                   |
|-------------------------------|------------|----------------------------------------------------------|
| User addresses                | Embedded   | Always fetched with user; small set (<10)                |
| Order products                | Embedded snapshot | Prices/names must be frozen at order time          |
| Order delivery address        | Embedded snapshot | Address may change after order; must be frozen     |
| Cart items                    | Embedded   | Always fetched as a unit; no partial updates             |
| Wishlist items                | Embedded   | Same as cart                                             |
| Product category name         | Referenced | Categories change infrequently; resolved client-side     |
| Review → order validation     | Referenced (checked at write) | One-time eligibility check only        |

---

## 5. Key Query Patterns

### 5.1 Product Listing (public)

```javascript
db.collection('products').find(
  { section: 'denim' },                          // optional section filter
  { projection: { purchasePrice: 0 } }           // strip internal cost field
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
db.collection('orders').findOne({ clientOrderId: clientOrderId })
// If found → return existing order (no duplicate insert)
```

### 5.4 Stock Decrement (atomic, race-condition safe)

```javascript
db.collection('products').updateOne(
  {
    _id: productObjectId,
    [`sizeStock.${size}`]: { $gte: quantity }    // guard: only update if stock is sufficient
  },
  {
    $inc: {
      [`sizeStock.${size}`]: -quantity,
      stock: -quantity
    }
  }
)
// If modifiedCount === 0: stock changed between check and decrement → rollback
```

### 5.5 Admin Analytics — Revenue Over Time

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

### 5.6 Profit Calculation (aggregation pipeline with lookup)

```javascript
db.collection('orders').aggregate([
  { $match: { status: { $in: ['delivered', 'completed'] }, ... } },
  { $unwind: '$products' },
  { $lookup: { from: 'products', localField: 'products.productId', ... } },
  { $match: { costPrice: { $ne: null } } },
  {
    $group: {
      _id: null,
      profit: { $sum: { $multiply: [{ $subtract: ['$products.price', '$costPrice'] }, '$products.quantity'] } }
    }
  }
])
```

### 5.7 Review Eligibility Check

```javascript
db.collection('orders').findOne({
  userId: userEmail,
  status: 'delivered',
  'products.productId': productId
})
// If null → user has not received this product → block review
```

---

## 6. Data Integrity Mechanisms

MongoDB does not support foreign key constraints or multi-document ACID transactions by default. The following mechanisms preserve data integrity at the application layer:

### 6.1 Idempotent Order Creation
Client-generated `clientOrderId` + sparse unique index prevents duplicate orders from network retries. Any second `POST` with the same `clientOrderId` returns the existing order without inserting a new one.

### 6.2 Optimistic Stock Locking
The `$gte` guard in the stock decrement `updateOne` filter implements optimistic locking. If another request decremented stock between the pre-flight check and the decrement, `modifiedCount === 0` signals a conflict and triggers a full compensation rollback (all previously decremented items are restored, and the order document is deleted).

### 6.3 Order Cancellation Stock Restore
Cancellation restores stock for every embedded product item. Best-effort — individual item restore failures are logged but do not block the cancellation itself (acceptable: partial stock discrepancy is less harmful than a stuck cancellation).

### 6.4 Review Deduplication
One active review per `(userId, productId)` enforced at application layer. Duplicate `POST` returns the existing review so the client can switch to edit mode without confusion.

### 6.5 Price Snapshot on Order
Order documents embed product name, price, and image at creation time. Future price changes or product deletions do not affect historical order records.

---

## 7. Migration Readiness — PostgreSQL / Supabase

This section assesses the effort and risk of migrating from MongoDB to a relational database (PostgreSQL, specifically Supabase).

### 7.1 Migration Complexity Rating

| Collection | Complexity | Notes                                                         |
|------------|------------|---------------------------------------------------------------|
| `categories` | Low      | Simple flat document → table with no changes                  |
| `brands`     | Low      | Simple flat document → table                                  |
| `users`      | Medium   | `addresses[]` embedded array → separate `user_addresses` table|
| `cart`       | Medium   | `items[]` embedded → `cart_items` table with `user_id` FK     |
| `wishlist`   | Medium   | Same as cart                                                  |
| `reviews`    | Medium   | Mostly flat; soft-delete pattern translates directly          |
| `products`   | High     | Two schema variants (standard vs. outfit); `sizeStock` dynamic map → `product_sizes` junction table or JSONB column |
| `orders`     | High     | Nested address + products snapshots; snapshot pattern must be preserved |

**Overall: Medium–High effort.** The dynamic `sizeStock` map and the outfit bifurcation (topwear/bottomwear sub-objects) are the most structurally challenging parts.

---

### 7.2 Proposed Relational Schema

#### Core Tables

```sql
-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id            TEXT PRIMARY KEY,              -- client-generated ID preserved
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
  purchase_price NUMERIC(10,2),             -- admin-only, never exposed publicly
  image          TEXT NOT NULL,
  images         TEXT[] NOT NULL DEFAULT '{}',
  description    TEXT NOT NULL DEFAULT '',
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand_id       UUID REFERENCES brands(id) ON DELETE SET NULL,
  section        TEXT NOT NULL DEFAULT 'denim',
  stock          INTEGER NOT NULL DEFAULT 0,
  -- For outfits: store topwear/bottomwear sub-stock as JSONB
  -- For standard products: sizeStock as JSONB { "32": 5, "34": 3 }
  size_stock     JSONB,
  outfit_data    JSONB,                     -- { topwear: {...}, bottomwear: {...} }
  highlights     JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ
);

-- Orders
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email      TEXT NOT NULL,            -- denormalised email (userId pattern preserved)
  client_order_id TEXT UNIQUE,              -- idempotency key (sparse: allow NULL)
  products        JSONB NOT NULL,           -- snapshot array (prices/names frozen at order time)
  address         JSONB NOT NULL,           -- snapshot (delivery address frozen at order time)
  payment_method  TEXT NOT NULL DEFAULT 'COD',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  total_amount    NUMERIC(10,2) NOT NULL,
  gift_message    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ,
  CONSTRAINT orders_client_order_id_unique UNIQUE NULLS NOT DISTINCT (client_order_id)
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

Rather than fully normalising every embedded structure, several fields are kept as JSONB columns. This balances migration effort against query flexibility:

| Field                    | Strategy  | Rationale                                               |
|--------------------------|-----------|---------------------------------------------------------|
| `orders.products`        | JSONB     | Price snapshot must be preserved exactly; never queried by individual product fields in current app |
| `orders.address`         | JSONB     | Address snapshot; not queried by sub-field              |
| `products.size_stock`    | JSONB     | Dynamic keys (size names); GIN index enables `?` key lookups if needed |
| `products.outfit_data`   | JSONB     | Outfit sub-structure; low query frequency               |
| `products.highlights`    | JSONB     | Display metadata; never filtered on                     |
| `cart.items`             | JSONB     | Always fetched as a unit; never partially queried       |
| `wishlist.items`         | JSONB     | Same as cart                                            |

For analytics queries that need to reach inside `orders.products` (e.g., top products), a JSONB path expression replaces MongoDB's `$unwind`:

```sql
SELECT
  p->>'productId' AS product_id,
  SUM((p->>'quantity')::int) AS total_sold
FROM orders,
     jsonb_array_elements(products) AS p
WHERE status NOT IN ('cancelled', 'canceled', 'refunded')
  AND created_at BETWEEN :from AND :to
GROUP BY p->>'productId'
ORDER BY total_sold DESC
LIMIT 5;
```

---

### 7.4 Index Equivalents

| MongoDB Index                                       | PostgreSQL Equivalent                                                |
|-----------------------------------------------------|----------------------------------------------------------------------|
| `orders: { userId: 1 }`                            | `CREATE INDEX ON orders (user_email);`                               |
| `orders: { createdAt: -1 }`                        | `CREATE INDEX ON orders (created_at DESC);`                          |
| `orders: { clientOrderId: 1 }` (sparse+unique)     | `UNIQUE NULLS NOT DISTINCT (client_order_id)` on the column          |
| `products: { categoryId: 1 }`                      | `CREATE INDEX ON products (category_id);`                            |
| `cart: { userId: 1 }` (unique)                     | `UNIQUE` constraint on `cart.user_email`                             |
| `wishlist: { userId: 1 }` (unique)                 | `UNIQUE` constraint on `wishlist.user_email`                         |
| `reviews: { productId, isDeleted, createdAt }`     | `CREATE INDEX ON reviews (product_id, is_deleted, created_at DESC);` |
| `reviews: { userId, isDeleted }`                   | `CREATE INDEX ON reviews (user_email, is_deleted);`                  |
| `reviews: { userId, productId }`                   | `CREATE INDEX ON reviews (user_email, product_id);`                  |

---

### 7.5 Migration Steps (Recommended Approach)

1. **Dual-write phase** — write to both MongoDB and PostgreSQL simultaneously. Read from MongoDB. Validate that written data is consistent across both.

2. **Backfill** — migrate all historical data (products, orders, users, reviews) from MongoDB to PostgreSQL. Use a one-time migration script with batch processing to avoid timeouts.

3. **Shadow read validation** — for a period, read from both DBs and compare results. Log any discrepancies.

4. **Read cutover** — switch reads to PostgreSQL, keep writes going to both.

5. **Write cutover** — stop writing to MongoDB. Monitor PostgreSQL for a period.

6. **MongoDB decommission** — once stable, remove all MongoDB code and shut down the Atlas cluster.

---

### 7.6 Breaking Changes to Anticipate

| Current Behaviour                              | Change Required                                             |
|------------------------------------------------|-------------------------------------------------------------|
| MongoDB ObjectId as `_id`                      | Switch to UUID; update all `_id` references in frontend     |
| `userId` stored as email string                | Evaluate: keep as `user_email` denorm or add FK to users    |
| `categoryId` / `brandId` stored as strings    | Convert to UUID references; update admin create/edit forms  |
| `sizeStock` dynamic object keys                | JSONB or dedicated `product_sizes` table (join required)    |
| `$inc` atomic stock decrement                  | Use `UPDATE ... WHERE size_stock->'key' >= qty FOR UPDATE`  |
| Idempotency via sparse unique index            | `UNIQUE NULLS NOT DISTINCT` (PostgreSQL 15+) or partial unique index |
| `isRateLimited` in-memory store                | No change required (stays Node.js in-memory or Redis)       |
| Soft delete on reviews (`isDeleted: true`)     | Add `deleted_at TIMESTAMPTZ` column or keep `is_deleted` boolean |
