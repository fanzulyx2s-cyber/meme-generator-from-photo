param(
  [switch]$SkipBrowserInstall
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Root = $PSScriptRoot
Push-Location $Root

try {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "没有检测到 Node.js。请先安装 Node.js 20 或更高版本。"
  }

  Write-Host "Node: $(node --version)" -ForegroundColor Cyan

  $PackageManager = ""
  if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $PackageManager = "pnpm"
    Write-Host "使用 pnpm 安装依赖……" -ForegroundColor Cyan
    pnpm install
  }
  elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    $PackageManager = "npm"
    Write-Host "使用 npm 安装依赖……" -ForegroundColor Cyan
    npm install
  }
  else {
    throw "没有检测到 pnpm 或 npm。"
  }

  if ($LASTEXITCODE -ne 0) {
    throw "依赖安装失败。"
  }

  if (-not $SkipBrowserInstall) {
    Write-Host "安装或确认 Playwright Chromium……" -ForegroundColor Cyan
    if ($PackageManager -eq "pnpm") {
      pnpm exec playwright install chromium
    } else {
      npx playwright install chromium
    }
    if ($LASTEXITCODE -ne 0) {
      throw "Playwright Chromium 安装失败。"
    }
  }

  Write-Host ""
  Write-Host "运行环境准备完成。" -ForegroundColor Green
}
finally {
  Pop-Location
}
