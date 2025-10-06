@echo off
echo === Railway Deployment ===
echo.

echo Step 1: Authenticating with Railway...
echo Please complete the authentication in your browser when it opens.
railway login
if %errorlevel% neq 0 (
    echo Failed to login
    exit /b 1
)

echo.
echo Step 2: Linking to project...
railway link
if %errorlevel% neq 0 (
    echo Failed to link project
    exit /b 1
)

echo.
echo Step 3: Deploying...
railway up --detach
if %errorlevel% neq 0 (
    echo Failed to deploy
    exit /b 1
)

echo.
echo Step 4: Checking status...
railway status

echo.
echo Step 5: Getting domain...
railway domain

echo.
echo === Deployment Complete ===

