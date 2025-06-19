# 🎨 チームA - フロントエンド開発チーム指示書

## 🎯 チーム概要
**責任領域**: ユーザーインターフェース、ユーザーエクスペリエンス、フロントエンド全般
**主要技術**: Next.js 14, TypeScript, Tailwind CSS, React Query

## 📋 現在の状況と完成度

### ✅ 完成済み機能（90%）
- **認証システム** (`/frontend/src/app/auth/`) - ログイン・新規登録
- **ダッシュボード** (`/frontend/src/app/dashboard/`) - メイン画面・統計表示
- **申請書作成ウィザード** (`/frontend/src/app/dashboard/applications/new/`) - 7ステップ構成
- **プロフィール管理** (`/frontend/src/app/dashboard/profile/`) - ユーザー情報編集
- **補助金プログラム表示** (`/frontend/src/app/dashboard/subsidy-programs/`) - 一覧・詳細
- **レスポンシブデザイン** - モバイル・タブレット対応

### 🟡 部分実装機能（60%）
- **ファイルアップロード** (`/frontend/src/components/ui/file-upload.tsx`) - UI完成、バックエンド連携要改良
- **リアルタイム通知** - react-hot-toast のみ、WebSocket未実装
- **高度フィルタリング** - 基本検索のみ、詳細フィルタ未実装

### ❌ 未実装機能
- **WebSocketリアルタイム通信**
- **PWA対応**
- **国際化（i18n）**
- **ダークモード**
- **詳細分析ダッシュボード**

## 🚀 優先度別実装タスク

### 【高優先度】即座に実装すべき機能

#### 1. ファイルアップロード機能強化
```typescript
// 📁 /frontend/src/components/enhanced/FileUpload.tsx
interface FileUploadProps {
  maxFiles?: number;
  maxSize?: number;
  allowedTypes?: string[];
  onUpload: (files: File[]) => Promise<UploadResult>;
  onProgress?: (progress: number) => void;
}

// 実装要件:
// - ドラッグ&ドロップ対応
// - プログレスバー表示
// - ファイル検証機能
// - 複数ファイル対応
// - プレビュー機能
```

#### 2. リアルタイム通知システム
```typescript
// 📁 /frontend/src/hooks/useWebSocket.ts
interface WebSocketHook {
  connect: (userId: string) => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  isConnected: boolean;
}

// 実装要件:
// - WebSocket接続管理
// - 自動再接続機能
// - メッセージキューイング
// - 通知表示システム
```

#### 3. エラーハンドリング強化
```typescript
// 📁 /frontend/src/components/ui/error-boundary.tsx
// - グローバルエラーキャッチ
// - ユーザーフレンドリーなエラー表示
// - エラー報告機能
// - 復旧提案機能
```

### 【中優先度】次フェーズで実装

#### 4. 詳細分析ダッシュボード
```typescript
// 📁 /frontend/src/app/dashboard/analytics/
// 実装要件:
// - Chart.js または Recharts を使用
// - 申請書分析結果の可視化
// - AI評価スコアのグラフ表示
// - 時系列データ表示
// - CSV/PDF エクスポート機能
```

#### 5. 高度検索・フィルタリング
```typescript
// 📁 /frontend/src/components/enhanced/AdvancedSearch.tsx
// 実装要件:
// - 複数条件検索
// - 日付範囲指定
// - 金額範囲指定
// - ステータス別フィルタ
// - 保存された検索条件
```

### 【低優先度】将来的な実装

#### 6. PWA対応
```json
// 📁 /frontend/next.config.js
// - Service Worker実装
// - オフライン対応
// - プッシュ通知
// - アプリインストール機能
```

#### 7. 国際化対応
```typescript
// 📁 /frontend/src/i18n/
// - next-i18next 導入
// - 日本語・英語対応
// - 動的言語切り替え
// - 地域設定対応
```

## 🛠 技術仕様・ベストプラクティス

### コンポーネント設計原則
```typescript
// ✅ 推奨パターン
interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

// コンポーネント命名規則
// - PascalCase (ButtonComponent)
// - 機能ベース命名 (UploadButton, SubmitForm)
// - 一つの責任原則遵守
```

### Tailwind CSS 設計システム
```css
/* 📁 /frontend/src/styles/globals.css */
/* カラーパレット統一 */
:root {
  --primary: #2563eb;
  --secondary: #64748b;
  --success: #059669;
  --warning: #d97706;
  --danger: #dc2626;
}

/* スペーシング統一 */
.spacing-xs { @apply p-2 m-1; }
.spacing-sm { @apply p-4 m-2; }
.spacing-md { @apply p-6 m-3; }
.spacing-lg { @apply p-8 m-4; }
```

### 状態管理パターン
```typescript
// React Query for server state
// Zustand for client state
// 📁 /frontend/src/store/useApplicationStore.ts

interface ApplicationStore {
  applications: Application[];
  currentApplication: Application | null;
  setApplications: (apps: Application[]) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
}
```

## 🔧 開発環境セットアップ

### 必要な環境
```bash
# Node.js 20+ 必須
node --version  # v20.0.0+
npm --version   # v10.0.0+

# 推奨エディタ設定
# VSCode + 以下拡張機能:
# - ES7+ React/Redux/React-Native snippets
# - Tailwind CSS IntelliSense
# - TypeScript Importer
# - Prettier - Code formatter
```

### ローカル開発環境構築
```bash
# プロジェクトルートから
cd frontend
npm install
npm run dev

# テスト実行
npm run test
npm run test:e2e

# リント・フォーマット
npm run lint
npm run lint:fix
npm run format
```

## 📊 パフォーマンス目標

### Core Web Vitals 目標値
- **Largest Contentful Paint (LCP)**: < 2.5秒
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### バンドルサイズ目標
- **Initial Bundle**: < 300KB (gzipped)
- **Page Bundles**: < 100KB each
- **Image Optimization**: WebP + lazy loading

### 最適化チェックリスト
```typescript
// パフォーマンス監視
// 📁 /frontend/src/utils/performance.ts
export const measurePerformance = () => {
  // Core Web Vitals 測定
  // Bundle analyzer 実行
  // Lighthouse score 90+ 維持
};
```

## 🧪 テスト戦略

### テストピラミッド構成
```typescript
// Unit Tests (60%) - Jest + React Testing Library
// 📁 /frontend/src/components/__tests__/

// Integration Tests (30%) - Next.js API Routes
// 📁 /frontend/src/app/__tests__/

// E2E Tests (10%) - Playwright
// 📁 /frontend/e2e/
```

### テスト実装例
```typescript
// 📁 /frontend/src/components/__tests__/FileUpload.test.tsx
describe('FileUpload Component', () => {
  it('should handle file upload successfully', async () => {
    // テスト実装
  });
  
  it('should validate file types', () => {
    // バリデーションテスト
  });
});
```

## 🔄 CI/CD パイプライン

### GitHub Actions 設定
```yaml
# 📁 /.github/workflows/frontend.yml
name: Frontend CI/CD
on:
  push:
    paths: ['frontend/**']
    
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test
        run: |
          cd frontend
          npm ci
          npm run lint
          npm run test
          npm run build
```

## 📈 成果指標・KPI

### 開発効率指標
- **機能実装速度**: 週1-2機能
- **バグ発生率**: < 10%
- **コードレビュー時間**: < 24時間
- **テストカバレッジ**: > 80%

### ユーザー体験指標
- **ページ読み込み速度**: < 3秒
- **離脱率**: < 5%
- **ユーザー満足度**: > 4.5/5
- **アクセシビリティスコア**: > 95

## 🤝 チーム連携

### 他チームとの連携方法
```typescript
// チームB（バックエンド）との連携
// API仕様書: /docs/api-specification.md
// TypeScript型定義共有: /shared/types/

// チームC（AI）との連携  
// AI応答データ型: /shared/types/ai-responses.ts
// エラーハンドリング: /shared/utils/error-handling.ts

// チームD（インフラ）との連携
// 環境変数設定: /.env.example
// デプロイ設定: /frontend/next.config.js
```

### 定期ミーティング
- **Daily Standup**: 毎朝9:00 (15分)
- **Weekly Planning**: 毎週月曜10:00 (60分)
- **Sprint Review**: 隔週金曜15:00 (90分)

## 🚨 緊急時対応

### 本番環境での問題発生時
1. **即座に** Slack #emergency-frontend に報告
2. **ロールバック判断** (5分以内)
3. **原因調査開始** 
4. **修正版デプロイ** (30分以内目標)

## 📚 学習リソース

### 必須学習項目
- **Next.js 14 Documentation**: https://nextjs.org/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **React Query Guide**: https://tanstack.com/query/latest

### 推奨コース
- **React Advanced Patterns**
- **TypeScript Deep Dive**
- **Web Performance Optimization**
- **Accessibility Best Practices**

---

**🎯 最終目標**: 世界レベルのユーザー体験を提供する補助金申請システムのフロントエンドを構築する

**📞 緊急連絡**: チームリーダー（Slack: @team-a-lead）