@echo off
echo ========================================
echo Generating Prisma Client for SQLite
echo ========================================
echo.

cd backend

echo Step 1: Generating Prisma client...
npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo Step 2: Creating SQLite database...
npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Failed to create database
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS! Prisma client generated and database created.
echo.
echo You can now start the backend with: npm run dev
echo.
pause