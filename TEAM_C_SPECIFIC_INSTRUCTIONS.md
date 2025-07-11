# チームC：フォーム・詳細画面チーム 専用作業指示書

**発行者**: チームB（統括）  
**受領者**: チームC  
**作成日**: 2025年6月14日  
**緊急度**: 最高  

---

## 🎯 チームC専任ミッション

### 責任範囲
**あなたはユーザー体験の専門家です**
- 申請書作成フローのUX最適化
- フォーム入力体験の改善
- 詳細ページの可読性向上

### 最重要目標
1. **5段階フォームのUX改善** - システムの核となる機能
2. **申請書詳細ページの表示最適化** - 成果物確認の要
3. **入力支援・ガイダンス強化** - ユーザーの迷いを解消

---

## 📋 Phase 1: 分析・設計フェーズ (1時間厳守)

### 1.1 現在のフォーム状況分析 (25分)
```bash
# 作業ディレクトリ移動
cd /Users/MBP/ai-subsidy-system/frontend/src/app/dashboard/applications

# 申請書作成フォーム分析
code new/NewApplicationClient.tsx

# 申請書詳細ページ分析
code [id]/ApplicationDetailsClient.tsx

# 既存フォームコンポーネント確認
cd ../../components
find . -name "*Form*" -o -name "*Input*" -o -name "*Field*"
```

**分析ポイント**:
- 現在のステップ表示方式
- バリデーション表示方法
- エラーハンドリング状況
- ユーザーガイダンスの有無
- 入力フィールドの使いやすさ

### 1.2 UX課題の洗い出し (20分)
**作成ファイル**: `FORM_UX_ANALYSIS.md`

```markdown
# フォーム・詳細画面 UX分析レポート

## 現在の課題

### 申請書作成フォーム（NewApplicationClient.tsx）
1. **ステップ表示の課題**
   - 現在位置が分かりにくい
   - 全体の進捗が見えない
   - 次のステップの予告がない

2. **入力体験の課題**
   - AI生成ボタンの位置・説明不足
   - バリデーションエラーが分かりにくい
   - 必須・任意の区別が不明確

3. **ナビゲーションの課題**
   - 前へ/次へボタンの視認性
   - スキップ可能項目の説明不足

### 申請書詳細ページ（ApplicationDetailsClient.tsx）
1. **表示の課題**
   - 情報の整理が不十分
   - セクション間の区切りが不明確
   - 重要情報の強調不足

2. **操作の課題**
   - 編集モードの切り替えが不自然
   - PDF出力ボタンの位置・説明不足
   - 保存状態の表示不足

## 改善提案

### 優先度 High
1. ステップインジケーターの強化
2. バリデーション表示の改善
3. AI生成機能の説明・ガイド追加

### 優先度 Medium
1. 入力支援（プレースホルダー・例文）
2. 詳細ページレイアウト改善
3. 操作説明の追加
```

### 1.3 ユーザーフロー設計 (15分)
**作成ファイル**: `USER_FLOW_DESIGN.md`

```markdown
# ユーザーフロー設計

## 申請書作成フロー

### Step 1: 基本情報
- 目的: 申請書の方向性を決定
- 必須項目: タイトル、補助金種別
- ガイダンス: 「どのような申請書を作成しますか？」

### Step 2: 企業情報  
- 目的: 会社の基本情報収集
- 必須項目: 会社名、業界、事業内容
- ガイダンス: 「あなたの会社について教えてください」

### Step 3: 事業計画（AI生成）
- 目的: 申請書の核となる内容生成
- AI機能: メイン機能として強調
- ガイダンス: 「AIが高品質な事業計画を生成します」

### Step 4: 詳細内容
- 目的: 申請書の具体化
- 必須項目: プロジェクト概要、予算、スケジュール
- ガイダンス: 「プロジェクトの詳細を入力してください」

### Step 5: 最終確認
- 目的: 申請書の最終チェック
- 機能: プレビュー表示、修正可能箇所の表示
- ガイダンス: 「内容を確認して保存してください」
```

---

## 📋 Phase 2: 実装フェーズ (3時間)

### 2.1 ステップインジケーター強化 (45分)
**作業ファイル**: `frontend/src/components/forms/ProgressIndicator.tsx`

```typescript
'use client'

interface Step {
  id: number
  name: string
  description: string
  status: 'upcoming' | 'current' | 'completed'
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="w-full py-6">
      {/* プログレスバー */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>進捗</span>
          <span>{currentStep}/5 ステップ</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ステップ一覧 */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep
          const isCompleted = step.id < currentStep
          const isUpcoming = step.id > currentStep

          return (
            <div key={step.id} className="flex items-center relative">
              {/* ステップアイコン */}
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium
                ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 
                  isCurrent ? 'border-blue-600 bg-white text-blue-600' : 
                  'border-gray-300 bg-white text-gray-400'}
              `}>
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>

              {/* ステップ情報 */}
              <div className="ml-3 min-w-0 flex-1">
                <p className={`text-sm font-medium ${
                  isCurrent ? 'text-blue-600' : 
                  isCompleted ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
                <p className="text-xs text-gray-500">
                  {step.description}
                </p>
              </div>

              {/* 接続線 */}
              {index < steps.length - 1 && (
                <div className={`
                  absolute top-5 -right-12 w-24 h-0.5
                  ${isCompleted ? 'bg-blue-600' : 'bg-gray-300'}
                `} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### 2.2 フォームフィールド共通コンポーネント (45分)
**作業ファイル**: `frontend/src/components/forms/FormField.tsx`

```typescript
import { ReactNode, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  children: ReactNode
  required?: boolean
  error?: string
  description?: string
  className?: string
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  rows?: number
}

export function FormField({
  label,
  children,
  required = false,
  error,
  description,
  className
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      
      {children}
      
      {error && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'input-base',
        error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, error, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'input-base resize-vertical',
        error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    />
  )
}
```

### 2.3 NewApplicationClient.tsx UX改善 (60分)
**作業ファイル**: `frontend/src/app/dashboard/applications/new/NewApplicationClient.tsx`

**改善ポイント**:
1. ProgressIndicator統合
2. FormField統合
3. AI生成ボタンの説明強化
4. バリデーションメッセージ改善

```typescript
// Step 3の改善例
case 3:
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <SparklesIcon className="h-6 w-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">AI事業計画生成</h3>
            <p className="text-sm text-blue-700 mt-1">
              入力いただいた企業情報を基に、AIが高品質な事業計画を自動生成します。
              生成後は内容を編集・調整することも可能です。
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">事業計画</h3>
        <button
          onClick={() => generateBusinessPlanMutation.mutate()}
          disabled={generateBusinessPlanMutation.isPending || !applicationData.subsidyType}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center font-medium"
        >
          <SparklesIcon className="h-5 w-5 mr-2" />
          {generateBusinessPlanMutation.isPending ? 'AI生成中...' : 'AIで事業計画を生成'}
        </button>
      </div>
      
      <FormField
        label="事業計画書"
        required
        description="事業の背景、目的、実施内容、期待される効果などを記載してください。AIで生成することも可能です。"
        error={/* バリデーションエラー */}
      >
        <Textarea
          value={applicationData.businessPlan}
          onChange={(e) => updateField('businessPlan', e.target.value)}
          rows={12}
          placeholder="事業計画の内容を入力するか、上記のAI生成ボタンをクリックしてください..."
          error={/* エラー状態 */}
        />
      </FormField>

      {applicationData.businessPlan && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="font-medium">事業計画が入力されました</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            内容を確認し、必要に応じて編集してから次のステップに進んでください。
          </p>
        </div>
      )}
    </div>
  )
```

### 2.4 ApplicationDetailsClient.tsx 表示改善 (60分)
**作業ファイル**: `frontend/src/app/dashboard/applications/[id]/ApplicationDetailsClient.tsx`

**改善ポイント**:
1. 情報の階層化・グルーピング
2. アクションボタンの整理
3. ステータス表示の強化
4. 編集モードのUX改善

```typescript
// 申請書内容表示の改善例
{(application.status === 'GENERATED' || application.status === 'DRAFT') && application.generatedContent && (
  <div className="space-y-6">
    {/* アクションバー */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">申請書内容</h3>
          <p className="text-sm text-gray-500 mt-1">
            内容を確認し、必要に応じて編集やPDF出力ができます
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isEditing && (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                編集
              </button>
              
              <button 
                onClick={handleHTMLPreview}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                プレビュー
              </button>
              
              <button 
                onClick={handlePDFGeneration}
                disabled={isGeneratingPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? 'PDF生成中...' : 'PDF出力'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>

    {/* 申請書内容 */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {isEditing ? (
        <div className="p-6">
          <ApplicationEditForm
            application={application}
            onSave={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isSaving={isSaving}
          />
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {Object.entries(application.generatedContent.sections || {}).map(([sectionKey, content]) => (
            <div key={sectionKey} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  {getSectionTitle(sectionKey)}
                </h4>
                <span className="text-sm text-gray-500">
                  {(content as string).length} 文字
                </span>
              </div>
              <div className="prose max-w-none">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4">
                  {content as string}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}
```

---

## 📊 チームBとの連携ポイント

### 30分毎報告内容
```
チームC - [時刻]
✅ 完了: フォームUX分析完了
🔄 進行中: ProgressIndicator実装中
⚠️ 課題: なし
📅 次30分: FormField共通コンポーネント実装予定
```

### チームBへの確認事項
1. **フォーム内ナビゲーション**: 戻る/次へボタンのデザイン統一
2. **詳細ページレイアウト**: ダッシュボードとの一貫性
3. **アクションボタン**: 全体統一との整合性

### チームAからの受け取り
- Button, Card等共通コンポーネントの統一仕様
- デザイントークンの適用
- フォーム要素のスタイル統一

---

## 🧪 品質保証・テスト

### 実装完了後のセルフチェック
```bash
# 1. フォーム動作確認
cd /Users/MBP/ai-subsidy-system/frontend
npm run dev

# 2. 5段階フォーム確認
# http://localhost:3000/dashboard/applications/new
# - 各ステップの表示確認
# - バリデーション動作確認
# - AI生成機能確認

# 3. 詳細ページ確認
# 申請書作成後の詳細ページ表示確認
# - 内容表示の確認
# - 編集モード切り替え確認
# - PDF出力確認
```

### ユーザビリティチェック
- [ ] フォーム入力が直感的
- [ ] エラーメッセージが分かりやすい
- [ ] 操作手順が明確
- [ ] 進捗状況が把握しやすい

---

## 🚨 注意事項・制約

### 絶対に削除してはいけないもの
- 既存のAPI呼び出し機能
- AI生成機能のロジック
- PDF出力機能
- 認証・保存機能

### 変更時の原則
```typescript
// ❌ 悪い例：既存機能を削除
// const handleSave = () => { /* 削除 */ }

// ✅ 良い例：UIのみ改善
const handleSave = () => {
  setIsSaving(true) // ローディング状態追加
  // 既存の保存ロジック保持
  saveApplicationMutation.mutate()
}
```

### アクセシビリティ考慮
- キーボードナビゲーション対応
- スクリーンリーダー対応
- 色だけに依存しない情報伝達

---

## 🎯 成功判定基準

### Phase 1完了基準
- [ ] フォームUX分析完了
- [ ] ユーザーフロー設計完了
- [ ] 改善計画確定

### Phase 2完了基準
- [ ] ProgressIndicator実装完了
- [ ] FormField共通コンポーネント完了
- [ ] 申請書作成フォーム改善完了
- [ ] 申請書詳細ページ改善完了

### 最終完了基準
- [ ] 全フォームでの操作性向上
- [ ] チームA・Bとの統一性確保
- [ ] アクセシビリティ基準クリア

---

## 📅 作業開始

**チームC作業開始宣言**:
- この指示書確認完了
- Phase 1即座開始  
- 1時間後にPhase 2移行

**チームBからの期待**:
あなたの作業がユーザー体験の大幅改善をもたらします。
使いやすく、直感的なインターフェースの構築をお願いします。

---

**頑張ってください！チームBはあなたをサポートします。**