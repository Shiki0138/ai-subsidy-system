#!/bin/bash

# AI補助金申請システム - 停止スクリプト
# 使用方法: ./stop.sh

echo "🛑 AI補助金申請システム停止中..."

# プロジェクトディレクトリに移動
cd "$(dirname "$0")"

# PIDファイルから停止
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo "   ✅ バックエンド停止 (PID: $BACKEND_PID)"
    rm .backend.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo "   ✅ フロントエンド停止 (PID: $FRONTEND_PID)"
    rm .frontend.pid
fi

# ポート強制停止
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "   ✅ ポート3000クリア"
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "   ✅ ポート3001クリア"

# ログファイル削除
rm -f backend.log frontend.log

echo ""
echo "✅ 停止完了！"
echo "🚀 再開方法: ./start.sh"