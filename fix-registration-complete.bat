@echo off
echo ========================================
echo Complete Registration System Fix
echo ========================================
echo.

echo Step 1: Checking current status...
echo - Frontend should be on: http://localhost:3001
echo - Backend should be on: http://localhost:5000
echo.

echo Step 2: Testing registration endpoints...
echo.

cd backend
echo Current directory: %CD%
echo.

echo Testing if backend is responding...
curl -X GET http://localhost:5000/health 2>nul
if %errorlevel% equ 0 (
    echo ✅ Backend is responding
) else (
    echo ❌ Backend is not responding
    echo Make sure to run: npm run dev in backend folder
)

echo.
echo Step 3: Testing registration endpoints...
echo.

echo Testing email registration endpoint...
curl -X POST http://localhost:5000/api/auth/register/email ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"TestPass123!\",\"acceptedTerms\":true}" 2>nul

echo.
echo Testing phone registration endpoint...
curl -X POST http://localhost:5000/api/auth/register/phone ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\":\"+2348012345678\",\"password\":\"TestPass123!\",\"acceptedTerms\":true}" 2>nul

echo.
echo Step 4: Common issues and solutions...
echo.
echo If you see CORS errors:
echo - Make sure FRONTEND_URL=http://localhost:3001 in backend/.env
echo.
echo If you see database errors:
echo - MongoDB Atlas connection is still failing
echo - Database operations will fail until Atlas is fixed
echo.
echo If you see validation errors:
echo - Check that all required fields are being sent
echo - Check password meets requirements (8+ chars, upper, lower, number, special)
echo.
echo Step 5: Open test page...
echo Opening simple registration test page...
start "" "%~dp0test-registration-simple.html"
echo.
pause