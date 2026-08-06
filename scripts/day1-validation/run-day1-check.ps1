param(
  [ValidateSet("All","Product","SEO","GA4")]
  [string]$Module = "All",
  [string]$ConfigPath = "",
  [switch]$SkipInstall,
  [switch]$NoOpenReport
)

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Root = $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
  $ConfigPath = Join-Path $Root "config.json"
}
$ConfigPath = [System.IO.Path]::GetFullPath($ConfigPath)

if (-not (Test-Path -LiteralPath $ConfigPath)) {
  Write-Host "找不到配置文件：$ConfigPath" -ForegroundColor Red
  exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "没有检测到 Node.js。" -ForegroundColor Red
  exit 1
}

if (-not $SkipInstall -and -not (Test-Path -LiteralPath (Join-Path $Root "node_modules"))) {
  Write-Host "首次运行，正在准备依赖和 Chromium……" -ForegroundColor Cyan
  & (Join-Path $Root "安装运行环境.ps1")
  if ($LASTEXITCODE -ne 0) {
    Write-Host "运行环境安装失败。" -ForegroundColor Red
    exit 1
  }
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$OutputDir = Join-Path $Root "artifacts\$Timestamp"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$env:DAY1_CONFIG_PATH = $ConfigPath
$env:DAY1_OUTPUT_DIR = $OutputDir

$Modules = @()
switch ($Module) {
  "Product" { $Modules = @("01-product-check.ps1") }
  "SEO"     { $Modules = @("02-seo-check.ps1") }
  "GA4"     { $Modules = @("03-ga4-check.ps1") }
  default   { $Modules = @("01-product-check.ps1", "02-seo-check.ps1", "03-ga4-check.ps1") }
}

$Failures = @()

Write-Host ""
Write-Host "============================================" -ForegroundColor DarkCyan
Write-Host " MemePhoto AI 第1天上线验收" -ForegroundColor Cyan
Write-Host " 模块：$Module" -ForegroundColor Cyan
Write-Host " 输出：$OutputDir" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor DarkCyan

foreach ($Item in $Modules) {
  $ModulePath = Join-Path $Root "modules\$Item"
  Write-Host ""
  Write-Host "运行 $Item ……" -ForegroundColor Yellow
  & $ModulePath -ConfigPath $ConfigPath -OutputDir $OutputDir
  if ($LASTEXITCODE -ne 0) {
    $Failures += $Item
    Write-Host "$Item 存在失败项，但总流程继续。" -ForegroundColor Red
  }
  else {
    Write-Host "$Item 已完成。" -ForegroundColor Green
  }
}

Push-Location $Root
try {
  node "scripts/build-report.mjs"
}
finally {
  Pop-Location
}

$Report = Join-Path $OutputDir "REPORT.html"
Write-Host ""
Write-Host "============================================" -ForegroundColor DarkCyan
Write-Host "验收完成。" -ForegroundColor Green
Write-Host "报告：$Report" -ForegroundColor Green
if ($Failures.Count -gt 0) {
  Write-Host "存在失败模块：$($Failures -join ', ')" -ForegroundColor Red
}
Write-Host "============================================" -ForegroundColor DarkCyan

if (-not $NoOpenReport -and (Test-Path -LiteralPath $Report)) {
  Start-Process $Report
}

if ($Failures.Count -gt 0) { exit 1 } else { exit 0 }
