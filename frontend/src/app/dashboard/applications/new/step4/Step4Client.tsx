'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyYenIcon,
  SparklesIcon,
  CloudArrowDownIcon,
  EyeIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'

interface GuidelineSection {
  title: string
  content: string
  important: boolean
  checkpoints: string[]
}

interface ApplicationGuideline {
  id: string
  name: string
  version: string
  lastUpdated: string
  fileSize: string
  url: string
  sections: GuidelineSection[]
  keyPoints: string[]
  eligibilityChecklist: {
    item: string
    description: string
    required: boolean
    userStatus?: boolean
  }[]
  requiredDocuments: {
    name: string
    description: string
    format: string
    required: boolean
  }[]
  timeline: {
    phase: string
    description: string
    duration: string
    deadline?: string
  }[]
}

export function Step4Client() {
  const router = useRouter()
  const [step3Results, setStep3Results] = useState<any>(null)
  const [guideline, setGuideline] = useState<ApplicationGuideline | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showFullGuideline, setShowFullGuideline] = useState(false)
  const [eligibilityChecked, setEligibilityChecked] = useState<Record<number, boolean>>({})
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  useEffect(() => {
    // ステップ3の結果を取得
    const step3Data = sessionStorage.getItem('step3-results')
    if (step3Data) {
      const results = JSON.parse(step3Data)
      setStep3Results(results)
      loadGuideline(results.selectedProgram.id)
    }
  }, [])

  const loadGuideline = async (programId: string) => {
    setIsLoading(true)
    try {
      // 実際の実装では外部APIやデータベースから募集要項を取得
      // ここではモック実装
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockGuideline: ApplicationGuideline = {
        id: programId,
        name: '小規模事業者持続化補助金 公募要領',
        version: '第16回',
        lastUpdated: '2024年3月15日',
        fileSize: '2.3MB',
        url: 'https://example.com/guideline.pdf',
        sections: [
          {
            title: '1. 事業の目的・概要',
            content: '小規模事業者の販路開拓等の取組の経費の一部を補助することにより、地域の雇用や産業を支える小規模事業者の生産性向上と持続的発展を図ることを目的とします。',
            important: true,
            checkpoints: [
              '販路開拓に該当する取組であること',
              '小規模事業者の要件を満たすこと',
              '補助対象経費に該当すること'
            ]
          },
          {
            title: '2. 補助対象者',
            content: '商業・サービス業（宿泊・娯楽業除く）：常時使用する従業員の数が5人以下\nサービス業のうち宿泊業・娯楽業：常時使用する従業員の数が20人以下\n製造業その他：常時使用する従業員の数が20人以下',
            important: true,
            checkpoints: [
              '従業員数の確認',
              '業種の分類確認',
              '法人格の有無確認'
            ]
          },
          {
            title: '3. 補助率・補助上限額',
            content: '補助率：2/3\n補助上限額：50万円\n※インボイス対応の場合は上限100万円まで',
            important: true,
            checkpoints: [
              '補助対象経費の計算',
              'インボイス対応の有無',
              '自己負担額の確認'
            ]
          },
          {
            title: '4. 補助対象経費',
            content: '機械装置等費、広報費、ウェブサイト関連費、展示会等出展費、旅費、開発費、資料購入費、雑役務費、借料、設備処分費、委託・外注費',
            important: false,
            checkpoints: [
              '経費区分の確認',
              '見積書の取得',
              '税抜き価格での計算'
            ]
          }
        ],
        keyPoints: [
          '申請は電子申請システムのみ（郵送不可）',
          '事業計画書は最大10ページ以内',
          '補助事業実施期間は交付決定日から2024年12月31日まで',
          '実績報告書の提出期限は2025年1月10日',
          '補助金の支払いは実績報告書受理後約1ヶ月'
        ],
        eligibilityChecklist: [
          {
            item: '従業員数要件',
            description: '常時使用する従業員数が業種別上限以下であること',
            required: true,
            userStatus: true
          },
          {
            item: '申請者要件',
            description: '法人または個人事業主であること',
            required: true,
            userStatus: true
          },
          {
            item: '事業実施要件',
            description: '補助事業を確実に実施できること',
            required: true
          },
          {
            item: '経理処理要件',
            description: '適切な経理処理体制を有すること',
            required: true
          },
          {
            item: '報告義務',
            description: '実績報告書等を期限内に提出できること',
            required: true
          }
        ],
        requiredDocuments: [
          {
            name: '事業計画書',
            description: '様式2-1を使用した詳細な事業計画',
            format: 'PDF (最大10ページ)',
            required: true
          },
          {
            name: '経費明細表',
            description: '様式3を使用した経費の詳細',
            format: 'Excel/PDF',
            required: true
          },
          {
            name: '見積書',
            description: '補助対象経費に関する見積書',
            format: 'PDF',
            required: true
          },
          {
            name: '決算書',
            description: '直近2期分の決算書',
            format: 'PDF',
            required: true
          },
          {
            name: '履歴事項全部証明書',
            description: '発行から3ヶ月以内のもの（法人のみ）',
            format: 'PDF',
            required: false
          }
        ],
        timeline: [
          {
            phase: '申請期間',
            description: '電子申請システムにて申請書類を提出',
            duration: '約1ヶ月',
            deadline: '2024年6月7日 17:00'
          },
          {
            phase: '審査期間',
            description: '書面審査により採択事業者を決定',
            duration: '約2ヶ月',
            deadline: '2024年8月上旬（予定）'
          },
          {
            phase: '交付決定',
            description: '採択通知と交付決定通知を送付',
            duration: '約2週間',
            deadline: '2024年8月下旬（予定）'
          },
          {
            phase: '事業実施期間',
            description: '補助事業の実施',
            duration: '約4ヶ月',
            deadline: '2024年12月31日'
          },
          {
            phase: '実績報告',
            description: '実績報告書の提出',
            duration: '約10日',
            deadline: '2025年1月10日'
          }
        ]
      }

      setGuideline(mockGuideline)
      
      // AI分析結果も設定
      const mockAnalysis = {
        compatibilityScore: 88,
        riskLevel: 'low',
        recommendations: [
          '従業員数要件は満たしており、申請可能です',
          '事業計画書の作成が最も重要なポイントです',
          '見積書は3社以上から取得することを推奨します'
        ],
        timeline: 'スケジュール的に十分余裕があります',
        requiredActions: [
          '事業計画書の準備開始',
          '見積書の収集',
          '決算書の最新版確認'
        ]
      }
      setAnalysisResult(mockAnalysis)
      
    } catch (error) {
      console.error('Failed to load guideline:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEligibilityCheck = (index: number, checked: boolean) => {
    setEligibilityChecked(prev => ({
      ...prev,
      [index]: checked
    }))
  }

  const getEligibilityProgress = () => {
    const required = guideline?.eligibilityChecklist.filter(item => item.required) || []
    const checked = required.filter((_, index) => eligibilityChecked[index])
    return { checked: checked.length, total: required.length }
  }

  const canProceed = () => {
    const progress = getEligibilityProgress()
    return progress.checked === progress.total
  }

  const handleNext = () => {
    if (canProceed()) {
      // ステップ4の結果を保存
      const results = {
        guideline,
        eligibilityChecked,
        analysisResult,
        timestamp: new Date().toISOString()
      }
      sessionStorage.setItem('step4-results', JSON.stringify(results))
      router.push('/dashboard/applications/new/step5')
    }
  }

  const handleBack = () => {
    router.push('/dashboard/applications/new/step3')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SparklesIcon className="h-12 w-12 text-brand-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">募集要項を分析中...</h2>
          <p className="text-gray-600">AIが募集要項の重要ポイントを抽出しています</p>
        </div>
      </div>
    )
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
              ステップ4: 募集要項の確認
            </h2>
            <div className="text-sm text-gray-600">
              4 / 7
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-brand-600 h-2 rounded-full" style={{ width: '57.1%' }}></div>
          </div>
        </div>

        {/* 選択された補助金情報 */}
        {step3Results && (
          <div className="card mb-8">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📋 選択された補助金
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-1">
                  {step3Results.selectedProgram.name}
                </h4>
                <p className="text-sm text-blue-800">
                  {step3Results.selectedProgram.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI分析結果 */}
        {analysisResult && (
          <div className="card mb-8">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🤖 AI分析結果
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">適合度</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{analysisResult.compatibilityScore}%</p>
                  <p className="text-sm text-green-700">高い適合度です</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">リスクレベル</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">低</p>
                  <p className="text-sm text-blue-700">申請リスクは低いです</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ClockIcon className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-900">スケジュール</span>
                  </div>
                  <p className="text-sm font-bold text-purple-600">余裕あり</p>
                  <p className="text-sm text-purple-700">{analysisResult.timeline}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">✅ AIレコメンデーション</h4>
                  <ul className="space-y-1">
                    {analysisResult.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📝 次に必要なアクション</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {analysisResult.requiredActions.map((action: string, index: number) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 募集要項ドキュメント */}
        {guideline && (
          <div className="card mb-8">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  📄 募集要項ドキュメント
                </h3>
                <div className="flex space-x-3">
                  <a
                    href={guideline.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline flex items-center"
                  >
                    <CloudArrowDownIcon className="h-4 w-4 mr-2" />
                    PDFダウンロード
                  </a>
                  <button
                    onClick={() => setShowFullGuideline(!showFullGuideline)}
                    className="btn-secondary flex items-center"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    {showFullGuideline ? '概要表示' : '詳細表示'}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">文書名:</span>
                    <p className="font-medium">{guideline.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">版:</span>
                    <p className="font-medium">{guideline.version}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">更新日:</span>
                    <p className="font-medium">{guideline.lastUpdated}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">ファイルサイズ:</span>
                    <p className="font-medium">{guideline.fileSize}</p>
                  </div>
                </div>
              </div>

              {/* 重要ポイント */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">⚠️ 重要ポイント</h4>
                <div className="space-y-2">
                  {guideline.keyPoints.map((point, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 募集要項セクション */}
              {showFullGuideline && (
                <div className="space-y-6">
                  {guideline.sections.map((section, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${
                        section.important
                          ? 'border-orange-300 bg-orange-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {section.title}
                        {section.important && (
                          <span className="ml-2 bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-xs">
                            重要
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">
                        {section.content}
                      </p>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">チェックポイント:</h5>
                        <ul className="space-y-1">
                          {section.checkpoints.map((checkpoint, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{checkpoint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 適格性チェックリスト */}
        {guideline && (
          <div className="card mb-8">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ✅ 適格性チェックリスト
              </h3>
              <div className="space-y-4">
                {guideline.eligibilityChecklist.map((item, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      item.required ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={eligibilityChecked[index] || false}
                        onChange={(e) => handleEligibilityCheck(index, e.target.checked)}
                        className="mt-1"
                        disabled={item.userStatus !== undefined && item.userStatus}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{item.item}</h4>
                          {item.required && (
                            <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs">
                              必須
                            </span>
                          )}
                          {item.userStatus && (
                            <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs">
                              ✓ 満たしています
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    適格性チェック進捗: {getEligibilityProgress().checked} / {getEligibilityProgress().total}
                  </span>
                </div>
                {canProceed() && (
                  <p className="text-sm text-blue-800 mt-1">
                    ✅ すべての必須要件を満たしています
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* スケジュール */}
        {guideline && (
          <div className="card mb-8">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📅 申請スケジュール
              </h3>
              <div className="space-y-4">
                {guideline.timeline.map((phase, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-brand-600">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{phase.phase}</h4>
                      <p className="text-sm text-gray-600 mb-1">{phase.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>期間: {phase.duration}</span>
                        {phase.deadline && (
                          <span className="text-red-600 font-medium">締切: {phase.deadline}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 必要書類 */}
        {guideline && (
          <div className="card mb-8">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📋 必要書類一覧
              </h3>
              <div className="space-y-3">
                {guideline.requiredDocuments.map((doc, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      doc.required ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{doc.name}</h4>
                          {doc.required && (
                            <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs">
                              必須
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{doc.description}</p>
                        <p className="text-xs text-gray-500">形式: {doc.format}</p>
                      </div>
                      <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
            disabled={!canProceed()}
            className={`btn flex items-center ${
              canProceed()
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
            {canProceed() ? (
              <span className="text-green-600">
                ✅ 適格性チェックが完了しました
              </span>
            ) : (
              <span className="text-orange-600">
                📝 すべての必須項目をチェックしてください
              </span>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}