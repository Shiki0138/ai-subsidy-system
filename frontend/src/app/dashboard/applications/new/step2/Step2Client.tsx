'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyYenIcon,
} from '@heroicons/react/24/outline'

interface CompanyInfo {
  companyName: string
  businessDescription: string
  industry: string
  foundedYear: string
  employeeCount: string
  annualRevenue: string
  businessAreas: string[]
  contactInfo: {
    address: string
    phone: string
    email: string
  }
  websiteContent?: string
}

interface AnalysisResult {
  isAnalyzed: boolean
  confidence: number
  extractedInfo: Partial<CompanyInfo>
  suggestions: string[]
}

export function Step2Client() {
  const router = useRouter()
  const [step1Results, setStep1Results] = useState<any>(null)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    businessDescription: '',
    industry: '',
    foundedYear: '',
    employeeCount: '',
    annualRevenue: '',
    businessAreas: [],
    contactInfo: {
      address: '',
      phone: '',
      email: ''
    }
  })
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState<'website' | 'upload' | 'manual'>('website')

  useEffect(() => {
    // ステップ1の結果を取得
    const results = sessionStorage.getItem('step1-results')
    if (results) {
      setStep1Results(JSON.parse(results))
    }
  }, [])

  const analyzeWebsite = async () => {
    if (!websiteUrl) return

    setIsAnalyzing(true)
    try {
      // 実際の実装では外部APIを使用してWebサイトを分析
      // ここではモック実装
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const mockAnalysis: AnalysisResult = {
        isAnalyzed: true,
        confidence: 85,
        extractedInfo: {
          companyName: 'デモ株式会社',
          businessDescription: 'IT関連サービスを提供する企業。Webアプリケーション開発、システム構築、デジタルマーケティング支援を主力事業とする。',
          industry: 'IT・ソフトウェア',
          foundedYear: '2015',
          employeeCount: '25名',
          businessAreas: ['Webアプリケーション開発', 'システム構築', 'デジタルマーケティング'],
          contactInfo: {
            address: '東京都渋谷区〇〇1-2-3',
            phone: '03-1234-5678',
            email: 'info@demo.co.jp'
          }
        },
        suggestions: [
          '事業内容がIT関連のため、IT導入補助金が最適です',
          '従業員数から小規模事業者持続化補助金も対象となります',
          '売上規模の詳細情報があると、より精度の高い提案が可能です'
        ]
      }

      setAnalysisResult(mockAnalysis)
      setCompanyInfo(prev => ({
        ...prev,
        ...mockAnalysis.extractedInfo
      }))
    } catch (error) {
      console.error('Website analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const updateCompanyInfo = (field: string, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateContactInfo = (field: string, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }))
  }

  const addBusinessArea = (area: string) => {
    if (area && !companyInfo.businessAreas.includes(area)) {
      setCompanyInfo(prev => ({
        ...prev,
        businessAreas: [...prev.businessAreas, area]
      }))
    }
  }

  const removeBusinessArea = (index: number) => {
    setCompanyInfo(prev => ({
      ...prev,
      businessAreas: prev.businessAreas.filter((_, i) => i !== index)
    }))
  }

  const canProceed = companyInfo.companyName && 
                    companyInfo.businessDescription && 
                    companyInfo.industry

  const handleNext = () => {
    if (canProceed) {
      // ステップ2の結果を保存
      const results = {
        companyInfo,
        analysisResult,
        uploadedFiles: uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
        timestamp: new Date().toISOString()
      }
      sessionStorage.setItem('step2-results', JSON.stringify(results))
      router.push('/dashboard/applications/new/step3')
    }
  }

  const handleBack = () => {
    router.push('/dashboard/applications/new/step1')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button onClick={handleBack} className="text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                申請書作成フロー
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              ステップ2: 自社情報の読み込み
            </h2>
            <div className="text-sm text-gray-600">
              2 / 7
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-brand-600 h-2 rounded-full" style={{ width: '28.6%' }}></div>
          </div>
        </div>

        {/* ステップ1の結果表示 */}
        {step1Results && (
          <div className="card mb-8">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📋 前のステップの結果
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  選択された分野: {step1Results.selectedCategories?.length || 0} 項目
                </p>
                <p className="text-sm text-blue-800">
                  推奨補助金: {step1Results.recommendedSubsidies?.slice(0, 2).join(', ') || 'なし'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 情報取得方法の選択 */}
        <div className="card mb-8">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🏢 企業情報の取得方法を選択してください
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => setActiveTab('website')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  activeTab === 'website'
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <GlobeAltIcon className="h-8 w-8 text-brand-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">ホームページから自動取得</h4>
                <p className="text-sm text-gray-600">
                  企業のWebサイトURLを入力してAIが自動分析
                </p>
              </button>

              <button
                onClick={() => setActiveTab('upload')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  activeTab === 'upload'
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CloudArrowUpIcon className="h-8 w-8 text-brand-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">書類をアップロード</h4>
                <p className="text-sm text-gray-600">
                  会社案内やパンフレットからAIが情報を抽出
                </p>
              </button>

              <button
                onClick={() => setActiveTab('manual')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  activeTab === 'manual'
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <DocumentTextIcon className="h-8 w-8 text-brand-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">手動で入力</h4>
                <p className="text-sm text-gray-600">
                  フォームに直接企業情報を入力
                </p>
              </button>
            </div>

            {/* Webサイト分析 */}
            {activeTab === 'website' && (
              <div className="space-y-4">
                <div>
                  <label className="form-label">企業ホームページURL</label>
                  <div className="flex space-x-3">
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="form-input flex-1"
                    />
                    <button
                      onClick={analyzeWebsite}
                      disabled={!websiteUrl || isAnalyzing}
                      className="btn-primary flex items-center"
                    >
                      {isAnalyzing ? (
                        <>
                          <SparklesIcon className="h-4 w-4 mr-2 animate-spin" />
                          分析中...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          AI分析開始
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isAnalyzing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <SparklesIcon className="h-5 w-5 text-blue-500 animate-spin mr-3" />
                      <div>
                        <p className="font-medium text-blue-900">AIがWebサイトを分析中...</p>
                        <p className="text-sm text-blue-700">企業情報を自動抽出しています</p>
                      </div>
                    </div>
                  </div>
                )}

                {analysisResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-green-900 mb-2">
                          分析完了 (信頼度: {analysisResult.confidence}%)
                        </h4>
                        <ul className="text-sm text-green-800 space-y-1">
                          {analysisResult.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ファイルアップロード */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div>
                  <label className="form-label">企業資料をアップロード</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      会社案内、パンフレット、決算書などをドラッグ&ドロップ
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="btn-outline">
                      ファイルを選択
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      PDF, Word, テキスト, 画像ファイル対応
                    </p>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">アップロード済みファイル</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 企業情報フォーム */}
        <div className="card mb-8">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              📝 企業情報の確認・編集
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本情報 */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                  基本情報
                </h4>
                
                <div>
                  <label className="form-label">企業名 *</label>
                  <input
                    type="text"
                    value={companyInfo.companyName}
                    onChange={(e) => updateCompanyInfo('companyName', e.target.value)}
                    className="form-input"
                    placeholder="株式会社〇〇"
                  />
                </div>

                <div>
                  <label className="form-label">業界 *</label>
                  <select
                    value={companyInfo.industry}
                    onChange={(e) => updateCompanyInfo('industry', e.target.value)}
                    className="form-select"
                  >
                    <option value="">選択してください</option>
                    <option value="IT・ソフトウェア">IT・ソフトウェア</option>
                    <option value="製造業">製造業</option>
                    <option value="小売業">小売業</option>
                    <option value="サービス業">サービス業</option>
                    <option value="建設業">建設業</option>
                    <option value="医療・福祉">医療・福祉</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">設立年</label>
                  <input
                    type="text"
                    value={companyInfo.foundedYear}
                    onChange={(e) => updateCompanyInfo('foundedYear', e.target.value)}
                    className="form-input"
                    placeholder="2015"
                  />
                </div>

                <div>
                  <label className="form-label">従業員数</label>
                  <select
                    value={companyInfo.employeeCount}
                    onChange={(e) => updateCompanyInfo('employeeCount', e.target.value)}
                    className="form-select"
                  >
                    <option value="">選択してください</option>
                    <option value="1-5名">1-5名</option>
                    <option value="6-20名">6-20名</option>
                    <option value="21-50名">21-50名</option>
                    <option value="51-100名">51-100名</option>
                    <option value="101名以上">101名以上</option>
                  </select>
                </div>
              </div>

              {/* 事業情報 */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  事業情報
                </h4>

                <div>
                  <label className="form-label">事業内容 *</label>
                  <textarea
                    value={companyInfo.businessDescription}
                    onChange={(e) => updateCompanyInfo('businessDescription', e.target.value)}
                    className="form-textarea"
                    rows={4}
                    placeholder="主力事業や提供サービスについて詳しく記述してください"
                  />
                </div>

                <div>
                  <label className="form-label">年間売上高</label>
                  <select
                    value={companyInfo.annualRevenue}
                    onChange={(e) => updateCompanyInfo('annualRevenue', e.target.value)}
                    className="form-select"
                  >
                    <option value="">選択してください</option>
                    <option value="1,000万円未満">1,000万円未満</option>
                    <option value="1,000万円-5,000万円">1,000万円-5,000万円</option>
                    <option value="5,000万円-1億円">5,000万円-1億円</option>
                    <option value="1億円-5億円">1億円-5億円</option>
                    <option value="5億円以上">5億円以上</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">事業分野</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {companyInfo.businessAreas.map((area, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-sm"
                      >
                        {area}
                        <button
                          onClick={() => removeBusinessArea(index)}
                          className="ml-2 text-brand-600 hover:text-brand-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="事業分野を入力"
                      className="form-input flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addBusinessArea(e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement
                        addBusinessArea(input.value)
                        input.value = ''
                      }}
                      className="btn-outline"
                    >
                      追加
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 連絡先情報 */}
            <div className="mt-8 space-y-4">
              <h4 className="font-medium text-gray-900">📞 連絡先情報</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">住所</label>
                  <input
                    type="text"
                    value={companyInfo.contactInfo.address}
                    onChange={(e) => updateContactInfo('address', e.target.value)}
                    className="form-input"
                    placeholder="東京都渋谷区..."
                  />
                </div>
                <div>
                  <label className="form-label">電話番号</label>
                  <input
                    type="tel"
                    value={companyInfo.contactInfo.phone}
                    onChange={(e) => updateContactInfo('phone', e.target.value)}
                    className="form-input"
                    placeholder="03-1234-5678"
                  />
                </div>
                <div>
                  <label className="form-label">メールアドレス</label>
                  <input
                    type="email"
                    value={companyInfo.contactInfo.email}
                    onChange={(e) => updateContactInfo('email', e.target.value)}
                    className="form-input"
                    placeholder="info@example.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="btn-outline flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            前のステップ
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`btn flex items-center ${
              canProceed
                ? 'btn-primary'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            次のステップへ
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </button>
        </div>

        {/* 進捗状況 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {canProceed ? (
              <span className="text-green-600">
                ✓ 必須項目が入力されました
              </span>
            ) : (
              <span className="text-red-600">
                ⚠ 企業名、事業内容、業界は必須項目です
              </span>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}