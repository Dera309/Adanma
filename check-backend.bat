@echo off
echo Checking if backend server is running...
netstat -ano | findstr :5002
if %errorlevel% == 0 (
    echo Backend server is running on port 5002
) else (
    echo Backend server is NOT running on port 5002
    echo.
    echo To start the backend server:
    echo 1. Double-click start-backend.bat
    echo 2. Or run: cd backend && npm run dev
)
pause