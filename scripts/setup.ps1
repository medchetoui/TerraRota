# TerraRota Setup Script (Windows PowerShell)
# Run from the TerraRota root directory: .\scripts\setup.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  TerraRota — Development Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# ─── Backend setup ───────────────────────────────────────
Write-Host "📦 Setting up Python backend..." -ForegroundColor Yellow

$BackendPath = Join-Path $Root "backend"
Set-Location $BackendPath

# Create virtual environment if it doesn't exist
if (-Not (Test-Path ".\.venv")) {
    Write-Host "  Creating Python virtual environment..."
    python -m venv .venv
} else {
    Write-Host "  Virtual environment already exists."
}

# Install dependencies
Write-Host "  Installing Python dependencies..."
& .\.venv\Scripts\pip.exe install -r requirements.txt --quiet

# Copy .env if it doesn't exist
if (-Not (Test-Path ".\.env")) {
    Write-Host "  Creating .env from .env.example..."
    Copy-Item (Join-Path $Root ".env.example") ".\.env"
    Write-Host "  ⚠️  Edit backend\.env to set DJANGO_SECRET_KEY before production use." -ForegroundColor Yellow
} else {
    Write-Host "  .env already exists."
}

# Run migrations
Write-Host "  Running Django migrations..."
& .\.venv\Scripts\python.exe manage.py migrate --run-syncdb 2>&1 | Out-Null
Write-Host "  ✅ Backend ready." -ForegroundColor Green

# ─── Frontend setup ────────────────────────────────────
Write-Host ""
Write-Host "🎨 Setting up React frontend..." -ForegroundColor Yellow

$FrontendPath = Join-Path $Root "frontend"
Set-Location $FrontendPath

Write-Host "  Installing Node dependencies..."
npm install --silent

Write-Host "  ✅ Frontend ready." -ForegroundColor Green

# ─── Summary ───────────────────────────────────────────
Set-Location $Root

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  ✅ Setup complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start servers:    .\scripts\run-dev.ps1"
Write-Host "  2. Run tests:        cd backend; .\.venv\Scripts\python.exe -m pytest -v"
Write-Host "  3. Check NASA:       cd backend; .\.venv\Scripts\python.exe scripts/check_nasa.py"
Write-Host "  4. Open app:         http://localhost:5173"
Write-Host ""
