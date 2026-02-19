@echo off
echo ========================================
echo Starting Learnership Management System
echo ========================================
echo.
echo Clearing cache...
rd /s /q .next 2>nul
echo Cache cleared!
echo.
echo Starting server...
echo.
call npm run dev
