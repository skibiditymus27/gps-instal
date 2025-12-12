#!/bin/bash
# GPS INSTAL - Start Script

# Start PostgreSQL
sudo docker start gps-postgres 2>/dev/null || true
sleep 2

# Kill any existing node servers
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "serve.*4173" 2>/dev/null || true
sleep 1

# Start backend
cd /home/skibiditymus27/Desktop/gps-instal/backend
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=gps_db
export PGUSER=gps_user
export PGPASSWORD=securepassword123
export ALLOW_ORIGINS=http://localhost:4173,http://192.168.1.26:4173

echo "Starting backend..."
node src/server.js &
BACKEND_PID=$!
sleep 2

# Start frontend
cd /home/skibiditymus27/Desktop/gps-instal/frontend
echo "Starting frontend..."
npx serve -l 4173 &
FRONTEND_PID=$!

echo ""
echo "================================"
echo "GPS INSTAL is running!"
echo "Frontend: http://localhost:4173"
echo "Backend:  http://localhost:3000"
echo "Admin:    http://localhost:4173/admin.html"
echo "================================"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
