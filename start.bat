@echo off
echo ========================================
echo   Unified Messaging Dashboard
echo ========================================
echo.
echo Starting development server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    echo Please install npm or reinstall Node.js
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Copying from env.example...
    copy env.example .env
    echo.
    echo Please edit .env file with your API keys before starting!
    echo.
    pause
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

echo Starting server on http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

REM Start the development server
npm run dev

pause
