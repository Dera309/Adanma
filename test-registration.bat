@echo off
echo ========================================
echo Testing Registration System
echo ========================================
echo.

echo Current Status:
echo - Frontend: http://localhost:3001 ✓
echo - Backend: http://localhost:5000 (should be running)
echo.

echo Fixed Issues:
echo ✅ Added acceptedTerms to registration requests
echo ✅ Fixed Prisma schema field mismatches
echo ✅ Added terms validation to forms
echo ✅ Fixed API URL configuration
echo ✅ Updated form props to accept terms validation
echo.

echo Test Steps:
echo 1. Make sure backend is running (npm run dev in backend folder)
echo 2. Make sure frontend is running (npm run dev in frontend folder)
echo 3. Go to http://localhost:3001/register
echo 4. Try registering with email or phone
echo.

echo Common Registration Endpoints:
echo POST http://localhost:5000/api/auth/register/email
echo POST http://localhost:5000/api/auth/register/phone
echo.

echo If you see errors, check:
echo - Backend console for database/validation errors
echo - Frontend console for API request errors
echo - Network tab in browser dev tools
echo.
pause