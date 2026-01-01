@echo off
echo ========================================
echo Fixing MongoDB Connection for Adanma
echo ========================================
echo.

echo Step 1: Regenerating Prisma Client for MongoDB...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✓ Prisma client generated successfully
echo.

echo Step 2: Testing database connection...
echo Make sure your MongoDB Atlas password is set in .env file
echo.
pause

echo Step 3: Starting server...
call npm run dev