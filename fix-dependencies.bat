@echo off
echo Fixing dependencies and security vulnerabilities...

echo.
echo === Cleaning node_modules and package-lock.json ===
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist backend\node_modules rmdir /s /q backend\node_modules
if exist backend\package-lock.json del backend\package-lock.json
if exist frontend\node_modules rmdir /s /q frontend\node_modules
if exist frontend\package-lock.json del frontend\package-lock.json

echo.
echo === Installing root dependencies ===
npm install

echo.
echo === Updating backend dependencies ===
cd backend
npm install
npm update
npm audit fix --force
cd ..

echo.
echo === Updating frontend dependencies ===
cd frontend
npm install
npm update
npm audit fix --force
cd ..

echo.
echo === Final security audit ===
npm audit
cd backend && npm audit
cd ../frontend && npm audit
cd ..

echo.
echo === Dependency fix complete! ===
pause