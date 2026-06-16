---
name: Return/Refund Policy System
description: Full return, cancellation, and refund system — policy rules, new files, DB changes, order status flow.
---

## Policy Rules
- **Cancellation**: Only allowed when `order.status === 'pending'`. Once confirmed/beyond, customers cannot cancel via app.
- **Return**: Only allowed when `order.status === 'delivered'`. One return per order (idempotency enforced).
- **Refund amount**: `totalAmount − ₹50 (SHIPPING_CHARGES)`. Admin sees the suggested amount and can override.
- **3 delivery attempts**: Admin absorbs loss if package is undeliverable (policy only, no code enforcement needed).

## New Files
- `api/returns/index.js` — GET (list), POST (create), PATCH (admin approve/reject)
- `src/components/ReturnRequestModal.tsx` — customer-facing return form (reason dropdown + description)

## Modified Files
- `api/orders/index.js` — handleCancel: only allows cancel for `status === 'pending'`; handleManage valid statuses extended with `return_requested`, `return_approved`, `return_rejected`
- `src/pages/Orders.tsx` — cancel button gated on `pending` only; return button for `delivered`; new status colors/labels/icons
- `src/pages/Admin.tsx` — Returns tab added (RotateCcw icon); approve/reject modal with refund amount input
- `src/lib/policyContent.ts` — returns & cancellation policy rewritten with accurate new rules
- `server.js` — `/api/returns` route mounted
- `vercel.json` — `/api/returns` rewrite added

## New MongoDB Collection: `returns`
```js
{
  _id, orderId, orderNumber, userId,
  products[], totalAmount, shippingCharges, suggestedRefundAmount,
  reason, description, status ('pending'|'approved'|'rejected'),
  refundAmount, adminNotes, createdAt, updatedAt
}
```

## Order Status Flow
`pending` → `confirmed` → `packed` → `shipped` → `delivered`
→ from `delivered`: `return_requested` → `return_approved` | `return_rejected`
→ from `pending` only: `cancelled`

**Why:** User specified this exact policy. Confirmed orders cannot be cancelled to prevent fulfilment disruption.
