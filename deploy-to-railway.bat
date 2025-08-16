@echo off
chcp 65001 >nul

echo 🚀 Railway Deployment Script for Kommo CRM Analytics Dashboard
echo ================================================================

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI is not installed.
    echo Please install it first: npm install -g @railway/cli
    echo Then run: railway login
    pause
    exit /b 1
)

REM Check if user is logged in to Railway
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Railway.
    echo Please run: railway login
    pause
    exit /b 1
)

echo ✅ Railway CLI is installed and logged in

REM Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ❌ Please run this script from the project root directory
    pause
    exit /b 1
)

echo ✅ Project structure looks good

:menu
echo.
echo Choose deployment option:
echo 1. Deploy Backend only
echo 2. Deploy Frontend only
echo 3. Deploy Both (Backend + Frontend)
echo 4. Check deployment status
echo 5. View logs
echo 6. Exit

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto deploy_backend
if "%choice%"=="2" goto deploy_frontend
if "%choice%"=="3" goto deploy_both
if "%choice%"=="4" goto check_status
if "%choice%"=="5" goto view_logs
if "%choice%"=="6" goto exit_script
echo ❌ Invalid choice
goto menu

:deploy_backend
echo 🔧 Deploying Backend...
cd backend
railway up
cd ..
goto end

:deploy_frontend
echo 🎨 Deploying Frontend...
cd kommo-pulse-main
railway up
cd ..
goto end

:deploy_both
echo 🚀 Deploying Both Backend and Frontend...
echo Deploying Backend first...
cd backend
railway up
cd ..
echo Deploying Frontend...
cd kommo-pulse-main
railway up
cd ..
goto end

:check_status
echo 📊 Checking deployment status...
railway status
goto end

:view_logs
echo 📋 Viewing logs...
echo Choose service:
echo 1. Backend logs
echo 2. Frontend logs
set /p log_choice="Enter choice (1-2): "

if "%log_choice%"=="1" (
    cd backend
    railway logs
    cd ..
) else if "%log_choice%"=="2" (
    cd kommo-pulse-main
    railway logs
    cd ..
) else (
    echo Invalid choice
)
goto end

:exit_script
echo 👋 Goodbye!
exit /b 0

:end
echo.
echo ✅ Deployment script completed!
echo.
echo 📋 Next steps:
echo 1. Check your Railway dashboard for deployment status
echo 2. Configure environment variables in Railway
echo 3. Test your deployed application
echo 4. Update Stripe webhooks and Kommo OAuth redirects
echo.
echo 📖 For detailed instructions, see: RAILWAY_DEPLOYMENT.md
pause
