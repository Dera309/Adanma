@echo off
echo ========================================
echo Updating Database Schema
echo ========================================
echo.

cd backend

echo Step 1: Generating updated Prisma client...
npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo Step 2: Updating database schema...
npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Failed to update database
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS! Database schema updated.
echo.
echo The server should now work without errors.
echo.
pause