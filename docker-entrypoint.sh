#!/bin/sh
set -e

# Jalankan Express.js di background pada port 3000
node /app/backend/server.js &

# Jalankan Nginx di foreground (jadi PID 1 process utama container)
nginx -g "daemon off;"