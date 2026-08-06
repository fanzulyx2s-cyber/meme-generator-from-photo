@echo off
chcp 65001 >nul
title MemePhoto AI 第1天上线验收
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-day1-check.ps1" -Module All
if errorlevel 1 (
  echo.
  echo 验收已完成，但报告中存在 FAIL 项。
  pause
)
