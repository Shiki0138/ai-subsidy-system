#!/bin/bash

# AI補助金システム 開発環境セットアップスクリプト
set -e

echo "🚀 Setting up AI Subsidy development environment..."

# 必要ツールのインストールチェック
check_requirements() {
    echo "📋 Checking requirements..."
    
    command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed."; exit 1; }
    command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
    command -v git >/dev/null 2>&1 || { echo "❌ Git is required but not installed."; exit 1; }
    
    # Node.js バージョンチェック
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt "18" ]; then
        echo "❌ Node.js version 18 or higher is required. Current: $NODE_VERSION"
        exit 1
    fi
    
    echo "✅ All requirements satisfied"
}

# 環境変数設定
setup_environment() {
    echo "🔧 Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "📝 Created .env file from template"
        echo "⚠️  Please update .env with your configuration"
    fi
    
    # バックエンド環境変数
    if [ ! -f backend/.env ]; then
        cat > backend/.env << EOF
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_subsidy_dev
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=your-jwt-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here
OPENAI_API_KEY=your-openai-api-key-here
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
EOF
        echo "📝 Created backend/.env file"
    fi
    
    # フロントエンド環境変数
    if [ ! -f frontend/.env.local ]; then
        cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_NAME=AI補助金申請システム
EOF
        echo "📝 Created frontend/.env.local file"
    fi
}

# Docker環境構築
setup_docker() {
    echo "🐳 Setting up Docker environment..."
    
    # Docker Composeファイルが存在するかチェック
    if [ ! -f docker-compose.dev.yml ]; then
        echo "❌ docker-compose.dev.yml not found"
        exit 1
    fi
    
    # 既存のコンテナを停止・削除
    docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans 2>/dev/null || true
    
    # イメージビルド
    echo "🔨 Building Docker images..."
    docker-compose -f docker-compose.dev.yml build --no-cache
    
    # サービス起動
    echo "▶️ Starting services..."
    docker-compose -f docker-compose.dev.yml up -d
    
    # サービス起動待機
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    echo "✅ Docker environment ready"
}

# データベース初期化
setup_database() {
    echo "🗄️ Setting up database..."
    
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
    
    cd backend
    
    # 依存関係インストール
    echo "📦 Installing backend dependencies..."
    npm install
    
    # Prismaクライアント生成
    echo "🔧 Generating Prisma client..."
    npx prisma generate
    
    # マイグレーション実行
    echo "🔄 Running database migrations..."
    npx prisma migrate dev --name init
    
    # シードデータ投入
    echo "🌱 Seeding database..."
    npx prisma db seed
    
    cd ..
    
    echo "✅ Database initialized"
}

# フロントエンド環境
setup_frontend() {
    echo "🎨 Setting up frontend..."
    
    cd frontend
    
    # 依存関係インストール
    echo "📦 Installing frontend dependencies..."
    npm install
    
    # 型チェック
    echo "🔍 Running type check..."
    npm run type-check
    
    # ビルドテスト
    echo "🔨 Testing build..."
    npm run build
    
    cd ..
    
    echo "✅ Frontend ready"
}

# AI Engine環境
setup_ai_engine() {
    echo "🤖 Setting up AI engine..."
    
    cd ai-engine
    
    # 依存関係インストール
    echo "📦 Installing AI engine dependencies..."
    npm install
    
    # TypeScriptコンパイル
    echo "🔨 Compiling TypeScript..."
    npm run build
    
    cd ..
    
    echo "✅ AI engine ready"
}

# 開発ツール設定
setup_dev_tools() {
    echo "🛠️ Setting up development tools..."
    
    # Git hooks
    if [ ! -f .git/hooks/pre-commit ]; then
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
echo "🔍 Running pre-commit checks..."

# フロントエンド検査
cd frontend
npm run lint:check || exit 1
npm run type-check || exit 1
cd ..

# バックエンド検査
cd backend
npm run lint:check || exit 1
npm run type-check || exit 1
cd ..

echo "✅ Pre-commit checks passed"
EOF
        chmod +x .git/hooks/pre-commit
        echo "📝 Created Git pre-commit hook"
    fi
    
    # VSCode設定
    mkdir -p .vscode
    cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  }
}
EOF
    
    # VSCode拡張機能推奨設定
    cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-vscode.vscode-json"
  ]
}
EOF
    
    echo "✅ Development tools configured"
}

# ヘルスチェック
health_check() {
    echo "🔍 Running health check..."
    
    # サービス起動待機
    echo "⏳ Waiting for all services to be ready..."
    sleep 15
    
    # PostgreSQLチェック
    if docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
    else
        echo "❌ PostgreSQL is not ready"
        return 1
    fi
    
    # Redisチェック
    if docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis is ready"
    else
        echo "❌ Redis is not ready"
        return 1
    fi
    
    # バックエンドチェック（開発サーバーが起動していない場合はスキップ）
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "✅ Backend service is healthy"
    else
        echo "⚠️ Backend service is not running (start with npm run dev in backend/)"
    fi
    
    # フロントエンドチェック（開発サーバーが起動していない場合はスキップ）
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Frontend service is healthy"
    else
        echo "⚠️ Frontend service is not running (start with npm run dev in frontend/)"
    fi
    
    echo "✅ Health check completed"
}

# クリーンアップ関数
cleanup() {
    echo "🧹 Cleaning up temporary files..."
    rm -rf node_modules/.cache
    rm -rf frontend/.next/cache
    rm -rf backend/dist
}

# メイン実行
main() {
    echo "🎯 AI補助金システム開発環境セットアップ開始"
    echo "================================================"
    
    check_requirements
    setup_environment
    setup_docker
    setup_database
    setup_frontend
    setup_ai_engine
    setup_dev_tools
    health_check
    
    echo ""
    echo "🎉 Development environment setup completed!"
    echo "================================================"
    echo ""
    echo "📍 Available services:"
    echo "   PostgreSQL: localhost:5432"
    echo "   Redis:      localhost:6379"
    echo "   MinIO:      localhost:9000 (console: localhost:9001)"
    echo ""
    echo "🚀 To start development servers:"
    echo "   Backend:    cd backend && npm run dev"
    echo "   Frontend:   cd frontend && npm run dev"
    echo "   AI Engine:  cd ai-engine && npm run dev"
    echo ""
    echo "🔧 Useful commands:"
    echo "   ./start.sh              - Start all services"
    echo "   ./stop.sh               - Stop all services"
    echo "   ./status.sh             - Check service status"
    echo "   ./scripts/logs.sh       - View service logs"
    echo "   ./scripts/reset-db.sh   - Reset database"
    echo ""
    echo "📱 Development URLs (after starting dev servers):"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:3001"
    echo "   API Docs:  http://localhost:3001/api-docs"
    echo ""
    echo "⚠️  Don't forget to:"
    echo "   1. Update .env files with your API keys"
    echo "   2. Start the development servers"
    echo "   3. Open http://localhost:3000 in your browser"
}

# エラーハンドリング
trap 'echo "❌ Setup failed. Check the error messages above."; exit 1' ERR

# スクリプト実行
main "$@"