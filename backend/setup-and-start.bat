@echo off
echo Setting up Adanma Backend Server...

echo.
echo 1. Generating Prisma client...
call npm run db:generate

echo.
echo 2. Pushing database schema...
call npm run db:push

echo.
echo 3. Starting development server...
call npm run dev

pause