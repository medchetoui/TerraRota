# TerraRota Development Servers (Windows PowerShell)
# Run from the TerraRota root directory: .\scripts\run-dev.ps1
# Opens two terminals: one for Django, one for Vite.

$Root = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  TerraRota — Starting Development Servers" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Django backend on http://localhost:8000"
Write-Host "Starting React frontend on http://localhost:5173"
Write-Host ""
Write-Host "Press Ctrl+C in each terminal to stop."
Write-Host ""

# Start Django backend in a new PowerShell window
$BackendCmd = "Set-Location '$Root\backend'; .\.venv\Scripts\Activate.ps1; Write-Host '✅ Django backend starting...' -ForegroundColor Green; python manage.py runserver; Read-Host 'Press Enter to close'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendCmd

Start-Sleep -Seconds 2

# Start Vite frontend in a new PowerShell window
$FrontendCmd = "Set-Location '$Root\frontend'; Write-Host '✅ Vite frontend starting...' -ForegroundColor Green; npm run dev; Read-Host 'Press Enter to close'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendCmd

Write-Host "✅ Both servers launched in separate windows." -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8000/api/v1/health/" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
