@echo off
title YEHA Diagnostic Tool
color 0A

echo ========================================
echo   YEHA System Diagnostic Tool
echo ========================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Node.js is installed
    node --version
) else (
    echo ✗ Node.js NOT FOUND
    echo Please download from: https://nodejs.org/
    echo.
    echo Press any key to open download page...
    pause >nul
    start https://nodejs.org/
    exit
)

echo.
echo [2/4] Checking npm...
npm --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ npm is available
    npm --version
) else (
    echo ✗ npm NOT FOUND
    pause
    exit
)

echo.
echo [3/4] Checking project directory...
if exist "package.json" (
    echo ✓ Found package.json
) else (
    echo ✗ package.json not found
    echo Make sure you're in the correct directory
    pause
    exit
)

echo.
echo [4/4] Checking dependencies...
if exist "node_modules" (
    echo ✓ Dependencies appear to be installed
    echo.
    echo Ready to start server!
    echo.
    choice /c YN /m "Start the development server now? (Y/N)"
    if errorlevel 2 goto :end
    if errorlevel 1 goto :start
) else (
    echo ⚠ Dependencies need to be installed
    echo.
    choice /c YN /m "Install dependencies now? (Y/N)"
    if errorlevel 2 goto :end
    if errorlevel 1 goto :install
)

:install
echo.
echo Installing dependencies...
npm install
if %errorlevel% == 0 (
    echo ✓ Dependencies installed successfully!
    echo.
    goto :start
) else (
    echo ✗ Installation failed
    pause
    exit
)

:start
echo.
echo Starting development server...
echo.
echo ========================================
echo   Server will start on http://localhost:3000
echo   Press Ctrl+C to stop the server
echo ========================================
echo.
npm run dev

:end
echo.
echo Goodbye!
pause