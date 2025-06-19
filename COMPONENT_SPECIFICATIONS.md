# 共通コンポーネント仕様

**作成日**: 2025年6月17日  
**デザインシステム**: AI補助金システム統一仕様

---

## 🎨 デザイン原則

### ブランドアイデンティティ
- **プライマリカラー**: `#2563eb` (Blue-600) - 信頼性・プロフェッショナル
- **セカンダリカラー**: `#64748b` (Gray-500) - 洗練・安定感
- **アクセントカラー**: `#10b981` (Green-500) - 成功・前進

### 視覚的優先順位
1. **高**: エラー (Red) > 成功 (Green) > 警告 (Yellow)
2. **中**: プライマリアクション (Blue) > セカンダリアクション (Gray)
3. **低**: 情報表示 (Gray系統)

---

## 🔘 Button仕様

### バリエーション
| Variant | 用途 | 背景色 | テキスト色 | ボーダー |
|---------|------|--------|------------|----------|
| `primary` | メインアクション | `bg-blue-600` | `text-white` | なし |
| `secondary` | サブアクション | `bg-gray-600` | `text-white` | なし |
| `outline` | 境界線スタイル | `bg-white` | `text-gray-700` | `border-gray-300` |
| `ghost` | 背景なしスタイル | `transparent` | `text-gray-700` | なし |

### サイズ
| Size | 高さ | パディング | フォントサイズ | 用途 |
|------|------|------------|---------------|------|
| `sm` | `32px` | `px-3 py-1.5` | `text-sm` | 小さなアクション |
| `md` | `40px` | `px-4 py-2` | `text-base` | 標準サイズ |
| `lg` | `48px` | `px-6 py-3` | `text-lg` | 重要なアクション |

### 状態
- **default**: 通常状態
- **hover**: ホバー状態（色を濃く）
- **active**: アクティブ状態
- **disabled**: 無効状態（`opacity-50`）
- **loading**: ローディング状態（スピナー表示）

### アクセシビリティ
- `focus:ring-2 focus:ring-offset-2` - フォーカス表示
- `focus:outline-none` - アウトライン非表示
- キーボードナビゲーション対応
- スクリーンリーダー対応

---

## 🃏 Card仕様

### 基本構造
```typescript
<Card padding="md">
  <CardHeader>タイトル</CardHeader>
  <CardBody>メインコンテンツ</CardBody>
  <CardFooter>アクション</CardFooter>
</Card>
```

### パディングオプション
| Padding | 値 | 用途 |
|---------|---|------|
| `none` | `p-0` | カスタムレイアウト |
| `sm` | `p-4` | コンパクト表示 |
| `md` | `p-6` | 標準（デフォルト） |
| `lg` | `p-8` | ゆったり表示 |

### 視覚スタイル
- **背景**: `bg-white`
- **ボーダー**: `border border-gray-200`
- **角丸**: `rounded-lg`
- **シャドウ**: `shadow-sm`

### コンポーネント間の区切り
- **CardHeader**: `border-b border-gray-200 pb-4 mb-4`
- **CardFooter**: `border-t border-gray-200 pt-4 mt-4`

---

## 📝 Input仕様

### バリエーション
| Variant | スタイル | 用途 |
|---------|----------|------|
| `default` | 標準ボーダー | 一般的な入力フィールド |
| `filled` | 背景色あり | モダンなスタイル |
| `flushed` | 下線のみ | ミニマルデザイン |

### 状態
- **通常**: `border-gray-300 focus:border-blue-500`
- **エラー**: `border-red-500 focus:border-red-500`
- **無効**: `opacity-50 cursor-not-allowed`

### サイズ統一
- **高さ**: `h-10` (40px) - Buttonのmdと統一
- **パディング**: `px-3 py-2`
- **フォント**: `text-base`

---

## 🚀 実装優先順位

### Phase 1 (完了目標: 1時間)
1. **Button.tsx** - 最重要、全画面で使用
2. **Card.tsx** - ダッシュボード・フォームで多用
3. **グローバルスタイル** - 基盤となるCSS

### Phase 2 (完了目標: 2時間)
1. **Input.tsx** - フォーム統一
2. **Modal.tsx** - ダイアログ統一
3. **Badge.tsx** - ステータス表示統一

---

**この仕様書に基づいて、統一性・一貫性・使いやすさを重視した高品質なコンポーネントを構築してください。**