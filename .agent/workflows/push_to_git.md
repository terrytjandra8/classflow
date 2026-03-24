---
description: How to push changes to the Classboards Git repository
---

To push changes to the Classboards Git repository (which auto-deploys to Vercel), follow these steps:

1. Stage all changes:
   ```powershell
   git add .
   ```

2. Set local user identity (required for auto-deploy to Vercel):
   ```powershell
   git config user.email "terrytjandra-ipeka@users.noreply.github.com"
   git config user.name "terrytjandra-ipeka"
   ```

// turbo
3. Commit the changes:
   ```powershell
   git commit -m "feat: <description of changes>"
   ```

// turbo
4. Push to the main branch:
   ```powershell
   git push origin main
   ```

> [!IMPORTANT]  
> This repo auto-deploys to Vercel upon pushing to the `main` branch.
