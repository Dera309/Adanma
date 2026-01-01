@echo off
echo ========================================
echo Starting Adanma Frontend
echo ========================================
echo.

cd frontend

echo Step 1: Installing dependencies (if needed)...
if not exist node_modules (
    echo Installing npm dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo ✓ Dependencies already installed
)

echo.
echo Step 2: Starting development server...
echo ✓ Frontend will be available at: http://localhost:3001
echo ✓ API configured for: http://localhost:5000
echo.

start "Adanma Frontend" cmd /k "npm run dev"

echo.
echo ✅ Frontend server starting...
echo.
echo Make sure your backend is running on port 5000
echo Frontend will be available at: http://localhost:3001
echo.
pause