---
name: Policy content architecture
description: How policy text is organized across Footer modal and Policies page
---

# Policy Content Architecture

All policy text lives in `src/lib/policyContent.ts` as a `policyData: PolicyData[]` array.

Three policies: `privacy`, `terms`, `returns` — each with `id`, `title`, `subtitle`, `sections[]`.

Sections have `heading`, `text`, optional `list[]`, and optional `highlight: boolean`.

**Consumers:**
- `src/components/Footer.tsx` — imports policyData, uses in PolicyModal (quick modal overlay)
- `src/pages/Policies.tsx` — imports policyData, renders as full accordion page at /policies

**Why:** Keeps policy text DRY — one source of truth for both the footer quick-view modal and the dedicated /policies page. Always edit policyContent.ts, not the consumers.

**How to apply:** When policy content changes, update policyContent.ts only. Both surfaces auto-update.
