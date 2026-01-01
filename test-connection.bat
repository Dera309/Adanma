@echo off
echo ========================================
echo Testing MongoDB Atlas Connection
echo ========================================
echo.

echo Step 1: Checking if backend can start...
cd backend
echo Current directory: %CD%
echo.

echo Step 2: Trying to start the backend server...
echo This will test the MongoDB connection.
echo.
echo If you see "Database connection established successfully" - SUCCESS!
echo If you see timeout errors - we need to check Atlas settings.
echo.
echo Press Ctrl+C to stop the server once you see the result.
echo.
pause

npm run dev