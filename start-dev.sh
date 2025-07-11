#!/bin/bash

# AI補助金申請システム - 開発環境起動スクリプト
# 認証無効化・開発モードで起動

echo "🚀 AI補助金申請システム - 開発環境を起動中..."
echo ""

# 環境変数を設定
export NODE_ENV=development
export DISABLE_AUTH=true

# .env.developmentをコピー
if [ -f ".env.development" ]; then
    cp .env.development .env
    echo "✅ 開発用環境変数を設定しました"
fi

if [ -f "frontend/.env.development" ]; then
    cp frontend/.env.development frontend/.env.local
    echo "✅ フロントエンド開発用環境変数を設定しました"
fi

if [ -f "backend/.env.development" ]; then
    cp backend/.env.development backend/.env
    echo "✅ バックエンド開発用環境変数を設定しました"
fi

echo ""
echo "🔓 認証無効化モードで起動します"
echo "📧 テストユーザー: dev@ai-subsidy.test" 
echo "🚀 ログイン画面をスキップして直接ダッシュボードへアクセスします"
echo ""

# データベースとRedisを起動
echo "🐳 Docker サービスを起動中..."
docker-compose -f docker-compose.dev.yml up -d postgres redis

echo ""
echo "⏳ データベース接続を待機中..."
sleep 5

# バックエンドを起動
echo "⚙️ バックエンドサーバーを起動中... (ポート7001)"
cd backend

# Prismaクライアント生成
echo "🔨 Prismaクライアントを生成中..."
npx prisma generate

# データベースマイグレーション
echo "🗄️ データベースマイグレーションを実行中..."
npx prisma migrate dev --name init --skip-seed

# 開発サーバー起動
echo "🖥️ バックエンドサーバーを起動..."
npm run dev &
BACKEND_PID=$!

cd ..

# フロントエンドを起動
echo "🎨 フロントエンドサーバーを起動中... (ポート7002)"
cd frontend

echo "🌐 フロントエンドサーバーを起動..."
npm run dev -- -p 7002 &
FRONTEND_PID=$!

cd ..

# 起動完了メッセージ
echo ""
echo "🎉 開発環境が起動しました！"
echo ""
echo "📍 アクセス情報:"
echo "   🌐 フロントエンド: http://localhost:7002"
echo "   ⚙️ バックエンドAPI: http://localhost:7001"
echo "   🔓 認証: 無効化（自動ログイン）"
echo ""
echo "🔧 開発ツール:"
echo "   - AI文章支援テスト: http://localhost:7002/test-ai"
echo "   - 開発用API: http://localhost:7001/api/dev-auth/auto-login"
echo ""
echo "🛑 停止方法: Ctrl+C"
echo ""

# プロセス管理
trap "echo '🛑 サーバーを停止中...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# フォアグラウンドで実行
wait