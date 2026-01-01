@echo off
echo ========================================
echo Fixing and Starting Adanma Frontend
echo ========================================
echo.

echo Step 1: Installing/updating dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    echo Trying to clear cache and reinstall...
    call npm cache clean --force
    call npm install
)
echo.

echo Step 2: Starting Vite development server...
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start frontend
    echo.
    echo Possible solutions:
    echo 1. Check if port 3000 is available
    echo 2. Try: npm cache clean --force
    echo 3. Delete node_modules and run npm install again
    echo.
    pause
)