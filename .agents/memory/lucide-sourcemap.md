---
name: lucide-react source map corruption
description: merge.js.map can become empty/corrupt causing esbuild build failure
---

# lucide-react Source Map Corruption

**Symptom:** Build fails with `Unexpected end of file in source map` pointing to `node_modules/lucide-react/dist/esm/icons/merge.js.map`

**Fix:** Write a valid minimal source map to the file:
```bash
printf '{"version":3,"sources":[],"mappings":""}' > node_modules/lucide-react/dist/esm/icons/merge.js.map
```

**Why:** The file can become empty or zero-bytes during npm install operations in the Replit environment. esbuild refuses to process source maps that aren't valid JSON.

**Note:** `echo ""` does NOT work — it leaves a newline which is still invalid JSON.
