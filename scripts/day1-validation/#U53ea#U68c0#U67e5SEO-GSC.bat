@echo off
chcp 65001 >nul
title MemePhoto AI Day 1 - SEO
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-day1-check.ps1" -Module SEO
if errorlevel 1 pause
