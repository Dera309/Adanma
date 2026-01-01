@echo off
echo ========================================
echo System Status Check
echo ========================================
echo.

echo Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found
) else (
    echo OK: Node.js is installed
)
echo.

echo Checking npm...
call npm --version
if %errorlevel% neq 0 (
    echo ERROR: npm not found
) else (
    echo OK: npm is installed
)
echo.

echo Checking Docker...
docker --version 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Docker not installed
    echo Docker is optional but recommended for production
) else (
    echo OK: Docker is installed
)
echo.

echo Checking Backend Dependencies...
if exist "backend\node_modules" (
    echo OK: Backend dependencies installed
) else (
    echo WARNING: Backend dependencies not installed
    echo Run setup.bat to install
)
echo.

echo Checking Frontend Dependencies...
if exist "frontend\node_modules" (
    echo OK: Frontend dependencies installed
) else (
    echo WARNING: Frontend dependencies not installed
    echo Run setup.bat to install
)
echo.

echo Checking Environment Files...
if exist "backend\.env" (
    echo OK: Backend .env file exists
) else (
    echo ERROR: Backend .env file missing
)

if exist "frontend\.env" (
    echo OK: Frontend .env file exists
) else (
    echo ERROR: Frontend .env file missing
)
echo.

echo Checking if ports are available...
netstat -ano | findstr :5000 >nul
if %errorlevel% equ 0 (
    echo WARNING: Port 5000 is in use
) else (
    echo OK: Port 5000 is available
)

netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo WARNING: Port 3000 is in use
) else (
    echo OK: Port 3000 is available
)
echo.

echo ========================================
echo Status Check Complete
echo ========================================
echo.
pause
