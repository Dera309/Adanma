@echo off
echo ========================================
echo Starting ADANMA Frontend (Fixed)
echo ========================================

cd frontend

echo Checking for processes on port 3001...
netstat -ano | findstr :3001
if %errorlevel% == 0 (
    echo Port 3001 is in use. Killing processes...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /f /pid %%a 2>nul
    timeout /t 2 /nobreak >nul
)

echo.
echo Starting frontend server on port 3001...
echo Configuration:
echo - Port: 3001
echo - Backend API: http://localhost:5003
echo - Enhanced Cart: Enabled
echo.

npm run dev

pause