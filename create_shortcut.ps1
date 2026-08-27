$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Localizador de Erosao Parana 3D.lnk"
$TargetFile = (Get-Item ".\Iniciar_Localizador_Erosao.bat").FullName
$WorkingDirectory = (Get-Item ".").FullName

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetFile
$Shortcut.WorkingDirectory = $WorkingDirectory
$Shortcut.Description = "Sistema de Localizacao e Triagem de Erosao 2D/3D - Mestrado PPGTCA"
$Shortcut.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,13"
$Shortcut.Save()

Write-Host "Atalho criado com sucesso na Area de Trabalho: $ShortcutPath"
