#!/bin/bash start-dev.sh

# Castly Development Startup Script
# This script starts both the Socket.io server and React dev server

echo "🎬 Starting Castly Development Environment..."
echo ""

# Check if node_modules exist in server
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

# Check if node_modules exist in react-app
if [ ! -d "react-app/node_modules" ]; then
    echo "📦 Installing React app dependencies..."
    cd react-app && npm install && cd ..
fi

echo ""
echo "✅ Dependencies installed"
echo ""
echo "🚀 Starting servers..."
echo ""
echo "📡 Socket.io Server: http://localhost:3001"
echo "🌐 React App: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both servers in parallel
# The & runs the command in background
# trap ensures both processes are killed when script exits
trap 'kill $(jobs -p)' EXIT

cd server && npm start &
cd react-app && npm run dev &

# Wait for all background processes
wait
