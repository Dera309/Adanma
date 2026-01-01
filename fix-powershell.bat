@echo off
echo ========================================
echo PowerShell Execution Policy Fix
echo ========================================
echo.
echo This will fix the npm PowerShell error by enabling
echo script execution for your user account only.
echo.
echo This is SAFE and only affects your user account.
echo.
pause

echo Checking current PowerShell execution policy...
powershell -Command "Get-ExecutionPolicy"
echo.

echo Attempting to fix PowerShell execution policy...
echo.
echo Running: Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
echo.

powershell -Command "Start-Process powershell -ArgumentList '-Command Set-ExecutionPolicy RemoteSigned -Scope CurrentUser' -Verb RunAs"

echo.
echo If a UAC prompt appeared, click YES to allow the change.
echo.
echo After the fix, you should be able to run npm commands.
echo.
pause

echo Testing npm...
npm --version
if %errorlevel% equ 0 (
    echo.
    echo ✓ SUCCESS: npm is working!
    echo You can now run start-backend.bat and start-frontend.bat
) else (
    echo.
    echo ✗ npm still has issues. Try using Command Prompt instead of PowerShell.
)
echo.
pause