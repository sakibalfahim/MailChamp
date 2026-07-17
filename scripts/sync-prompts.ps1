# Sync root prompts/ → api/prompts/ for Go embed.FS
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root "prompts"
$dst = Join-Path $root "api\prompts"
Copy-Item (Join-Path $src "advanced.md") (Join-Path $dst "advanced.md") -Force
Copy-Item (Join-Path $src "naive.md") (Join-Path $dst "naive.md") -Force
Write-Host "Synced prompts to api/prompts/"
