# 🚀 AI補助金申請システム - Vercel本番環境デプロイガイド

## 前提条件

- Vercelアカウント
- Supabaseアカウント
- Google Cloud Platform アカウント（Gemini API用）
- GitHub リポジトリ

## 1. Supabase セットアップ

### 1.1 プロジェクト作成

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. 「New Project」をクリック
3. プロジェクト情報を入力：
   - Name: `ai-subsidy-system`
   - Database Password: 強力なパスワードを生成
   - Region: `Northeast Asia (Tokyo)`
   - Pricing Plan: `Pro`（本番環境用）

### 1.2 データベース初期化

```bash
# Supabase CLIをインストール
npm install -g supabase

# ログイン
supabase login

# プロジェクトとリンク
supabase link --project-ref your-project-ref

# マイグレーション実行
supabase db push
```

### 1.3 環境変数取得

Supabase Dashboard > Settings > API から以下を取得：
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

## 2. Gemini API 設定

### 2.1 API キー取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. 「Create API Key」をクリック
3. APIキーをコピー

### 2.2 使用制限設定

1. Google Cloud Console でプロジェクトを作成
2. Gemini API を有効化
3. API キーに制限を設定：
   - HTTPリファラー制限
   - IPアドレス制限（Vercelの固定IP使用時）

## 3. Vercel デプロイ

### 3.1 GitHubとの連携

```bash
# リポジトリ作成
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/ai-subsidy-system.git
git push -u origin main
```

### 3.2 Vercelプロジェクト作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. 「Import Project」をクリック
3. GitHubリポジトリを選択
4. 以下の設定を行う：
   - Framework Preset: `Next.js`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3.3 環境変数設定

Vercel Dashboard > Settings > Environment Variables で以下を設定：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx

# AI APIs
GEMINI_API_KEY=xxxxx
OPENAI_API_KEY=xxxxx  # オプション
ANTHROPIC_API_KEY=xxxxx  # オプション

# External APIs
ESTAT_APP_ID=xxxxx

# App Config
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 3.4 デプロイ実行

```bash
# Vercel CLIでデプロイ
npm i -g vercel
vercel --prod

# または GitHub経由で自動デプロイ
git push origin main
```

## 4. ドメイン設定

### 4.1 カスタムドメイン追加

1. Vercel Dashboard > Settings > Domains
2. ドメインを追加
3. DNSレコードを設定：
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

### 4.2 SSL証明書

Vercelが自動的にLet's Encrypt証明書を発行・更新

## 5. 本番環境の最適化

### 5.1 パフォーマンス設定

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
}
```

### 5.2 キャッシュ設定

```javascript
// vercel.json に追加
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=1, stale-while-revalidate=59"
        }
      ]
    }
  ]
}
```

## 6. 監視とアラート

### 6.1 Vercel Analytics

1. Vercel Dashboard > Analytics を有効化
2. Web Vitalsの監視
3. パフォーマンス改善の追跡

### 6.2 Supabase Monitoring

1. Database > Monitoring でクエリパフォーマンス確認
2. アラート設定：
   - Database容量
   - API使用率
   - エラー率

### 6.3 エラー監視（Sentry）

```bash
# Sentryインストール
npm install @sentry/nextjs

# 設定
npx @sentry/wizard -i nextjs
```

## 7. セキュリティチェックリスト

- [ ] 環境変数が本番用に設定されている
- [ ] Supabase RLSが有効になっている
- [ ] API レート制限が設定されている
- [ ] CORS設定が適切
- [ ] セキュリティヘッダーが設定されている
- [ ] 依存関係の脆弱性チェック完了

## 8. デプロイ後の確認

### 8.1 機能テスト

```bash
# E2Eテスト実行
npm run test:e2e:prod

# ヘルスチェック
curl https://your-domain.com/api/health
```

### 8.2 パフォーマンステスト

```bash
# Lighthouse実行
npm run lighthouse https://your-domain.com

# 負荷テスト
npm run load-test
```

## 9. ロールバック手順

```bash
# Vercel CLIでロールバック
vercel rollback

# または Vercel Dashboard から
# Deployments > 以前のデプロイメント > Promote to Production
```

## 10. トラブルシューティング

### よくある問題

1. **Supabase接続エラー**
   - 環境変数の確認
   - IPアドレス制限の確認

2. **Gemini APIエラー**
   - APIキーの有効性確認
   - レート制限の確認

3. **ビルドエラー**
   - Node.jsバージョン確認
   - 依存関係の確認

### サポート

- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support
- プロジェクト: issues@your-domain.com

## 付録：コスト見積もり

### 月額費用（1,000ユーザー想定）

| サービス | プラン | 月額費用 |
|---------|--------|----------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| Gemini API | 無料枠 | $0 |
| **合計** | | **$45** |

### スケーリング時の追加費用

- Vercel: 帯域幅 $40/100GB
- Supabase: ストレージ $0.125/GB
- Gemini API: $0.00025/1k characters（無料枠超過後）

---

🎉 **デプロイ完了後は、実際のユーザーが補助金申請書を作成できます！**