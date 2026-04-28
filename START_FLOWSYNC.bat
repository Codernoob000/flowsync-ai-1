@echo off
title FlowSync AI - Launcher
color 0A

echo.
echo  ============================================================
echo   FLOWSYNC AI - STARTING ALL SERVICES
echo  ============================================================
echo.

REM ── Kill any processes on port 8000 and 3000 ──
echo  [1/4] Clearing ports 8000 and 3000...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R ":8000 " 2^>nul') do (
    if not "%%P"=="0" taskkill /PID %%P /F >nul 2>&1
)
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R ":3000 " 2^>nul') do (
    if not "%%P"=="0" taskkill /PID %%P /F >nul 2>&1
)
timeout /t 2 >nul

REM ── Start Backend ──
echo  [2/4] Starting FastAPI Backend on http://localhost:8000 ...
start "FlowSync Backend" cmd /k "cd /d "%~dp0flowsync-ai-1\backend" && uvicorn app.main:app --host 0.0.0.0 --port 8000"
timeout /t 5 >nul

REM ── Start Frontend ──
echo  [3/4] Starting Frontend on http://localhost:3000 ...
start "FlowSync Frontend" cmd /k "cd /d "%~dp0frontend" && npx http-server -p 3000 -c-1"
timeout /t 3 >nul

REM ── Open in Chrome ──
echo  [4/4] Opening Chrome...
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "http://localhost:3000"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "http://localhost:3000"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" "http://localhost:3000"
) else (
    echo  Chrome not found - opening default browser instead
    start "" "http://localhost:3000"
)

echo.
echo  ============================================================
echo   FLOWSYNC AI IS RUNNING!
echo.
echo   Backend  :  http://localhost:8000
echo   Frontend :  http://localhost:3000
echo   API Docs :  http://localhost:8000/docs
echo.
echo   Close the two terminal windows to stop FlowSync AI.
echo  ============================================================
echo.
pause
