#!/bin/bash

# ========================================
# デプロイ前セルフチェックスクリプト
# ========================================
# このスクリプトは、Vercel/Hugging Faceへのデプロイ前に
# 自動的に実行され、潜在的な問題を検出します

set -e  # エラーが発生したら即座に停止

echo "🔍 デプロイ前セルフチェックを開始します..."
echo "================================================"

# 結果を格納する変数
ERRORS=0
WARNINGS=0

# エラーと警告を記録する関数
log_error() {
    echo "❌ ERROR: $1"
    ERRORS=$((ERRORS + 1))
}

log_warning() {
    echo "⚠️  WARNING: $1"
    WARNINGS=$((WARNINGS + 1))
}

log_success() {
    echo "✅ SUCCESS: $1"
}

# 1. Node.jsバージョンチェック
echo ""
echo "1️⃣ Node.jsバージョンチェック"
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.17.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then 
    log_success "Node.js バージョン v$NODE_VERSION (>= v$REQUIRED_VERSION)"
else
    log_error "Node.js バージョンが古いです。v$REQUIRED_VERSION 以上が必要です。現在: v$NODE_VERSION"
fi

# 2. 必須ファイルの存在確認
echo ""
echo "2️⃣ 必須ファイルの存在確認"
REQUIRED_FILES=(
    "frontend/package.json"
    "frontend/next.config.js"
    "frontend/.env.example"
    "backend/package.json"
    "backend/tsconfig.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "$file が存在します"
    else
        log_error "$file が見つかりません"
    fi
done

# 3. 環境変数チェック
echo ""
echo "3️⃣ 環境変数チェック"
if [ -f "frontend/.env.local" ]; then
    log_success ".env.local が存在します"
    
    # 必須環境変数の確認
    REQUIRED_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" "frontend/.env.local"; then
            log_success "$var が設定されています"
        else
            log_warning "$var が設定されていません（本番環境で設定が必要）"
        fi
    done
else
    log_warning ".env.local が見つかりません。本番環境で環境変数の設定が必要です"
fi

# 4. package.jsonの依存関係チェック
echo ""
echo "4️⃣ 依存関係チェック"
cd frontend

# Chart.jsの依存関係確認
if grep -q '"chart.js"' package.json; then
    log_success "chart.js が依存関係に含まれています"
else
    log_error "chart.js が依存関係に含まれていません"
    echo "   実行: npm install chart.js react-chartjs-2"
fi

# 開発依存と本番依存の分離確認
if grep -q '"@types/.*":' package.json; then
    if grep -q '"devDependencies"' package.json && grep -A50 '"devDependencies"' package.json | grep -q '"@types/'; then
        log_success "TypeScript型定義が適切にdevDependenciesに配置されています"
    else
        log_warning "TypeScript型定義が dependencies に含まれている可能性があります"
    fi
fi

cd ..

# 5. TypeScriptコンパイルチェック
echo ""
echo "5️⃣ TypeScriptコンパイルチェック"
cd frontend
echo "   フロントエンドのTypeScriptチェック中..."
if npx tsc --noEmit 2>/dev/null; then
    log_success "フロントエンド: TypeScriptエラーなし"
else
    log_error "フロントエンド: TypeScriptコンパイルエラーがあります"
    echo "   実行して詳細を確認: cd frontend && npx tsc --noEmit"
fi
cd ..

cd backend
echo "   バックエンドのTypeScriptチェック中..."
if npx tsc --noEmit 2>/dev/null; then
    log_success "バックエンド: TypeScriptエラーなし"
else
    log_error "バックエンド: TypeScriptコンパイルエラーがあります"
    echo "   実行して詳細を確認: cd backend && npx tsc --noEmit"
fi
cd ..

# 6. ビルドテスト
echo ""
echo "6️⃣ ビルドテスト"
cd frontend
echo "   Next.jsビルドテスト中..."
if npm run build > /dev/null 2>&1; then
    log_success "Next.js ビルド成功"
else
    log_error "Next.js ビルドエラー"
    echo "   実行して詳細を確認: cd frontend && npm run build"
fi
cd ..

# 7. ESLintチェック
echo ""
echo "7️⃣ Lintチェック"
cd frontend
if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
    echo "   ESLintチェック中..."
    if npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings 0 2>/dev/null; then
        log_success "ESLintエラーなし"
    else
        log_warning "ESLintの警告またはエラーがあります"
        echo "   実行して詳細を確認: cd frontend && npx eslint . --ext .js,.jsx,.ts,.tsx"
    fi
else
    log_warning "ESLint設定が見つかりません"
fi
cd ..

# 8. 不要なファイルチェック
echo ""
echo "8️⃣ 不要なファイルチェック"
UNNECESSARY_FILES=(
    "frontend/.env.local"
    "backend/.env"
    "frontend/node_modules"
    "backend/node_modules"
    ".DS_Store"
)

for file in "${UNNECESSARY_FILES[@]}"; do
    if [ -e "$file" ]; then
        log_warning "$file がリポジトリに含まれています（.gitignoreに追加推奨）"
    fi
done

# 9. ポート競合チェック
echo ""
echo "9️⃣ ポート設定チェック"
if grep -r "localhost:3000" frontend/src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "process.env"; then
    log_warning "ハードコードされたlocalhost:3000の参照が見つかりました"
    echo "   環境変数を使用するように修正してください"
else
    log_success "ポート番号のハードコーディングなし"
fi

# 10. APIエンドポイントチェック
echo ""
echo "🔟 APIエンドポイントチェック"
if grep -r "http://localhost" frontend/src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "process.env"; then
    log_error "ハードコードされたlocalhostのAPIエンドポイントが見つかりました"
    echo "   環境変数（NEXT_PUBLIC_API_URL等）を使用してください"
else
    log_success "APIエンドポイントのハードコーディングなし"
fi

# 結果サマリー
echo ""
echo "================================================"
echo "📊 チェック結果サマリー"
echo "================================================"
echo "エラー数: $ERRORS"
echo "警告数: $WARNINGS"

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo ""
        echo "🎉 すべてのチェックをパスしました！デプロイの準備ができています。"
    else
        echo ""
        echo "⚠️  警告がありますが、デプロイは可能です。"
        echo "   警告内容を確認し、必要に応じて修正してください。"
    fi
    exit 0
else
    echo ""
    echo "❌ エラーが検出されました。デプロイ前に修正が必要です。"
    exit 1
fi