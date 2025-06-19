# AI補助金申請システム - チーム開発指示書 V2
## 製品化レベル達成のための作業分担

---

## 🎯 **全体目標**
**期限：4週間後**  
一般販売可能な完全機能システムの完成

---

## 📋 **チームA：コア申請機能完成チーム**
**リーダー：ターミナルA**  
**責任範囲：** 申請書作成・編集・出力機能の完全実装

### 🔥 **Phase 1: 基盤コンポーネント実装**（1週間）

#### 1.1 UIコンポーネントライブラリ完成
```typescript
// 実装ファイル：/frontend/src/components/ui/
- Input.tsx           // フォーム入力（完全版）
- Select.tsx          // セレクトボックス
- Textarea.tsx        // テキストエリア
- Button.tsx          // ボタン（既存改良）
- Card.tsx           // カード（既存改良）
- Modal.tsx          // モーダル
- Alert.tsx          // アラート
- Badge.tsx          // バッジ
- Progress.tsx       // プログレスバー
- Spinner.tsx        // ローディング
- Tooltip.tsx        // ツールチップ
```

#### 1.2 API接続層実装
```typescript
// 実装ファイル：/frontend/src/services/api/
- applicationApi.ts   // 申請書API
- subsidyProgramApi.ts // 補助金プログラムAPI
- autoFillApi.ts     // 自動入力API
- adoptedCasesApi.ts // 採択事例API
- fileApi.ts         // ファイルAPI
```

#### 1.3 残りステップコンポーネント
```typescript
// 実装ファイル：/frontend/src/features/application-wizard/steps/
- ProjectPlanStep.tsx    // 事業計画入力
- BudgetPlanStep.tsx     // 予算計画入力
- DocumentsStep.tsx      // 書類アップロード
- ReviewStep.tsx         // 確認・提出
```

### 🔥 **Phase 2: 高度機能統合**（1週間）

#### 2.1 リッチテキストエディタ
```typescript
// 実装ファイル：/frontend/src/components/editor/
- RichTextEditor.tsx     // TipTap基盤エディタ
- EditorToolbar.tsx      // ツールバー
- AutoSaveProvider.tsx   // 自動保存
- AIAssistant.tsx        // AI提案統合
```

#### 2.2 PDF生成・プレビュー
```typescript
// 実装ファイル：/frontend/src/features/pdf-preview/
- PDFPreview.tsx         // プレビューコンポーネント
- PDFDownloadButton.tsx  // ダウンロードボタン
- PDFTemplateSelector.tsx // テンプレート選択
```

#### 2.3 ファイル管理システム
```typescript
// 実装ファイル：/frontend/src/components/upload/
- FileUploader.tsx       // ドラッグ&ドロップ対応
- UploadProgress.tsx     // アップロード進捗
- FileManager.tsx        // ファイル一覧管理
```

### 📊 **成果物・KPI**
- [ ] 申請書作成から提出まで完全フロー動作
- [ ] 全ステップでバリデーション完備
- [ ] AI生成機能統合済み
- [ ] PDF出力機能動作
- [ ] ファイルアップロード機能動作
- [ ] 自動保存機能動作

---

## 🔐 **チームB：認証・決済・インフラチーム**
**リーダー：ターミナルB**  
**責任範囲：** セキュリティ・決済・管理機能実装

### 🔥 **Phase 1: 認証システム強化**（1週間）

#### 1.1 多要素認証実装
```typescript
// バックエンド：/backend/src/services/
- twoFactorService.ts    // 2FA（Google Authenticator）
- emailVerificationService.ts // メール認証
- passwordResetService.ts // パスワードリセット

// フロントエンド：/frontend/src/features/auth/
- TwoFactorSetup.tsx     // 2FA設定画面
- EmailVerification.tsx  // メール認証画面
- PasswordReset.tsx      // パスワードリセット
```

#### 1.2 セッション管理強化
```typescript
// 実装内容：
- JWT refresh token実装
- セッション期限管理
- デバイス管理
- ログイン履歴記録
```

### 🔥 **Phase 2: 決済システム実装**（1週間）

#### 2.1 Stripe決済統合
```typescript
// バックエンド：/backend/src/services/
- paymentService.ts      // 決済処理
- subscriptionService.ts // サブスクリプション
- invoiceService.ts      // 請求書生成

// フロントエンド：/frontend/src/features/billing/
- PricingPlans.tsx       // 料金プラン
- PaymentForm.tsx        // 決済フォーム
- BillingHistory.tsx     // 請求履歴
- SubscriptionManager.tsx // プラン管理
```

#### 2.2 プラン制限システム
```typescript
// 実装内容：
- フリープラン：月3件まで
- スタンダード：月額9,800円（無制限）
- プレミアム：月額29,800円（優先サポート）
- 使用量制限チェック
- アップグレード誘導
```

### 🔥 **Phase 3: 管理者システム**（1週間）

#### 3.1 管理ダッシュボード
```typescript
// 実装ファイル：/frontend/src/admin/
- AdminDashboard.tsx     // ダッシュボード
- UserManagement.tsx     // ユーザー管理
- SystemStats.tsx        // システム統計
- RevenueAnalytics.tsx   // 売上分析
- SupportTickets.tsx     // サポート管理
```

#### 3.2 通知システム
```typescript
// バックエンド：/backend/src/services/
- notificationService.ts // 通知サービス
- emailTemplateService.ts // メールテンプレート

// フロントエンド：/frontend/src/features/notifications/
- NotificationCenter.tsx // 通知センター
- NotificationPreferences.tsx // 通知設定
```

### 📊 **成果物・KPI**
- [ ] 2FA認証動作
- [ ] メール認証・パスワードリセット動作
- [ ] Stripe決済フロー完全動作
- [ ] サブスクリプション管理完備
- [ ] 管理者ダッシュボード動作
- [ ] 通知システム動作

---

## 🎨 **チームC：UX・品質・最適化チーム**
**リーダー：ターミナルC**  
**責任範囲：** UI/UX改善・品質保証・最適化

### 🔥 **Phase 1: デザインシステム完成**（1週間）

#### 1.1 統一デザインシステム
```typescript
// 実装ファイル：/frontend/src/design-system/
- tokens/colors.ts       // カラーパレット
- tokens/typography.ts   // タイポグラフィ
- tokens/spacing.ts      // スペーシング
- tokens/shadows.ts      // シャドウ
- themes/lightTheme.ts   // ライトテーマ
- themes/darkTheme.ts    // ダークテーマ
- animations/transitions.ts // アニメーション
```

#### 1.2 アクセシビリティ対応
```typescript
// 実装内容：
- ARIA属性完備
- キーボードナビゲーション
- スクリーンリーダー対応
- カラーコントラスト最適化
- フォーカス管理
```

### 🔥 **Phase 2: モバイル・i18n対応**（1週間）

#### 2.1 完全レスポンシブ化
```typescript
// 実装ファイル：/frontend/src/styles/
- responsive.css         // レスポンシブCSS
- mobile-optimizations.css // モバイル最適化

// 対応項目：
- スマートフォン（375px-）
- タブレット（768px-）
- デスクトップ（1024px-）
- 大画面（1440px-）
```

#### 2.2 多言語対応（i18n）
```typescript
// 実装ファイル：/frontend/src/i18n/
- locales/ja/common.json     // 日本語（共通）
- locales/ja/application.json // 日本語（申請）
- locales/en/common.json     // 英語（共通）
- locales/en/application.json // 英語（申請）
- locales/zh/common.json     // 中国語（共通）
- locales/zh/application.json // 中国語（申請）
```

### 🔥 **Phase 3: PWA・パフォーマンス最適化**（1週間）

#### 3.1 PWA実装
```typescript
// 実装ファイル：
- /frontend/public/manifest.json // PWAマニフェスト
- /frontend/src/serviceWorker.ts // サービスワーカー
- /frontend/src/utils/offline.ts // オフライン対応
```

#### 3.2 パフォーマンス最適化
```typescript
// 最適化項目：
- コード分割（React.lazy）
- 画像最適化（WebP対応）
- キャッシュ戦略
- バンドルサイズ最適化
- Core Web Vitals改善
```

#### 3.3 品質保証
```typescript
// テスト実装：/frontend/cypress/
- e2e/auth.cy.ts         // 認証テスト
- e2e/application.cy.ts  // 申請フローテスト
- e2e/payment.cy.ts      // 決済テスト
- e2e/admin.cy.ts        // 管理機能テスト
```

### 📊 **成果物・KPI**
- [ ] 統一デザインシステム完成
- [ ] モバイル完全対応
- [ ] 3言語対応完了
- [ ] PWA化完了
- [ ] PageSpeed Insights 90点以上
- [ ] 全機能E2Eテスト完備

---

## 🚀 **スプリント計画**

### **第1週：基盤実装**
- **チームA**: UIコンポーネント + API層
- **チームB**: 認証強化 + 2FA
- **チームC**: デザインシステム + アクセシビリティ

### **第2週：コア機能**  
- **チームA**: ステップコンポーネント + エディタ
- **チームB**: Stripe決済 + サブスクリプション
- **チームC**: レスポンシブ + i18n

### **第3週：高度機能**
- **チームA**: PDF生成 + ファイル管理
- **チームB**: 管理ダッシュボード + 通知
- **チームC**: PWA + パフォーマンス最適化

### **第4週：統合・テスト**
- **全チーム**: 統合テスト・バグ修正・リリース準備

---

## 📋 **日次報告フォーマット**

### 毎日17:00に報告
```markdown
## チーム[A/B/C] 日次報告 - MM/DD

### ✅ 完了タスク
- [ ] タスク名（所要時間）

### 🚧 進行中タスク  
- [ ] タスク名（進捗%）

### ⚠️ ブロッカー・課題
- 課題内容と対応方針

### 📅 明日の予定
- [ ] 予定タスク
```

---

## 🎯 **品質基準チェックリスト**

### 機能要件
- [ ] 申請書作成→提出まで完結
- [ ] AI生成機能動作
- [ ] PDF出力機能動作  
- [ ] 決済フロー動作
- [ ] 管理機能動作

### 非機能要件
- [ ] 応答時間 < 3秒
- [ ] 同時接続1000ユーザー対応
- [ ] 99.9% アップタイム
- [ ] モバイル完全対応

### セキュリティ
- [ ] 2FA認証実装
- [ ] SQLインジェクション対策
- [ ] XSS対策完備
- [ ] GDPR準拠

---

## 💰 **収益目標**

### ローンチ後3ヶ月目標
- 有料ユーザー：100名
- 月間売上：150万円
- 解約率：<5%

### 損益分岐点
- 月間有料ユーザー50名で黒字化

---

これで各チームは並行作業を開始してください。**週次レビュー**で進捗確認・調整を行います。

**質問・相談は随時受け付けます。**

**頑張りましょう！ 🚀**