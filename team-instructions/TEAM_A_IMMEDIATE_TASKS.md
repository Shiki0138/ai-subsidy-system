# 🎨 チームA（フロントエンド）即座実行タスク

## 🎯 特別指示：最高のユーザー体験を構築せよ

**⚠️ 最重要原則**: **このシステムのユーザーの操作性を常に考え、最高のシステムを構築すること**

### 👥 ユーザー視点での開発指針
- **ユーザーは補助金申請の専門家ではない** → 直感的な操作を実現
- **重要な書類作成** → ミスを防ぐ設計、確認ステップの充実
- **時間が貴重** → 効率的な入力、自動保存、進捗の可視化
- **安心感が必要** → エラー時の適切なガイダンス、データ保護の明示

## 🚀 今週の最優先実装タスク

### 【Task 1】ファイルアップロード機能の完全実装
**期限**: 今日中に開始、3日以内に完了

#### 実装要件
```typescript
// 📁 /frontend/src/components/enhanced/FileUpload.tsx
interface FileUploadProps {
  maxFiles?: number;
  maxSize?: number;
  allowedTypes?: string[];
  onUpload: (files: File[]) => Promise<UploadResult>;
  onProgress?: (progress: number) => void;
  disabled?: boolean;
  helpText?: string;
}

// ユーザビリティ要件
const UX_REQUIREMENTS = {
  // 直感的操作
  dragAndDrop: true,
  clickToSelect: true,
  
  // 明確なフィードバック
  progressIndicator: true,
  successConfirmation: true,
  errorMessages: "具体的で解決策を提示",
  
  // 安心感
  fileValidation: "リアルタイム検証",
  previewSupport: true,
  deleteConfirmation: true,
  
  // 効率性
  multipleFiles: true,
  autoRetry: true,
  backgroundUpload: true
};
```

#### ユーザビリティチェックリスト
- [ ] ドラッグ&ドロップで直感的にアップロード
- [ ] ファイル形式・サイズエラーを分かりやすく表示
- [ ] アップロード進捗をリアルタイムで表示
- [ ] 成功・失敗を明確にフィードバック
- [ ] ファイルプレビュー機能
- [ ] 削除時の確認ダイアログ

### 【Task 2】エラーハンドリングとユーザーガイダンス強化
**期限**: 2日以内に完了

#### 実装要件
```typescript
// 📁 /frontend/src/components/ui/ErrorBoundary.tsx
interface UserFriendlyError {
  title: string;           // "申請書の保存に失敗しました"
  message: string;         // "ネットワーク接続を確認してください"
  actionButtons: Array<{
    label: string;         // "再試行"
    action: () => void;
    variant: 'primary' | 'secondary';
  }>;
  severity: 'error' | 'warning' | 'info';
  autoRetry?: boolean;
  supportContact?: boolean;
}

// ユーザーガイダンス要件
const USER_GUIDANCE = {
  errorRecovery: "具体的な解決手順を提示",
  progressSaving: "作業内容の自動保存",
  helpContext: "各画面でのヘルプ情報",
  tooltips: "重要項目への説明",
  validation: "リアルタイム入力検証"
};
```

#### ユーザビリティチェックリスト
- [ ] エラーメッセージが分かりやすい日本語
- [ ] 解決方法を具体的に提示
- [ ] 自動復旧機能の実装
- [ ] 重要な操作前の確認ダイアログ
- [ ] 入力中のリアルタイム検証
- [ ] ヘルプ・ガイダンスの充実

### 【Task 3】申請書作成ウィザードのUX改善
**期限**: 5日以内に完了

#### 改善要項
```typescript
// 📁 /frontend/src/app/dashboard/applications/new/enhanced-wizard.tsx
interface WizardEnhancement {
  // 進捗の可視化
  progressIndicator: {
    currentStep: number;
    totalSteps: number;
    completedSteps: string[];
    timeEstimate: string;  // "あと約15分で完了"
  };
  
  // 入力支援
  autoSave: {
    interval: 30; // 30秒間隔
    indicator: boolean; // 保存状態表示
    conflict_resolution: boolean; // 競合解決
  };
  
  // 入力ガイダンス
  fieldHelp: {
    tooltips: boolean;
    examples: string[]; // 入力例
    validation: "realtime";
    suggestions: boolean; // AI提案
  };
  
  // 安心感
  dataProtection: {
    autosave_notification: true;
    data_recovery: true;
    privacy_indicator: true;
  };
}
```

#### 具体的改善点
- [ ] **進捗表示**: どこまで完了したか一目で分かる
- [ ] **自動保存**: 30秒間隔での自動保存 + 保存状態表示
- [ ] **入力例表示**: 各項目に具体的な記入例
- [ ] **リアルタイム検証**: 入力中の即座チェック
- [ ] **戻る・進む**: 安全なナビゲーション
- [ ] **一時保存**: いつでも中断・再開可能

### 【Task 4】レスポンシブデザイン最適化
**期限**: 3日以内に完了

#### モバイル対応要件
```css
/* 📁 /frontend/src/styles/mobile-optimization.css */
@media (max-width: 768px) {
  /* タッチ操作最適化 */
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* 読みやすいフォントサイズ */
  .mobile-text {
    font-size: 16px;
    line-height: 1.5;
  }
  
  /* ナビゲーション改善 */
  .mobile-nav {
    position: fixed;
    bottom: 0;
    width: 100%;
  }
}
```

#### モバイルUXチェックリスト
- [ ] タッチ操作に最適化されたボタンサイズ
- [ ] 読みやすいフォントサイズ・行間
- [ ] スクロール操作の最適化
- [ ] 入力フォームの使いやすさ
- [ ] 画像・PDF表示の最適化

## 🔧 実装開始手順

### Step 1: 開発環境確認
```bash
# プロジェクトルートで実行
cd frontend
npm install
npm run dev

# 動作確認
curl http://localhost:3000
```

### Step 2: 既存コードの確認
<function_calls>
<invoke name="Read">
<parameter name="file_path">/Users/MBP/Desktop/system/ai-subsidy-system/frontend