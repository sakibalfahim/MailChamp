# Run full MailChamp pipeline (requires GEMINI_API_KEY in .env)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path .env)) {
    Write-Host "Missing .env — copy .env.example to .env and set GEMINI_API_KEY"
    exit 1
}

$env:PYTHONPATH = $PSScriptRoot
.\.venv\Scripts\python.exe -m src.generate --batch
.\.venv\Scripts\python.exe -m src.evaluate
Write-Host "Done. See results/evaluation_report.json and docs/final_report.md"
