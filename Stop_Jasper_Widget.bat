@echo off
title STOP J.A.S.P.E.R. WIDGET
cls
echo Stopping JASPER Floating Desktop Widget...
taskkill /F /IM electron.exe /T 2>nul
echo [SUCCESS] JASPER Widget terminated.
exit /b 0
