@echo off
chcp 65001 >nul
title MemePhoto AI Day 1 - Product
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-day1-check.ps1" -Module Product
if errorlevel 1 pause
