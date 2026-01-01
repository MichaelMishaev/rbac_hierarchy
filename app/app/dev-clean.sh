#!/bin/bash

# Kill all processes on port 3200
echo "🔍 Checking for processes on port 3200..."
PIDS=$(lsof -ti:3200)

if [ -z "$PIDS" ]; then
  echo "✅ Port 3200 is free"
else
  echo "🔪 Killing processes on port 3200: $PIDS"
  lsof -ti:3200 | xargs kill -9
  echo "✅ Port 3200 cleared"
fi

# Kill any stray Next.js build processes
echo "🔍 Checking for stray Next.js processes..."
NEXT_PIDS=$(ps aux | grep -E "next build|next-server|next dev" | grep -v grep | awk '{print $2}')

if [ -n "$NEXT_PIDS" ]; then
  echo "🔪 Killing stray Next.js processes: $NEXT_PIDS"
  echo "$NEXT_PIDS" | xargs kill -9 2>/dev/null
  echo "✅ Stray processes cleaned"
fi

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
if [ -d ".next" ]; then
  chmod -R 777 .next 2>/dev/null
  rm -rf .next
  echo "✅ .next cache cleared"
else
  echo "✅ No .next cache found"
fi

# Wait a moment for processes to fully terminate
sleep 1

# Start dev server
echo "🚀 Starting dev server on port 3200..."
npm run dev
