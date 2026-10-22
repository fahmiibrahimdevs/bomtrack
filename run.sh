#!/bin/bash
# ==============================================================================
# BOMTrack Control Script (bomtrack.test)
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

ACTION="${1:-status}"

case "$ACTION" in
  start)
    echo "🚀 Starting BOMTrack service..."
    echo "31750321" | sudo -S systemctl start bomtrack.service
    echo "✅ BOMTrack is running at http://bomtrack.test"
    ;;
  stop)
    echo "🛑 Stopping BOMTrack service..."
    echo "31750321" | sudo -S systemctl stop bomtrack.service
    echo "✅ BOMTrack stopped."
    ;;
  restart)
    echo "🔄 Restarting BOMTrack service..."
    echo "31750321" | sudo -S systemctl restart bomtrack.service
    echo "✅ BOMTrack restarted at http://bomtrack.test"
    ;;
  status)
    systemctl status bomtrack.service --no-pager
    ;;
  build)
    echo "🔨 Rebuilding frontend..."
    cd frontend && /home/midpc/.bun/bin/bun run build && cd ..
    echo "31750321" | sudo -S systemctl restart bomtrack.service
    echo "✅ Rebuild complete and service restarted!"
    ;;
  dev)
    echo "⚡ Starting frontend in Vite dev mode (hot reload)..."
    cd frontend && /home/midpc/.bun/bin/bun run dev
    ;;
  *)
    echo "Usage: ./run.sh {start|stop|restart|status|build|dev}"
    exit 1
    ;;
esac
