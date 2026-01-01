@echo off
echo ========================================
echo Switching Back to MongoDB Atlas
echo ========================================
echo.

cd backend

echo Step 1: Restoring MongoDB configuration...
if exist .env.mongodb.backup (
    copy .env.mongodb.backup .env
    echo ✓ Restored .env from backup
) else (
    echo ❌ No MongoDB backup found
)

if exist prisma\schema.mongodb.backup (
    copy prisma\schema.mongodb.backup prisma\schema.prisma
    echo ✓ Restored schema.prisma from backup
) else (
    echo ❌ No schema backup found
)

echo.
echo Step 2: Generating Prisma client for MongoDB...
call npx prisma generate

echo.
echo ✅ Switched back to MongoDB Atlas configuration.
echo.
echo Make sure to:
echo 1. Fix your network connectivity issues
echo 2. Add your IP to MongoDB Atlas whitelist
echo 3. Ensure cluster is active
echo.
pause