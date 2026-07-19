# Thunderbold — Database Architecture & Complete Schema Reference

> MongoDB Atlas · Database: `thunderbold` · **10 collections** · Node.js Native Driver

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
3. [Legacy Collection](#3-legacy-collection)
4. [Indexes](#4-indexes)
5. [Relationships & Access Patterns](#5-relationships--access-patterns)
6. [Key Query Patterns](#6-key-query-patterns)
7. [Data Integrity Mechanisms](#7-data-integrity-mechanisms)
8. [Migration Readiness — PostgreSQL / Supabase](#8-migration-readiness--postgresql--supabase)

---

## 1. Database Overview

| Property | Value |
|---|---|
| Engine | MongoDB Atlas |
| Database name | `thunderbold` |
| Driver | `mongodb` ^6.21.0 (official Node.js native driver) |
| Connection pool | `minPoolSize: 2`, `maxPoolSize: 10`, `serverSelectionTimeoutMS: 5000` |
| Pool caching | Singleton cached in `global.mongo` — survives serverless warm-starts |
| **Active collections** | **10** |

### The 10 Collections

| # | Collection | Purpose |
|---|---|---|
| 1 | `users` | User profiles, embedded addresses, FCM tokens |
| 2 | `products` | Product catalogue |
| 3 | `orders` | Order records with embedded snapshots |
| 4 | `returns` | Return requests |
| 5 | `cart` | Per-user shopping cart |
| 6 | `wishlist` | Per-user wishlist |
| 7 | `reviews` | Product reviews |
| 8 | `categories` | Category lookup table |
| 9 | `brands` | Brand lookup table |
| 10 | `config` | Site config (slider + hero banner) |

### Connection Bootstrap

On first connection, `api/_lib/mongodb.js` bootstraps indexes asynchronously. Index creation is non-blocking and non-fatal — failures log a warning but do not crash the server.

---

## 2. Collection Schemas

All documents use MongoDB's auto-generated `_id` (ObjectId) as the primary key unless otherwise noted. Fields documented below are those **actually written** by the current API handlers.

---

### 2.1 `users`

One document per registered user. Created or updated on login via `POST /api/users` (upsert keyed on `uid` or `email`).

```json
{
  "_id":       "ObjectId",
  "uid":       "string",
  "email":     "string",
  "name":      "string",
  "phone":     "string | undefined",
  "role":      "\"user\" | \"admin\"",
  "addresses": [
    {
      "id":           "string",
      "fullName":     "string",
      "phone":        "string",
      "addressLine1": "string",
      "addressLine2": "string",
      "city":         "string",
      "state":        "string",
      "pincode":      "string",
      "landmark":     "string",
      "isDefault":    "boolean",
      "createdAt":    "ISO 8601 string"
    }
  ],
  "fcmTokens": [
    {
      "token":     "string",
      "deviceId":  "string",
      "updatedAt": "Date"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Design notes:**

- Profile GET/PATCH/DELETE look up by `uid`.
- `email` is the foreign key for orders, cart, wishlist, returns, reviews.
- `addresses` is embedded (not a separate collection in the main app flow).
- `fcmTokens` enforces one active token per `deviceId` via `$pull` before `$push`.
- Legacy raw string tokens in `fcmTokens[]` are cleaned up on re-registration.
- New users default to `role: "user"`.

**Unique constraints:** application-enforced on `uid` and `email`.

---

### 2.2 `products`

Supports standard products and outfit (`section: "outfits"`) variants.

#### Standard Product

Applies to sections such as `denim`, `shirts`, `t-shirts`, `kurta`, `live-sale`:

```json
{
  "_id":           "ObjectId",
  "name":          "string",
  "price":         "number",
  "mrp":           "number | undefined",
  "purchasePrice": "number | undefined",
  "image":         "string",
  "images":        ["string"],
  "description":   "string",
  "categoryId":    "string",
  "brandId":       "string | undefined",
  "section":       "string",
  "sizeStock":     { "28": 0, "30": 0, "...": 0 },
  "stock":         "number",
  "highlights": {
    "color":         "string",
    "length":        "string",
    "printsPattern": "string",
    "waistRise":     "string",
    "shade":         "string",
    "lengthInches":  "string"
  },
  "createdAt":     "Date",
  "updatedAt":     "Date | undefined"
}
```

Valid size keys: jeans `28–36`, apparel `S/M/L/XL/XXL`. API normalises via `normaliseSizeStock()`.

**Category requirement:** `categoryId` required except for `live-sale`, `kurta`, and `outfits` sections.

#### Outfit Product

```json
{
  "_id":     "ObjectId",
  "name":    "string",
  "price":   "number",
  "mrp":     "number | undefined",
  "purchasePrice": "number | undefined",
  "section": "\"outfits\"",
  "topwear": {
    "sizeStock":  { "S": 5, "M": 3 },
    "stock":      8,
    "highlights": { "color": "string", "length": "string", "...": "string" }
  },
  "bottomwear": {
    "sizeStock":  { "28": 4, "30": 6 },
    "stock":      10,
    "highlights": { "color": "string", "waistRise": "string", "...": "string" }
  },
  "stock":       "number",
  "image":       "string",
  "images":      ["string"],
  "description": "string",
  "brandId":     "string | undefined",
  "createdAt":   "Date",
  "updatedAt":   "Date | undefined"
}
```

`stock = min(topwear.stock, bottomwear.stock)`.

**Pricing rules:**

- `price` — selling price (always present)
- `mrp` — optional crossed-out price
- `purchasePrice` — internal cost; stripped from public API via response mapping: `mrp: doc.mrp ?? doc.purchasePrice ?? null`

**Type switching:** PUT unsets incompatible fields when changing between outfit and standard (`sizeStock`/`highlights` vs `topwear`/`bottomwear`).

---

### 2.3 `orders`

One document per order. Embedded `products` and `address` are snapshots frozen at order time.

```json
{
  "_id":                   "ObjectId",
  "userId":                "string",
  "orderNumber":           "string",
  "clientOrderId":         "string | undefined",
  "products": [
    {
      "productId":      "string",
      "name":           "string",
      "price":          "number",
      "image":          "string",
      "size":           "string",
      "quantity":       "number",
      "topwearSize":    "string | undefined",
      "bottomwearSize": "string | undefined"
    }
  ],
  "address": {
    "fullName":     "string",
    "phone":        "string",
    "addressLine1": "string",
    "addressLine2": "string | undefined",
    "city":         "string",
    "state":        "string | undefined",
    "pincode":      "string"
  },
  "paymentMethod":         "string",
  "status":                "string",
  "totalAmount":           "number",
  "giftMessage":           "string | undefined",
  "returnShippingCharges": "number | undefined",
  "returnRefundAmount":    "number | undefined",
  "adminNotes":            "string | null | undefined",
  "createdAt":             "Date",
  "updatedAt":             "Date | undefined"
}
```

**Status values (observed in code):**

| Status | Meaning |
|---|---|
| `pending` | Created, awaiting confirmation |
| `confirmed` | Admin confirmed |
| `packed` | Packed for shipping |
| `shipped` | In transit |
| `delivered` | Delivered to customer |
| `cancelled` | Cancelled |
| `return_requested` | Customer submitted return |
| `return_approved` | Admin approved return |
| `return_rejected` | Admin rejected return |
| `refund_issued` | Refund marked complete |

**Key fields:**

- `userId` = customer's email
- `orderNumber` = `TB-XXXXXX` (6 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`)
- `clientOrderId` — sparse unique index for idempotency
- Return fields (`returnShippingCharges`, `returnRefundAmount`, `adminNotes`) written on return approve/reject

---

### 2.4 `returns`

One document per return request.

```json
{
  "_id":                   "ObjectId",
  "orderId":               "string",
  "orderNumber":           "string | null",
  "userId":                "string",
  "products":              "array (snapshot from order)",
  "totalAmount":           "number",
  "shippingCharges":       "number",
  "suggestedRefundAmount": "number",
  "reason":                "\"defective\" | \"wrong_item\" | \"size_issue\" | \"not_as_described\" | \"other\"",
  "description":           "string",
  "upiId":                 "string",
  "status":                "\"pending\" | \"approved\" | \"rejected\" | \"refund_issued\"",
  "refundAmount":          "number | null",
  "adminNotes":            "string | null",
  "refundIssuedAt":        "Date | undefined",
  "createdAt":             "Date",
  "updatedAt":             "Date"
}
```

**Status lifecycle:**

```
pending → approved → refund_issued
        → rejected
```

**Business rules:**

- Only `delivered` orders
- One return per `orderId` (409 on duplicate)
- Default shipping: ₹50; `suggestedRefundAmount = max(0, totalAmount − 50)`
- On approve: stock restored; order updated with refund details
- `upiId` required at creation for COD refund payout

---

### 2.5 `cart`

One document per user. Full `items[]` replace on every POST.

```json
{
  "_id":       "ObjectId",
  "userId":    "string",
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

Unique index on `{ userId: 1 }`. Upsert on write.

---

### 2.6 `wishlist`

Same structure as cart minus `size` and `quantity`:

```json
{
  "_id":       "ObjectId",
  "userId":    "string",
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

Unique index on `{ userId: 1 }`.

---

### 2.7 `reviews`

```json
{
  "_id":       "ObjectId",
  "userId":    "string",
  "productId": "string",
  "orderId":   "string",
  "rating":    "number",
  "comment":   "string",
  "isDeleted": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

- `rating`: integer 1–5
- `comment`: trimmed, max 1000 chars
- `isDeleted: true` on DELETE (soft delete)
- All GET queries filter `{ isDeleted: { $ne: true } }`

---

### 2.8 `categories`

```json
{
  "_id":       "ObjectId",
  "name":      "string",
  "image":     "string",
  "section":   "string",
  "createdAt": "Date",
  "updatedAt": "Date | undefined"
}
```

Default section: `denim`. Products reference via string `categoryId`.

---

### 2.9 `brands`

```json
{
  "_id":       "ObjectId",
  "name":      "string",
  "logoUrl":   "string",
  "createdAt": "Date",
  "updatedAt": "Date | undefined"
}
```

> Field is **`logoUrl`**, not `image`. POST checks case-insensitive name uniqueness.

Products optionally reference via string `brandId`.

---

### 2.10 `config`

Fixed string `_id` values (not ObjectIds). Two documents:

#### `_id: "slider"` — ThunderboltSlider

```json
{
  "_id": "slider",
  "slides": [
    {
      "imageUrl":  "string",
      "heading":   "string",
      "productId": "string | null"
    }
  ],
  "updatedAt": "Date"
}
```

Exactly 4 slides enforced on PUT. GET enriches with `productName` and `productImage` from `products` collection.

#### `_id: "hero-banner"` — Homepage Hero

```json
{
  "_id": "hero-banner",
  "images":    ["string"],
  "updatedAt": "Date"
}
```

1–3 image URLs on PUT. GET via `/api/slider?type=hero`.

---

## 3. Legacy Collection

### `addresses` (not counted in the 10)

Used only by `api/address/index.js` — a legacy endpoint with **no authentication**:

```json
{
  "_id":          "ObjectId",
  "userId":       "string | null",
  "fullName":     "string",
  "phone":        "string",
  "addressLine1": "string",
  "addressLine2": "string",
  "city":         "string",
  "state":        "string",
  "pincode":      "string",
  "landmark":     "string",
  "createdAt":    "Date"
}
```

The main app stores addresses embedded in `users.addresses[]`. Checkout and profile use `/api/users`, not `/api/address`.

A legacy `slider` collection may exist in Atlas from earlier versions — the app reads exclusively from `config`.

---

## 4. Indexes

All indexes below are **created** in `api/_lib/mongodb.js` `ensureIndexes()`:

| Collection | Fields | Options | Purpose |
|---|---|---|---|
| `orders` | `{ userId: 1 }` | | User order listing |
| `orders` | `{ createdAt: -1 }` | | Admin listing (newest first) |
| `orders` | `{ clientOrderId: 1 }` | sparse + unique | Idempotency |
| `products` | `{ categoryId: 1 }` | | Products by category |
| `cart` | `{ userId: 1 }` | unique | One cart per user |
| `wishlist` | `{ userId: 1 }` | unique | One wishlist per user |
| `reviews` | `{ productId: 1, isDeleted: 1, createdAt: -1 }` | | Public review listing |
| `reviews` | `{ userId: 1, isDeleted: 1 }` | | User's reviews |
| `reviews` | `{ userId: 1, productId: 1 }` | | Duplicate check |

### Recommended Additional Indexes (not created)

| Collection | Index | Reason |
|---|---|---|
| `products` | `{ section: 1, createdAt: -1 }` | Section-filtered listings scan full collection |
| `products` | `{ stock: 1 }` | Stock alert queries in analytics |
| `orders` | `{ userId: 1, createdAt: -1 }` | Compound for paginated user orders |
| `orders` | `{ status: 1 }` | Admin status filtering |
| `orders` | `{ orderNumber: 1 }` | Unique lookup by TB-XXXXXX |
| `returns` | `{ userId: 1 }` | Customer return list |
| `returns` | `{ orderId: 1 }` | Idempotency (one return per order) |
| `returns` | `{ status: 1, createdAt: -1 }` | Admin return queue |
| `reviews` | `{ userId: 1, productId: 1, isDeleted: 1 }` | Compound deduplication |
| `users` | `{ uid: 1 }` | Profile lookup |
| `users` | `{ email: 1 }` | Email lookup for FCM/orders |
| `brands` | `{ name: 1 }` | Name uniqueness (currently app-level regex check) |

---

## 5. Relationships & Access Patterns

```
users (uid, email)
  ├──[email]──► orders ──► products[] snapshot, address snapshot
  ├──[email]──► returns ──► orderId ref + products[] snapshot
  ├──[email]──► cart ──► items[] embedded
  ├──[email]──► wishlist ──► items[] embedded
  └──[email]──► reviews ──► productId + orderId refs (checked at write)

products
  ├── categoryId → categories (string, client-resolved)
  └── brandId → brands (string, optional)

config
  └── slides[].productId → products (enriched on GET)
```

| Data | Strategy | Reason |
|---|---|---|
| User addresses | Embedded in `users` | Always fetched together; small set |
| Order products/address | Embedded snapshot | Prices frozen at order time |
| Return products | Embedded snapshot | Copied from order at request time |
| Cart/wishlist items | Embedded | Full replace writes |
| FCM tokens | Embedded in `users` | Updated with user doc |
| Category/brand names | Referenced by string ID | Resolved client-side from cached lists |

---

## 6. Key Query Patterns

### 6.1 Product Listing

```javascript
db.collection('products').find(
  { section: 'denim', price: { $lte: 999 } },
).sort({ createdAt: -1 })
// purchasePrice stripped in API response layer for non-admin
```

### 6.2 Paginated User Orders

```javascript
db.collection('orders').find({ userId: email })
  .sort({ createdAt: -1 })
  .skip((page - 1) * 10)
  .limit(10)
```

### 6.3 Idempotent Order Creation

```javascript
db.collection('orders').findOne({ clientOrderId })
// If found → return existing order (200)
```

### 6.4 Atomic Stock Decrement

```javascript
db.collection('products').updateOne(
  { _id: productId, [`sizeStock.${size}`]: { $gte: qty } },
  { $inc: { [`sizeStock.${size}`]: -qty, stock: -qty } }
)
// modifiedCount === 0 → rollback + 409
```

### 6.5 Return Idempotency

```javascript
db.collection('returns').findOne({ orderId })
// If found → 409 Conflict
```

### 6.6 Analytics Revenue (excludes non-revenue statuses)

```javascript
db.collection('orders').aggregate([
  { $match: {
      createdAt: { $gte: from, $lte: to },
      status: { $nin: ['cancelled','canceled','refunded','return_requested','return_approved','refund_issued'] }
  }},
  { $group: { _id: null, total: { $sum: '$totalAmount' } } }
])
```

### 6.7 Profit Calculation

```javascript
// Match status: { $in: ['delivered', 'completed'] }
// $unwind products → $lookup purchasePrice → sum (price - cost) * qty
```

### 6.8 Review Eligibility

```javascript
db.collection('orders').findOne({
  userId: email,
  status: 'delivered',
  'products.productId': productId
})
```

### 6.9 FCM Broadcast Token Collection

```javascript
db.collection('users').find(
  { fcmTokens: { $exists: true, $ne: [] } },
  { projection: { email: 1, fcmTokens: 1 } }
)
```

---

## 7. Data Integrity Mechanisms

| Mechanism | Implementation |
|---|---|
| Idempotent orders | `clientOrderId` sparse unique index + pre-insert check |
| Optimistic stock lock | `$gte` guard on decrement; rollback on `modifiedCount === 0` |
| Return idempotency | `findOne({ orderId })` before insert |
| Return stock restore | Size-aware + outfit-aware `$inc` on approve |
| Cancel stock restore | Same restore logic; best-effort per item |
| Review deduplication | App-layer check on `(userId, productId, isDeleted)` |
| Price snapshot | Order embeds product name/price/image at creation |
| FCM token dedup | `$pull` by deviceId/token before `$push` |
| Admin notes propagation | Written to both `returns` and `orders` on approve/reject |
| Brand name uniqueness | Case-insensitive regex check on POST |

---

## 8. Migration Readiness — PostgreSQL / Supabase

### 8.1 Complexity Rating

| Collection | Complexity | Notes |
|---|---|---|
| `categories` | Low | Flat table |
| `brands` | Low | Flat table (`logoUrl`) |
| `config` | Low | Two fixed-key documents → config table |
| `users` | Medium | Extract `addresses[]` and `fcmTokens[]` |
| `cart` / `wishlist` | Medium | JSONB items column |
| `reviews` | Medium | Soft-delete translates directly |
| `returns` | Medium | Includes `upiId`; products snapshot as JSONB |
| `products` | High | Standard vs outfit variants; dynamic `sizeStock` |
| `orders` | High | Nested snapshots must be preserved |

### 8.2 JSONB Candidates

| Field | Rationale |
|---|---|
| `orders.products` | Snapshot — never queried by sub-field |
| `orders.address` | Snapshot |
| `returns.products` | Snapshot |
| `products.size_stock` | Dynamic size keys |
| `products.outfit_data` | Topwear/bottomwear sub-structure |
| `products.highlights` | Display metadata |
| `cart.items` / `wishlist.items` | Always fetched as unit |
| `config.slides` / `config.images` | Small structured arrays |

### 8.3 Index Equivalents

| MongoDB | PostgreSQL |
|---|---|
| `orders: { userId: 1 }` | `INDEX ON orders (user_email)` |
| `orders: { createdAt: -1 }` | `INDEX ON orders (created_at DESC)` |
| `orders: { clientOrderId: 1 }` unique sparse | `UNIQUE NULLS NOT DISTINCT (client_order_id)` |
| `cart/wishlist: { userId: 1 }` unique | `UNIQUE (user_email)` |
| `reviews: { productId, isDeleted, createdAt }` | Compound index on equivalent columns |
| `returns: { orderId: 1 }` | `UNIQUE (order_id)` |

### 8.4 Breaking Changes to Anticipate

| Current | Migration change |
|---|---|
| ObjectId `_id` | UUID + frontend ID updates |
| Email as `userId` | Keep as `user_email` denorm or add FK |
| String `categoryId`/`brandId` | UUID FKs |
| Dynamic `sizeStock` keys | JSONB or junction table |
| `$inc` stock decrement | Row-level lock or serializable transaction |
| In-memory rate limiter | Redis or unchanged per-process |
| Embedded FCM tokens | `user_fcm_tokens` table with `UNIQUE(device_id)` |
| Hardcoded Firebase config | Environment variables |
| No single-product API | Add `GET /products/:id` or keep client filter |

---

*Thunderbold — Premium Indian Fashion. Built for the Bold.*

> Last updated: July 19, 2026
