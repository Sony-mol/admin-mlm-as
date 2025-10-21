# Railway Deployment Fix Guide for asmlm Service

## Issues Fixed

### 1. **Configuration Conflicts Resolved**
- ✅ Standardized all configs to use **Nixpacks** (removed Docker conflicts)
- ✅ Unified Node.js version to **20** across all configs
- ✅ Fixed package installation commands to use `npm ci --legacy-peer-deps`

### 2. **Build Process Standardized**
- ✅ All configs now use consistent build commands
- ✅ Proper dependency installation with legacy peer deps
- ✅ Correct start command for production

### 3. **Environment Variables Set**
- ✅ `BACKEND_URL`: https://asmlmbackend-production.up.railway.app
- ✅ `NODE_ENV`: production
- ✅ `PORT`: 3000

## Files Modified

### 1. **Dockerfile** (Backup - not used with Nixpacks)
- Fixed Node.js base image
- Added proper package-lock.json copying
- Improved dependency installation

### 2. **nixpacks.toml** (Primary config)
- Standardized Node.js 20
- Fixed install command with legacy peer deps
- Correct start command

### 3. **.nixpacks** (Secondary config)
- Aligned with nixpacks.toml
- Consistent Node.js version
- Proper start command

### 4. **railway.json** (Railway config)
- Changed builder to NIXPACKS
- Added all required environment variables
- Proper restart policy

### 5. **package.json**
- Updated start script to use PORT environment variable
- Consistent with Nixpacks configuration

## Deployment Steps

### Option 1: Railway Dashboard (Recommended)
1. Go to your Railway dashboard
2. Navigate to the `asmlm` service
3. Go to **Settings** → **Variables**
4. Ensure these environment variables are set:
   ```
   BACKEND_URL=https://asmlmbackend-production.up.railway.app
   NODE_ENV=production
   PORT=3000
   ```
5. Go to **Deployments** and click **Redeploy**

### Option 2: Railway CLI
```bash
# Navigate to asmlm directory
cd asmlm

# Deploy using Railway CLI
railway up

# Check status
railway status

# View logs
railway logs
```

### Option 3: Git Push (Auto-deploy)
```bash
# Commit the configuration fixes
git add .
git commit -m "Fix deployment configuration conflicts"
git push origin main
```

## Verification Steps

After deployment, verify:

1. **Service Status**: Check Railway dashboard for successful deployment
2. **Application Access**: Visit your Railway domain
3. **API Connectivity**: Test if frontend can connect to backend
4. **Logs**: Check Railway logs for any errors

## Troubleshooting

### If deployment still fails:
1. **Check logs**: `railway logs` or Railway dashboard logs
2. **Verify environment variables**: Ensure all required vars are set
3. **Clear cache**: Try redeploying with fresh build
4. **Check dependencies**: Ensure package-lock.json is committed

### Common Issues:
- **Build timeout**: Increase build timeout in Railway settings
- **Memory issues**: Check if build process needs more memory
- **Dependency conflicts**: The `--legacy-peer-deps` flag should resolve these

## Configuration Summary

The service now uses:
- **Builder**: Nixpacks (not Docker)
- **Node.js**: Version 20
- **Package Manager**: npm with legacy peer deps
- **Start Command**: `npx serve dist --single --listen $PORT`
- **Environment**: Production with proper backend URL

This configuration should resolve the deployment failures you've been experiencing.
