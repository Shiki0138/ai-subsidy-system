# 🎪 ステージング環境デプロイメントガイド

## 📋 ステージング環境の目的
本番環境と同等の環境で最終テストを行い、問題を事前に発見する

## 🚀 Vercelでのステージング環境セットアップ

### 1. プレビューデプロイメントの活用
```bash
# featureブランチを作成
git checkout -b staging
git push origin staging

# Vercelが自動的にプレビューURLを生成
# 例: https://ai-subsidy-system-staging-xxx.vercel.app
```

### 2. 環境変数の設定
Vercelダッシュボードで:
1. Settings → Environment Variables
2. "Preview" 環境用の変数を設定
```env
# ステージング用のSupabase
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
SUPABASE_SERVICE_KEY=staging-service-key

# テスト用のAPI Key（本番とは別）
GEMINI_API_KEY=test-api-key

# ステージング識別子
NEXT_PUBLIC_ENVIRONMENT=staging
```

### 3. ステージング専用の設定
`frontend/src/config/staging.ts`:
```typescript
export const stagingConfig = {
  // テストユーザー
  testUsers: [
    { email: 'test1@example.com', password: 'test123' },
    { email: 'test2@example.com', password: 'test123' }
  ],
  
  // 機能フラグ
  features: {
    enableDebugMode: true,
    showTestBanner: true,
    mockExternalAPIs: false, // 実際のAPIを使用
  },
  
  // レート制限を緩和
  rateLimits: {
    api: 1000, // 本番: 100
    upload: 50, // 本番: 10
  }
}
```

## 🧪 ステージング環境でのテストチェックリスト

### 1. 機能テスト
- [ ] ユーザー登録・ログイン
- [ ] 法人番号による企業情報取得
- [ ] 各種補助金申請フローの完了
- [ ] AI申請書生成（Gemini API）
- [ ] PDFダウンロード
- [ ] 自動保存機能
- [ ] テンプレート機能
- [ ] 通知システム
- [ ] 統計グラフ表示

### 2. 非機能テスト
- [ ] ページ読み込み速度（< 3秒）
- [ ] APIレスポンス時間（< 1秒）
- [ ] 同時アクセステスト（10ユーザー）
- [ ] モバイル表示確認
- [ ] ブラウザ互換性（Chrome, Safari, Firefox, Edge）

### 3. セキュリティテスト
- [ ] 認証なしでのAPI アクセス拒否
- [ ] XSS攻撃への耐性
- [ ] SQLインジェクション対策
- [ ] CSRF対策
- [ ] レート制限の動作

### 4. エラーハンドリング
- [ ] ネットワークエラー時の動作
- [ ] API障害時のフォールバック
- [ ] 不正なデータ入力の処理
- [ ] 404ページの表示

## 📊 パフォーマンステスト

### Lighthouse実行
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=https://staging-url.vercel.app
```

### 目標スコア
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

### 負荷テスト（Artillery）
```bash
# artillery.yml
config:
  target: "https://staging-url.vercel.app"
  phases:
    - duration: 60
      arrivalRate: 10
      
scenarios:
  - name: "ユーザーフロー"
    flow:
      - get:
          url: "/"
      - think: 5
      - get:
          url: "/apply/sustainability"
      - think: 3
      - post:
          url: "/api/corporate-number"
          json:
            corporateNumber: "1234567890123"

# 実行
artillery run artillery.yml
```

## 🔍 ステージング環境でのデバッグ

### ログの確認
```bash
# Vercelログ
vercel logs --scope staging

# ブラウザコンソール
localStorage.setItem('DEBUG', '*')
```

### 環境の識別
```typescript
// 現在の環境を表示
if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging') {
  console.log('🎪 ステージング環境で実行中')
}
```

## ✅ 本番移行前の最終チェック

### 1. データ移行計画
- [ ] ステージングデータのクリーンアップ方法
- [ ] 本番データベースの初期化手順
- [ ] バックアップの確認

### 2. 監視設定
- [ ] エラー監視（Sentry等）の設定
- [ ] パフォーマンス監視の設定
- [ ] アラート通知の設定

### 3. ドキュメント更新
- [ ] README.mdの最新化
- [ ] API ドキュメントの更新
- [ ] 運用手順書の作成

### 4. チーム準備
- [ ] リリースノートの作成
- [ ] サポートチームへの連絡
- [ ] 緊急時対応計画の共有

## 🚦 Go/No-Go判定基準

### Go（本番デプロイ可）
- すべての機能テストがPASS
- パフォーマンス目標を達成
- 重大なバグなし
- セキュリティ問題なし

### No-Go（延期）
- クリティカルなバグが残存
- パフォーマンス基準未達
- セキュリティ脆弱性が発見
- データ損失のリスク

## 📅 推奨スケジュール

1. **Day 1-2**: ステージング環境構築
2. **Day 3-4**: 機能テスト実施
3. **Day 5**: パフォーマンス・セキュリティテスト
4. **Day 6**: 問題修正
5. **Day 7**: 最終確認・Go/No-Go判定

このプロセスに従うことで、本番環境での問題を最小限に抑えることができます。