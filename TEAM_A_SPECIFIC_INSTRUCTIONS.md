# チームA：デザインシステム・基盤チーム 専用作業指示書

**発行者**: チームB（統括）  
**受領者**: チームA  
**作成日**: 2025年6月14日  
**緊急度**: 最高  

---

## 🎯 チームA専任ミッション

### 責任範囲
**あなたはデザインシステムの設計者です**
- 全UIの視覚的統一性確保
- 共通コンポーネントの品質責任
- ブランドアイデンティティの統一

### 最重要目標
1. **デザイントークン策定** - 全チームの基盤となる
2. **Button・Card等共通コンポーネント統一** - 最も使用頻度が高い
3. **グローバルスタイル適用** - 全画面に影響

---

## 📋 Phase 1: 分析・設計フェーズ (1時間厳守)

### 1.1 現状UI分析 (20分)
```bash
# 作業ディレクトリ移動
cd /Users/MBP/ai-subsidy-system/frontend/src

# 現在使用されている色・スタイル分析
echo "=== 現在のカラー使用状況 ===" > ui-analysis.txt
find . -name "*.tsx" -exec grep -H "bg-\|text-\|border-" {} \; >> ui-analysis.txt

# コンポーネント使用状況確認
find ./components -name "*.tsx" -type f | xargs wc -l | sort -n

# 最も重要: Button.tsxの現状確認
code components/ui/Button.tsx
```

**分析対象**:
- 現在のカラーパレット使用状況
- フォントサイズ・ウェイト使用パターン
- スペーシング・マージン使用パターン
- ボタン・カードのデザインバリエーション

### 1.2 デザイントークン設計 (25分)
**最優先で作成**: `frontend/src/styles/design-system.css`

```css
/* ===== AI補助金システム デザインシステム ===== */
:root {
  /* === ブランドカラー === */
  --brand-primary: #2563eb;      /* メインブルー */
  --brand-primary-dark: #1d4ed8;
  --brand-primary-light: #3b82f6;
  
  --brand-secondary: #64748b;    /* グレー */
  --brand-accent: #10b981;       /* グリーン（成功） */
  
  /* === セマンティックカラー === */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* === グレースケール === */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  /* === タイポグラフィ === */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  
  --font-size-xs: 0.75rem;       /* 12px */
  --font-size-sm: 0.875rem;      /* 14px */
  --font-size-base: 1rem;        /* 16px */
  --font-size-lg: 1.125rem;      /* 18px */
  --font-size-xl: 1.25rem;       /* 20px */
  --font-size-2xl: 1.5rem;       /* 24px */
  --font-size-3xl: 1.875rem;     /* 30px */
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* === スペーシング === */
  --spacing-0: 0;
  --spacing-1: 0.25rem;          /* 4px */
  --spacing-2: 0.5rem;           /* 8px */
  --spacing-3: 0.75rem;          /* 12px */
  --spacing-4: 1rem;             /* 16px */
  --spacing-5: 1.25rem;          /* 20px */
  --spacing-6: 1.5rem;           /* 24px */
  --spacing-8: 2rem;             /* 32px */
  --spacing-10: 2.5rem;          /* 40px */
  --spacing-12: 3rem;            /* 48px */
  --spacing-16: 4rem;            /* 64px */
  --spacing-20: 5rem;            /* 80px */
  
  /* === ボーダー・シャドウ === */
  --border-radius-sm: 0.25rem;   /* 4px */
  --border-radius-md: 0.375rem;  /* 6px */
  --border-radius-lg: 0.5rem;    /* 8px */
  --border-radius-xl: 0.75rem;   /* 12px */
  
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  
  /* === トランジション === */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}
```

### 1.3 コンポーネント統一仕様策定 (15分)
**作成ファイル**: `COMPONENT_SPECIFICATIONS.md`

```markdown
# 共通コンポーネント仕様

## Button仕様
### バリエーション
- primary: メインアクション用
- secondary: サブアクション用  
- outline: 境界線スタイル
- ghost: 背景なしスタイル

### サイズ
- sm: 32px高さ、小さなアクション用
- md: 40px高さ、標準サイズ
- lg: 48px高さ、重要なアクション用

### 状態
- default: 通常状態
- hover: ホバー状態
- active: アクティブ状態
- disabled: 無効状態
- loading: ローディング状態
```

---

## 📋 Phase 2: 実装フェーズ (3時間)

### 2.1 グローバルスタイル適用 (30分)
**作業ファイル**: `frontend/src/app/globals.css`

```css
/* デザインシステムインポート */
@import '../styles/design-system.css';

/* Tailwindリセット */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* グローバルベーススタイル */
@layer base {
  * {
    box-sizing: border-box;
  }
  
  html {
    font-family: var(--font-family-sans);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  body {
    background-color: var(--gray-50);
    color: var(--gray-900);
    font-size: var(--font-size-base);
  }
}

/* 共通ユーティリティクラス */
@layer components {
  .btn-base {
    @apply inline-flex items-center justify-center rounded-md font-medium transition-colors;
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .card-base {
    @apply bg-white rounded-lg shadow-sm border border-gray-200;
  }
  
  .input-base {
    @apply w-full rounded-md border border-gray-300 bg-white px-3 py-2;
    @apply focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500;
  }
}
```

### 2.2 Button.tsx完全リニューアル (45分)
**最重要ファイル**: `frontend/src/components/ui/Button.tsx`

```typescript
'use client'

import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'btn-base'
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-4 py-2 text-base h-10',
      lg: 'px-6 py-3 text-lg h-12'
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          (disabled || loading) && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
```

### 2.3 Card.tsx統一実装 (30分)
**作業ファイル**: `frontend/src/components/ui/Card.tsx`

```typescript
import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const Card = ({ className, padding = 'md', children, ...props }: CardProps) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  return (
    <div
      className={cn('card-base', paddingStyles[padding], className)}
      {...props}
    >
      {children}
    </div>
  )
}

const CardHeader = ({ className, children, ...props }: CardHeaderProps) => (
  <div className={cn('border-b border-gray-200 pb-4 mb-4', className)} {...props}>
    {children}
  </div>
)

const CardBody = ({ className, children, ...props }: CardBodyProps) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
)

const CardFooter = ({ className, children, ...props }: CardFooterProps) => (
  <div className={cn('border-t border-gray-200 pt-4 mt-4', className)} {...props}>
    {children}
  </div>
)

export { Card, CardHeader, CardBody, CardFooter }
```

### 2.4 Layout.tsx統一適用 (30分)
**作業ファイル**: `frontend/src/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI補助金申請システム',
  description: 'AI技術による高品質な補助金申請書自動生成システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
```

### 2.5 その他共通コンポーネント (45分)
**実装順序**:
1. `Input.tsx` - フォーム要素統一
2. `Modal.tsx` - ダイアログ統一  
3. `Badge.tsx` - ステータス表示統一

---

## 📊 チームBとの連携ポイント

### 30分毎報告内容
```
チームA - [時刻]
✅ 完了: デザイントークン策定
🔄 進行中: Button.tsx実装
⚠️ 課題: なし
📅 次30分: Card.tsx実装予定
```

### チームBへの確認事項
1. **ダッシュボードカードの色合い**: チームBが指定する色使い
2. **ナビゲーション要素**: ボタンスタイルの統一仕様
3. **ブランドカラー**: 最終的な承認

### 調整が必要な場合
- **即座にチームBに連絡**
- 作業を一時停止して調整
- 方針確定後に再開

---

## 🧪 品質保証・テスト

### 実装完了後のセルフチェック
```bash
# 1. デザイントークン適用確認
cd /Users/MBP/ai-subsidy-system/frontend
npm run dev

# 2. Button.tsx動作確認
# - 全variant, size組み合わせ確認
# - loading状態確認
# - disabled状態確認

# 3. レスポンシブ確認
# ブラウザ開発者ツールで各ブレークポイント確認
```

### 統合確認項目
- [ ] 全コンポーネントでデザイントークン使用
- [ ] 色・フォント・スペーシングの統一
- [ ] ダークモード対応（将来対応）
- [ ] アクセシビリティ基準準拠

---

## 🚨 注意事項・制約

### 絶対に削除してはいけないもの
- 既存の機能ロジック
- 認証関連のコンポーネント
- API呼び出し部分

### 変更時の原則
```typescript
// ❌ 悪い例：既存機能を削除
// const handleLogin = () => { /* 削除 */ }

// ✅ 良い例：デザインのみ変更
const handleLogin = () => {
  // 既存ロジック保持
  // スタイルのみ更新
}
```

### 緊急時連絡
**問題発生時は即座にチームBに報告**
- デザイン判断で迷った場合
- 技術的な問題が発生した場合
- 想定より時間がかかる場合

---

## 🎯 成功判定基準

### Phase 1完了基準
- [ ] デザイントークン策定完了
- [ ] コンポーネント仕様書作成完了
- [ ] 実装計画確定

### Phase 2完了基準
- [ ] Button.tsx完全統一完了
- [ ] Card.tsx統一完了
- [ ] グローバルスタイル適用完了
- [ ] 全画面での統一確認

### 最終完了基準
- [ ] 全コンポーネントがデザインシステム準拠
- [ ] チームB・Cの画面との統一性確保
- [ ] レスポンシブ対応完了

---

## 📅 作業開始

**チームA作業開始宣言**:
- この指示書確認完了
- Phase 1即座開始
- 1時間後にPhase 2移行

**チームBからの期待**:
あなたの作業が全体のUI統一の基盤となります。
高品質なデザインシステムの構築をお願いします。

---

**頑張ってください！チームBはあなたをサポートします。**