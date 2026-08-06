@echo off
chcp 65001 >nul
title MemePhoto AI Day 1 - GA4
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-day1-check.ps1" -Module GA4
if errorlevel 1 pause
