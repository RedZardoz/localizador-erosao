@echo off
title Localizador de Erosão 2D/3D - Mestrado PPGTCA
chcp 65001 >nul
cls
echo =======================================================================
echo   SISTEMA DE LOCALIZACAO E TRIAGEM DE EROSAO 2D/3D - PARANA E BRASIL
echo   Mestrado PPGTCA • Pesquisa em Erosao Laminar e Conservacao de Solos
echo =======================================================================
echo.
echo [1/3] Acessando diretorio do projeto...
cd /d "%~dp0"

echo [2/3] Abrindo o navegador em http://localhost:3000 em 3 segundos...
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

echo [3/3] Iniciando o servidor Next.js...
echo.
echo Para encerrar a aplicacao, basta fechar esta janela.
echo =======================================================================
echo.

npm run dev
pause
