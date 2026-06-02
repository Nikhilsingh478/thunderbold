---
name: vite-plugin-pwa install
description: vite-plugin-pwa may not be installed even though it's in package.json
---

# vite-plugin-pwa Install

**Symptom:** Build fails with `Cannot find package 'vite-plugin-pwa' imported from vite.config.ts`

**Fix:** Use installLanguagePackages({ packages: ["vite-plugin-pwa"], language: "nodejs" }) via code_execution

**Why:** In the Replit dev environment, npm installs can be incomplete after workspace restarts. vite-plugin-pwa is in package.json but may not be in node_modules.
