@echo off
echo Clearing browser cache and restarting frontend...
cd frontend
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q dist 2>nul
echo Cache cleared. Please:
echo 1. Close your browser completely
echo 2. Restart your browser
echo 3. Go to http://localhost:3000
echo 4. Press Ctrl+Shift+R for hard refresh
pause