@echo off
echo ========================================
echo Restarting Adanma App (Real Database)
echo ========================================
echo.

echo Step 1: Stopping any running Node processes...
taskkill /f /im node.exe 2>nul
echo ✓ Stopped Node processes

echo.
echo Step 2: Fixing database configuration...
call fix-database.bat

echo.
echo Step 3: Starting backend server...
cd backend
start "Adanma Backend" cmd /k "npm run dev"

echo.
echo Step 4: Starting frontend server...
cd ../frontend
start "Adanma Frontend" cmd /k "npm start"

echo.
echo ✅ SUCCESS! Both servers are starting...
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3001
echo.
echo Check the opened terminal windows for server status.
echo.
pause