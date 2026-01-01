@echo off
echo ========================================
echo Fixing Adanma Build Errors
echo ========================================
echo.

echo Step 1: Installing missing Node.js types...
call npm install --save-dev @types/node
if %errorlevel% neq 0 (
    echo WARNING: Failed to install @types/node
)
echo.

echo Step 2: Attempting build with relaxed TypeScript rules...
call npm run build
if %errorlevel% equ 0 (
    echo ✓ Build successful!
    echo.
    echo The build completed with relaxed TypeScript rules.
    echo For production, consider fixing the remaining warnings.
) else (
    echo ✗ Build still failing
    echo.
    echo Try running: npm run build:dev
    echo Or check individual component files for syntax errors.
)
echo.
pause