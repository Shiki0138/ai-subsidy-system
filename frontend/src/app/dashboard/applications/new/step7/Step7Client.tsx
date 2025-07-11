'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PrinterIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline'

interface ApplicationSummary {
  projectTitle: string
  companyName: string
  subsidyProgram: string
  requestAmount: string
  applicationDate: string
  submissionDeadline: string
  status: string
}

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  required: boolean
}

export function Step7Client() {
  const router = useRouter()
  const [allResults, setAllResults] = useState<any>({})
  const [applicationSummary, setApplicationSummary] = useState<ApplicationSummary | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [showFullPreview, setShowFullPreview] = useState(false)
  const [submitToSystem, setSubmitToSystem] = useState(false)

  useEffect(() => {
    // 全ステップの結果を取得
    const step1Data = sessionStorage.getItem('step1-results')
    const step2Data = sessionStorage.getItem('step2-results')
    const step3Data = sessionStorage.getItem('step3-results')
    const step4Data = sessionStorage.getItem('step4-results')
    const step5Data = sessionStorage.getItem('step5-results')
    const step6Data = sessionStorage.getItem('step6-results')
    
    const results = {
      step1: step1Data ? JSON.parse(step1Data) : null,
      step2: step2Data ? JSON.parse(step2Data) : null,
      step3: step3Data ? JSON.parse(step3Data) : null,
      step4: step4Data ? JSON.parse(step4Data) : null,
      step5: step5Data ? JSON.parse(step5Data) : null,
      step6: step6Data ? JSON.parse(step6Data) : null,
    }
    
    setAllResults(results)
    generateApplicationSummary(results)
    generateChecklist(results)
  }, [])

  const generateApplicationSummary = (results: any) => {
    const summary: ApplicationSummary = {
      projectTitle: results.step6?.applicationDraft?.projectTitle || 'ECサイト構築による販路拡大事業',
      companyName: results.step2?.companyInfo?.companyName || 'デモ株式会社',
      subsidyProgram: results.step3?.selectedProgram?.name || '小規模事業者持続化補助金',
      requestAmount: '333,000円',
      applicationDate: new Date().toLocaleDateString('ja-JP'),
      submissionDeadline: '2024年6月7日',
      status: '完成（未提出）'
    }
    setApplicationSummary(summary)
  }

  const generateChecklist = (results: any) => {
    const items: ChecklistItem[] = [
      {
        id: 'application_form',
        title: '申請書（事業計画書）',
        description: 'AI生成された申請書の内容確認',
        completed: !!results.step6?.applicationDraft,
        required: true
      },
      {
        id: 'budget_plan',
        title: '経費明細書',
        description: '補助対象経費の詳細確認',
        completed: !!results.step6?.applicationDraft?.budget,
        required: true
      },
      {
        id: 'quotations',
        title: '見積書',
        description: '補助対象経費に関する見積書（3社以上推奨）',
        completed: false,
        required: true
      },
      {
        id: 'financial_statements',
        title: '決算書',
        description: '直近2期分の決算書',
        completed: false,
        required: true
      },
      {
        id: 'registration_certificate',
        title: '履歴事項全部証明書',
        description: '発行から3ヶ月以内（法人のみ）',
        completed: false,
        required: false
      },
      {
        id: 'id_verification',
        title: '本人確認書類',
        description: '代表者の身分証明書（個人事業主のみ）',
        completed: false,
        required: false
      }
    ]
    setChecklist(items)
  }

  const handleChecklistToggle = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const getChecklistProgress = () => {
    const required = checklist.filter(item => item.required)
    const completed = required.filter(item => item.completed)
    return { completed: completed.length, total: required.length }
  }

  const generatePDF = async () => {
    setIsGeneratingPDF(true)
    
    // アプリケーションデータを関数レベルで定義
    const applicationData = {
      id: Date.now().toString(),
      title: allResults.step6?.applicationDraft?.projectTitle || 'ECサイト構築による販路拡大事業',
      subsidyProgramName: allResults.step3?.selectedProgram?.name || '小規模事業者持続化補助金',
      subsidyProgramCategory: allResults.step3?.selectedProgram?.category || '一般型',
      projectDescription: allResults.step6?.applicationDraft?.projectOverview || '',
      purpose: allResults.step6?.applicationDraft?.objectives || '',
      targetMarket: allResults.step6?.applicationDraft?.marketAnalysis || 'ターゲット市場の分析',
      expectedEffects: allResults.step6?.applicationDraft?.expectedResults || '',
      budget: 500000,
      timeline: allResults.step6?.applicationDraft?.implementation || '',
      challenges: '既存の課題と解決アプローチ',
      innovation: '新規性・独自性',
      companyName: allResults.step2?.companyInfo?.companyName || 'デモ株式会社',
      representativeName: '代表者名',
      createdAt: new Date().toISOString(),
      status: 'COMPLETED'
    }
    
    try {
      // 実際の実装では、jsPDFやPuppeteerを使用してPDF生成
      // ここではモック実装
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // 既存のPDF生成機能を利用
      const { generateApplicationPDF } = await import('@/utils/pdfGenerator')
      await generateApplicationPDF(applicationData)
      setPdfGenerated(true)
      
    } catch (error) {
      console.error('PDF generation failed:', error)
      // HTMLプレビューフォールバックを表示
      const { showHTMLPreview } = await import('@/utils/pdfGenerator')
      await showHTMLPreview(applicationData)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleSubmitToSystem = async () => {
    try {
      // 申請書データをシステムに保存
      const applicationData = {
        title: allResults.step6?.applicationDraft?.projectTitle,
        companyInfo: allResults.step2?.companyInfo,
        selectedProgram: allResults.step3?.selectedProgram,
        applicationDraft: allResults.step6?.applicationDraft,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // 実際の実装では外部APIに送信
      console.log('Saving application:', applicationData)
      
      // ローカルストレージに保存（テスト用）
      const existingApplications = JSON.parse(localStorage.getItem('applications') || '[]')
      const newApplication = {
        id: Date.now().toString(),
        ...applicationData
      }
      existingApplications.push(newApplication)
      localStorage.setItem('applications', JSON.stringify(existingApplications))
      
      setSubmitToSystem(true)
      
    } catch (error) {
      console.error('Failed to submit application:', error)
    }
  }

  const handleFinish = () => {
    // セッションストレージをクリア
    sessionStorage.removeItem('step1-results')
    sessionStorage.removeItem('step2-results')
    sessionStorage.removeItem('step3-results')
    sessionStorage.removeItem('step4-results')
    sessionStorage.removeItem('step5-results')
    sessionStorage.removeItem('step6-results')
    
    router.push('/dashboard')
  }

  const handleBack = () => {
    router.push('/dashboard/applications/new/step6')
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
              ステップ7: PDF出力・完了
            </h2>
            <div className="text-sm text-gray-600">
              7 / 7
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* 完了メッセージ */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                🎉 申請書作成が完了しました！
              </h3>
              <p className="text-gray-600 mb-6">
                AIが生成した高品質な申請書が準備できました。
                PDF出力後、必要な添付書類と合わせて申請手続きを行ってください。
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <SparklesIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-blue-900 mb-1">AI最適化</h4>
                  <p className="text-sm text-blue-800">採択率向上のため内容を最適化</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <DocumentTextIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-900 mb-1">書式準拠</h4>
                  <p className="text-sm text-green-800">公式様式に完全対応</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <CheckCircleIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-purple-900 mb-1">即座に提出可能</h4>
                  <p className="text-sm text-purple-800">追加の編集なしで提出可能</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 申請書サマリー */}
        {applicationSummary && (
          <div className="card mb-8">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📋 申請書サマリー
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">事業名:</span>
                    <p className="font-medium text-gray-900">{applicationSummary.projectTitle}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">申請者:</span>
                    <p className="font-medium text-gray-900">{applicationSummary.companyName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">申請日:</span>
                    <p className="font-medium text-gray-900">{applicationSummary.applicationDate}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">補助金プログラム:</span>
                    <p className="font-medium text-gray-900">{applicationSummary.subsidyProgram}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">申請金額:</span>
                    <p className="font-medium text-green-600">{applicationSummary.requestAmount}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">提出期限:</span>
                    <p className="font-medium text-red-600">{applicationSummary.submissionDeadline}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PDF生成・ダウンロード */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📄 PDF出力
              </h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowFullPreview(!showFullPreview)}
                  className="btn-outline flex items-center"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  {showFullPreview ? '概要表示' : 'プレビュー'}
                </button>
                <button
                  onClick={generatePDF}
                  disabled={isGeneratingPDF}
                  className={`btn flex items-center ${
                    isGeneratingPDF
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'btn-primary'
                  }`}
                >
                  {isGeneratingPDF ? (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2 animate-spin" />
                      PDF生成中...
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      PDF生成・ダウンロード
                    </>
                  )}
                </button>
              </div>
            </div>

            {pdfGenerated && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">PDF生成完了</span>
                </div>
                <p className="text-sm text-green-800 mt-1">
                  申請書がPDF形式でダウンロードされました。ファイルを確認してください。
                </p>
              </div>
            )}

            {showFullPreview && allResults.step6?.applicationDraft && (
              <div className="border border-gray-200 rounded-lg p-6 bg-white max-h-96 overflow-y-auto">
                <div className="space-y-6">
                  <div className="text-center border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {allResults.step6.applicationDraft.projectTitle}
                    </h2>
                    <p className="text-gray-600 mt-2">
                      {allResults.step2?.companyInfo?.companyName}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      申請日: {new Date().toLocaleDateString('ja-JP')}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">1. 事業概要</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {allResults.step6.applicationDraft.projectOverview}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">2. 事業目標</h3>
                    <pre className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      {allResults.step6.applicationDraft.objectives}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">3. 実施計画</h3>
                    <pre className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      {allResults.step6.applicationDraft.implementation}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">4. 予算計画</h3>
                    <pre className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      {allResults.step6.applicationDraft.budget}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">5. 期待される効果</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {allResults.step6.applicationDraft.expectedResults}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 提出チェックリスト */}
        <div className="card mb-8">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ✅ 提出書類チェックリスト
            </h3>
            
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  進捗: {getChecklistProgress().completed} / {getChecklistProgress().total} (必須項目)
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round((getChecklistProgress().completed / getChecklistProgress().total) * 100)}% 完了
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(getChecklistProgress().completed / getChecklistProgress().total) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    item.completed
                      ? 'border-green-300 bg-green-50'
                      : item.required
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleChecklistToggle(item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        {item.required && (
                          <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs">
                            必須
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 重要な注意事項 */}
        <div className="card mb-8">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⚠️ 提出前の重要な確認事項
            </h3>
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">申請期限</h4>
                    <p className="text-sm text-yellow-800">
                      提出期限は{applicationSummary?.submissionDeadline} 17:00です。
                      余裕を持って提出してください。
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <CalendarDaysIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">電子申請のみ</h4>
                    <p className="text-sm text-blue-800">
                      申請は電子申請システムからのみ受け付けています。
                      郵送での申請はできません。
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <ClipboardDocumentIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-900 mb-1">書類の不備</h4>
                    <p className="text-sm text-red-800">
                      提出書類に不備がある場合、審査対象外となる可能性があります。
                      チェックリストを必ず確認してください。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* システム保存 */}
        <div className="card mb-8">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💾 申請書をシステムに保存
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                作成した申請書をシステムに保存すると、ダッシュボードからいつでも確認・編集できます。
              </p>
            </div>
            
            {!submitToSystem ? (
              <button
                onClick={handleSubmitToSystem}
                className="btn-secondary flex items-center"
              >
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                申請書をシステムに保存
              </button>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">保存完了</span>
                </div>
                <p className="text-sm text-green-800 mt-1">
                  申請書がシステムに保存されました。ダッシュボードから確認できます。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 完了ボタン */}
        <div className="text-center">
          <button
            onClick={handleFinish}
            className="btn-primary btn-lg"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            申請書作成を完了してダッシュボードに戻る
          </button>
        </div>

        {/* 追加アクション */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/dashboard/applications')}
              className="btn-outline flex items-center justify-center"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              申請書一覧を見る
            </button>
            
            <button
              onClick={() => router.push('/dashboard/applications/new/step1')}
              className="btn-outline flex items-center justify-center"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              新しい申請書を作成
            </button>
            
            <button
              onClick={() => window.print()}
              className="btn-outline flex items-center justify-center"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              このページを印刷
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}