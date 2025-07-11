# 🚀 Track A: バックエンド開発指示書

## 📋 概要
**担当**: バックエンド開発者  
**期間**: 2025年6月13日 - 6月19日 (7日間)  
**目標**: ユーザー管理と申請書CRUD API完全実装

---

## 🎯 Day 1-2: ユーザー管理API実装

### ✅ チェックリスト（実行前確認）
```bash
# 1. 環境確認
cd /Users/MBP/ai-subsidy-system/backend
npm --version  # 10.9.2以上
node --version # v23.11.0以上

# 2. データベース接続確認
npx prisma migrate status
# → "Database schema is up to date!" が表示されること

# 3. 現在のAPIエンドポイント確認
ls -la src/routes/
# → users.ts が存在することを確認
```

### 📝 Task 1: ユーザープロフィール更新API
**ファイル**: `src/routes/users.ts`  
**推定時間**: 3時間  
**優先度**: HIGH

#### 実装内容
```typescript
// PUT /api/users/profile
// 企業情報、代表者情報の更新機能
{
  "companyName": "更新された会社名",
  "representativeName": "更新された代表者名", 
  "businessType": "更新された業種",
  "foundedYear": 2020,
  "employeeCount": 25,
  "website": "https://example.com",
  "description": "会社説明文"
}
```

#### 実装手順
1. **バリデーション実装**
```bash
# Zodスキーマ定義
# - companyName: 必須、1-100文字
# - representativeName: 必須、1-50文字
# - businessType: 必須、選択肢制限
# - foundedYear: 1900-現在年
# - employeeCount: 1以上の整数
```

2. **Prismaクエリ実装**
```bash
# User.update() を使用
# - whereクエリでuser認証
# - データ更新とレスポンス
```

3. **テスト作成**
```bash
# 正常系テスト
# - 認証済みユーザーでの更新
# - 部分更新機能
# 異常系テスト  
# - 未認証でのアクセス
# - 無効なデータでの更新
```

#### 成功確認方法
```bash
# 1. サーバー起動
npm run dev

# 2. テスト実行（別ターミナル）
curl -X PUT http://localhost:3001/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "companyName": "テスト更新株式会社",
    "website": "https://updated-example.com"
  }'

# 期待結果: 200 OK + 更新されたユーザー情報
```

### 📝 Task 2: ユーザー統計情報API
**ファイル**: `src/routes/users.ts`  
**推定時間**: 2時間  
**優先度**: HIGH

#### 実装内容
```typescript
// GET /api/users/stats
// ユーザーの申請書統計情報取得
{
  "totalApplications": 5,
  "submittedApplications": 3,
  "draftApplications": 2,
  "aiGenerationCount": 8,
  "lastLoginAt": "2025-06-13T10:00:00Z"
}
```

#### 実装手順
```bash
# 1. Prismaクエリで関連データ集計
# 2. 結果の整形とレスポンス
# 3. キャッシュ実装（Redis使用）
```

### 📝 Task 3: パスワード変更API
**ファイル**: `src/routes/users.ts`  
**推定時間**: 2時間  
**優先度**: MEDIUM

#### 実装内容
```typescript
// PUT /api/users/password
{
  "currentPassword": "現在のパスワード",
  "newPassword": "新しいパスワード"
}
```

---

## 🎯 Day 3-4: 申請書管理API実装

### 📝 Task 4: 申請書更新API強化
**ファイル**: `src/routes/applications.ts`  
**推定時間**: 4時間  
**優先度**: HIGH

#### 実装内容
```typescript
// PUT /api/applications/:id
// 申請書内容の部分更新機能
{
  "companyOverview": "更新された会社概要",
  "businessPlan": "更新された事業計画",
  "sections": {
    "section1": "セクション1の内容",
    "section2": "セクション2の内容"
  }
}
```

#### 実装手順
1. **セクション別更新機能**
2. **変更履歴記録**
3. **楽観的ロック実装**

### 📝 Task 5: 申請書削除API
**ファイル**: `src/routes/applications.ts`  
**推定時間**: 1時間  
**優先度**: HIGH

#### 実装内容
```typescript
// DELETE /api/applications/:id
// 論理削除実装
```

### 📝 Task 6: 申請書提出API
**ファイル**: `src/routes/applications.ts`  
**推定時間**: 3時間  
**優先度**: HIGH

#### 実装内容
```typescript
// POST /api/applications/:id/submit
// 提出前バリデーション + ステータス変更
```

---

## 🎯 Day 5-7: AI機能API実装

### 📝 Task 7: AI再生成API
**ファイル**: `src/routes/applications.ts`  
**推定時間**: 6時間  
**優先度**: HIGH

#### 実装内容
```typescript
// POST /api/applications/:id/regenerate
{
  "sections": ["companyOverview", "businessPlan"],
  "aiModel": "gpt-4o", // or "claude-3.5"
  "regenerateOptions": {
    "tone": "formal",
    "length": "detailed"
  }
}
```

### 📝 Task 8: AI分析・スコアAPI
**ファイル**: `src/routes/applications.ts`  
**推定時間**: 4時間  
**優先度**: MEDIUM

#### 実装内容
```typescript
// GET /api/applications/:id/analysis
{
  "overallScore": 85,
  "sectionScores": {
    "companyOverview": 90,
    "businessPlan": 80
  },
  "suggestions": [
    "事業計画の具体性を向上させてください",
    "市場分析をより詳細に記述してください"
  ]
}
```

---

## 🛠️ 開発環境セットアップ

### 必要なツール
```bash
# 1. VSCode拡張機能
# - TypeScript + JavaScript
# - Prisma
# - REST Client

# 2. デバッグツール
npm install -g @types/node
npm install -g prisma

# 3. APIテストツール準備
# Postmanまたは curl コマンド使用
```

### デバッグ方法
```bash
# 1. ログ出力確認
tail -f backend.log

# 2. データベース確認
npx prisma studio
# → http://localhost:5555 でデータ確認

# 3. Redisキャッシュ確認
redis-cli
> keys *
```

---

## 📊 進捗管理

### Daily Check-in（毎日16:00）
```bash
# 進捗報告フォーマット
echo "=== Track A 進捗レポート $(date) ==="
echo "✅ 完了タスク: [タスク名]"
echo "🚧 進行中タスク: [タスク名] (進捗:X%)"
echo "❌ ブロッカー: [問題点]"
echo "📅 明日の予定: [タスク名]"
```

### テスト実行
```bash
# 全APIテスト実行
npm run test:api

# カバレッジ確認
npm run test:coverage
# 目標: 80%以上
```

### コード品質確認
```bash
# 型チェック
npm run type-check

# リント確認
npm run lint

# セキュリティチェック
npm audit
```

---

## 🚨 エラー対処法

### よくある問題と解決法

#### 1. Prismaエラー
```bash
# 症状: データベース接続エラー
# 解決: 
npx prisma generate
npx prisma db push
```

#### 2. 認証エラー
```bash
# 症状: JWT検証失敗
# 解決: .envのJWT_SECRET確認
```

#### 3. Redis接続エラー
```bash
# 症状: セッション保存失敗
# 解決: Redisサーバー起動確認
redis-cli ping
```

---

## 🎯 成功指標

### Day 2終了時
- [x] ユーザープロフィール更新API完成
- [x] ユーザー統計API完成  
- [x] パスワード変更API完成

### Day 4終了時
- [x] 申請書CRUD API完成
- [x] 基本的なバリデーション実装
- [x] エラーハンドリング統一

### Day 7終了時
- [x] AI再生成API完成
- [x] AI分析API完成
- [x] 全APIテスト完了
- [x] Track Bとの統合準備完了

---

## 📞 サポート・質問

### 開発中の質問・相談
- **技術的な問題**: この指示書のコメント欄
- **仕様の不明点**: 要件定義書参照
- **緊急の問題**: 即座報告

### リソース
- **API仕様**: `/Users/MBP/ai-subsidy-system/必要API仕様書.md`
- **DB schema**: `/Users/MBP/ai-subsidy-system/backend/prisma/schema.prisma`
- **開発記録**: `/Users/MBP/ai-subsidy-system/開発記録.md`

---

**🚀 Track A開発開始準備完了！この指示書に従って着実に進めましょう。**