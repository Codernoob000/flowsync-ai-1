@echo off
title FlowSync AI - Stop
color 0C

echo.
echo  ============================================================
echo   FLOWSYNC AI - STOPPING ALL SERVICES
echo  ============================================================
echo.

echo  Stopping services on ports 8000 and 3000...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 " 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
    echo  Backend stopped (PID %%a)
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
    echo  Frontend stopped (PID %%a)
)

echo.
echo  All FlowSync AI services stopped.
echo  ============================================================
echo.
pause
