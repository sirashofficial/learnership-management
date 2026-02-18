# YEHA Student Management System - Startup Script

Write-Host "========================================" -ForegroundColor Green
Write-Host "  YEHA Student Management System" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is available
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Navigate to project directory
Set-Location "C:\Users\LATITUDE 5400\Downloads\Learnership Management"
Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Cyan

# Install dependencies if node_modules doesn't exist
if (!(Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Once the server starts:" -ForegroundColor Cyan
Write-Host "  → Open your browser" -ForegroundColor White
Write-Host "  → Go to: http://localhost:3000" -ForegroundColor White
Write-Host "  → Press Ctrl+C to stop the server" -ForegroundColor White
Write-Host ""

# Start the development server
npm run dev