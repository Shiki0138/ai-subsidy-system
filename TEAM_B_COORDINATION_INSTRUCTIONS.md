# チームB：ダッシュボード・メイン画面チーム 統括指示書

**チームリーダー**: チームB  
**作成日**: 2025年6月14日  
**目的**: チームA・Cとの連携によるUI整理作業の統括管理

---

## 🎯 チームB責任範囲

### 主担当領域
- **ダッシュボード** (`frontend/src/app/dashboard/DashboardClient.tsx`)
- **ホーム画面** (`frontend/src/app/page.tsx`)
- **ナビゲーション構造** 全体設計
- **レイアウト統一** 画面間一貫性

### 統括責任
- 各チーム間のデザイン調整
- 全体UI一貫性の確保
- プロジェクト進捗管理

---

## 📋 チームA・C作業指示

### 🎨 チームA作業指示書

#### Phase 1: デザインシステム策定 (1時間)

**最優先作業**:
```bash
# 1. 現在のUIコンポーネント分析
cd /Users/MBP/ai-subsidy-system/frontend/src
find . -name "*.tsx" -exec grep -l "className.*bg-\|className.*text-\|className.*border-" {} \;

# 2. カラーパレット統一
# 分析対象: Button.tsx, Card, Modal等の色使用状況
```

**成果物要求**:
1. **デザイントークン定義** (`design-tokens.css`)
```css
:root {
  /* ブランドカラー */
  --brand-primary: #2563eb;
  --brand-secondary: #64748b;
  --brand-accent: #10b981;
  
  /* グレースケール */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-900: #111827;
  
  /* 状態カラー */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```

2. **共通コンポーネント統一仕様書**
   - Button: variant, size, loading state統一
   - Card: padding, shadow, border統一
   - Modal: サイズ、動作仕様統一

**チームBとの調整事項**:
- ダッシュボードカードの色合いをチームBが指定
- ナビゲーション要素の色合いをチームBが指定
- 全体ブランディングをチームBが最終承認

#### Phase 2: 実装 (3時間)

**実装優先順位**:
1. **最優先**: `components/ui/Button.tsx` 統一
2. **高優先**: 共通レイアウト (`app/layout.tsx`)
3. **中優先**: その他共通コンポーネント

**実装完了報告**:
チームBに30分毎の進捗報告必須

---

### 📋 チームC作業指示書

#### Phase 1: フォーム・詳細画面分析 (1時間)

**最優先作業**:
```bash
# 1. 現在のフォーム状況分析
cd /Users/MBP/ai-subsidy-system/frontend/src/app/dashboard/applications
code new/NewApplicationClient.tsx
code [id]/ApplicationDetailsClient.tsx

# 2. UX課題洗い出し
# - ステップインジケーターの改善点
# - バリデーション表示の改善点
# - 操作フローの改善点
```

**成果物要求**:
1. **フォームUX改善計画書** (`FORM_UX_ANALYSIS.md`)
   - 現在の課題リスト
   - 改善提案
   - 実装優先度

2. **画面遷移フロー図**
   - 申請書作成の全ステップ
   - エラー・成功状態の処理
   - ユーザーガイダンス配置

**チームBとの調整事項**:
- フォーム内ナビゲーション（戻る/次へボタン）デザイン
- 詳細ページのアクションボタン配置
- ダッシュボードからの遷移方法

#### Phase 2: 実装 (3時間)

**実装優先順位**:
1. **最優先**: 5段階フォームのステップ表示改善
2. **高優先**: 申請書詳細ページの表示レイアウト改善
3. **中優先**: バリデーション・エラー表示改善

**実装完了報告**:
チームBに30分毎の進捗報告必須

---

## 📊 チームB自身の作業計画

### Phase 1: ダッシュボード・ナビゲーション設計 (1時間)

#### 1.1 現状分析
```bash
# ダッシュボード現状確認
cd /Users/MBP/ai-subsidy-system/frontend/src/app/dashboard
code DashboardClient.tsx

# ホーム画面現状確認
cd /Users/MBP/ai-subsidy-system/frontend/src/app
code page.tsx
```

#### 1.2 情報アーキテクチャ設計
**ダッシュボード要素優先度**:
1. **最重要**: 申請書一覧・ステータス
2. **重要**: 統計サマリー（作成数、完了数、進行中）
3. **補助**: クイックアクション、最近の活動

**ナビゲーション構造**:
```typescript
const mainNavigation = [
  { 
    name: 'ダッシュボード', 
    href: '/dashboard', 
    icon: HomeIcon,
    description: 'メイン画面'
  },
  { 
    name: '新規作成', 
    href: '/dashboard/applications/new', 
    icon: PlusCircleIcon,
    description: '申請書を作成'
  },
  { 
    name: '申請書一覧', 
    href: '/dashboard/applications', 
    icon: DocumentTextIcon,
    description: '作成済み申請書'
  },
  { 
    name: 'プロフィール', 
    href: '/dashboard/profile', 
    icon: UserIcon,
    description: 'アカウント設定'
  }
];
```

### Phase 2: ダッシュボード・ナビゲーション実装 (3時間)

#### 2.1 ダッシュボード統計ウィジェット実装
```typescript
// frontend/src/components/dashboard/StatsGrid.tsx
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType;
}

const statsData = [
  {
    title: '申請書総数',
    value: applications.length,
    icon: DocumentTextIcon,
    trend: 'up'
  },
  {
    title: '完了済み',
    value: applications.filter(app => app.status === 'COMPLETED').length,
    icon: CheckCircleIcon,
    trend: 'up'
  },
  {
    title: '作成中',
    value: applications.filter(app => app.status === 'DRAFT').length,
    icon: ClockIcon,
    trend: 'neutral'
  }
];
```

#### 2.2 レスポンシブナビゲーション実装
```typescript
// frontend/src/components/navigation/MainNavigation.tsx
// - デスクトップ: サイドバー
// - タブレット: 折りたたみ式
// - スマートフォン: ボトムナビゲーション
```

#### 2.3 ホーム画面改善
```typescript
// frontend/src/app/page.tsx
// - ヒーローセクション改善
// - 機能紹介セクション
// - CTAボタン最適化
```

---

## 🔄 チーム間連携プロトコル

### 定期報告スケジュール
- **30分毎**: 各チームから進捗報告
- **1時間毎**: 統合確認・調整会議
- **Phase完了時**: 全体統合テスト

### 報告フォーマット
```
[チーム名] - [時刻]
✅ 完了: [実装した機能]
🔄 進行中: [現在作業中の機能]
⚠️ 課題: [発生した問題・調整事項]
📅 次30分の予定: [予定作業]
```

### 統合ポイント
1. **デザイントークン統一** (チームA → B → C)
2. **コンポーネント仕様調整** (全チーム)
3. **画面遷移フロー確認** (チームB ↔ C)

---

## 📁 ファイル分担・競合回避

### 🎨 チームA専用ファイル
```
frontend/src/
├── styles/design-system.css          # 新規作成
├── components/ui/                     # 統一改善
│   ├── Button.tsx                    # 最優先
│   ├── Card.tsx                      # 高優先  
│   ├── Modal.tsx                     # 中優先
│   └── Input.tsx                     # 中優先
└── app/globals.css                   # グローバルスタイル
```

### 🖥️ チームB専用ファイル
```
frontend/src/
├── app/page.tsx                      # ホームページ
├── app/dashboard/
│   ├── DashboardClient.tsx          # メインダッシュボード
│   └── layout.tsx                   # ダッシュボードレイアウト
├── components/dashboard/            # 新規作成
│   ├── StatsGrid.tsx               # 統計表示
│   ├── ActivityFeed.tsx            # 活動履歴
│   └── QuickActions.tsx            # クイックアクション
└── components/navigation/           # 新規作成
    ├── MainNavigation.tsx          # メインナビ
    └── Breadcrumb.tsx              # パンくず
```

### 📋 チームC専用ファイル
```
frontend/src/
├── app/dashboard/applications/
│   ├── new/NewApplicationClient.tsx  # フォーム改善
│   └── [id]/ApplicationDetailsClient.tsx # 詳細改善
├── components/forms/                # 新規作成
│   ├── FormStep.tsx                # ステップ表示
│   ├── ValidationMessage.tsx       # バリデーション
│   ├── ProgressIndicator.tsx       # 進捗表示
│   └── FormField.tsx               # フィールド共通
└── components/application/
    ├── ApplicationEditForm.tsx     # 編集フォーム
    └── ApplicationPreview.tsx      # プレビュー表示
```

---

## 🧪 統合テスト・品質保証

### Phase完了時チェックリスト

#### Phase 1完了確認
- [ ] チームA: デザイントークン策定完了
- [ ] チームB: ダッシュボード設計完了  
- [ ] チームC: フォームUX設計完了
- [ ] 全チーム: 実装計画合意

#### Phase 2完了確認
- [ ] チームA: 共通コンポーネント統一完了
- [ ] チームB: ダッシュボード・ナビゲーション改善完了
- [ ] チームC: フォーム・詳細ページ改善完了
- [ ] 全チーム: デザイン統一確認

#### Phase 3完了確認
- [ ] 全画面デザイン統一確認
- [ ] レスポンシブ動作確認
- [ ] 既存機能動作確認
- [ ] パフォーマンス確認

### 統合テスト手順
```bash
# 1. システム起動確認
cd /Users/MBP/ai-subsidy-system
# バックエンド確認
curl -s http://localhost:3001/api/health

# 2. 主要フロー確認
# - ログイン → ダッシュボード → 申請書作成 → 詳細表示 → PDF出力

# 3. レスポンシブ確認
# ブラウザ開発者ツールで各ブレークポイント確認
```

---

## 🚨 緊急時対応

### 問題発生時の対応
1. **即座にチームB（統括）に報告**
2. **作業を一時停止**
3. **問題箇所の特定・共有**
4. **解決策の協議**

### ロールバック手順
```bash
# 緊急時のバックアップ復元
cd /Users/MBP/ai-subsidy-system
cp -r frontend/src.backup.* frontend/src
npm run dev  # 動作確認
```

---

## 📈 成功指標・KPI

### 完了判定基準
1. **視覚的統一性**: 90%以上（色・フォント・スペーシング統一）
2. **操作効率**: ダッシュボード表示速度向上
3. **ユーザビリティ**: 直感的な操作フロー実現
4. **レスポンシブ**: 全デバイス対応
5. **既存機能維持**: 100%（機能削除なし）

### 測定方法
- デザイントークン適用率
- ページロード時間
- 操作ステップ数
- エラー発生率

---

## 🎯 作業開始宣言

**チームB開始宣言**:
- **開始時刻**: [開始時に記録]
- **Phase 1目標**: 1時間後完了
- **最終目標**: 5時間後UI整理完了

**各チームへの開始指示**:
- チームA: この指示書確認後、即座にPhase 1開始
- チームC: この指示書確認後、即座にPhase 1開始

---

**この指示書に従い、3チーム体制でUI整理作業を開始します！**