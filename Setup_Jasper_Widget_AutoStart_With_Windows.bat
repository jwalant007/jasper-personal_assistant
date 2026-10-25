@echo off
title J.A.S.P.E.R. - ENABLE AUTO-START WITH WINDOWS
cls
echo ===============================================================================
echo     ⚙️ CONFIGURE J.A.S.P.E.R. WIDGET FOR WINDOWS STARTUP ⚙️
echo ===============================================================================
echo.

set "TARGET_BAT=%~dp0Launch_AlwaysOn_Jasper_Widget.bat"
set "SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Jasper_Widget.lnk"

echo Creating Windows startup shortcut at:
echo %SHORTCUT_PATH%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_BAT%'; $s.WorkingDirectory = '%~dp0'; $s.WindowStyle = 7; $s.Description = 'JASPER Always-On Floating Desktop Widget'; $s.Save()"

if %errorlevel% equ 0 (
    echo [SUCCESS] J.A.S.P.E.R. Widget is now configured to start with Windows!
    echo Every time you turn on your laptop, the floating JASPER Widget Orb will appear
    echo automatically on your desktop, even without opening Jasper or a browser.
) else (
    echo [ERROR] Failed to create startup shortcut.
)

echo.
pause
