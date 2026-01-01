@echo off
echo 🚀 Starting Adanma E-commerce Platform (Full Mode)
echo.

echo 📋 Configuration:
echo - Backend: Port 5001 (Full Database Mode)
echo - Frontend: Port 3000 (Full Authentication)
echo - Cart: Enhanced with all features
echo - Database: SQLite (Local Development)
echo.

echo 🔧 Starting Backend...
start "Backend" cmd /k "cd /d %~dp0\backend && npm run dev"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo 🎨 Starting Frontend...
start "Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo ✅ Both servers starting...
echo.
echo 📖 Access the application:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:5001
echo - Health Check: http://localhost:5001/health
echo.
echo 🔑 Test Credentials:
echo - Email: obia.colin.100@gmail.com
echo - Password: password123
echo.
echo Press any key to close this window...
pause >nul