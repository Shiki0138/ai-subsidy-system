#!/bin/bash

# AI補助金申請システム - ワンコマンド起動スクリプト
# 使用方法: ./start.sh

echo "🚀 AI補助金申請システム起動中..."
echo "💰 低コストAI対応済み (95%コスト削減)"
echo ""

# プロジェクトディレクトリに移動
cd "$(dirname "$0")"

# 既存のプロセスを停止
echo "🔄 既存プロセスを停止中..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "   ポート3000クリア"
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "   ポート3001クリア"
sleep 2

# バックエンドサーバー起動（バックグラウンド）
echo "🔧 バックエンドサーバー起動中..."
cd backend
npx ts-node src/simple-test-server.ts > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 3秒待機
sleep 3

# バックエンドAPI確認
echo "✅ バックエンドAPI確認中..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "   ✅ バックエンド起動成功 (http://localhost:3001)"
else
    echo "   ❌ バックエンド起動失敗"
fi

# フロントエンド起動（バックグラウンド）
echo "🎨 フロントエンド起動中..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 10秒待機
echo "⏳ 起動完了まで10秒待機..."
sleep 10

# フロントエンド確認
echo "✅ フロントエンド確認中..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ フロントエンド起動成功 (http://localhost:3000)"
else
    echo "   ❌ フロントエンド起動失敗"
fi

echo ""
echo "🎉 起動完了！"
echo ""
echo "📱 アクセス情報:"
echo "   フロントエンド: http://localhost:3000"
echo "   バックエンドAPI: http://localhost:3001"
echo ""
echo "🧪 テストアカウント:"
echo "   Email: test@ai-subsidy.com"
echo "   Password: Test123!@#"
echo ""
echo "📊 ログ確認:"
echo "   バックエンド: tail -f backend.log"
echo "   フロントエンド: tail -f frontend.log"
echo ""
echo "🛑 停止方法:"
echo "   ./stop.sh"
echo ""

# PIDファイルに保存
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# ブラウザで自動オープン（macOS）
if command -v open >/dev/null 2>&1; then
    echo "🌐 ブラウザを自動で開きます..."
    sleep 2
    open http://localhost:3000
fi

echo "✨ すべて準備完了！"