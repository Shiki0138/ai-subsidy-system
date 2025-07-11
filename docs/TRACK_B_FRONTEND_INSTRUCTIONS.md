# 🎨 Track B: フロントエンド開発指示書

## 📋 概要
**担当**: フロントエンド開発者  
**期間**: 2025年6月13日 - 6月19日 (7日間)  
**目標**: 認証フロー完成 + プロフィール管理UI実装

---

## 🎯 Day 1: 緊急バグ修正

### ✅ チェックリスト（実行前確認）
```bash
# 1. 環境確認
cd /Users/MBP/ai-subsidy-system/frontend
npm --version  # 10.9.2以上
node --version # v23.11.0以上

# 2. ビルドエラー確認
npm run build
# → cacheTime エラーが表示されることを確認

# 3. 現在のファイル構造確認
ls -la src/app/
# → providers.tsx が存在することを確認
```

### 🚨 Task 1: ビルドエラー修正 (cacheTime → gcTime)
**ファイル**: `src/app/providers.tsx:14`  
**推定時間**: 30分  
**優先度**: CRITICAL

#### 問題箇所
```typescript
// ❌ エラー箇所（14行目）
cacheTime: 10 * 60 * 1000, // 10分
```

#### 修正内容
```typescript
// ✅ 修正版
gcTime: 10 * 60 * 1000, // 10分 (React Query v5では cacheTime は gcTime に変更)
```

#### 実装手順
1. **ファイル確認**
```bash
# エラー箇所特定
grep -n "cacheTime" src/app/providers.tsx
```

2. **修正実行**
```bash
# src/app/providers.tsx を編集
# 14行目: cacheTime → gcTime に変更
```

3. **動作確認**
```bash
# ビルドテスト
npm run build
# → エラーが解消されることを確認

# 開発サーバー起動テスト
npm run dev
# → http://localhost:3000 が正常表示されること
```

#### 成功確認方法
```bash
# 1. ビルド成功確認
npm run build
# Expected: "Compiled successfully" 表示

# 2. 型チェック成功確認
npm run type-check || npx tsc --noEmit
# Expected: エラーなし

# 3. 開発サーバー動作確認
npm run dev &
curl http://localhost:3000
# Expected: HTMLレスポンス取得
```

---

## 🎯 Day 2-3: 認証フロー修正

### 📝 Task 2: 認証状態管理修正
**ファイル**: `src/app/providers.tsx`  
**推定時間**: 4時間  
**優先度**: HIGH

#### 実装内容
- React Query設定の完全化
- 認証状態の永続化
- エラーハンドリングの統一

#### 実装手順
1. **React Query設定確認**
```typescript
// src/app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分
      gcTime: 10 * 60 * 1000,   // 10分 (修正済み)
      retry: (failureCount, error: any) => {
        // 認証エラーの場合はリトライしない
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});
```

2. **認証状態フック作成**
```bash
# 新規ファイル作成
touch src/hooks/useAuth.ts
```

3. **認証コンテキスト実装**
```typescript
// src/hooks/useAuth.ts
export interface AuthUser {
  id: string;
  email: string;
  companyName: string;
  representativeName: string;
}

export const useAuth = () => {
  // JWT token管理
  // ユーザー情報キャッシュ
  // ログイン/ログアウト機能
};
```

### 📝 Task 3: ログインフォーム修正
**ファイル**: `src/components/auth/LoginForm.tsx`  
**推定時間**: 3時間  
**優先度**: HIGH

#### 実装内容
- エラー表示の統一
- ローディング状態の改善
- リダイレクト処理の修正

#### 実装手順
1. **現在のフォーム確認**
```bash
# ファイル確認
cat src/components/auth/LoginForm.tsx
```

2. **エラーハンドリング改善**
```typescript
// エラー状態管理
const [error, setError] = useState<string | null>(null);

// API呼び出し時のエラー処理
try {
  const response = await login(data);
  // 成功時のリダイレクト
  router.push('/dashboard');
} catch (err) {
  // エラー表示
  setError('ログインに失敗しました。');
}
```

3. **レスポンシブ対応**
```typescript
// Tailwind CSS でモバイル対応
className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md"
```

### 📝 Task 4: 登録フォーム修正
**ファイル**: `src/components/auth/RegisterForm.tsx`  
**推定時間**: 3時間  
**優先度**: HIGH

#### 実装内容
- バリデーション強化
- 企業情報入力の改善
- 成功時の処理改善

---

## 🎯 Day 4-5: プロフィール管理UI

### 📝 Task 5: プロフィール編集ページ作成
**ファイル**: `src/app/dashboard/profile/page.tsx`  
**推定時間**: 6時間  
**優先度**: HIGH

#### 実装内容
```typescript
// プロフィール編集フォーム
interface ProfileFormData {
  companyName: string;
  representativeName: string;
  businessType: string;
  foundedYear: number;
  employeeCount: number;
  website?: string;
  description?: string;
}
```

#### ファイル構造
```bash
# 新規ディレクトリ・ファイル作成
mkdir -p src/app/dashboard/profile
touch src/app/dashboard/profile/page.tsx
touch src/components/profile/ProfileEditForm.tsx
touch src/components/profile/ProfileSummary.tsx
```

#### 実装手順
1. **基本レイアウト作成**
```tsx
// src/app/dashboard/profile/page.tsx
export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">プロフィール管理</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProfileSummary />
        <ProfileEditForm />
      </div>
    </div>
  );
}
```

2. **編集フォーム実装**
```tsx
// src/components/profile/ProfileEditForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const profileSchema = z.object({
  companyName: z.string().min(1, '会社名は必須です').max(100),
  representativeName: z.string().min(1, '代表者名は必須です').max(50),
  businessType: z.string().min(1, '業種を選択してください'),
  foundedYear: z.number().min(1900).max(new Date().getFullYear()),
  employeeCount: z.number().min(1, '従業員数は1人以上を入力してください'),
  website: z.string().url('正しいURLを入力してください').optional(),
  description: z.string().max(1000, '1000文字以内で入力してください').optional(),
});
```

3. **API連携**
```tsx
// プロフィール更新API呼び出し
const updateProfile = useMutation({
  mutationFn: async (data: ProfileFormData) => {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  onSuccess: () => {
    toast.success('プロフィールを更新しました');
  },
  onError: () => {
    toast.error('更新に失敗しました');
  },
});
```

### 📝 Task 6: ダッシュボード統計表示
**ファイル**: `src/app/dashboard/page.tsx`  
**推定時間**: 4時間  
**優先度**: MEDIUM

#### 実装内容
```tsx
// 統計カード表示
interface UserStats {
  totalApplications: number;
  submittedApplications: number;
  draftApplications: number;
  aiGenerationCount: number;
}
```

---

## 🎯 Day 6-7: UI/UX改善

### 📝 Task 7: レスポンシブ対応強化
**推定時間**: 4時間  
**優先度**: MEDIUM

#### 実装内容
- モバイルファースト設計
- タブレット対応
- ダークモード準備

### 📝 Task 8: アニメーション追加
**推定時間**: 3時間  
**優先度**: LOW

#### 実装内容
```tsx
// Framer Motion でアニメーション
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* コンテンツ */}
</motion.div>
```

---

## 🛠️ 開発環境セットアップ

### 必要なツール
```bash
# 1. VSCode拡張機能
# - ES7+ React/Redux/React-Native snippets
# - Tailwind CSS IntelliSense
# - Auto Rename Tag

# 2. ブラウザ開発者ツール設定
# Chrome DevTools
# React Developer Tools
```

### デバッグ方法
```bash
# 1. 開発サーバーログ確認
npm run dev
# → コンソールでエラー確認

# 2. ブラウザコンソール確認
# F12 → Console タブ

# 3. React DevTools
# Components タブでstate確認
```

### パフォーマンス確認
```bash
# 1. Lighthouse実行
# Chrome → DevTools → Lighthouse

# 2. バンドルサイズ確認
npm run build
npm run analyze # (要設定)
```

---

## 📊 進捗管理

### Daily Check-in（毎日16:00）
```bash
# 進捗報告フォーマット
echo "=== Track B 進捗レポート $(date) ==="
echo "✅ 完了タスク: [タスク名]"
echo "🚧 進行中タスク: [タスク名] (進捗:X%)"
echo "❌ ブロッカー: [問題点]"
echo "📅 明日の予定: [タスク名]"
echo "🌐 デモURL: http://localhost:3000/[ページ]"
```

### UI/UX品質確認
```bash
# 1. 各画面での動作確認
# ✅ ログイン画面
# ✅ 登録画面  
# ✅ ダッシュボード
# ✅ プロフィール編集

# 2. レスポンシブ確認
# ✅ モバイル (375px)
# ✅ タブレット (768px)
# ✅ デスクトップ (1024px+)

# 3. ブラウザ対応確認
# ✅ Chrome
# ✅ Safari
# ✅ Firefox
```

---

## 🚨 エラー対処法

### よくある問題と解決法

#### 1. ビルドエラー
```bash
# 症状: TypeScript型エラー
# 解決: 
npm run type-check
# 型定義確認・修正

# 症状: React Query エラー
# 解決:
npm install @tanstack/react-query@latest
```

#### 2. スタイリングエラー
```bash
# 症状: Tailwind CSS効かない
# 解決:
npx tailwindcss -i ./src/app/globals.css -o ./dist/output.css --watch
```

#### 3. API接続エラー
```bash
# 症状: CORS エラー
# 解決: next.config.js でプロキシ設定確認
```

---

## 🎯 成功指標

### Day 1終了時
- [x] ビルドエラー完全解消
- [x] 開発サーバー正常起動
- [x] 基本ページアクセス可能

### Day 3終了時
- [x] ログイン機能正常動作
- [x] 登録機能正常動作
- [x] 認証状態管理完成

### Day 5終了時
- [x] プロフィール編集機能完成
- [x] ダッシュボード統計表示完成
- [x] レスポンシブ対応完成

### Day 7終了時
- [x] 全UI/UX完成
- [x] Track Aとの API統合完成
- [x] 基本的なテスト完了

---

## 🎨 UI/UXガイドライン

### デザインシステム
```css
/* カラーパレット */
:root {
  --primary: #3B82F6;     /* ブルー */
  --secondary: #10B981;   /* グリーン */
  --accent: #F59E0B;      /* オレンジ */
  --neutral: #6B7280;     /* グレー */
  --error: #EF4444;       /* レッド */
  --success: #10B981;     /* グリーン */
}

/* フォント */
font-family: 'Inter', 'Hiragino Sans', 'Yu Gothic', sans-serif;
```

### コンポーネント規約
```tsx
// ボタンスタイル
const buttonVariants = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900",
  danger: "bg-red-600 hover:bg-red-700 text-white",
};

// スペーシング
const spacing = {
  xs: "0.25rem",   // 4px
  sm: "0.5rem",    // 8px
  md: "1rem",      // 16px
  lg: "1.5rem",    // 24px
  xl: "2rem",      // 32px
};
```

---

## 📞 サポート・質問

### 開発中の質問・相談
- **UI/UX の不明点**: この指示書のコメント欄
- **技術的な問題**: React/Next.js公式ドキュメント参照
- **緊急の問題**: 即座報告

### リソース
- **API仕様**: Track A開発者との連携
- **デザインガイド**: Figmaまたはこの指示書
- **コンポーネント例**: `src/components/` 参照

---

**🎨 Track B開発開始準備完了！美しく使いやすいUIを作りましょう。**