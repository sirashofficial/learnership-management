@echo off
cd /d "C:\Users\LATITUDE 5400\Downloads\Learnership Management"
echo Starting YEHA Development Server...
echo Please make sure Node.js and npm are installed
echo.
npm --version
echo.
echo Installing dependencies...
npm install
echo.
echo Starting development server...
npm run dev
pause