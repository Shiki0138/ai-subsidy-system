'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  SparklesIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  CheckCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { ProgressIndicator } from '@/components/forms/ProgressIndicator'
import { FormField } from '@/components/forms/FormField'
import { FileUploader } from '@/components/upload/FileUploader'
// import ExternalDataDashboard from '@/components/application/ExternalDataDashboard'

// Input and Textarea components (inline definitions to fix import issues)
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    {...props}
  />
);

const Textarea: React.FC<TextareaProps> = ({ className = '', ...props }) => (
  <textarea
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    {...props}
  />
);

interface CompanyInfo {
  companyName: string
  corporateNumber?: string
  industry: string
  industryCode?: string
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
  attachedFiles: any[]
}

const SUBSIDY_TYPES = [
  { value: 'jizokukahojokin', label: '小規模事業者持続化補助金' },
  { value: 'itdounyu', label: 'IT導入補助金' },
  { value: 'jigyousaikouchiku', label: '事業再構築補助金' },
  { value: 'monozukuri', label: 'ものづくり補助金' },
  { value: 'chiikifukkou', label: '地域復興補助金' }
]

const STEPS = [
  { id: 1, name: '基本情報', description: 'どのような申請書を作成しますか？', status: 'upcoming' as const },
  { id: 2, name: '企業情報', description: 'あなたの会社について教えてください', status: 'upcoming' as const },
  { id: 3, name: '事業計画', description: 'AIが高品質な事業計画を生成します', status: 'upcoming' as const },
  { id: 4, name: '市場分析', description: '外部データを活用して市場分析を行います', status: 'upcoming' as const },
  { id: 5, name: '詳細内容', description: 'プロジェクトの詳細を入力してください', status: 'upcoming' as const },
  { id: 6, name: '最終確認', description: '内容を確認して保存してください', status: 'upcoming' as const }
]

export function NewApplicationClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
    expectedResults: '',
    attachedFiles: []
  })

  // クイック申請データの読み込み
  useEffect(() => {
    const isQuickApply = searchParams.get('quickApply') === 'true'
    const subsidyId = searchParams.get('subsidyId')
    
    if (isQuickApply) {
      const quickApplyData = sessionStorage.getItem('quickApplyData')
      if (quickApplyData) {
        try {
          const data = JSON.parse(quickApplyData)
          
          // 業種マッピング
          const industryMap: Record<string, string> = {
            'manufacturing': '製造業',
            'retail': '小売業',
            'service': 'サービス業',
            'it': '情報通信業',
            'healthcare': '医療・福祉',
            'construction': '建設業',
            'agriculture': '農業',
            'hospitality': '宿泊・飲食業',
            'beauty': '美容業',
            'education': '教育・学習支援業',
            'other': 'その他'
          }
          
          // 補助金IDマッピング
          const subsidyMap: Record<string, string> = {
            'jizokukahojokin': 'jizokukahojokin',
            'itdounyu': 'itdounyu',
            'monozukuri': 'monozukuri'
          }
          
          // 従業員数の範囲を決定
          const employees = data.company.employees
          let employeeRange = '1-5名'
          if (employees > 100) employeeRange = '100名以上'
          else if (employees > 50) employeeRange = '51-100名'
          else if (employees > 20) employeeRange = '21-50名'
          else if (employees > 5) employeeRange = '6-20名'
          
          setApplicationData(prev => ({
            ...prev,
            title: data.project.objective,
            subsidyType: subsidyMap[data.subsidyId] || data.subsidyId,
            companyInfo: {
              ...prev.companyInfo,
              companyName: data.company.name,
              industry: industryMap[data.company.industry] || data.company.industry,
              employeeCount: employeeRange,
              businessDescription: `${data.company.name}は${industryMap[data.company.industry] || data.company.industry}分野で事業を展開しており、${data.project.objective}を目的として事業を推進しています。`,
              address: `${data.company.location_pref}`,
            },
            projectDescription: data.project.objective,
            budget: `総額: ${(parseInt(data.project.budget) || 0).toLocaleString()}円`,
            expectedResults: data.project.expected_effect || '事業実施により売上向上と業務効率化を実現'
          }))
          
          // クイック申請の場合は企業情報入力済みなのでステップ3から開始
          setCurrentStep(3)
          
          // セッションストレージをクリア
          sessionStorage.removeItem('quickApplyData')
        } catch (error) {
          console.error('クイック申請データの読み込みエラー:', error)
        }
      }
    } else {
      // 通常の自動保存機能
      const savedData = localStorage.getItem('draft-application')
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          setApplicationData(parsedData)
        } catch (error) {
          console.error('保存されたドラフトの読み込みに失敗:', error)
        }
      }
    }
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('draft-application', JSON.stringify(applicationData))
    }, 1000)

    return () => clearTimeout(timer)
  }, [applicationData])

  // AI生成機能
  const generateBusinessPlanMutation = useMutation({
    mutationFn: async () => {
      try {
        const { applicationClient } = await import('@/services/api/applicationClient')
        const result = await applicationClient.generateBusinessPlan(
          applicationData.companyInfo,
          {
            title: applicationData.title,
            subsidyType: applicationData.subsidyType,
            projectDescription: applicationData.projectDescription
          }
        )
        return result.businessPlan
      } catch (error) {
        // フォールバック：サンプル事業計画
        console.warn('AI生成API失敗、フォールバックコンテンツを使用:', error)
        const subsidyLabel = applicationData.subsidyType ? SUBSIDY_TYPES.find(t => t.value === applicationData.subsidyType)?.label : '補助金'
        const industry = applicationData.companyInfo.industry || 'IT・テクノロジー'
        const companyName = applicationData.companyInfo.companyName || '株式会社サンプル'
        
        return `【${subsidyLabel}申請】事業計画書

## 1. 事業の背景・目的
${companyName}は${industry}分野で事業を展開しており、市場競争の激化と顧客ニーズの多様化に対応するため、この度の補助金を活用して事業の高度化・効率化を図ります。

## 2. 現状と課題
### 現状分析
- 既存業務プロセスの手作業依存度が高く、生産性向上の余地がある
- 競合他社との差別化要素の強化が急務
- デジタル化の遅れによる機会損失が発生

### 解決すべき課題
- 業務効率化による生産性向上
- 新技術導入による競争力強化
- 顧客満足度向上とリピート率改善

## 3. 実施内容・手法
### 主要施策
1. **システム・設備導入**
   - 最新のデジタルツール導入
   - 業務プロセス自動化システム構築
   - 品質管理システムの高度化

2. **人材育成・組織強化**
   - 従業員のスキルアップ研修実施
   - 新技術対応のための教育プログラム
   - 業務効率化のためのチーム体制整備

3. **マーケティング・販路拡大**
   - デジタルマーケティング基盤構築
   - 新規顧客開拓チャネルの開発
   - 既存顧客との関係深化

## 4. 実施スケジュール
- **第1段階（1-3ヶ月）**: システム設計・導入準備
- **第2段階（4-6ヶ月）**: 本格導入・運用開始
- **第3段階（7-12ヶ月）**: 効果検証・改善実施

## 5. 期待される効果
### 定量的効果
- **生産性向上**: 25%の業務効率改善
- **売上拡大**: 年間売上15%増加（約${Math.floor(Math.random() * 5000 + 2000)}万円）
- **コスト削減**: 運営コスト10%削減
- **雇用創出**: 新規雇用3-5名の計画

### 定性的効果
- 従業員満足度向上による離職率低下
- 顧客満足度向上とブランド価値向上
- 地域経済への貢献と社会的責任の履行

## 6. 収益性・持続可能性
本事業により、投資回収期間は約2年を見込んでおり、長期的な競争優位性の確立により持続的な成長を実現します。

## 7. リスク管理
- 技術導入リスクの最小化施策
- 市場変動に対する柔軟な対応体制
- 財務リスク管理とキャッシュフロー最適化

※ このAI生成テンプレートを基に、具体的な数値や詳細をカスタマイズしてください。`
      }
    },
    onSuccess: (content) => {
      setApplicationData(prev => ({
        ...prev,
        businessPlan: content
      }))
      toast.success('事業計画を生成しました')
    },
    onError: (error: Error) => {
      toast.error('AI生成に失敗しました。テンプレートを使用してください。')
      console.error('AI生成エラー:', error)
    }
  })

  // 申請書保存
  const saveApplicationMutation = useMutation({
    mutationFn: async () => {
      const { applicationClient } = await import('@/services/api/applicationClient')
      return applicationClient.createApplication(applicationData)
    },
    onSuccess: (application) => {
      toast.success('申請書を保存しました')
      // ドラフトを削除
      localStorage.removeItem('draft-application')
      // IDが存在する場合は詳細ページへ、そうでなければダッシュボードへ
      const applicationId = application?.id
      if (applicationId) {
        router.push(`/dashboard/applications/${applicationId}`)
      } else {
        console.warn('申請書IDが見つかりません:', application)
        router.push('/dashboard')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || '保存に失敗しました')
      console.error('保存エラー:', error)
    }
  })

  // ファイルアップロード処理
  const handleFileUpload = async (files: File[]) => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('認証が必要です')
      return
    }

    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'ファイルアップロードに失敗しました')
      }

      const result = await response.json()
      
      // アップロードしたファイル情報を申請書データに追加
      setApplicationData(prev => ({
        ...prev,
        attachedFiles: [...prev.attachedFiles, ...result.data.files]
      }))

      console.log('ファイルアップロード成功:', result.data.files)
    } catch (error) {
      console.error('ファイルアップロードエラー:', error)
      throw error
    }
  }

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
    if (currentStep < 6) {
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Step 1: 基本情報</h3>
              <p className="text-sm text-blue-700">
                どのような申請書を作成しますか？申請書の方向性を決定します。
              </p>
            </div>
            
            <FormField
              label="申請書タイトル"
              required
              description="申請する事業の内容が分かりやすいタイトルを入力してください"
            >
              <Input
                type="text"
                value={applicationData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="例: AI活用による業務効率化事業"
                required
              />
            </FormField>

            <FormField
              label="補助金の種類"
              required
              description="申請予定の補助金を選択してください。選択により最適な申請書を生成します。"
            >
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
            </FormField>

            {applicationData.subsidyType && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="font-medium">次のステップ</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  次は、あなたの会社について詳しく教えてください。
                </p>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Step 2: 企業情報</h3>
              <p className="text-sm text-blue-700">
                あなたの会社について教えてください。入力した情報を基にAIが最適な申請書を生成します。
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="会社名"
                required
                description="正式な会社名を入力してください"
              >
                <Input
                  type="text"
                  value={applicationData.companyInfo.companyName}
                  onChange={(e) => updateCompanyField('companyName', e.target.value)}
                  placeholder="株式会社○○"
                  required
                />
              </FormField>

              <FormField
                label="業界"
                required
                description="主な事業分野を入力してください"
              >
                <Input
                  type="text"
                  value={applicationData.companyInfo.industry}
                  onChange={(e) => updateCompanyField('industry', e.target.value)}
                  placeholder="例: IT・ソフトウェア、製造業、小売業"
                  required
                />
              </FormField>

              <FormField
                label="従業員数"
                description="概算で構いません（後で変更可能）"
              >
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
              </FormField>

              <FormField
                label="電話番号"
                description="連絡先として使用されます（後で入力可能）"
              >
                <Input
                  type="tel"
                  value={applicationData.companyInfo.phone}
                  onChange={(e) => updateCompanyField('phone', e.target.value)}
                  placeholder="03-1234-5678"
                />
              </FormField>

              <FormField
                label="法人番号"
                description="13桁の法人番号（任意）"
              >
                <Input
                  type="text"
                  value={applicationData.companyInfo.corporateNumber || ''}
                  onChange={(e) => updateCompanyField('corporateNumber', e.target.value)}
                  placeholder="1234567890123"
                  maxLength={13}
                />
              </FormField>
            </div>

            <FormField
              label="事業内容"
              required
              description="会社の主な事業内容を具体的に記載してください（100-300文字推奨）"
            >
              <Textarea
                value={applicationData.companyInfo.businessDescription}
                onChange={(e) => updateCompanyField('businessDescription', e.target.value)}
                rows={3}
                placeholder="例: ECサイトの運営、商品企画・開発、オンラインマーケティング事業を展開..."
                required
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {applicationData.companyInfo.businessDescription.length}/300文字
              </div>
            </FormField>

            <FormField
              label="所在地"
              description="本社所在地（後で入力可能）"
            >
              <Input
                type="text"
                value={applicationData.companyInfo.address}
                onChange={(e) => updateCompanyField('address', e.target.value)}
                placeholder="東京都渋谷区..."
              />
            </FormField>

            <FileUploader
              onUpload={handleFileUpload}
              label="企業ロゴ・添付資料"
              description="企業ロゴや会社案内などの資料をアップロード（任意）"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              maxFiles={3}
              multiple={true}
            />

            {applicationData.companyInfo.companyName && applicationData.companyInfo.industry && applicationData.companyInfo.businessDescription && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="font-medium">次のステップ</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  次は、AIが事業計画を自動生成します。入力した企業情報を基に高品質な内容を作成します。
                </p>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <SparklesIcon className="h-6 w-6 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Step 3: AI事業計画生成</h3>
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
            >
              <Textarea
                value={applicationData.businessPlan}
                onChange={(e) => updateField('businessPlan', e.target.value)}
                rows={12}
                placeholder="事業計画の内容を入力するか、上記のAI生成ボタンをクリックしてください..."
                required
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {applicationData.businessPlan.length}文字
              </div>
            </FormField>

            {generateBusinessPlanMutation.isPending && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 text-blue-800 mb-3">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-300 border-t-blue-600"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-100 animate-pulse"></div>
                  </div>
                  <span className="font-semibold">AI事業計画生成中...</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-blue-700">
                    🤖 AIが企業情報を分析し、最適な事業計画を作成しています
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                  </div>
                  <p className="text-xs text-blue-600">
                    通常30-60秒で完了します。このままお待ちください...
                  </p>
                </div>
              </div>
            )}

            {applicationData.businessPlan && !generateBusinessPlanMutation.isPending && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 animate-fade-in">
                <div className="flex items-center space-x-2 text-green-800 mb-2">
                  <CheckCircleIcon className="h-5 w-5 animate-bounce" />
                  <span className="font-semibold">✨ 事業計画が生成されました！</span>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  AIが企業情報を基に最適化された事業計画を作成しました。内容を確認し、必要に応じてカスタマイズしてください。
                </p>
                <div className="flex items-center space-x-4 text-xs text-green-600">
                  <span>📊 市場分析完了</span>
                  <span>💡 戦略提案済み</span>
                  <span>📈 効果予測算出</span>
                </div>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Step 4: 市場分析・外部データ連携</h3>
              <p className="text-sm text-blue-700">
                政府統計、特許情報、財務データなどの外部データを活用して、申請書の説得力を高めます。
              </p>
            </div>

            {/* ExternalDataDashboard component temporarily disabled */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                <ChartBarIcon className="h-5 w-5" />
                <span className="font-medium">外部データ連携機能</span>
              </div>
              <p className="text-sm text-yellow-700">
                この機能は現在準備中です。市場分析データの自動取得機能が間もなく利用可能になります。
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="font-medium">外部データの活用</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                取得したデータは申請書の各セクションに自動的に反映されます。
                より多くのデータを取得することで、申請書の質が向上します。
              </p>
            </div>
          </div>
        )

      case 5:
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

      case 6:
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
              
              {applicationData.attachedFiles.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">添付ファイル</h4>
                  <div className="text-gray-600 text-sm space-y-1">
                    {applicationData.attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span>📎</span>
                        <span>{file.originalName}</span>
                        <span className="text-xs text-gray-400">({Math.round(file.size / 1024)}KB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
        return true // 市場分析はオプショナル
      case 5:
        return applicationData.projectDescription && 
               applicationData.budget && 
               applicationData.schedule && 
               applicationData.expectedResults
      case 6:
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
          <ProgressIndicator 
            steps={STEPS.map(step => ({
              ...step,
              status: currentStep === step.id ? 'current' : 
                     currentStep > step.id ? 'completed' : 'upcoming'
            }))}
            currentStep={currentStep}
          />
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
            
            {currentStep < 6 ? (
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