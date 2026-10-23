@echo off
title JWALANT BHATT CREATION - DUAL OS BOOT SELECTOR
color 0B
cls
echo ===============================================================================
echo        ⚡ JWALANT BHATT CREATION - DUAL OS BOOT SELECTOR ⚡
echo ===============================================================================
echo.
echo    [1] Launch Always-On Desktop Assistant (Floating Bar + Tray + Wake-Word)
echo    [2] Launch Standalone JASPER OS (Full Screen Kiosk Shell)
echo    [3] Continue to Standard Windows Desktop
echo    [4] Launch Local Assistant Core (Server + Vite Dashboard)
echo    [5] Launch Telephony & AI Receptionist Hub
echo.
echo ===============================================================================
echo Choice will auto-select [3] Windows Desktop in 6 seconds...
echo.

choice /c 12345 /t 6 /d 3 /m "Select Operating System Environment:"

if errorlevel 5 goto TELEPHONY_HUB
if errorlevel 4 goto LOCAL_CORE
if errorlevel 3 goto WINDOWS_DESKTOP
if errorlevel 2 goto KIOSK_OS
if errorlevel 1 goto DESKTOP_ASSISTANT

:DESKTOP_ASSISTANT
cls
echo.
echo [SYSTEM] Booting J.A.S.P.E.R. Always-On Desktop Assistant...
cd /d "%~dp0"
if exist "%LocalAppData%\Programs\jasper-assistant\JASPER Assistant.exe" (
    start "" "%LocalAppData%\Programs\jasper-assistant\JASPER Assistant.exe"
    exit
)
if exist "electron\main.js" (
    start "" npm run electron:dev
    exit
)
call "%~dp0JASPER_STANDALONE_OS.bat"
exit

:KIOSK_OS
cls
echo.
echo [SYSTEM] Booting Standalone JASPER OS Kiosk Shell...
cd /d "%~dp0"
call "%~dp0JASPER_STANDALONE_OS.bat"
exit

:LOCAL_CORE
cls
echo.
echo [SYSTEM] Starting Local J.A.S.P.E.R. Core Services...
cd /d "%~dp0"
call "%~dp0start-jasper.bat"
exit

:TELEPHONY_HUB
cls
echo.
echo [SYSTEM] Opening Telephony & AI Receptionist Hub...
cd /d "%~dp0"
call "%~dp0Launch_Telephony_Hub.bat"
exit

:WINDOWS_DESKTOP
cls
echo.
echo [SYSTEM] Continuing to Windows Desktop...
exit
