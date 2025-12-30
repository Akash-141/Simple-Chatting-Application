# Socket Chat Application - Quick Start Guide

## ✅ Easy Start (Recommended)

**Just double-click `START_CHAT.bat`** 

This will:
- Start both TCP and UDP WebSocket servers automatically
- Open the chat application in your browser
- Keep the servers running in the background
- Press any key in the console window to stop all servers

---

## 🔧 Manual Start (Alternative)

If you prefer to start servers manually:

### 1. Start the servers:

**Option A - Using PowerShell:**
```powershell
# Terminal 1 - TCP Server
cd "C:\Users\akash\Desktop\Networks sessional\Swarna mam"
& "C:\Users\akash\Desktop\Networks sessional\.venv\Scripts\python.exe" websocket_tcp_server.py

# Terminal 2 - UDP Server  
cd "C:\Users\akash\Desktop\Networks sessional\Swarna mam"
& "C:\Users\akash\Desktop\Networks sessional\.venv\Scripts\python.exe" websocket_udp_server.py
```

**Option B - Using Command Prompt:**
```cmd
REM Terminal 1 - TCP Server
cd "C:\Users\akash\Desktop\Networks sessional\Swarna mam"
"C:\Users\akash\Desktop\Networks sessional\.venv\Scripts\python.exe" websocket_tcp_server.py

REM Terminal 2 - UDP Server
cd "C:\Users\akash\Desktop\Networks sessional\Swarna mam"
"C:\Users\akash\Desktop\Networks sessional\.venv\Scripts\python.exe" websocket_udp_server.py
```

### 2. Open the application:
- Double-click `index.html` or
- Right-click → Open with → Browser

---

## 📝 Files Overview

- **START_CHAT.bat** - One-click launcher (EASIEST METHOD)
- **index.html** - Web interface
- **app.js** - Client-side JavaScript
- **styles.css** - Styling
- **websocket_tcp_server.py** - TCP server (port 8765)
- **websocket_udp_server.py** - UDP server (port 8766)

---

## 🎯 Usage

1. Select connection type (TCP or UDP)
2. Click "Start Chat (Connect Both)"
3. Type in either Server or Client side and press Enter
4. Wait for reply before sending another message from the same side
5. UDP has a 1000 character limit per message

---

## 🛑 Stopping the Application

- **If using START_CHAT.bat:** Press any key in the console window
- **If started manually:** Press Ctrl+C in each terminal window

---

## ⚠️ Troubleshooting

**Problem:** Connection errors appear  
**Solution:** Make sure both servers are running (use START_CHAT.bat)

**Problem:** Page shows "disconnected"  
**Solution:** Refresh the page after servers are running

**Problem:** Port already in use  
**Solution:** Close any existing Python processes:
```powershell
Get-Process python | Stop-Process -Force
```

Then restart using START_CHAT.bat
