@echo off
echo 🔧 Restarting Frontend (Fixed Configuration)...
echo.

cd /d "%~dp0\frontend"

echo 📋 Configuration Check:
echo - API URL: http://localhost:5001 (updated to match backend)
echo - Frontend Port: 3000
echo - Backend Port: 5001
echo.

echo 🛑 Stopping any existing frontend processes...
taskkill /f /im node.exe 2>nul

echo 🚀 Starting frontend with fixed configuration...
npm run dev