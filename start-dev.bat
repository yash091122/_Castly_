@echo off
REM Castly Development Startup Script for Windows
REM This script starts both the Socket.io server and React dev server

echo 🎬 Starting Castly Development Environment...
echo.

REM Check if node_modules exist in server
if not exist "server\node_modules" (
    echo 📦 Installing server dependencies...
    cd server
    call npm install
    cd ..
)

REM Check if node_modules exist in react-app
if not exist "react-app\node_modules" (
    echo 📦 Installing React app dependencies...
    cd react-app
    call npm install
    cd ..
)

echo.
echo ✅ Dependencies installed
echo.
echo 🚀 Starting servers...
echo.
echo 📡 Socket.io Server: http://localhost:3001
echo 🌐 React App: http://localhost:5173
echo.
echo Press Ctrl+C to stop all servers
echo.

REM Start both servers in separate windows
start "Socket.io Server" cmd /k "cd server && npm start"
start "React Dev Server" cmd /k "cd react-app && npm run dev"

echo.
echo ✅ Servers started in separate windows
echo You can close this window now
pause
