# 🚀 Deploy Tier Management Fix to Production

## The Problem
The production site (`asmlm-production.up.railway.app`) is still using the OLD code without the fix.

The Network tab shows requests going to `/undefined/1` instead of `/api/levels/1`.

## The Solution
You need to rebuild and deploy the frontend to production.

---

## 🔧 **Deployment Steps**

### Method 1: Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**:
   - Open: https://railway.app/dashboard
   - Find your project: **miraculous-vision** → service: **asmlm** (frontend)

2. **Trigger Manual Deploy**:
   - Click on the **asmlm** frontend service
   - Go to **Deployments** tab
   - Click **"Deploy"** button (or wait for auto-deploy if GitHub is connected)
   - Or go to **Settings** → **Redeploy** → **Deploy Latest Commit**

3. **Wait for Build to Complete** (~2-5 minutes)
   - Watch the deployment logs
   - Wait for status: ✅ **Active**

4. **Test the Fix**:
   - Go to: `https://asmlm-production.up.railway.app/tier-management`
   - Change "Referrals Required" value
   - Click "Save Changes"
   - Check Network tab: URL should be `/api/levels/{id}` (not `/undefined/{id}`)
   - Refresh page: Value should persist

---

### Method 2: Railway CLI (Alternative)

**Step 1: Login to Railway CLI**
```bash
railway login
```
This opens your browser for authentication.

**Step 2: Navigate to Frontend Directory**
```bash
cd admin-mlm-as
```

**Step 3: Link to Your Project**
```bash
railway link
```
Select: **miraculous-vision** → **asmlm** (frontend service)

**Step 4: Deploy**
```bash
railway up
```

**Step 5: Check Status**
```bash
railway status
```

---

### Method 3: Git Push (If Auto-Deploy is Enabled)

If your Railway project is connected to GitHub and has auto-deploy enabled:

**Step 1: Commit Changes** (if not already committed)
```bash
git add admin-mlm-as/src/config/api.js
git commit -m "fix: Add missing UPDATE_LEVEL_PROPERTIES endpoint for tier management"
```

**Step 2: Push to GitHub**
```bash
git push origin master
```

**Step 3: Wait for Auto-Deploy**
- Railway will automatically detect the push
- Build and deploy will start automatically
- Check Railway dashboard for deployment status

---

## ✅ **How to Verify the Fix Works**

### Before Fix (Current Production):
```
1. Change "Referrals Required" to 1
2. Click "Save Changes"
3. Network tab shows: PATCH /undefined/1 ❌
4. Reload page → Still shows 100 ❌
```

### After Fix (After Deployment):
```
1. Change "Referrals Required" to 1
2. Click "Save Changes"
3. Network tab shows: PATCH /api/levels/1 ✅
4. Response: 200 OK with updated data ✅
5. Reload page → Shows 1 ✅
```

---

## 🐛 **What Was Fixed**

**File Changed**: `admin-mlm-as/src/config/api.js`

**Line 59 Added**:
```javascript
UPDATE_LEVEL_PROPERTIES: getApiUrl('/api/levels'), // For PATCH updates to level properties
```

This endpoint was missing, causing `TierManagement.jsx` to use `undefined` as the API URL.

---

## 📞 **Still Having Issues?**

### Issue 1: Build Fails on Railway
**Check**:
- Railway build logs for errors
- Node version compatibility
- Environment variables

### Issue 2: Still Seeing `/undefined/1`
**Solution**:
- Hard refresh browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Clear browser cache
- Try incognito/private window
- Check Railway deployment status (must be "Active")

### Issue 3: Railway CLI Not Working
**Solution**:
- Install/reinstall: `npm install -g @railway/cli`
- Or use Railway Dashboard method instead

---

## 🎯 **Quick Checklist**

- [ ] Verify fix is in `api.js` file (line 59: `UPDATE_LEVEL_PROPERTIES`)
- [ ] Deploy to Railway (any method above)
- [ ] Wait for deployment to complete (status: Active)
- [ ] Clear browser cache / hard refresh
- [ ] Test: Change referrals → Save → Check Network tab
- [ ] Verify: Request URL should be `/api/levels/{id}` not `/undefined/{id}`
- [ ] Confirm: Value persists after page reload

---

**Current Status**: ✅ Code fixed locally, ⏳ Needs deployment to production

**Next Step**: Deploy using one of the methods above!

