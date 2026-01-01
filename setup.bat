@echo off
echo ========================================
echo Adanma Setup Script
echo ========================================
echo.

echo Step 1: Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend npm install failed
    echo Please check your internet connection
    pause
    exit /b 1
)
echo Backend dependencies installed successfully!
echo.

echo Step 2: Installing Frontend Dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend npm install failed
    echo Please check your internet connection
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully!
echo.

echo Step 3: Generating Prisma Client...
cd ..\backend
call npx prisma generate
if %errorlevel% neq 0 (
    echo WARNING: Prisma generate failed
    echo You may need to configure DATABASE_URL in backend/.env
)
echo.

cd ..
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo IMPORTANT: Before starting the app:
echo 1. Update backend/.env with your MongoDB password
echo 2. Make sure MongoDB Atlas is accessible
echo.
echo To start Adanma:
echo   Option 1: Run start-backend.bat and start-frontend.bat in separate terminals
echo   Option 2: Manually run 'npm run dev' in backend and frontend folders
echo.
pause
