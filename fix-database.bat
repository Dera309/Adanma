@echo off
echo ========================================
echo Fixing Database Configuration
echo ========================================
echo.

cd backend

echo Step 1: Cleaning up old Prisma client...
if exist node_modules\.prisma (
    rmdir /s /q node_modules\.prisma
    echo ✓ Removed old Prisma client
)

if exist node_modules\@prisma\client (
    rmdir /s /q node_modules\@prisma\client
    echo ✓ Removed old Prisma client package
)

echo.
echo Step 2: Generating new Prisma client for SQLite...
npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo Step 3: Creating SQLite database...
npx prisma db push --force-reset
if %errorlevel% neq 0 (
    echo ❌ Failed to create database
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS! Database configuration fixed.
echo.
echo You can now restart your backend server with: npm run dev
echo.
pause