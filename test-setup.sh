#!/bin/bash

# ローカルテスト環境セットアップスクリプト

set -e

echo "🚀 AI補助金システム - ローカルテスト環境セットアップ開始"

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Docker確認
log_info "Docker環境確認中..."
if ! command -v docker &> /dev/null; then
    log_error "Dockerがインストールされていません"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Composeがインストールされていません"
    exit 1
fi

log_success "Docker環境確認完了"

# 既存コンテナ停止・削除
log_info "既存のテストコンテナを停止・削除中..."
docker-compose -f docker-compose.test.yml down --volumes 2>/dev/null || true
docker volume prune -f 2>/dev/null || true

# PostgreSQL初期化SQL作成
log_info "PostgreSQL初期化スクリプト作成中..."
mkdir -p backend/prisma
cat > backend/prisma/init.sql << 'EOF'
-- AI補助金システム テスト用データベース初期化

-- 拡張機能有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- テストデータ用の追加設定
ALTER DATABASE ai_subsidy_test SET timezone TO 'Asia/Tokyo';

-- パフォーマンス調整（テスト用）
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_min_duration_statement = 1000;

SELECT pg_reload_conf();

-- 初期化完了ログ
\echo 'PostgreSQL初期化完了 - AI補助金システムテスト環境';
EOF

log_success "PostgreSQL初期化スクリプト作成完了"

# Docker Composeでサービス起動
log_info "PostgreSQLとRedisサービス起動中..."
docker-compose -f docker-compose.test.yml up -d postgres redis

# ヘルスチェック待機
log_info "データベースサービスの起動待ち..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose -f docker-compose.test.yml exec -T postgres pg_isready -U ai_user -d ai_subsidy_test >/dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    log_error "PostgreSQLの起動がタイムアウトしました"
    docker-compose -f docker-compose.test.yml logs postgres
    exit 1
fi

log_success "PostgreSQL起動完了"

# Redis確認
log_info "Redis接続確認中..."
if docker-compose -f docker-compose.test.yml exec -T redis redis-cli -a redis_password_123 ping >/dev/null 2>&1; then
    log_success "Redis起動完了"
else
    log_error "Redisの起動に失敗しました"
    exit 1
fi

# 管理ツール起動
log_info "管理ツール起動中..."
docker-compose -f docker-compose.test.yml up -d pgadmin redis-commander

# Prismaセットアップ
log_info "Prismaセットアップ中..."
cd backend

# 環境変数設定
export NODE_ENV=test
cp .env.test .env

# 依存関係インストール
if [ ! -d "node_modules" ]; then
    log_info "Node.js依存関係インストール中..."
    npm install
fi

# Prismaクライアント生成
log_info "Prismaクライアント生成中..."
npx prisma generate

# データベースマイグレーション
log_info "データベースマイグレーション実行中..."
npx prisma db push --force-reset

# テストデータシード
log_info "テストデータ投入中..."
npx prisma db seed 2>/dev/null || log_warning "シードスクリプトが見つかりません（任意）"

cd ..

# テスト環境確認
log_info "テスト環境接続確認中..."

# PostgreSQL接続テスト
if docker-compose -f docker-compose.test.yml exec -T postgres psql -U ai_user -d ai_subsidy_test -c "SELECT version();" >/dev/null 2>&1; then
    log_success "PostgreSQL接続テスト成功"
else
    log_error "PostgreSQL接続テスト失敗"
fi

# Redis接続テスト
if docker-compose -f docker-compose.test.yml exec -T redis redis-cli -a redis_password_123 set test_key "test_value" >/dev/null 2>&1; then
    log_success "Redis接続テスト成功"
else
    log_error "Redis接続テスト失敗"
fi

# 環境情報表示
echo ""
echo "🎉 ローカルテスト環境セットアップ完了！"
echo ""
echo "📊 接続情報:"
echo "  PostgreSQL: localhost:5433"
echo "  Redis: localhost:6380"
echo "  pgAdmin: http://localhost:8080 (admin@aisubsidy.local / admin123)"
echo "  Redis Commander: http://localhost:8081 (admin / admin123)"
echo ""
echo "🔧 使用方法:"
echo "  テストサーバー起動: cd backend && npm run test:server"
echo "  環境停止: docker-compose -f docker-compose.test.yml down"
echo "  ログ確認: docker-compose -f docker-compose.test.yml logs"
echo ""
echo "📝 環境変数ファイル: backend/.env.test"
echo ""

log_success "セットアップ完了 - 開発を開始できます！"