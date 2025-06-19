# ターミナルB 作業指示書

**作成日**: 2025年6月13日 23:58  
**目的**: ターミナルAとの統合により全機能完成を目指す  
**参照**: `FINAL_IMPLEMENTATION_GUIDE.md`, `FUNCTION_STATUS_ANALYSIS.md`

---

## 🎯 ターミナルB 作業概要

### 担当機能
1. **申請書作成フロー完成** (最優先)
2. **PDF機能完成** (高優先)  
3. **申請書詳細ページ完成** (高優先)

### 作業時間見積もり
- **総時間**: 6-7時間
- **Phase 1**: 3-4時間
- **Phase 2**: 2時間
- **Phase 3**: 2時間

---

## 📋 事前確認事項

### 開発環境確認
```bash
# バックエンド稼働確認
curl http://localhost:3001/api/health

# フロントエンド稼働確認  
curl http://localhost:3000

# ターミナルA完成機能確認
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@demo.com","password":"demo123"}'
```

### 必須リファレンス
1. `DEVELOPMENT_RULES.md` - 既存機能削除禁止ルール
2. `MASTER_DEVELOPMENT_RECORD.md` - 全体進捗把握
3. `FUNCTION_STATUS_ANALYSIS.md` - 現在の機能状況

---

## 🚀 Phase 1: 申請書作成フロー完成 (3-4時間)

### 1.1 現在の状況確認
```bash
cd /Users/MBP/ai-subsidy-system/frontend
ls -la src/app/dashboard/applications/new/
```

**期待ファイル**:
- `page.tsx` (✅ 存在確認済み)
- `NewApplicationClient.tsx` (✅ 存在確認済み)

### 1.2 5段階フォーム実装

**ファイル**: `frontend/src/app/dashboard/applications/new/NewApplicationClient.tsx`

**実装する機能**:
1. **Step 1: 基本情報**
   - 申請書タイトル
   - 補助金の種類選択
   
2. **Step 2: 企業情報**
   - 会社名、業界、従業員数
   - 事業内容、住所、連絡先
   
3. **Step 3: 事業計画**
   - AI生成ボタン統合
   - 手動編集可能
   - リアルタイムプレビュー
   
4. **Step 4: 詳細内容**
   - プロジェクト概要
   - 予算計画、スケジュール
   - 期待される成果
   
5. **Step 5: 最終確認**
   - 入力内容確認
   - 保存・送信

### 1.3 AI統合の実装

**API連携**:
```javascript
// 事業計画生成
const generateBusinessPlan = async () => {
  const response = await fetch('/api/ai/generate-business-plan', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      companyInfo: applicationData.companyInfo,
      subsidyType: applicationData.subsidyType
    })
  });
  
  const result = await response.json();
  if (result.success) {
    setBusinessPlan(result.data.content);
  }
};
```

### 1.4 フォームバリデーション

**実装項目**:
- 必須フィールドチェック
- メールアドレス形式チェック
- 文字数制限チェック
- リアルタイムエラー表示

### 1.5 自動保存機能

**実装項目**:
- 入力内容の自動保存（localStorage）
- 復元機能
- 保存状態表示

---

## 🚀 Phase 2: PDF機能完成 (2時間)

### 2.1 現在の状況確認
```bash
cd /Users/MBP/ai-subsidy-system/backend
ls -la pdf-service.js
```

**現在の問題**:
- Mac Silicon環境でPuppeteer不安定
- HTMLプレビューは動作済み

### 2.2 PDF生成サービス強化

**ファイル**: `backend/pdf-service.js`

**実装する機能**:
1. **Mac Silicon対応強化**
   ```javascript
   const launchOptions = {
     headless: 'new',
     args: [
       '--no-sandbox',
       '--disable-setuid-sandbox',
       '--disable-dev-shm-usage',
       '--disable-gpu'
     ]
   };
   
   // Mac Silicon対応
   if (process.platform === 'darwin' && process.arch === 'arm64') {
     launchOptions.executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
   }
   ```

2. **HTMLテンプレート強化**
   - 日本語フォント対応
   - レスポンシブレイアウト
   - 補助金別テンプレート

3. **エラーハンドリング強化**
   - フォールバック機能
   - 詳細エラー情報
   - リトライ機能

### 2.3 PDF API実装

**ファイル**: `backend/test-local-api.js`

**実装するエンドポイント**:
```javascript
// PDF生成API
app.post('/api/pdf/generate', authenticate, async (req, res) => {
  // 実装済みを確認・強化
});

// HTMLプレビューAPI  
app.get('/api/pdf/preview/:id', authenticate, async (req, res) => {
  // 実装済みを確認・強化
});
```

### 2.4 フロントエンド統合

**実装場所**: 申請書詳細ページ、ダッシュボード

**実装機能**:
- PDF出力ボタン
- プレビューボタン
- ダウンロード機能
- エラー表示

---

## 🚀 Phase 3: 申請書詳細ページ完成 (2時間)

### 3.1 現在の状況確認
```bash
cd /Users/MBP/ai-subsidy-system/frontend
ls -la src/app/dashboard/applications/[id]/
```

**期待ファイル**:
- `page.tsx` (✅ 存在確認済み)
- `ApplicationDetailsClient.tsx` (✅ 存在確認済み)

### 3.2 詳細ページ機能実装

**ファイル**: `frontend/src/app/dashboard/applications/[id]/ApplicationDetailsClient.tsx`

**実装する機能**:
1. **申請書表示**
   - セクション別表示
   - 読みやすいレイアウト
   - ステータス表示

2. **編集機能**
   - インライン編集
   - セクション別編集
   - 自動保存

3. **AI統合**
   - セクション別AI生成
   - 改善提案機能
   - 採択率予測表示

4. **PDF機能統合**
   - PDF出力ボタン
   - プレビュー機能
   - ダウンロード

### 3.3 UI/UX強化

**実装項目**:
- ローディング状態
- プログレスバー
- エラー表示
- 成功通知

### 3.4 API統合テスト

**テスト項目**:
- 申請書取得
- 更新機能
- AI生成機能
- PDF生成機能

---

## 📝 開発中の注意事項

### 🔒 開発基本ルール遵守
1. **既存機能は削除しない**
   - モック機能は保持
   - 認証機能は統合のみ
   - 既存UIコンポーネントは拡張のみ

2. **エラーハンドリング徹底**
   - すべてのAPI呼び出しにエラー処理
   - ユーザーフレンドリーなエラーメッセージ
   - ローディング状態の表示

3. **レスポンシブデザイン**
   - モバイル対応
   - タブレット対応
   - デスクトップ最適化

### 🧪 テスト方法

**各Phase完了後のテスト**:
```bash
# Phase 1 テスト
# 1. http://localhost:3000/dashboard/applications/new アクセス
# 2. 5段階フォーム動作確認
# 3. AI生成ボタンテスト
# 4. 保存機能テスト

# Phase 2 テスト  
# 1. PDF生成API直接テスト
# 2. HTMLプレビュー確認
# 3. エラーケース確認

# Phase 3 テスト
# 1. 申請書詳細ページアクセス
# 2. 編集機能テスト  
# 3. AI統合テスト
# 4. PDF出力テスト
```

---

## 🎯 完成判定基準

### Phase 1 完成条件
- [ ] 5段階フォームが完全動作
- [ ] AI生成ボタンが動作
- [ ] バリデーションが動作
- [ ] 保存機能が動作

### Phase 2 完成条件
- [ ] PDF生成が成功（または適切なフォールバック）
- [ ] HTMLプレビューが動作
- [ ] エラーハンドリングが動作

### Phase 3 完成条件
- [ ] 申請書詳細表示が動作
- [ ] 編集機能が動作
- [ ] AI統合が動作
- [ ] PDF出力統合が動作

---

## 🚨 トラブルシューティング

### よくある問題と対処

1. **API接続エラー**
   ```bash
   # バックエンド再起動
   cd backend && node test-local-api.js
   ```

2. **認証エラー**
   ```bash
   # トークン確認
   localStorage.getItem('token')
   ```

3. **AI生成エラー**
   - モック機能で代替確認
   - エラーメッセージの詳細確認

4. **PDF生成エラー**
   - HTMLプレビューで代替
   - Mac Silicon環境の問題確認

---

## 📚 参考資料

### API エンドポイント一覧
```
POST /api/auth/login                     # ログイン
POST /api/auth/register                  # 登録
GET  /api/auth/me                       # 認証確認
POST /api/ai/generate-business-plan     # 事業計画生成
POST /api/ai/generate-application-content # 申請書内容生成
POST /api/ai/predict-approval-rate      # 採択率予測
GET  /api/applications                  # 申請書一覧
POST /api/applications                  # 申請書作成
GET  /api/applications/:id             # 申請書詳細
PUT  /api/applications/:id             # 申請書更新
POST /api/pdf/generate                 # PDF生成
GET  /api/pdf/preview/:id             # HTMLプレビュー
```

### テストユーザー
- Email: `demo@demo.com`
- Password: `demo123`

---

## ✅ 完了後の報告

各Phase完了後、以下を報告してください：

1. **実装した機能**
2. **テスト結果**
3. **発見した問題**
4. **残っている課題**

---

**この指示書に従って、効率的にターミナルB作業を完了してください！**