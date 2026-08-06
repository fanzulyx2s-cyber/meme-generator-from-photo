@echo off
chcp 65001 >nul
title MemePhoto AI Day 1 - 安装运行环境
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0安装运行环境.ps1"
if errorlevel 1 (
  echo.
  echo 安装失败，请查看上方错误。
  pause
)
