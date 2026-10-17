@echo off
title JWALANT BHATT CREATION - DUAL OS BOOT SELECTOR
color 0B
cls
echo ===============================================================================
echo        ⚡ JWALANT BHATT CREATION - DUAL OS BOOT SELECTOR ⚡
echo ===============================================================================
echo.
echo    [1] Launch JASPER OS (Full Screen Standalone AI OS)
echo    [2] Continue to Standard Windows 11 Desktop
echo    [3] Launch Local Assistant Core (Server + Vite Dashboard)
echo    [4] Launch Telephony & AI Receptionist Hub
echo.
echo ===============================================================================
echo Choice will auto-select [2] Windows 11 Desktop in 5 seconds...
echo.

choice /c 1234 /t 5 /d 2 /m "Select Operating System Environment:"

if errorlevel 4 goto TELEPHONY_HUB
if errorlevel 3 goto LOCAL_CORE
if errorlevel 2 goto WINDOWS_DESKTOP
if errorlevel 1 goto JASPER_OS

:JASPER_OS
cls
echo.
echo [SYSTEM] Booting JASPER OS Standalone Environment...
cd /d "%~dp0"
if exist "%~dp0JASPER_STANDALONE_OS.bat" (
    call "%~dp0JASPER_STANDALONE_OS.bat"
    exit
)
start "" "https://jasper-personal-assistant.onrender.com"
exit

:LOCAL_CORE
cls
echo.
echo [SYSTEM] Starting Local J.A.S.P.E.R. Core...
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
