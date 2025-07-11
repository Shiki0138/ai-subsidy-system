#!/bin/bash

# ========================================
# ローカル統合テストスクリプト
# ========================================
# 本番デプロイ前に全機能をローカルでテストします

set -e

echo "🧪 ローカル統合テストを開始します..."
echo "================================================"

# テスト結果を記録
TEST_RESULTS=()
FAILED_TESTS=0

# テスト関数
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo ""
    echo "▶️  テスト: $test_name"
    
    if eval "$test_command"; then
        echo "✅ PASS: $test_name"
        TEST_RESULTS+=("✅ $test_name")
    else
        echo "❌ FAIL: $test_name"
        TEST_RESULTS+=("❌ $test_name")
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# 1. 環境準備
echo "1️⃣ 環境準備"
run_test "Node.jsバージョン確認" "node -v | grep -E 'v(18|19|20|21|22|23|24)'"
run_test "npmバージョン確認" "npm -v"

# 2. 依存関係のインストール
echo ""
echo "2️⃣ 依存関係のクリーンインストール"
cd frontend
run_test "フロントエンド依存関係のインストール" "npm ci"
cd ../backend
run_test "バックエンド依存関係のインストール" "npm ci"
cd ..

# 3. TypeScriptコンパイル
echo ""
echo "3️⃣ TypeScriptコンパイルテスト"
cd frontend
run_test "フロントエンドTypeScriptチェック" "npx tsc --noEmit"
cd ../backend
run_test "バックエンドTypeScriptチェック" "npx tsc --noEmit"
cd ..

# 4. Lintチェック
echo ""
echo "4️⃣ Lintチェック"
cd frontend
if [ -f ".eslintrc.json" ]; then
    run_test "ESLintチェック" "npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings 20"
fi
cd ..

# 5. ビルドテスト
echo ""
echo "5️⃣ ビルドテスト"
cd frontend
run_test "Next.js プロダクションビルド" "npm run build"
cd ..

# 6. APIエンドポイントテスト
echo ""
echo "6️⃣ APIエンドポイントの疎通確認"
cd frontend

# サーバーを起動
echo "   Next.jsサーバーを起動中..."
npm run build > /dev/null 2>&1
npm run start > /dev/null 2>&1 &
SERVER_PID=$!
sleep 10

# APIエンドポイントのテスト
run_test "ヘルスチェックAPI" "curl -s http://localhost:3000/api/health | grep -q 'success'"
run_test "法人番号API" "curl -s -X POST http://localhost:3000/api/corporate-number -H 'Content-Type: application/json' -d '{\"corporateNumber\":\"1234567890123\"}' | grep -q 'success'"
run_test "通知API" "curl -s http://localhost:3000/api/notifications?userId=test | grep -q 'success'"
run_test "テンプレートAPI" "curl -s http://localhost:3000/api/templates?userId=test | grep -q 'success'"
run_test "下書きAPI" "curl -s http://localhost:3000/api/drafts?userId=test | grep -q 'success'"

# サーバーを停止
kill $SERVER_PID 2>/dev/null || true
cd ..

# 7. フロントエンドルーティングテスト
echo ""
echo "7️⃣ フロントエンドルーティングテスト"
ROUTES=(
    "/"
    "/apply/sustainability"
    "/apply/it-subsidy"
    "/apply/manufacturing"
    "/dashboard"
    "/auth/login"
)

cd frontend
npm run build > /dev/null 2>&1
npm run start > /dev/null 2>&1 &
SERVER_PID=$!
sleep 10

for route in "${ROUTES[@]}"; do
    run_test "ルート $route の確認" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$route | grep -E '200|404'"
done

kill $SERVER_PID 2>/dev/null || true
cd ..

# 8. 環境変数の確認
echo ""
echo "8️⃣ 環境変数の確認"
if [ -f "frontend/.env.local" ]; then
    run_test ".env.localの存在確認" "true"
    run_test "NEXT_PUBLIC_SUPABASE_URL設定確認" "grep -q 'NEXT_PUBLIC_SUPABASE_URL=' frontend/.env.local"
else
    run_test ".env.localの存在確認" "false"
fi

# 9. セキュリティチェック
echo ""
echo "9️⃣ 基本的なセキュリティチェック"
run_test "秘密鍵のハードコーディングチェック" "! grep -r 'sk_' --include='*.ts' --include='*.tsx' --include='*.js' frontend/src || true"
run_test "APIキーのハードコーディングチェック" "! grep -r 'AIza' --include='*.ts' --include='*.tsx' --include='*.js' frontend/src || true"

# 10. パフォーマンステスト
echo ""
echo "🔟 パフォーマンステスト"
cd frontend
if [ -d ".next" ]; then
    run_test "ビルドサイズチェック（< 50MB）" "[ $(du -sm .next | cut -f1) -lt 50 ]"
fi
cd ..

# テスト結果のサマリー
echo ""
echo "================================================"
echo "📊 テスト結果サマリー"
echo "================================================"
for result in "${TEST_RESULTS[@]}"; do
    echo "$result"
done

echo ""
echo "合計テスト数: ${#TEST_RESULTS[@]}"
echo "失敗数: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo "🎉 すべてのテストに合格しました！"
    echo "   次のステップ: ステージング環境でのテスト"
    exit 0
else
    echo ""
    echo "❌ $FAILED_TESTS 個のテストが失敗しました。"
    echo "   修正してから再度テストを実行してください。"
    exit 1
fi