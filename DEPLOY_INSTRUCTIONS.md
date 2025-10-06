# Railway CLI Deployment Instructions

## Quick Deploy Steps

Since you're already logged into Railway in your browser, follow these steps:

### Step 1: Authenticate Railway CLI
```bash
railway login
```
This will open your browser. Click "Confirm" to authenticate the CLI.

### Step 2: Link to Your Project
```bash
railway link
```
Select your project: **miraculous-vision** → service: **asmlm**

### Step 3: Deploy
```bash
railway up
```
This will build and deploy your application directly from the CLI.

### Step 4: Monitor Deployment
```bash
railway status
```

### Step 5: View Logs (if needed)
```bash
railway logs
```

### Step 6: Get Your Domain
```bash
railway domain
```

---

## Alternative: Deploy Specific Environment

If you have multiple environments (production, staging):

```bash
# Select environment
railway environment

# Then deploy
railway up
```

---

## Quick One-Liner (After Authentication)

After you've authenticated and linked, you can deploy with:

```bash
railway up && railway status && railway domain
```

---

## Troubleshooting

If deployment fails:
1. Check logs: `railway logs`
2. Check service: `railway status`
3. Restart: `railway restart`

If you want to redeploy from GitHub instead:
- Just push to master (already done ✓)
- Railway will auto-deploy from GitHub

