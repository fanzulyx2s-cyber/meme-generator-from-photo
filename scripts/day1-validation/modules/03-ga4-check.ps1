param(
  [Parameter(Mandatory=$true)]
  [string]$ConfigPath,
  [Parameter(Mandatory=$true)]
  [string]$OutputDir
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$env:DAY1_CONFIG_PATH = $ConfigPath
$env:DAY1_OUTPUT_DIR = $OutputDir

Push-Location $Root
try {
  node "scripts/ga4-check.mjs"
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
