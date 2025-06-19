# AI補助金申請書自動作成システム - 必要API仕様書

## 📋 API実装ステータス概要

### ✅ 実装済み (8個)
- 認証系API 6個
- システム系API 2個

### ❌ 未実装 (42個)
- ユーザープロフィール管理: 4個
- 補助金プログラム管理: 4個  
- 申請書管理: 5個
- AI生成機能: 4個
- ファイル・PDF管理: 6個
- 管理機能: 7個
- 通知・サポート: 4個

---

## 🚀 優先実装API（フェーズ1: 即座に必要）

### 1. ユーザープロフィール管理
```http
PUT /api/users/profile
GET /api/users/stats  
PUT /api/users/password
```

### 2. 申請書コンテンツ管理
```http
PUT /api/applications/:id          # 申請書内容更新
DELETE /api/applications/:id       # 申請書削除
POST /api/applications/:id/submit  # 申請書提出
```

### 3. AI機能強化
```http
POST /api/applications/:id/regenerate  # セクション再生成
GET /api/applications/:id/analysis     # AI分析・スコア
```

### 4. PDF生成機能
```http
POST /api/applications/:id/pdf         # PDF生成
GET /api/applications/:id/pdf/download # PDFダウンロード
```

### 5. 補助金詳細管理
```http
GET /api/subsidy-programs/:id          # 詳細情報
GET /api/subsidy-programs/search       # 検索機能
GET /api/subsidy-programs/recommendations # 推奨プログラム
```

---

## 💰 運用コスト詳細分析

### AI API費用（月額）
```
OpenAI GPT-4o:
- 入力: $0.005/1k tokens
- 出力: $0.015/1k tokens
- 申請書1件: 約$0.50-1.00
- 月100件想定: $50-100

Anthropic Claude 3.5:  
- 入力: $0.003/1k tokens
- 出力: $0.015/1k tokens
- 申請書1件: 約$0.40-0.80
- 月100件想定: $40-80

AI合計: $90-180/月
```

### インフラ費用（AWS）
```
ECS Fargate: $30-50/月
RDS PostgreSQL: $40-60/月  
ElastiCache Redis: $20-30/月
S3 + CloudFront: $10-25/月
その他: $10-15/月

インフラ合計: $110-180/月
```

### 総コスト
```
月額総額: $200-360
年額総額: $2,400-4,320
ユーザー単価: $2-4/月（100ユーザー想定）
```

---

## 🧪 テストログイン機能

### 現在のテスト方法
```bash
# 1. ユーザー登録テスト
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "companyName": "テスト株式会社",
    "representativeName": "山田太郎", 
    "businessType": "IT・ソフトウェア開発",
    "foundedYear": 2020,
    "employeeCount": 10
  }'

# 2. ログインテスト
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# 3. トークンでユーザー情報取得
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 推奨テストデータ
```json
{
  "email": "demo@ai-subsidy.com",
  "password": "Demo123!@#",
  "companyName": "AI補助金テスト株式会社",
  "representativeName": "田中花子",
  "businessType": "製造業",
  "foundedYear": 2018,
  "employeeCount": 25,
  "website": "https://example.com"
}
```

---

## 🔗 必要な外部API連携

### 1. 補助金情報収集API
```
ミラサポplus API: 中小企業庁の公式情報
J-Grants API: 政府統一補助金システム
各都道府県の補助金API
```

### 2. メール送信サービス
```
SendGrid: パスワードリセット、通知メール
AWS SES: 大量メール配信
Postmark: トランザクションメール
```

### 3. ファイルストレージ
```
AWS S3: PDFファイル、アップロード書類
CloudFront: 高速配信
MinIO: 開発環境用ストレージ
```

### 4. 決済システム（将来）
```
Stripe: サブスクリプション管理
PayPal: 代替決済手段
```

### 5. 監視・分析
```
Sentry: エラー監視
Google Analytics: ユーザー行動分析  
Datadog: インフラ監視
```

---

## ⚡ 次期実装ロードマップ

### Week 1: コア機能完成
- [ ] ユーザープロフィール更新API
- [ ] 申請書編集API
- [ ] AI再生成API
- [ ] 基本的なPDF生成

### Week 2: 機能拡充
- [ ] ファイルアップロード機能
- [ ] 詳細な補助金情報API
- [ ] 申請書分析・スコアリング
- [ ] 通知システム基盤

### Week 3: 運用機能
- [ ] パスワードリセット完成
- [ ] 管理者機能
- [ ] システム監視API
- [ ] バックアップ・復旧機能

### Week 4: 最適化・テスト
- [ ] パフォーマンス最適化
- [ ] セキュリティテスト
- [ ] 負荷テスト
- [ ] 本番環境構築

---

## 📊 API認証セキュリティ

### 実装済みセキュリティ
```
✅ JWT + セッション二重認証
✅ レート制限（API別）
✅ パスワード強度チェック
✅ SQLインジェクション対策
✅ XSS対策（Helmet）
✅ CORS設定
✅ 監査ログ
```

### 追加予定セキュリティ
```
⏳ 二要素認証（2FA）
⏳ IPホワイトリスト
⏳ API キー管理
⏳ 暗号化強化
⏳ 脆弱性スキャン自動化
```

---

## 🎯 成功指標（KPI）

### 技術指標
- API応答時間: 500ms以内（95%tile）
- AI生成時間: 30秒以内
- システム可用性: 99.9%
- エラー率: 0.1%以下

### ビジネス指標  
- 申請書作成時間: 従来の80%削減
- ユーザー満足度: 4.5/5以上
- 採択率向上: 従来比20%アップ
- 月間アクティブユーザー: 1,000人

---

**次回実装**: ユーザープロフィール更新API → 申請書編集機能 → PDF生成機能
**コスト最適化**: AIプロンプト最適化、キャッシュ機能、並列処理
**監視強化**: リアルタイム監視、アラート設定、パフォーマンス分析