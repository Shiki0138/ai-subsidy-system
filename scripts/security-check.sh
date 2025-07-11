#!/bin/bash

# ========================================
# セキュリティチェックスクリプト
# ========================================
# 本番デプロイ前のセキュリティ脆弱性をチェックします

set -e

echo "🔒 セキュリティチェックを開始します..."
echo "================================================"

SECURITY_ISSUES=0

# 1. 機密情報の漏洩チェック
echo ""
echo "1️⃣ 機密情報の漏洩チェック"

# APIキーのハードコーディング
echo "   APIキーのハードコーディングをチェック中..."
if grep -r "sk_live" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null; then
    echo "   ❌ 本番APIキーがハードコーディングされています！"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
else
    echo "   ✅ APIキーのハードコーディングなし"
fi

# パスワードのハードコーディング
if grep -r "password.*=.*['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v "password: ''" | grep -v "example" | grep -v "test"; then
    echo "   ❌ パスワードがハードコーディングされている可能性があります！"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
else
    echo "   ✅ パスワードのハードコーディングなし"
fi

# 2. 依存関係の脆弱性チェック
echo ""
echo "2️⃣ 依存関係の脆弱性チェック"
cd frontend
echo "   フロントエンドの脆弱性をチェック中..."
if npm audit --production | grep -q "found 0 vulnerabilities"; then
    echo "   ✅ フロントエンド: 脆弱性なし"
else
    echo "   ⚠️  フロントエンド: 脆弱性が検出されました"
    npm audit --production || true
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
fi

cd ../backend
echo "   バックエンドの脆弱性をチェック中..."
if npm audit --production | grep -q "found 0 vulnerabilities"; then
    echo "   ✅ バックエンド: 脆弱性なし"
else
    echo "   ⚠️  バックエンド: 脆弱性が検出されました"
    npm audit --production || true
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
fi
cd ..

# 3. CORS設定チェック
echo ""
echo "3️⃣ CORS設定チェック"
if grep -r "cors.*origin.*\*" --include="*.ts" --include="*.js" backend/src 2>/dev/null; then
    echo "   ⚠️  CORS設定で'*'（すべてのオリジン）が許可されています"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
else
    echo "   ✅ CORS設定は適切です"
fi

# 4. 認証・認可チェック
echo ""
echo "4️⃣ 認証・認可チェック"
if grep -r "disable.*auth" --include="*.ts" --include="*.tsx" --include="*.js" . 2>/dev/null | grep -v "test" | grep -v "dev"; then
    echo "   ⚠️  認証が無効化されている箇所があります"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
else
    echo "   ✅ 認証設定は適切です"
fi

# 5. HTTPSチェック
echo ""
echo "5️⃣ HTTPS設定チェック"
if grep -r "http://" --include="*.ts" --include="*.tsx" --include="*.js" frontend/src 2>/dev/null | grep -v "localhost" | grep -v "127.0.0.1" | grep -v "comment" | grep -v "example"; then
    echo "   ⚠️  HTTPの使用が検出されました（HTTPSを使用してください）"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
else
    echo "   ✅ HTTPS設定は適切です"
fi

# 6. ファイルアップロードのセキュリティ
echo ""
echo "6️⃣ ファイルアップロードのセキュリティ"
if grep -r "upload" --include="*.ts" --include="*.js" backend/src 2>/dev/null | grep -q "fileFilter"; then
    echo "   ✅ ファイルアップロードにフィルターが設定されています"
else
    echo "   ⚠️  ファイルアップロードのセキュリティ設定を確認してください"
fi

# 7. SQLインジェクション対策
echo ""
echo "7️⃣ SQLインジェクション対策"
if grep -r "query.*\${" --include="*.ts" --include="*.js" backend/src 2>/dev/null | grep -v "prisma"; then
    echo "   ⚠️  SQLクエリに文字列結合が使用されています（SQLインジェクションのリスク）"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
else
    echo "   ✅ SQLインジェクション対策は適切です"
fi

# 8. XSS対策
echo ""
echo "8️⃣ XSS対策"
if grep -r "dangerouslySetInnerHTML" --include="*.tsx" --include="*.jsx" frontend/src 2>/dev/null; then
    echo "   ⚠️  dangerouslySetInnerHTMLが使用されています（XSSのリスク）"
    echo "   使用箇所を確認し、必要な場合のみ使用してください"
else
    echo "   ✅ XSS対策は適切です"
fi

# 9. 環境変数の確認
echo ""
echo "9️⃣ 環境変数のセキュリティ"
if [ -f "frontend/.env" ]; then
    echo "   ⚠️  .envファイルがコミットされています（.gitignoreに追加してください）"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
else
    echo "   ✅ 環境変数ファイルは適切に管理されています"
fi

# 10. レート制限の確認
echo ""
echo "🔟 レート制限の確認"
if grep -r "rateLimit\|rate-limit" --include="*.ts" --include="*.js" backend/src 2>/dev/null; then
    echo "   ✅ レート制限が実装されています"
else
    echo "   ⚠️  レート制限が実装されていません（DDoS対策として推奨）"
fi

# 結果サマリー
echo ""
echo "================================================"
echo "📊 セキュリティチェック結果"
echo "================================================"
echo "検出された問題数: $SECURITY_ISSUES"

if [ $SECURITY_ISSUES -eq 0 ]; then
    echo ""
    echo "🎉 重大なセキュリティ問題は検出されませんでした！"
    echo ""
    echo "推奨事項:"
    echo "- 定期的にnpm auditを実行してください"
    echo "- 本番環境では強力なパスワードポリシーを設定してください"
    echo "- WAF（Web Application Firewall）の導入を検討してください"
else
    echo ""
    echo "❌ $SECURITY_ISSUES 個のセキュリティ問題が検出されました。"
    echo "   本番デプロイ前に修正することを強く推奨します。"
fi

exit $SECURITY_ISSUES