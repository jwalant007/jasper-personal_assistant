@echo off
title STOP J.A.S.P.E.R. DESKTOP WIDGET
cls
echo Stopping J.A.S.P.E.R. background desktop widget...
taskkill /F /IM electron.exe >nul 2>nul
echo [SUCCESS] J.A.S.P.E.R. Desktop Widget stopped.
timeout /t 2 >nul
exit /b 0
