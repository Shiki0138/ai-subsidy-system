#!/bin/bash

echo "🧪 ローカルテスト実行開始"

# 既存サーバー停止
pkill -f node 2>/dev/null || true

# バックエンドディレクトリに移動
cd backend

# テストサーバー起動（バックグラウンド）
echo "🚀 ローカルテストサーバー起動中..."
node test-local-api.js &
SERVER_PID=$!

# サーバー起動待機
sleep 3

# テスト実行
echo "🧪 統合テスト実行中..."
cd ..
node ai-pdf-test.js

# サーバー停止
echo "🛑 テストサーバー停止中..."
kill $SERVER_PID 2>/dev/null || true

echo "✅ ローカルテスト完了"
