#!/bin/bash

# AI補助金申請システム - ステータス確認
# 使用方法: ./status.sh

echo "📊 AI補助金申請システム ステータス"
echo "=================================="
echo ""

# プロジェクトディレクトリに移動
cd "$(dirname "$0")"

# ポート確認
echo "🔌 ポート使用状況:"
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   ✅ ポート3000: フロントエンド実行中"
else
    echo "   ❌ ポート3000: 停止中"
fi

if lsof -ti:3001 > /dev/null 2>&1; then
    echo "   ✅ ポート3001: バックエンド実行中"
else
    echo "   ❌ ポート3001: 停止中"
fi

echo ""

# API確認
echo "🔧 API確認:"
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "   ✅ バックエンドAPI: 正常"
    # API詳細取得
    API_INFO=$(curl -s http://localhost:3001/api/health | grep -o '"registeredUsers":[0-9]*' | cut -d':' -f2)
    echo "   📊 登録ユーザー数: ${API_INFO:-0}"
else
    echo "   ❌ バックエンドAPI: 停止中"
fi

echo ""

# フロントエンド確認
echo "🎨 フロントエンド確認:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ フロントエンド: 正常"
else
    echo "   ❌ フロントエンド: 停止中"
fi

echo ""

# ログファイル確認
echo "📋 ログファイル:"
if [ -f backend.log ]; then
    BACKEND_LINES=$(wc -l < backend.log)
    echo "   📄 backend.log: ${BACKEND_LINES}行"
else
    echo "   📄 backend.log: なし"
fi

if [ -f frontend.log ]; then
    FRONTEND_LINES=$(wc -l < frontend.log)
    echo "   📄 frontend.log: ${FRONTEND_LINES}行"
else
    echo "   📄 frontend.log: なし"
fi

echo ""

# アクセス情報
if lsof -ti:3000 > /dev/null 2>&1 && lsof -ti:3001 > /dev/null 2>&1; then
    echo "🎉 システム稼働中！"
    echo "   🌐 フロントエンド: http://localhost:3000"
    echo "   🔧 バックエンドAPI: http://localhost:3001"
    echo "   🧪 テストアカウント: test@ai-subsidy.com / Test123!@#"
else
    echo "🛑 システム停止中"
    echo "   🚀 起動方法: ./start.sh"
fi

echo ""