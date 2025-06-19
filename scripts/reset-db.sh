#!/bin/bash

# データベースリセットスクリプト
set -e

echo "🗄️ Resetting database..."

# 確認プロンプト
read -p "⚠️  This will delete all data. Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Database reset cancelled."
    exit 1
fi

# PostgreSQLコンテナを停止・削除
echo "🛑 Stopping PostgreSQL container..."
docker-compose -f docker-compose.dev.yml stop postgres
docker-compose -f docker-compose.dev.yml rm -f postgres

# ボリュームを削除
echo "🗑️ Removing database volume..."
docker volume rm ai-subsidy-system_postgres_data 2>/dev/null || true

# PostgreSQLを再起動
echo "▶️ Starting PostgreSQL..."
docker-compose -f docker-compose.dev.yml up -d postgres

# PostgreSQLの準備完了を待機
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=60
while ! docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -eq 0 ]; then
        echo "❌ PostgreSQL failed to start"
        exit 1
    fi
    sleep 1
done

# マイグレーション実行
echo "🔄 Running database migrations..."
cd backend
npx prisma migrate dev --name reset
npx prisma db seed
cd ..

echo "✅ Database reset completed successfully!"
echo "🌱 Seed data has been inserted."