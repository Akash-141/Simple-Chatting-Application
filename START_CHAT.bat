@echo off
echo Starting Socket Chat Application...
echo.

REM Change to the correct directory
cd /d "%~dp0"

REM Kill any existing Python processes (optional - uncomment if needed)
REM taskkill /F /IM python.exe 2>nul

echo Starting TCP WebSocket Server (port 8765)...
start "TCP Server" cmd /k "C:\Users\akash\Desktop\Networks sessional\.venv\Scripts\python.exe" websocket_tcp_server.py

echo Starting UDP WebSocket Server (port 8766)...
start "UDP Server" cmd /k "C:\Users\akash\Desktop\Networks sessional\.venv\Scripts\python.exe" websocket_udp_server.py

echo Waiting for servers to start...
timeout /t 3 /nobreak >nul

echo Opening Chat Application in browser...
start "" "index.html"

echo.
echo ========================================
echo Both servers are running!
echo TCP Server: ws://localhost:8765
echo UDP Server: ws://localhost:8766
echo ========================================
echo.
echo Press any key to stop all servers...
pause >nul

REM Stop the servers when user presses a key
taskkill /F /FI "WINDOWTITLE eq TCP Server*" 2>nul
taskkill /F /FI "WINDOWTITLE eq UDP Server*" 2>nul

echo Servers stopped.
