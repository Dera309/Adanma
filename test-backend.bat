@echo off
echo ========================================
echo Testing Backend MongoDB Connection
echo ========================================
echo.

echo Current Status:
echo - Frontend: Running on http://localhost:3001 ✓
echo - Backend: Testing MongoDB connection...
echo.

echo Step 1: Navigating to backend directory...
cd backend
echo Current directory: %CD%
echo.

echo Step 2: Starting backend server...
echo.
echo 🔍 WHAT TO LOOK FOR:
echo ✅ SUCCESS: "Database connection established successfully"
echo ✅ SUCCESS: "Server running on port 5000"
echo ❌ FAIL: "Server selection timeout"
echo ❌ FAIL: "Authentication failed"
echo.
echo Press Ctrl+C to stop the server after you see the result.
echo.
pause

echo Starting backend...
npm run dev