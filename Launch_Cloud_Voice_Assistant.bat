@echo off
title J.A.S.P.E.R. CLOUD VOICE ASSISTANT - JWALANT BHATT
cls
echo ===============================================================================
echo     ⚡ J.A.S.P.E.R. CLOUD VOICE ASSISTANT (RENDER 24/7 HOSTED) ⚡
echo ===============================================================================
echo Connecting to: https://jasper-personal-assistant.onrender.com ...
echo.

set "TARGET_URL=https://jasper-personal-assistant.onrender.com/?mode=mobile_assistant&auto_wake=true"

:: 1. Launch via Google Chrome in compact app-window mode
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%TARGET_URL%" --window-size=460,780
    exit
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%TARGET_URL%" --window-size=460,780
    exit
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="%TARGET_URL%" --window-size=460,780
    exit
)

:: 2. Launch via Microsoft Edge in compact app-window mode
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%TARGET_URL%" --window-size=460,780
    exit
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%TARGET_URL%" --window-size=460,780
    exit
)

:: 3. Launch via Chrome or Edge in PATH
where chrome >nul 2>nul && (
    start "" chrome --app="%TARGET_URL%" --window-size=460,780
    exit
)
where msedge >nul 2>nul && (
    start "" msedge --app="%TARGET_URL%" --window-size=460,780
    exit
)

:: 4. Fallback to default browser
start "" "%TARGET_URL%"
exit
