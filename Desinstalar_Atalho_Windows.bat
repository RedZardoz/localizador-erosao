@echo off
chcp 65001 > nul
title Desinstalador de Atalhos - Localizador de Erosao Laminar

echo ===============================================================================
echo     DESINSTALADOR DE ATALHOS - LOCALIZADOR DE EROSAO LAMINAR
echo ===============================================================================
echo.

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\uninstall_shortcut.ps1"

echo.
pause
