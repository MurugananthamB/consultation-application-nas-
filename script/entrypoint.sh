#!/bin/sh

echo "📌 Registering cron job..."
crontab /etc/cron.d/move-cron

echo "📌 Starting cron daemon..."
cron

echo "📌 Starting backend..."
npx nodemon ./backend/server.js &

echo "📌 Starting nginx..."
nginx -g "daemon off;"

echo " ✅ All services started successfully!"