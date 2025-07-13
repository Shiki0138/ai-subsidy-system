'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { StepIndicator } from '@/components/apply/StepIndicator'
import { 
  ArrowLeft, 
  ArrowRight,
  Building2, 
  FileText, 
  Sparkles,
  Download,
  CheckCircle,
  Search,
  Target,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { logger } from '@/utils/logger'
import { showError, showSuccess } from '@/utils/error-handler'
import { corporateNumberService } from '@/services/corporateNumberService'
import { GeminiService } from '@/services/ai/geminiService'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useTemplates } from '@/hooks/useTemplates'

// 補助金情報（既存のまま）
const subsidyInfo: Record<string, any> = {
  sustainability: {
    name: '小規模事業者持続化補助金',
    maxAmount: '200万円',
    subsidyRate: '2/3',
    description: '小規模事業者の販路開拓等の取り組みを支援',
    requirements: [
      '小規模事業者であること',
      '商工会議所・商工会の支援を受けること',
      '事業計画を策定すること'
    ]
  },
  // ... 他の補助金情報
}

// ステップ定義
const STEPS = [
  { number: 1, title: '補助金確認', description: '要件確認' },
  { number: 2, title: '企業情報', description: '基本情報入力' },
  { number: 3, title: '事業計画', description: '計画詳細' },
  { number: 4, title: '経営課題', description: 'ニーズ入力' },
  { number: 5, title: '補助金活用', description: '使途説明' },
  { number: 6, title: 'AI生成', description: '申請書作成' },
  { number: 7, title: '完了', description: 'ダウンロード' }
]

export default function ApplyPageImproved() {
  const params = useParams()
  const router = useRouter()
  const type = params.type as string
  const subsidy = subsidyInfo[type]

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetchingCorporateInfo, setFetchingCorporateInfo] = useState(false)
  
  // フォームデータ（改善版）
  const [formData, setFormData] = useState({
    // ステップ2: 企業情報
    companyName: '',
    corporateNumber: '',
    representativeName: '',
    email: '',
    phone: '',
    address: '',
    employeeCount: '',
    annualRevenue: '',
    businessType: '',
    establishedYear: '',
    
    // ステップ3: 事業計画
    projectTitle: '',
    projectDescription: '',
    projectPurpose: '',
    projectPeriod: '',
    expectedBudget: '',
    implementationSchedule: '',
    
    // ステップ4: 経営課題・ニーズ
    currentChallenges: '',
    improvementNeeds: '',
    targetMarket: '',
    competitiveAdvantage: '',
    marketTrends: '',
    
    // ステップ5: 補助金使途
    subsidyUsage: '',
    expectedResults: '',
    kpiTargets: '',
    sustainabilityPlan: '',
    riskManagement: ''
  })

  // 自動保存機能
  const { saveNow, loadSavedData, clearSavedData } = useAutoSave({
    key: `application_${type}_improved`,
    data: { step, formData },
    interval: 10000,
    enabled: true
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // 法人番号から企業情報を取得
  const fetchCorporateInfo = async () => {
    const normalizedNumber = formData.corporateNumber.replace(/[-\s]/g, '')
    
    if (!normalizedNumber) {
      showError('法人番号を入力してください')
      return
    }
    
    if (!/^\d{13}$/.test(normalizedNumber)) {
      showError('法人番号は13桁の数字で入力してください')
      return
    }
    
    setFetchingCorporateInfo(true)
    try {
      const corpInfo = await corporateNumberService.getCorporateInfo(normalizedNumber)
      if (corpInfo) {
        setFormData(prev => ({
          ...prev,
          companyName: corpInfo.name || prev.companyName,
          address: corpInfo.address || prev.address,
          corporateNumber: normalizedNumber,
        }))
        showSuccess('企業情報を取得しました')
      } else {
        showError('企業情報が見つかりませんでした')
      }
    } catch (error) {
      logger.error('企業情報取得エラー', error)
      showError('企業情報の取得に失敗しました')
    } finally {
      setFetchingCorporateInfo(false)
    }
  }

  // AI申請書生成（改善版）
  const handleGenerateApplication = async () => {
    try {
      setLoading(true)
      logger.info('申請書生成開始（詳細版）', { type, formData })
      
      const geminiService = new GeminiService()
      const applicationContent = await geminiService.generateApplication({
        subsidyType: type,
        companyData: {
          // 全ての入力情報を渡す
          ...formData
        },
        requirements: {
          ...subsidy,
          // 詳細な事業計画情報
          projectDetails: {
            title: formData.projectTitle,
            description: formData.projectDescription,
            purpose: formData.projectPurpose,
            period: formData.projectPeriod,
            budget: formData.expectedBudget,
            schedule: formData.implementationSchedule
          },
          // 経営課題情報
          businessChallenges: {
            current: formData.currentChallenges,
            needs: formData.improvementNeeds,
            market: formData.targetMarket,
            advantage: formData.competitiveAdvantage,
            trends: formData.marketTrends
          },
          // 補助金活用計画
          subsidyPlan: {
            usage: formData.subsidyUsage,
            results: formData.expectedResults,
            kpi: formData.kpiTargets,
            sustainability: formData.sustainabilityPlan,
            risk: formData.riskManagement
          }
        },
        additionalInfo: '詳細な事業計画と経営課題を含む申請書を生成してください'
      })
      
      localStorage.setItem(`application_${type}_${Date.now()}`, JSON.stringify({
        formData,
        generatedContent: applicationContent,
        createdAt: new Date().toISOString()
      }))
      
      showSuccess('申請書を生成しました')
      setStep(7)
    } catch (error) {
      logger.error('申請書生成エラー', error)
      showError('申請書の生成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // PDF生成・ダウンロード
  const handleDownloadPDF = async () => {
    try {
      // 申請書データの準備
      const applicationData = {
        id: Date.now().toString(),
        title: formData.projectTitle || '補助金申請書',
        subsidyProgramName: subsidy.name,
        subsidyProgramCategory: type,
        projectDescription: formData.projectDescription || '',
        purpose: formData.projectPurpose || '',
        targetMarket: formData.targetMarket || '',
        expectedEffects: formData.expectedResults || '',
        budget: parseInt(formData.expectedBudget?.replace(/[^0-9]/g, '') || '0'),
        timeline: `実施期間: ${formData.projectPeriod || '未定'}`,
        challenges: formData.currentChallenges || '',
        innovation: formData.competitiveAdvantage || '',
        companyName: formData.companyName || '',
        representativeName: formData.representativeName || '',
        createdAt: new Date().toISOString(),
        status: 'COMPLETED'
      }
      
      // シンプルなPDF生成を試す
      const { downloadApplicationAsPDF, showApplicationPreview } = await import('@/utils/simplePdfGenerator')
      
      try {
        await downloadApplicationAsPDF(applicationData)
        showSuccess('PDFをダウンロードしました')
      } catch (pdfError) {
        console.warn('PDF生成に失敗しました。HTMLプレビューを表示します。', pdfError)
        showApplicationPreview(applicationData)
        showSuccess('プレビューを表示しました。印刷機能でPDF保存できます。')
      }
      
    } catch (error) {
      console.error('PDF生成エラー:', error)
      showError('PDF生成に失敗しました。もう一度お試しください。')
    }
  }

  // ステップごとのコンテンツ
  const renderStepContent = () => {
    switch (step) {
      case 1:
        // ステップ1: 補助金確認（既存のまま）
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">補助金の概要</h2>
            {/* 既存のコンテンツ */}
            <Button onClick={() => setStep(2)} className="w-full mt-4">
              申請を開始する
            </Button>
          </Card>
        )

      case 2:
        // ステップ2: 企業情報（拡張版）
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">企業情報の入力</h2>
            <div className="space-y-4">
              {/* 既存の企業情報フィールド */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">従業員数</label>
                  <Input
                    name="employeeCount"
                    value={formData.employeeCount}
                    onChange={handleInputChange}
                    placeholder="10"
                    type="number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">年間売上高</label>
                  <Input
                    name="annualRevenue"
                    value={formData.annualRevenue}
                    onChange={handleInputChange}
                    placeholder="5000万円"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">業種</label>
                <Input
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  placeholder="製造業、小売業など"
                />
              </div>
              
              <div className="flex gap-4 mt-6">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  戻る
                </Button>
                <Button 
                  onClick={() => setStep(3)}
                  disabled={!formData.companyName || !formData.representativeName}
                  className="flex-1"
                >
                  次へ：事業計画
                </Button>
              </div>
            </div>
          </Card>
        )

      case 3:
        // ステップ3: 事業計画（新規）
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              <Target className="inline-block w-5 h-5 mr-2" />
              事業計画の詳細
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">事業計画名 *</label>
                <Input
                  name="projectTitle"
                  value={formData.projectTitle}
                  onChange={handleInputChange}
                  placeholder="例：ECサイト構築による販路拡大事業"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">事業内容の詳細 *</label>
                <textarea
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                  placeholder="具体的な事業内容を記載してください。何を、どのように実施するか詳しく説明してください。"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">事業の目的 *</label>
                <textarea
                  name="projectPurpose"
                  value={formData.projectPurpose}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="なぜこの事業を実施するのか、解決したい課題は何か"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">実施期間</label>
                  <Input
                    name="projectPeriod"
                    value={formData.projectPeriod}
                    onChange={handleInputChange}
                    placeholder="例：6ヶ月"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">必要予算</label>
                  <Input
                    name="expectedBudget"
                    value={formData.expectedBudget}
                    onChange={handleInputChange}
                    placeholder="例：300万円"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  戻る
                </Button>
                <Button 
                  onClick={() => setStep(4)}
                  disabled={!formData.projectTitle || !formData.projectDescription}
                  className="flex-1"
                >
                  次へ：経営課題
                </Button>
              </div>
            </div>
          </Card>
        )

      case 4:
        // ステップ4: 経営課題・ニーズ（新規）
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              <TrendingUp className="inline-block w-5 h-5 mr-2" />
              経営課題とニーズ
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">現在の経営課題 *</label>
                <textarea
                  name="currentChallenges"
                  value={formData.currentChallenges}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="例：新規顧客の獲得が困難、売上が伸び悩んでいる、業務効率が悪い等"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">改善したいポイント *</label>
                <textarea
                  name="improvementNeeds"
                  value={formData.improvementNeeds}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="例：オンライン販売の強化、業務のデジタル化、新商品開発等"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">ターゲット市場</label>
                <Input
                  name="targetMarket"
                  value={formData.targetMarket}
                  onChange={handleInputChange}
                  placeholder="例：30-40代の女性、地域の中小企業等"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">競争優位性</label>
                <textarea
                  name="competitiveAdvantage"
                  value={formData.competitiveAdvantage}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                  placeholder="他社と比較した強み、独自性など"
                />
              </div>
              
              <div className="flex gap-4 mt-6">
                <Button variant="ghost" onClick={() => setStep(3)}>
                  戻る
                </Button>
                <Button 
                  onClick={() => setStep(5)}
                  disabled={!formData.currentChallenges || !formData.improvementNeeds}
                  className="flex-1"
                >
                  次へ：補助金活用計画
                </Button>
              </div>
            </div>
          </Card>
        )

      case 5:
        // ステップ5: 補助金使途（新規）
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              <DollarSign className="inline-block w-5 h-5 mr-2" />
              補助金の活用計画
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">補助金の使途 *</label>
                <textarea
                  name="subsidyUsage"
                  value={formData.subsidyUsage}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="例：ECサイト構築費用150万円、マーケティング費用50万円、システム導入費100万円"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">期待される成果 *</label>
                <textarea
                  name="expectedResults"
                  value={formData.expectedResults}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="例：売上20%向上、新規顧客100名獲得、業務時間30%削減"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">成果指標（KPI）</label>
                <textarea
                  name="kpiTargets"
                  value={formData.kpiTargets}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                  placeholder="例：月間売上高、新規顧客数、リピート率等の具体的な数値目標"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">持続可能性</label>
                <textarea
                  name="sustainabilityPlan"
                  value={formData.sustainabilityPlan}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                  placeholder="補助事業終了後も継続的に効果を維持する計画"
                />
              </div>
              
              <div className="flex gap-4 mt-6">
                <Button variant="ghost" onClick={() => setStep(4)}>
                  戻る
                </Button>
                <Button 
                  onClick={() => setStep(6)}
                  disabled={!formData.subsidyUsage || !formData.expectedResults}
                  className="flex-1"
                >
                  次へ：申請書生成
                </Button>
              </div>
            </div>
          </Card>
        )

      case 6:
        // ステップ6: AI生成確認（新規）
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              <Sparkles className="inline-block w-5 h-5 mr-2" />
              申請書生成の確認
            </h2>
            
            <Alert className="mb-6">
              <div>
                <p className="font-semibold">入力内容の確認</p>
                <p className="text-sm mt-1">
                  以下の情報を基にAIが申請書を生成します
                </p>
              </div>
            </Alert>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">事業計画</h3>
                <p className="text-sm text-gray-700">{formData.projectTitle}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">解決する課題</h3>
                <p className="text-sm text-gray-700">{formData.currentChallenges}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">期待される成果</h3>
                <p className="text-sm text-gray-700">{formData.expectedResults}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setStep(5)}>
                戻って修正
              </Button>
              <Button 
                onClick={handleGenerateApplication}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    AI申請書を生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    申請書を生成する
                  </>
                )}
              </Button>
            </div>
          </Card>
        )

      case 7:
        // ステップ7: 完了（既存のまま）
        return (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">申請書の生成が完了しました！</h2>
            <p className="text-gray-600 mb-6">
              詳細な情報を基にAIが高品質な申請書を作成しました
            </p>
            <Button onClick={handleDownloadPDF} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              PDFをダウンロード
            </Button>
          </Card>
        )

      default:
        return null
    }
  }

  if (!subsidy) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5" />
              <span>トップに戻る</span>
            </Link>
            <Badge variant="secondary">
              ステップ {step} / 7
            </Badge>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {subsidy.name}
          </h1>
          <p className="text-gray-600">{subsidy.description}</p>
        </div>

        {/* ステップインジケーター */}
        <StepIndicator steps={STEPS} currentStep={step} />

        {/* ステップコンテンツ */}
        <div className="mt-8">
          {renderStepContent()}
        </div>
      </main>
    </div>
  )
}