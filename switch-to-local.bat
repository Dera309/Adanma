@echo off
echo ========================================
echo Switching to Local SQLite Database
echo ========================================
echo.

echo This will temporarily use SQLite instead of MongoDB Atlas
echo to bypass network connectivity issues.
echo.

cd backend

echo Step 1: Backing up current files...
if exist .env (
    copy .env .env.mongodb.backup
    echo ✓ Backed up .env to .env.mongodb.backup
)

if exist prisma\schema.prisma (
    copy prisma\schema.prisma prisma\schema.mongodb.backup
    echo ✓ Backed up schema.prisma to schema.mongodb.backup
)

echo.
echo Step 2: Switching to local configuration...
copy .env.local .env
copy prisma\schema.local.prisma prisma\schema.prisma
echo ✓ Switched to local SQLite configuration

echo.
echo Step 3: Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo Step 4: Creating local database...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Failed to create local database
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS! Local database setup complete.
echo.
echo You can now run: npm run dev
echo The backend will use SQLite instead of MongoDB Atlas.
echo.
echo To switch back to MongoDB Atlas later, run: switch-to-mongodb.bat
echo.
pause