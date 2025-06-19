# ターミナルB 即座実行指示書

**作成日**: 2025年6月14日 00:05  
**緊急度**: 最高  
**目標**: 6-7時間でシステム完全稼働状態へ

---

## 🚨 ターミナルB 即座開始コマンド

### Step 1: 環境確認と起動
```bash
# 新しいターミナルを開いて以下を実行

# 1. プロジェクトディレクトリに移動
cd /Users/MBP/ai-subsidy-system

# 2. 必須ドキュメント確認
echo "📋 開発ルール確認中..."
head -20 DEVELOPMENT_RULES.md

echo "📊 現在の機能状況確認中..."
head -30 FUNCTION_STATUS_ANALYSIS.md

# 3. バックエンド稼働確認
echo "🔍 バックエンド稼働状況確認中..."
curl -s http://localhost:3001/api/health || echo "❌ バックエンドが稼働していません"

# 4. フロントエンド起動
echo "🚀 フロントエンド起動中..."
cd frontend && npm run dev
```

### Step 2: 作業開始前チェック
```bash
# ターミナルBで実行 - 別ウィンドウで

# 1. 作業対象ファイル確認
echo "📁 申請書作成フォーム確認..."
ls -la /Users/MBP/ai-subsidy-system/frontend/src/app/dashboard/applications/new/

echo "📁 申請書詳細ページ確認..."
ls -la /Users/MBP/ai-subsidy-system/frontend/src/app/dashboard/applications/[id]/

echo "📁 PDFサービス確認..."
ls -la /Users/MBP/ai-subsidy-system/backend/pdf-service.js

# 2. 認証テスト（ターミナルA成果確認）
echo "🔐 認証システムテスト..."
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@demo.com","password":"demo123"}'

# 3. AI機能テスト（ターミナルA成果確認）
echo "🤖 AI機能テスト準備..."
```

---

## 🎯 Phase 1: 申請書作成フロー完成 (3-4時間)

### 最優先タスク: NewApplicationClient.tsx 完全実装

**作業ファイル**: `frontend/src/app/dashboard/applications/new/NewApplicationClient.tsx`

#### 現在のファイル状況確認
```bash
# ファイル確認
cat /Users/MBP/ai-subsidy-system/frontend/src/app/dashboard/applications/new/NewApplicationClient.tsx | head -50
```

#### 実装する5段階フォーム

**完全なコード実装** (このコードをファイルに書き込む):

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  SparklesIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface CompanyInfo {
  companyName: string
  industry: string
  employeeCount: string
  businessDescription: string
  address: string
  phone: string
  website: string
}

interface ApplicationData {
  title: string
  subsidyType: string
  companyInfo: CompanyInfo
  businessPlan: string
  projectDescription: string
  budget: string
  schedule: string
  expectedResults: string
}

const SUBSIDY_TYPES = [
  { value: 'jizokukahojokin', label: '小規模事業者持続化補助金' },
  { value: 'itdounyu', label: 'IT導入補助金' },
  { value: 'jigyousaikouchiku', label: '事業再構築補助金' },
  { value: 'monozukuri', label: 'ものづくり補助金' },
  { value: 'chiikifukkou', label: '地域復興補助金' }
]

const STEPS = [
  { id: 1, name: '基本情報', description: '申請書の基本情報を入力' },
  { id: 2, name: '企業情報', description: '会社の詳細情報を入力' },
  { id: 3, name: '事業計画', description: 'AI生成または手動入力' },
  { id: 4, name: '詳細内容', description: '申請書の詳細を入力' },
  { id: 5, name: '確認', description: '入力内容の最終確認' }
]

export function NewApplicationClient() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    title: '',
    subsidyType: '',
    companyInfo: {
      companyName: '',
      industry: '',
      employeeCount: '',
      businessDescription: '',
      address: '',
      phone: '',
      website: ''
    },
    businessPlan: '',
    projectDescription: '',
    budget: '',
    schedule: '',
    expectedResults: ''
  })

  // AI生成機能
  const generateBusinessPlanMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate-business-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          companyInfo: applicationData.companyInfo,
          subsidyType: applicationData.subsidyType
        })
      })

      if (!response.ok) throw new Error('AI生成に失敗しました')
      
      const result = await response.json()
      return result.data.content
    },
    onSuccess: (content) => {
      setApplicationData(prev => ({
        ...prev,
        businessPlan: content
      }))
      toast.success('事業計画をAIで生成しました')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  // 申請書保存
  const saveApplicationMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...applicationData,
          status: 'DRAFT'
        })
      })

      if (!response.ok) throw new Error('保存に失敗しました')
      
      const result = await response.json()
      return result.data
    },
    onSuccess: (application) => {
      toast.success('申請書を保存しました')
      router.push(`/dashboard/applications/${application.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const updateField = (field: keyof ApplicationData, value: any) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateCompanyField = (field: keyof CompanyInfo, value: string) => {
    setApplicationData(prev => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        [field]: value
      }
    }))
  }

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">基本情報</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                申請書タイトル *
              </label>
              <input
                type="text"
                value={applicationData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: AI活用による業務効率化事業"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                補助金の種類 *
              </label>
              <select
                value={applicationData.subsidyType}
                onChange={(e) => updateField('subsidyType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">選択してください</option>
                {SUBSIDY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">企業情報</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会社名 *
                </label>
                <input
                  type="text"
                  value={applicationData.companyInfo.companyName}
                  onChange={(e) => updateCompanyField('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  業界 *
                </label>
                <input
                  type="text"
                  value={applicationData.companyInfo.industry}
                  onChange={(e) => updateCompanyField('industry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: IT・ソフトウェア"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  従業員数
                </label>
                <select
                  value={applicationData.companyInfo.employeeCount}
                  onChange={(e) => updateCompanyField('employeeCount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="1-5名">1-5名</option>
                  <option value="6-20名">6-20名</option>
                  <option value="21-50名">21-50名</option>
                  <option value="51-100名">51-100名</option>
                  <option value="100名以上">100名以上</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={applicationData.companyInfo.phone}
                  onChange={(e) => updateCompanyField('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="03-1234-5678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                事業内容 *
              </label>
              <textarea
                value={applicationData.companyInfo.businessDescription}
                onChange={(e) => updateCompanyField('businessDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="会社の主な事業内容を記載してください"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所在地
              </label>
              <input
                type="text"
                value={applicationData.companyInfo.address}
                onChange={(e) => updateCompanyField('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="東京都渋谷区..."
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">事業計画</h3>
              <button
                onClick={() => generateBusinessPlanMutation.mutate()}
                disabled={generateBusinessPlanMutation.isPending || !applicationData.subsidyType}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                {generateBusinessPlanMutation.isPending ? 'AI生成中...' : 'AIで生成'}
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                事業計画書 *
              </label>
              <textarea
                value={applicationData.businessPlan}
                onChange={(e) => updateField('businessPlan', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={12}
                placeholder="事業の背景、目的、実施内容、期待される効果などを記載してください。AIで生成することも可能です。"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                AIで生成した内容は編集できます。より具体的な内容に修正してください。
              </p>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">詳細内容</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロジェクト概要 *
              </label>
              <textarea
                value={applicationData.projectDescription}
                onChange={(e) => updateField('projectDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="今回申請するプロジェクトの具体的な内容"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                予算計画 *
              </label>
              <textarea
                value={applicationData.budget}
                onChange={(e) => updateField('budget', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="必要な予算の内訳を記載してください"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                実施スケジュール *
              </label>
              <textarea
                value={applicationData.schedule}
                onChange={(e) => updateField('schedule', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="プロジェクトの実施スケジュール"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                期待される成果 *
              </label>
              <textarea
                value={applicationData.expectedResults}
                onChange={(e) => updateField('expectedResults', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="プロジェクト実施により期待される具体的な成果"
                required
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">最終確認</h3>
            
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">申請書タイトル</h4>
                <p className="text-gray-600">{applicationData.title}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">補助金の種類</h4>
                <p className="text-gray-600">
                  {SUBSIDY_TYPES.find(t => t.value === applicationData.subsidyType)?.label}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">会社名</h4>
                <p className="text-gray-600">{applicationData.companyInfo.companyName}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">事業計画</h4>
                <p className="text-gray-600 text-sm">
                  {applicationData.businessPlan.substring(0, 200)}...
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                保存後、申請書の編集やPDF出力が可能になります。
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return applicationData.title && applicationData.subsidyType
      case 2:
        return applicationData.companyInfo.companyName && 
               applicationData.companyInfo.industry && 
               applicationData.companyInfo.businessDescription
      case 3:
        return applicationData.businessPlan
      case 4:
        return applicationData.projectDescription && 
               applicationData.budget && 
               applicationData.schedule && 
               applicationData.expectedResults
      case 5:
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 戻る
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                新規申請書作成
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ステップインジケーター */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep === step.id 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : currentStep > step.id
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`mx-6 h-0.5 w-12 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-8">
            {renderStepContent()}
          </div>
          
          <div className="px-8 py-4 bg-gray-50 flex justify-between rounded-b-lg">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              前へ
            </button>
            
            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                disabled={!isStepValid()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                次へ
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={() => saveApplicationMutation.mutate()}
                disabled={saveApplicationMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                {saveApplicationMutation.isPending ? '保存中...' : '申請書を保存'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
```

#### Phase 1 実装手順

```bash
# 1. ファイルを完全に置き換える
cd /Users/MBP/ai-subsidy-system/frontend/src/app/dashboard/applications/new/

# 2. 現在のファイルをバックアップ
cp NewApplicationClient.tsx NewApplicationClient.tsx.backup

# 3. 新しいコードを書き込む（上記のコードを完全にコピー）
# エディタで NewApplicationClient.tsx を開いて全内容を上記コードに置き換える

# 4. 動作テスト
echo "✅ Phase 1 テスト開始..."
echo "🌐 http://localhost:3000/dashboard/applications/new にアクセスしてテスト"
```

---

## 🎯 Phase 2: PDF機能完成 (2時間)

### PDF生成サービス強化

**作業ファイル**: `backend/pdf-service.js`

#### PDF機能テスト
```bash
# 現在のPDF機能確認
curl -X POST http://localhost:3001/api/pdf/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"applicationId":"1"}'
```

#### HTMLプレビュー確認
```bash
# HTMLプレビュー確認
curl http://localhost:3001/api/pdf/preview/1
```

---

## 🎯 Phase 3: 申請書詳細ページ完成 (2時間)

### 申請書詳細ページ機能実装

**作業ファイル**: `frontend/src/app/dashboard/applications/[id]/ApplicationDetailsClient.tsx`

#### 詳細ページテスト
```bash
# 申請書詳細ページアクセステスト
echo "🌐 http://localhost:3000/dashboard/applications/1 にアクセスしてテスト"
```

---

## ✅ 各Phase完了チェックリスト

### Phase 1 完了確認
- [ ] 5段階フォームが表示される
- [ ] Step間の移動ができる
- [ ] AI生成ボタンが動作する
- [ ] フォームバリデーションが動作する
- [ ] 保存ボタンが動作する

### Phase 2 完了確認
- [ ] PDF生成APIが応答する
- [ ] HTMLプレビューが表示される
- [ ] エラーケースが適切に処理される

### Phase 3 完了確認
- [ ] 申請書詳細が表示される
- [ ] 編集機能が動作する
- [ ] AI統合が動作する
- [ ] PDF出力ボタンが動作する

---

## 🚨 トラブルシューティング

### よくある問題
```bash
# バックエンド接続確認
curl http://localhost:3001/api/health

# 認証トークン確認
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@demo.com","password":"demo123"}'

# フロントエンド再起動
cd frontend && npm run dev
```

---

## 🎉 完了報告

各Phase完了後、以下を確認して報告してください：

1. **実装した機能**
2. **テスト結果** 
3. **発見した問題**
4. **スクリーンショット（可能であれば）**

---

**この指示書に従って、ターミナルBで即座に作業を開始してください！**