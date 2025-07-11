#!/bin/bash

# ログ表示スクリプト
set -e

SERVICE=$1
LINES=${2:-100}

show_help() {
    echo "Usage: $0 [service] [lines]"
    echo ""
    echo "Services:"
    echo "  postgres   - PostgreSQL database logs"
    echo "  redis      - Redis cache logs"  
    echo "  minio      - MinIO object storage logs"
    echo "  backend    - Backend application logs"
    echo "  frontend   - Frontend application logs"
    echo "  all        - All Docker services logs"
    echo ""
    echo "Examples:"
    echo "  $0 postgres           - Show last 100 lines of PostgreSQL logs"
    echo "  $0 backend 50         - Show last 50 lines of backend logs"
    echo "  $0 all                - Show all services logs"
}

case $SERVICE in
    "postgres")
        echo "📊 PostgreSQL Logs (last $LINES lines):"
        docker-compose -f docker-compose.dev.yml logs --tail=$LINES postgres
        ;;
    "redis")
        echo "🔄 Redis Logs (last $LINES lines):"
        docker-compose -f docker-compose.dev.yml logs --tail=$LINES redis
        ;;
    "minio")
        echo "📦 MinIO Logs (last $LINES lines):"
        docker-compose -f docker-compose.dev.yml logs --tail=$LINES minio
        ;;
    "backend")
        echo "⚙️ Backend Logs (last $LINES lines):"
        if [ -f backend/backend.log ]; then
            tail -n $LINES backend/backend.log
        else
            echo "❌ Backend log file not found. Make sure backend is running."
        fi
        ;;
    "frontend")
        echo "🎨 Frontend Logs (last $LINES lines):"
        if [ -f frontend/frontend.log ]; then
            tail -n $LINES frontend/frontend.log
        else
            echo "❌ Frontend log file not found. Make sure frontend is running."
        fi
        ;;
    "all")
        echo "📋 All Services Logs (last $LINES lines each):"
        docker-compose -f docker-compose.dev.yml logs --tail=$LINES
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    "")
        show_help
        ;;
    *)
        echo "❌ Unknown service: $SERVICE"
        show_help
        exit 1
        ;;
esac