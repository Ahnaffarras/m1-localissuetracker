#!/bin/sh
set -e

echo "=== Starting Local Issue Tracker ==="
echo "Starting Express.js backend on port 3000..."

# Jalankan Express.js di background pada port 3000
node /app/backend/server.js &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 2

# Check if backend is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "ERROR: Backend failed to start!"
    exit 1
fi

echo "Backend is running. Starting Nginx..."

# Jalankan Nginx di foreground (jadi PID 1 process utama container)
nginx -g "daemon off;"