#!/bin/bash

# AI補助金申請システム - テストUI起動スクリプト
# ポート7000番台でフロントエンド・バックエンドを起動

echo "🚀 AI補助金申請システム - テストUI環境を起動中..."
echo ""

# 現在の作業ディレクトリを保存
CURRENT_DIR=$(pwd)

# プロセスIDを保存するためのファイル
PID_FILE="$CURRENT_DIR/.test-pids"

# 既存のプロセスを終了
if [ -f "$PID_FILE" ]; then
    echo "📝 既存のプロセスを確認中..."
    while read pid; do
        if ps -p $pid > /dev/null 2>&1; then
            echo "🛑 プロセス $pid を終了中..."
            kill $pid 2>/dev/null || true
        fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
    sleep 2
fi

# 必要なディレクトリの存在確認
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ frontend または backend ディレクトリが見つかりません"
    echo "   このスクリプトはプロジェクトルートで実行してください"
    exit 1
fi

# Docker Compose で必要なサービスを起動（PostgreSQL, Redis等）
echo "🐳 データベース・Redis サービスを起動中..."
if command -v docker-compose &> /dev/null; then
    docker-compose -f docker-compose.dev.yml up -d postgres redis
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    docker compose -f docker-compose.dev.yml up -d postgres redis
else
    echo "⚠️  Docker/Docker Compose が見つかりません"
    echo "   手動でPostgreSQL (localhost:5432) と Redis (localhost:6379) を起動してください"
fi

echo ""
echo "⏳ データベース接続を待機中..."
sleep 5

# バックエンドを起動 (ポート7001)
echo "⚙️ バックエンドサーバーを起動中... (ポート7001)"
cd backend

# 依存関係のインストール確認
if [ ! -d "node_modules" ]; then
    echo "📦 バックエンドの依存関係をインストール中..."
    npm install
fi

# TypeScript のビルド
echo "🔨 TypeScript をビルド中..."
npm run build 2>/dev/null || npx tsc --skipLibCheck 2>/dev/null || echo "⚠️ TypeScript ビルドに問題がありました（無視して続行）"

# データベースのマイグレーション
echo "🗄️ データベースマイグレーションを実行中..."
npx prisma migrate dev --name initial 2>/dev/null || npx prisma db push 2>/dev/null || echo "⚠️ マイグレーションに問題がありました"

# シードデータの投入
echo "🌱 シードデータを投入中..."
npx prisma db seed 2>/dev/null || echo "⚠️ シードデータの投入をスキップしました"

# バックエンドサーバーを起動
echo "🖥️ バックエンドサーバーを起動..."
PORT=7001 NODE_ENV=development npm run dev &
BACKEND_PID=$!
echo $BACKEND_PID >> "$CURRENT_DIR/$PID_FILE"

cd "$CURRENT_DIR"

# フロントエンドを起動 (ポート7000)
echo "🎨 フロントエンドサーバーを起動中... (ポート7000)"
cd frontend

# 依存関係のインストール確認
if [ ! -d "node_modules" ]; then
    echo "📦 フロントエンドの依存関係をインストール中..."
    npm install
fi

# Next.js の設定確認
if [ ! -f ".next/package.json" ]; then
    echo "🔨 Next.js をビルド中..."
    npm run build 2>/dev/null || echo "⚠️ Next.js ビルドに問題がありました（開発サーバーで起動）"
fi

# フロントエンドサーバーを起動
echo "🌐 フロントエンドサーバーを起動..."
NEXT_PUBLIC_API_URL=http://localhost:7001 npm run dev &
FRONTEND_PID=$!
echo $FRONTEND_PID >> "$CURRENT_DIR/$PID_FILE"

cd "$CURRENT_DIR"

# 起動完了を待機
echo ""
echo "⏳ サーバー起動を待機中..."
sleep 10

# ヘルスチェック
echo "🔍 サーバー状態を確認中..."

# バックエンドのヘルスチェック
if curl -f http://localhost:7001/api/health >/dev/null 2>&1; then
    echo "✅ バックエンドサーバー: 正常稼働中 (http://localhost:7001)"
else
    echo "⚠️ バックエンドサーバー: 起動中または接続エラー"
fi

# フロントエンドのヘルスチェック
if curl -f http://localhost:7000 >/dev/null 2>&1; then
    echo "✅ フロントエンドサーバー: 正常稼働中 (http://localhost:7000)"
else
    echo "⚠️ フロントエンドサーバー: 起動中または接続エラー"
fi

# 成功メッセージ
echo ""
echo "🎉 AI補助金申請システム - テストUI環境が起動しました！"
echo ""
echo "📍 アクセス情報:"
echo "   🌐 フロントエンド:  http://localhost:7000"
echo "   ⚙️ バックエンド API: http://localhost:7001"
echo "   📖 API ドキュメント:  http://localhost:7001/api-docs (準備中)"
echo ""
echo "🔧 開発ツール:"
echo "   📊 データベース: PostgreSQL (localhost:5432)"
echo "   🗄️ Redis: localhost:6379"
echo ""
echo "👤 テストアカウント:"
echo "   📧 メール: test@ai-subsidy.com"
echo "   🔑 パスワード: Test123!@#"
echo ""
echo "📝 ログ確認:"
echo "   tail -f backend/logs/combined.log  # バックエンドログ"
echo "   docker-compose -f docker-compose.dev.yml logs -f  # インフラログ"
echo ""
echo "🛑 停止方法:"
echo "   ./stop-test-ui.sh  # または Ctrl+C"
echo ""

# トラップでCtrl+Cが押された時の処理
cleanup() {
    echo ""
    echo "🛑 サーバーを停止中..."
    
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            if ps -p $pid > /dev/null 2>&1; then
                echo "🔄 プロセス $pid を終了中..."
                kill $pid 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    
    echo "✅ 全てのサービスを停止しました"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ブラウザを自動で開く（macOSの場合）
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🌐 ブラウザを起動中..."
    sleep 3
    open http://localhost:7000
fi

# フォアグラウンドで実行し続ける
echo "💡 サーバーを停止するには Ctrl+C を押してください"
echo ""

# 無限ループでプロセスを監視
while true; do
    # プロセスが生きているかチェック
    if [ -f "$PID_FILE" ]; then
        all_running=true
        while read pid; do
            if ! ps -p $pid > /dev/null 2>&1; then
                all_running=false
                break
            fi
        done < "$PID_FILE"
        
        if [ "$all_running" = false ]; then
            echo "⚠️ 一部のプロセスが停止しました。再起動してください。"
            cleanup
        fi
    fi
    
    sleep 5
done