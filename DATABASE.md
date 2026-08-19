# Thunderbold — Database Architecture & Complete Schema Reference

> MongoDB Atlas · Database: `thunderbold` · **10 active collections** · Node.js Native Driver

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
4. [Complete Index List (20 Bootstrapped Indexes)](#4-complete-index-list-20-bootstrapped-indexes)
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
| **Bootstrapped Indexes** | **20 indexes across 7 collections** |

---

## 2. Collection Schemas

All documents use MongoDB's auto-generated `_id` (ObjectId) as the primary key unless otherwise noted.

---

### 2.1 `users`

One document per registered user. Created or updated on login via `POST /api/users`.

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

---

### 2.2 `products`

Supports standard products and outfit (`section: "outfits"`) variants.

#### Standard Product
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
  "highlights":    { "color": "string", "waistRise": "string", "...": "string" },
  "createdAt":     "Date",
  "updatedAt":     "Date | undefined"
}
```

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
    "highlights": { "color": "string", "length": "string" }
  },
  "bottomwear": {
    "sizeStock":  { "28": 4, "30": 6 },
    "stock":      10,
    "highlights": { "color": "string", "waistRise": "string" }
  },
  "stock":       "number",
  "image":       "string",
  "images":      ["string"],
  "description": "string",
  "createdAt":   "Date",
  "updatedAt":   "Date | undefined"
}
```

---

### 2.3 `orders`

One document per order. Embedded `products` and `address` snapshots frozen at creation time.

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
  "paymentMethod":         "\"cod\"",
  "status":                "\"pending\" | \"confirmed\" | \"packed\" | \"shipped\" | \"delivered\" | \"cancelled\" | \"return_requested\" | \"return_approved\" | \"return_rejected\" | \"refund_issued\"",
  "totalAmount":           "number",
  "giftMessage":           "string | undefined",
  "giftCardId":            "number | null",
  "giftDeliveryDate":      "string | null",
  "returnShippingCharges": "number | undefined",
  "returnRefundAmount":    "number | undefined",
  "adminNotes":            "string | null | undefined",
  "createdAt":             "Date",
  "updatedAt":             "Date | undefined"
}
```

---

### 2.4 `returns`

One document per return request.

```json
{
  "_id":                   "ObjectId",
  "orderId":               "string",
  "orderNumber":           "string | null",
  "userId":                "string",
  "products":              "array (snapshot)",
  "totalAmount":           "number",
  "shippingCharges":       "number",
  "suggestedRefundAmount": "number",
  "reason":                "\"defective\" | \"wrong_item\" | \"size_issue\" | \"not_as_described\" | \"other\"",
  "description":           "string",
  "upiId":                 "string",
  "status":                "\"pending\" | \"approved\" | \"rejected\" | \"refund_issued\"",
  "refundAmount":          "number | null",
  "adminNotes":            "string | null",
  "createdAt":             "Date",
  "updatedAt":             "Date"
}
```

---

### 2.5 `cart`

One document per user.

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

---

### 2.6 `wishlist`

One document per user.

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

---

### 2.8 `categories`

```json
{
  "_id":       "ObjectId",
  "name":      "string",
  "image":     "string",
  "section":   "string",
  "createdAt": "Date"
}
```

---

### 2.9 `brands`

```json
{
  "_id":       "ObjectId",
  "name":      "string",
  "logoUrl":   "string",
  "createdAt": "Date"
}
```

---

### 2.10 `config`

Two singleton documents: `_id: "slider"` (ThunderboldSlider config) and `_id: "hero-banner"` (Hero banner URLs).

---

## 3. Legacy Collection

- **`addresses`**: Legacy collection used only by `api/address/index.js`. Active main app embeds user addresses inside `users.addresses[]`.

---

## 4. Complete Index List (20 Bootstrapped Indexes)

All 20 indexes below are automatically created asynchronously on database connection by `ensureIndexes()` in `api/_lib/mongodb.js`:

| # | Collection | Field Spec | Options | Purpose |
|---|---|---|---|---|
| 1 | `orders` | `{ userId: 1 }` | Standard | Query user orders |
| 2 | `orders` | `{ createdAt: -1 }` | Standard | Admin order history sorting |
| 3 | `orders` | `{ clientOrderId: 1 }` | `sparse: true, unique: true` | Order creation idempotency |
| 4 | `orders` | `{ orderNumber: 1 }` | `background: true, sparse: true` | Fast TB-XXXXXX lookup |
| 5 | `orders` | `{ status: 1 }` | `background: true` | Admin status filtering |
| 6 | `orders` | `{ userId: 1, createdAt: -1 }` | `background: true` | Paginated user order history |
| 7 | `products` | `{ categoryId: 1 }` | Standard | Filter products by category |
| 8 | `products` | `{ section: 1, createdAt: -1 }` | `background: true` | Filter products by section |
| 9 | `products` | `{ stock: 1 }` | `background: true` | Low stock alert queries |
| 10 | `cart` | `{ userId: 1 }` | `unique: true` | One cart document per user |
| 11 | `wishlist` | `{ userId: 1 }` | `unique: true` | One wishlist document per user |
| 12 | `reviews` | `{ productId: 1, isDeleted: 1, createdAt: -1 }` | Standard | Product review display |
| 13 | `reviews` | `{ userId: 1, isDeleted: 1 }` | Standard | User review history |
| 14 | `reviews` | `{ userId: 1, productId: 1 }` | Standard | Deduplication check |
| 15 | `users` | `{ uid: 1 }` | `background: true` | Fast profile lookup by Firebase UID |
| 16 | `users` | `{ email: 1 }` | `background: true` | Fast user lookup by email |
| 17 | `returns` | `{ orderId: 1 }` | `background: true` | Return lookup & idempotency |
| 18 | `returns` | `{ userId: 1 }` | `background: true` | User return history |
| 19 | `returns` | `{ status: 1, createdAt: -1 }` | `background: true` | Admin return queue |
| 20 | `brands` | `{ name: 1 }` | `background: true` | Brand name uniqueness check |

---

## 5. Relationships & Access Patterns

- `users (email)` ──► `orders`, `returns`, `cart`, `wishlist`, `reviews`
- `orders` embeds frozen snapshots of `products` and shipping `address`.
- `returns` embeds frozen product snapshot from parent order.

---

## 6. Key Query Patterns

- **Atomic Stock Decrement:** `db.collection('products').updateOne({ _id: id, ['sizeStock.' + size]: { $gte: qty } }, { $inc: { ['sizeStock.' + size]: -qty, stock: -qty } })`
- **FCM User Token Retrieval:** `db.collection('users').find({ fcmTokens: { $exists: true, $ne: [] } }, { projection: { email: 1, fcmTokens: 1 } })`

---

## 7. Data Integrity Mechanisms

- Server-side price verification on order placement.
- Atomic MongoDB stock decrements for standard and outfit items.
- Idempotency guards via `clientOrderId` sparse unique index.

---

## 8. Migration Readiness — PostgreSQL / Supabase

- Document structure easily translates to relational tables with JSONB columns for product snapshots (`orders.products`) and dynamic stock matrices (`products.size_stock`).

---

*Thunderbold — Premium Indian Fashion. Built for the Bold.*

> Last updated: August 20, 2026
