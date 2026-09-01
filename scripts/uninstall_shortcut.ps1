$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$startMenuPath = [System.Environment]::GetFolderPath('StartMenu') + '\Programs'

$dShortcut = Join-Path $desktopPath "Localizador de Erosao Laminar.lnk"
$sShortcut = Join-Path $startMenuPath "Localizador de Erosao Laminar.lnk"

if (Test-Path $dShortcut) {
    Remove-Item $dShortcut -Force
    Write-Host "Atalho da Area de Trabalho removido." -ForegroundColor Yellow
}
if (Test-Path $sShortcut) {
    Remove-Item $sShortcut -Force
    Write-Host "Atalho do Menu Iniciar removido." -ForegroundColor Yellow
}

Write-Host "[SUCESSO] Atalhos removidos com sucesso." -ForegroundColor Green
