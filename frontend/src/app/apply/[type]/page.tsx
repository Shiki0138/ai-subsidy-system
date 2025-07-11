'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { 
  ArrowLeft, 
  Building2, 
  FileText, 
  Sparkles,
  Download,
  CheckCircle,
  Search,
  Target,
  TrendingUp,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { logger } from '@/utils/logger'
import { showError, showSuccess } from '@/utils/error-handler'
import { corporateNumberService } from '@/services/corporateNumberService'
import { GeminiService } from '@/services/ai/geminiService'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useTemplates } from '@/hooks/useTemplates'
import { AITextAssistant } from '@/components/apply/AITextAssistant'
import { AutoSaveIndicator } from '@/components/apply/AutoSaveIndicator'

// 補助金情報の定義
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
  'business-improvement': {
    name: '業務改善助成金',
    maxAmount: '600万円',
    subsidyRate: '最大90%',
    description: '生産性向上と賃金引上げを同時に実現',
    requirements: [
      '中小企業・小規模事業者であること',
      '最低賃金の引き上げを行うこと',
      '生産性向上のための設備投資を行うこと'
    ]
  },
  'it-subsidy': {
    name: 'IT導入補助金',
    maxAmount: '450万円',
    subsidyRate: '1/2〜3/4',
    description: 'ITツール導入による業務効率化を支援',
    requirements: [
      '中小企業・小規模事業者であること',
      'IT導入支援事業者と連携すること',
      'ITツールを導入し業務効率化を図ること'
    ]
  },
  manufacturing: {
    name: 'ものづくり補助金',
    maxAmount: '1,250万円',
    subsidyRate: '1/2〜2/3',
    description: '革新的サービス開発・生産プロセス改善を支援',
    requirements: [
      '中小企業・小規模事業者であること',
      '革新的な取り組みを行うこと',
      '3〜5年の事業計画を策定すること'
    ]
  },
  reconstruction: {
    name: '事業再構築補助金',
    maxAmount: '1.5億円',
    subsidyRate: '1/2〜3/4',
    description: '新分野展開や事業転換を支援',
    requirements: [
      '売上高が減少していること',
      '事業再構築に取り組むこと',
      '認定経営革新等支援機関と事業計画を策定すること'
    ]
  }
}

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const type = params.type as string
  
  // カスタム補助金の場合はlocalStorageから取得
  const [customSubsidy, setCustomSubsidy] = useState<any>(null)
  
  useEffect(() => {
    if (type.startsWith('custom-')) {
      const savedCustomSubsidy = localStorage.getItem(`custom_subsidy_${type}`)
      if (savedCustomSubsidy) {
        setCustomSubsidy(JSON.parse(savedCustomSubsidy))
      }
    }
  }, [type])
  
  const subsidy = subsidyInfo[type] || customSubsidy

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetchingCorporateInfo, setFetchingCorporateInfo] = useState(false)
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
    
    // ステップ3: 事業計画
    projectTitle: '',
    projectDescription: '',
    projectPurpose: '',
    projectPeriod: '',
    expectedBudget: '',
    
    // ステップ4: 経営課題・ニーズ
    currentChallenges: '',
    improvementNeeds: '',
    targetMarket: '',
    competitiveAdvantage: '',
    
    // ステップ5: 補助金使途
    subsidyUsage: '',
    expectedResults: '',
    kpiTargets: '',
    sustainabilityPlan: ''
  })
  
  // 自動保存機能
  const { saveNow, loadSavedData, clearSavedData, getLastSaveTime } = useAutoSave({
    key: `application_${type}`,
    data: { step, formData },
    interval: 30000, // 30秒間隔
    enabled: true
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const lastSaveTime = getLastSaveTime()
  
  // 手動保存
  const handleManualSave = async () => {
    setIsSaving(true)
    await saveNow()
    setIsSaving(false)
  }
  
  // テンプレート機能
  const { 
    templates,
    createTemplate,
    applyTemplate,
    getTemplatesByType 
  } = useTemplates({ type })

  useEffect(() => {
    if (!subsidy) {
      router.push('/')
      return
    }
    
    // 保存されたデータの復元
    const savedData = loadSavedData()
    if (savedData && savedData.isRecent) {
      if (confirm('前回入力中のデータが見つかりました。復元しますか？')) {
        setStep(savedData.data.step || 1)
        setFormData(savedData.data.formData || formData)
        showSuccess('前回のデータを復元しました')
      } else {
        clearSavedData()
      }
    }
  }, [subsidy, router, loadSavedData, clearSavedData, customSubsidy])

  if (!subsidy) {
    return null
  }

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
          // 郵便番号も取得できる場合
          ...(corpInfo.postalCode && { postalCode: corpInfo.postalCode })
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

  const handleGenerateApplication = async () => {
    try {
      setLoading(true)
      logger.info('申請書生成開始（詳細版）', { type, formData })
      
      // Gemini APIを使用して申請書を生成
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
          },
          // 経営課題情報
          businessChallenges: {
            current: formData.currentChallenges,
            needs: formData.improvementNeeds,
            market: formData.targetMarket,
            advantage: formData.competitiveAdvantage,
          },
          // 補助金活用計画
          subsidyPlan: {
            usage: formData.subsidyUsage,
            results: formData.expectedResults,
            kpi: formData.kpiTargets,
            sustainability: formData.sustainabilityPlan,
          }
        },
        additionalInfo: '詳細な事業計画と経営課題を含む申請書を生成してください'
      })
      
      // 生成された内容を保存（将来的にはサーバーに送信）
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

  const handleDownloadPDF = () => {
    showSuccess('PDFのダウンロードを開始しました')
    // 実際のPDF生成・ダウンロード処理
  }
  
  // テンプレートの保存
  const handleSaveAsTemplate = async () => {
    const templateName = prompt('テンプレート名を入力してください：')
    if (!templateName) return
    
    await createTemplate(
      templateName,
      type,
      formData,
      `${subsidy.name}のテンプレート`
    )
  }
  
  // テンプレートの適用
  const handleApplyTemplate = (templateId: string) => {
    const templateData = applyTemplate(templateId)
    if (templateData) {
      setFormData({ ...formData, ...templateData })
      showSuccess('テンプレートを適用しました')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">トップに戻る</span>
            </Link>
            <Badge variant="secondary" className="text-xs sm:text-sm">
              ステップ {step} / 7
            </Badge>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
            {subsidy.name}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">{subsidy.description}</p>
        </div>

        {/* ステップ1: 補助金情報 */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">補助金の概要</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">最大補助額</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{subsidy.maxAmount}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">補助率</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{subsidy.subsidyRate}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">主な要件</h3>
                    <ul className="space-y-2">
                      {subsidy.requirements.map((req: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button onClick={() => setStep(2)} className="w-full">
                    申請を開始する
                  </Button>
                </div>
              </Card>
            </div>
            
            <div>
              <Alert className="mb-4">
                <Sparkles className="h-4 w-4" />
                <div>
                  <p className="font-semibold">AI支援機能</p>
                  <p className="text-sm mt-1">
                    AIが申請書の作成をサポートします
                  </p>
                </div>
              </Alert>
              
              {/* テンプレート選択 */}
              {getTemplatesByType(type).length > 0 && (
                <Alert className="mb-4">
                  <FileText className="h-4 w-4" />
                  <div>
                    <p className="font-semibold">テンプレート</p>
                    <p className="text-sm mt-1 mb-2">
                      保存済みのテンプレートから選択
                    </p>
                    <select 
                      className="w-full text-sm border rounded px-2 py-1"
                      onChange={(e) => e.target.value && handleApplyTemplate(e.target.value)}
                      defaultValue=""
                    >
                      <option value="">テンプレートを選択...</option>
                      {getTemplatesByType(type).map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* ステップ2: 企業情報入力 */}
        {step === 2 && (
          <Card className="max-w-2xl mx-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
              <h2 className="text-lg sm:text-xl font-semibold">企業情報の入力</h2>
              <AutoSaveIndicator 
                lastSaveTime={lastSaveTime} 
                onSave={handleManualSave} 
                isSaving={isSaving} 
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">企業名 *</label>
                <Input
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="株式会社サンプル"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">法人番号</label>
                <div className="flex gap-2">
                  <Input
                    name="corporateNumber"
                    value={formData.corporateNumber}
                    onChange={handleInputChange}
                    placeholder="1234567890123"
                    maxLength={13}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={fetchCorporateInfo}
                    disabled={fetchingCorporateInfo || !formData.corporateNumber}
                    variant="secondary"
                    className="px-4"
                  >
                    {fetchingCorporateInfo ? (
                      <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-1" />
                        反映
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  法人番号を入力して「反映」ボタンをクリックすると企業情報を自動取得します
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">代表者名 *</label>
                <Input
                  name="representativeName"
                  value={formData.representativeName}
                  onChange={handleInputChange}
                  placeholder="山田太郎"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">メールアドレス *</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="sample@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">電話番号 *</label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="03-1234-5678"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">住所</label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="東京都千代田区..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">事業計画名 *</label>
                <Input
                  name="projectTitle"
                  value={formData.projectTitle}
                  onChange={handleInputChange}
                  placeholder="新商品開発による販路拡大計画"
                  required
                />
                <AITextAssistant
                  fieldName="projectTitle"
                  fieldLabel="事業計画名"
                  currentValue={formData.projectTitle}
                  subsidyType={subsidy.name}
                  onUpdate={(value) => setFormData({ ...formData, projectTitle: value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">事業計画の概要 *</label>
                <textarea
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                  placeholder="事業の内容を簡潔に記載してください"
                  required
                />
                <AITextAssistant
                  fieldName="projectDescription"
                  fieldLabel="事業計画の概要"
                  currentValue={formData.projectDescription}
                  subsidyType={subsidy.name}
                  onUpdate={(value) => setFormData({ ...formData, projectDescription: value })}
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
        )}

        {/* ステップ3: 事業計画 */}
        {step === 3 && (
          <Card className="max-w-2xl mx-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
              <h2 className="text-lg sm:text-xl font-semibold">
                <Target className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                事業計画の詳細
              </h2>
              <AutoSaveIndicator 
                lastSaveTime={lastSaveTime} 
                onSave={handleManualSave} 
                isSaving={isSaving} 
              />
            </div>
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
                <AITextAssistant
                  fieldName="projectDescription"
                  fieldLabel="事業内容の詳細"
                  currentValue={formData.projectDescription}
                  subsidyType={subsidy.name}
                  onUpdate={(value) => setFormData({ ...formData, projectDescription: value })}
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
                <AITextAssistant
                  fieldName="projectPurpose"
                  fieldLabel="事業の目的"
                  currentValue={formData.projectPurpose}
                  subsidyType={subsidy.name}
                  onUpdate={(value) => setFormData({ ...formData, projectPurpose: value })}
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
        )}

        {/* ステップ4: 経営課題・ニーズ */}
        {step === 4 && (
          <Card className="max-w-2xl mx-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
              <h2 className="text-lg sm:text-xl font-semibold">
                <TrendingUp className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                経営課題とニーズ
              </h2>
              <AutoSaveIndicator 
                lastSaveTime={lastSaveTime} 
                onSave={handleManualSave} 
                isSaving={isSaving} 
              />
            </div>
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
                <AITextAssistant
                  fieldName="currentChallenges"
                  fieldLabel="現在の経営課題"
                  currentValue={formData.currentChallenges}
                  subsidyType={subsidy.name}
                  onUpdate={(value) => setFormData({ ...formData, currentChallenges: value })}
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
                <AITextAssistant
                  fieldName="improvementNeeds"
                  fieldLabel="改善したいポイント"
                  currentValue={formData.improvementNeeds}
                  subsidyType={subsidy.name}
                  onUpdate={(value) => setFormData({ ...formData, improvementNeeds: value })}
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
                <AITextAssistant
                  fieldName="targetMarket"
                  fieldLabel="ターゲット市場"
                  currentValue={formData.targetMarket}
                  subsidyType={subsidy.name}
                  onUpdate={(value) => setFormData({ ...formData, targetMarket: value })}
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
                <AITextAssistant
                  fieldName="competitiveAdvantage"
                  fieldLabel="競争優位性"
                  currentValue={formData.competitiveAdvantage}
                  subsidyType={subsidy.name}
                  onUpdate={(value) => setFormData({ ...formData, competitiveAdvantage: value })}
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
        )}

        {/* ステップ5: 補助金使途 */}
        {step === 5 && (
          <Card className="max-w-2xl mx-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
              <h2 className="text-lg sm:text-xl font-semibold">
                <DollarSign className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                補助金の活用計画
              </h2>
              <AutoSaveIndicator 
                lastSaveTime={lastSaveTime} 
                onSave={handleManualSave} 
                isSaving={isSaving} 
              />
            </div>
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
                <AITextAssistant
                  fieldName="subsidyUsage"
                  fieldLabel="補助金の使途"
                  currentValue={formData.subsidyUsage}
                  subsidyType={subsidy.name}
                  onUpdate={(value) => setFormData({ ...formData, subsidyUsage: value })}
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
                <AITextAssistant
                  fieldName="expectedResults"
                  fieldLabel="期待される成果"
                  currentValue={formData.expectedResults}
                  subsidyType={subsidy.name}
                  onUpdate={(value) => setFormData({ ...formData, expectedResults: value })}
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
                <AITextAssistant
                  fieldName="kpiTargets"
                  fieldLabel="成果指標（KPI）"
                  currentValue={formData.kpiTargets}
                  subsidyType={subsidy.name}
                  onUpdate={(value) => setFormData({ ...formData, kpiTargets: value })}
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
                <AITextAssistant
                  fieldName="sustainabilityPlan"
                  fieldLabel="持続可能性"
                  currentValue={formData.sustainabilityPlan}
                  subsidyType={subsidy.name}
                  onUpdate={(value) => setFormData({ ...formData, sustainabilityPlan: value })}
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
        )}

        {/* ステップ6: AI生成確認 */}
        {step === 6 && (
          <Card className="max-w-2xl mx-auto p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              <Sparkles className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              申請書生成の確認
            </h2>
            
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
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
        )}

        {/* ステップ7: 生成完了 */}
        {step === 7 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 sm:p-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">申請書の生成が完了しました！</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                詳細な情報を基にAIが高品質な申請書を作成しました
              </p>
              
              <div className="space-y-4">
                <Button onClick={handleDownloadPDF} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  PDFをダウンロード
                </Button>
                
                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => setStep(6)} className="flex-1">
                    内容を編集
                  </Button>
                  <Button variant="ghost" onClick={handleSaveAsTemplate} className="flex-1">
                    テンプレート保存
                  </Button>
                  <Button variant="ghost" onClick={() => router.push('/dashboard')} className="flex-1">
                    ダッシュボードへ
                  </Button>
                </div>
              </div>
              
              <Alert className="mt-6 text-left">
                <FileText className="h-4 w-4" />
                <div>
                  <p className="font-semibold">次のステップ</p>
                  <p className="text-sm mt-1">
                    生成された申請書を確認し、必要に応じて修正してから提出してください
                  </p>
                </div>
              </Alert>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}