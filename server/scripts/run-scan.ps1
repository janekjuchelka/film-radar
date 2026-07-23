# Jednorázový denní scan Film Radar (pro Windows Task Scheduler)
$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Set-Location $PSScriptRoot\..
npx tsx src/run-scan.ts
