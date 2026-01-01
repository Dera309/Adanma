@echo off
echo 🔧 Starting Adanma Backend (Fixed Version)...
echo.

cd /d "%~dp0\backend"

echo 📋 Configuration Check:
echo - Port: 5001 (changed from 5000 to avoid conflicts)
echo - Database: SQLite (local dev.db)
echo - Mock Data: Disabled (full mode)
echo - Enhanced Cart: Enabled
echo.

echo 🚀 Starting backend server...
npm run dev