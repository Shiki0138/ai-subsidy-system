# UI整理 3チーム体制作業指示書

**作成日**: 2025年6月14日  
**目的**: 現在稼働中のAI補助金申請システムのUI整理・改善・統一  
**前提**: ターミナルB完了により基本機能は全て稼働中

---

## 🎯 作業概要

### 現在のシステム状況
- **基本機能**: 100%稼働（認証、申請書作成、AI生成、PDF出力）
- **UI状態**: 機能優先で実装されたため統一性に課題
- **目標**: 統一されたデザインシステムとUX改善

### 3チーム体制の目的
1. **効率性**: 並行作業による短期間での大幅改善
2. **専門性**: 各チームが特定領域に集中
3. **一貫性**: 統一されたデザインガイドライン適用

---

## 🏗️ チーム構成と役割分担

### 🎨 チームA: デザインシステム・基盤チーム
**担当領域**: 全体のデザイン統一、共通コンポーネント、ブランディング

#### 主要責任
1. **デザインシステム策定**
   - カラーパレット定義
   - タイポグラフィ規則
   - コンポーネントライブラリ

2. **共通UI改善**
   - ヘッダー・ナビゲーション
   - フッター・レイアウト
   - ローディング・エラー状態

3. **ブランド統一**
   - ロゴ・アイコン最適化
   - 全体的な視覚的一貫性

### 🖥️ チームB: ダッシュボード・メイン画面チーム
**担当領域**: ユーザーの主要動線、ダッシュボード、統計表示

#### 主要責任
1. **ダッシュボード改善**
   - 統計データの視覚化
   - カード・ウィジェット最適化
   - レスポンシブ対応

2. **ナビゲーション改善**
   - メニュー構造最適化
   - パンくずリスト
   - サイドバー設計

3. **ホーム画面強化**
   - ランディングページ改善
   - CTAボタン最適化

### 📋 チームC: フォーム・詳細画面チーム
**担当領域**: 申請書作成フォーム、詳細ページ、入力体験

#### 主要責任
1. **フォーム体験改善**
   - 5段階フォームのUX最適化
   - バリデーション表示改善
   - プログレス表示強化

2. **詳細ページ改善**
   - 申請書詳細表示最適化
   - 編集モード改善
   - PDF・プレビュー機能UI

3. **入力支援機能**
   - ツールチップ・ヘルプ
   - 入力候補・オートコンプリート

---

## 📋 作業フェーズ

### Phase 1: 分析・設計フェーズ (1時間)

#### 🎨 チームA作業
```bash
# 1. 現在のUI状況分析
cd /Users/MBP/ai-subsidy-system/frontend
find src -name "*.tsx" -o -name "*.css" | head -20

# 2. デザイントークン策定
# - 基本カラーパレット定義
# - フォント・スペーシング規則
# - ブレークポイント設定

# 3. 共通コンポーネント洗い出し
# - Button, Card, Modal等の統一
```

**成果物**: `DESIGN_SYSTEM.md`、`design-tokens.css`

#### 🖥️ チームB作業
```bash
# 1. ダッシュボード現状分析
code frontend/src/app/dashboard/DashboardClient.tsx
code frontend/src/app/page.tsx

# 2. 情報アーキテクチャ設計
# - ダッシュボード要素優先度
# - ナビゲーション構造
# - レイアウト改善案

# 3. データ視覚化計画
# - 統計表示方法
# - グラフ・チャート選定
```

**成果物**: `DASHBOARD_IMPROVEMENT_PLAN.md`

#### 📋 チームC作業
```bash
# 1. フォーム体験分析
code frontend/src/app/dashboard/applications/new/NewApplicationClient.tsx
code frontend/src/app/dashboard/applications/[id]/ApplicationDetailsClient.tsx

# 2. UXフロー設計
# - フォーム入力体験マッピング
# - エラー・成功状態設計
# - 操作説明・ガイダンス

# 3. アクセシビリティチェック
# - キーボードナビゲーション
# - スクリーンリーダー対応
```

**成果物**: `FORM_UX_IMPROVEMENT_PLAN.md`

---

### Phase 2: 実装フェーズ (3-4時間)

#### 🎨 チームA実装項目

##### 2.1 デザインシステム実装
```typescript
// frontend/src/styles/design-system.css
:root {
  /* カラーパレット */
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-900: #1e3a8a;
  
  /* タイポグラフィ */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  
  /* スペーシング */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-4: 1rem;
  --spacing-8: 2rem;
}
```

##### 2.2 共通コンポーネント更新
```typescript
// frontend/src/components/ui/Button.tsx - 統一仕様
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  // ... 統一プロパティ
}
```

##### 2.3 レイアウト統一
- ヘッダー・ナビゲーション統一
- フッター改善
- グローバルスタイル適用

#### 🖥️ チームB実装項目

##### 2.1 ダッシュボード改善
```typescript
// frontend/src/app/dashboard/DashboardClient.tsx
// - 統計カード再設計
// - グラフ・チャート追加
// - レスポンシブグリッド最適化
```

##### 2.2 ナビゲーション強化
```typescript
// ナビゲーション構造
const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: HomeIcon },
  { name: '申請書作成', href: '/dashboard/applications/new', icon: PlusIcon },
  { name: '申請書一覧', href: '/dashboard/applications', icon: DocumentTextIcon },
  { name: 'プロフィール', href: '/dashboard/profile', icon: UserIcon },
];
```

##### 2.3 データ表示改善
- 統計ウィジェット視覚化
- プログレス表示
- アニメーション追加

#### 📋 チームC実装項目

##### 2.1 フォーム体験向上
```typescript
// frontend/src/app/dashboard/applications/new/NewApplicationClient.tsx
// - ステップインジケーター改善
// - リアルタイムバリデーション強化
// - 入力支援機能追加
```

##### 2.2 詳細ページ改善
```typescript
// frontend/src/app/dashboard/applications/[id]/ApplicationDetailsClient.tsx
// - 読みやすい表示レイアウト
// - 編集モードUI改善
// - アクションボタン最適化
```

##### 2.3 入力支援機能
- ツールチップ・ヘルプテキスト
- 入力例・プレースホルダー改善
- エラーメッセージ改善

---

### Phase 3: 統合・テストフェーズ (1時間)

#### 全チーム共同作業
1. **UI統一性チェック**
   - デザインシステム適用確認
   - 一貫性検証

2. **レスポンシブテスト**
   - モバイル・タブレット表示確認
   - ブレークポイント動作確認

3. **ユーザビリティテスト**
   - 基本フロー操作確認
   - アクセシビリティチェック

---

## 🔒 開発ルール遵守事項

### 絶対厳守項目
1. **既存機能は削除しない**
   - 認証機能は完全保持
   - 申請書作成・編集機能保持
   - AI生成・PDF機能保持

2. **段階的改善**
   - 一度に全てを変更しない
   - 機能単位での段階的改善
   - 常にロールバック可能な状態維持

3. **相互調整**
   - チーム間のデザイン統一
   - コンポーネント重複排除
   - 命名規則統一

---

## 📁 ファイル構成・分担

### 🎨 チームA担当ファイル
```
frontend/src/
├── styles/design-system.css          # 新規作成
├── components/ui/                     # 統一改善
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   └── ...
├── app/layout.tsx                     # グローバルレイアウト
└── app/globals.css                    # 基本スタイル
```

### 🖥️ チームB担当ファイル
```
frontend/src/
├── app/page.tsx                       # ホームページ
├── app/dashboard/
│   ├── DashboardClient.tsx           # メインダッシュボード
│   └── layout.tsx                    # ダッシュボードレイアウト
└── components/dashboard/             # 新規作成
    ├── StatCard.tsx
    ├── Chart.tsx
    └── ...
```

### 📋 チームC担当ファイル
```
frontend/src/
├── app/dashboard/applications/
│   ├── new/NewApplicationClient.tsx   # 申請書作成フォーム
│   └── [id]/ApplicationDetailsClient.tsx # 申請書詳細
├── components/forms/                  # 新規作成
│   ├── FormStep.tsx
│   ├── ValidationMessage.tsx
│   └── ...
└── components/application/
    └── ApplicationEditForm.tsx       # 編集フォーム
```

---

## 🧪 テスト・検証方法

### 各Phase完了時のチェックリスト

#### Phase 1完了チェック
- [ ] 各チームが改善計画書を作成
- [ ] デザインシステム基本仕様決定
- [ ] ファイル分担確認

#### Phase 2完了チェック
- [ ] 各チームの実装完了
- [ ] デザインシステム適用
- [ ] 既存機能の動作確認

#### Phase 3完了チェック
- [ ] 全画面でのUI統一確認
- [ ] レスポンシブ動作確認
- [ ] ユーザビリティテスト完了

### 動作確認手順
```bash
# 1. システム起動
cd /Users/MBP/ai-subsidy-system
# バックエンド: backend/node test-local-api.js
# フロントエンド: frontend/npm run dev

# 2. 基本フロー確認
# - ログイン (demo@demo.com / demo123)
# - ダッシュボード表示
# - 申請書作成フロー
# - 申請書詳細表示
# - PDF出力・プレビュー

# 3. レスポンシブ確認
# - デスクトップ (1920x1080)
# - タブレット (768x1024)
# - スマートフォン (375x667)
```

---

## 🎯 成功判定基準

### 完了条件
1. **視覚的統一性**: 全画面で一貫したデザイン
2. **ユーザビリティ**: 直感的で使いやすいUI
3. **レスポンシブ**: 全デバイスで適切な表示
4. **パフォーマンス**: 既存機能の動作速度維持
5. **アクセシビリティ**: キーボード操作・スクリーンリーダー対応

### 品質指標
- **統一性スコア**: 90%以上（デザインシステム適用率）
- **操作効率**: 既存比20%向上
- **表示速度**: 既存レベル維持
- **エラー率**: 0.1%以下

---

## 🚀 開始手順

### 各チーム作業開始前の準備
```bash
# 1. 最新状態確認
cd /Users/MBP/ai-subsidy-system
git status  # (運用中はgit管理推奨)

# 2. バックアップ作成
cp -r frontend/src frontend/src.backup.$(date +%Y%m%d%H%M)

# 3. 作業環境確認
cd frontend && npm run dev  # フロントエンド起動確認
cd ../backend && node test-local-api.js  # バックエンド起動確認
```

### チーム作業開始宣言
各チームは作業開始時に以下を宣言：
1. **担当チーム名** (A/B/C)
2. **作業開始時刻**
3. **Phase 1目標完了時刻**

---

## 📞 チーム間連携

### 定期同期
- **30分毎**: 進捗共有
- **Phase完了時**: 統合確認
- **問題発生時**: 即座に相談

### 共有事項
- デザイントークンの更新
- 共通コンポーネントの変更
- 重複作業の回避

---

**この指示書に従って、3チーム体制でUI整理作業を開始してください！**