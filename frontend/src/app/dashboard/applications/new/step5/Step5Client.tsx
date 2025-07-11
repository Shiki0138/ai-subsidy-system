'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  TrophyIcon,
  ChartBarIcon,
  LightBulbIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  StarIcon,
  SparklesIcon,
  EyeIcon,
  UserGroupIcon,
  CurrencyYenIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'

interface AdoptionCase {
  id: string
  title: string
  companyName: string
  industry: string
  employeeCount: string
  grantAmount: string
  projectOverview: string
  objectives: string[]
  implementation: string[]
  results: string[]
  keySuccessFactors: string[]
  similarityScore: number
  year: string
  category: string
}

interface AnalysisResult {
  totalCases: number
  relevantCases: number
  commonSuccessFactors: string[]
  recommendedApproach: string[]
  keyInsights: string[]
  industryStats: {
    adoptionRate: number
    averageAmount: string
    commonCategories: string[]
  }
}

export function Step5Client() {
  const router = useRouter()
  const [step2Results, setStep2Results] = useState<any>(null)
  const [step3Results, setStep3Results] = useState<any>(null)
  const [adoptionCases, setAdoptionCases] = useState<AdoptionCase[]>([])
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState<AdoptionCase | null>(null)
  const [showAllCases, setShowAllCases] = useState(false)

  useEffect(() => {
    // 前のステップの結果を取得
    const step2Data = sessionStorage.getItem('step2-results')
    const step3Data = sessionStorage.getItem('step3-results')
    
    if (step2Data) setStep2Results(JSON.parse(step2Data))
    if (step3Data) setStep3Results(JSON.parse(step3Data))
    
    loadAdoptionCases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadAdoptionCases = useCallback(async () => {
    setIsLoading(true)
    try {
      // 実際の実装では外部APIやデータベースから採択事例を取得
      // ここではモック実装
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockCases: AdoptionCase[] = [
        {
          id: '001',
          title: 'ECサイト構築による販路拡大事業',
          companyName: '株式会社〇〇商店',
          industry: '小売業',
          employeeCount: '8名',
          grantAmount: '45万円',
          projectOverview: '従来の店舗販売に加えて、ECサイトを構築し、全国への販路拡大を図る事業。コロナ禍で店舗来客数が減少する中、オンライン販売による売上回復を目指す。',
          objectives: [
            'ECサイトの構築による新たな販売チャネルの確保',
            '全国への商品販売エリア拡大',
            '年間売上20%向上'
          ],
          implementation: [
            'ECサイト構築（デザイン・システム開発）',
            '商品撮影・画像加工',
            'SEO対策・Web広告運用',
            '配送システムの整備'
          ],
          results: [
            'ECサイト開設から3ヶ月で月間売上150万円達成',
            '全国47都道府県への配送実績',
            '年間売上25%向上（目標20%を上回る）',
            '新規顧客獲得数400名/月'
          ],
          keySuccessFactors: [
            '地域特産品という差別化された商品',
            '魅力的な商品写真による訴求力',
            '迅速な配送システムの構築',
            'SNSを活用したマーケティング戦略'
          ],
          similarityScore: 95,
          year: '2023',
          category: '販路開拓'
        },
        {
          id: '002',
          title: 'AI活用による業務効率化システム導入',
          companyName: '〇〇コンサルティング株式会社',
          industry: 'IT・ソフトウェア',
          employeeCount: '15名',
          grantAmount: '48万円',
          projectOverview: 'AI技術を活用した顧客データ分析システムを導入し、営業活動の効率化と成約率向上を図る事業。従来の手作業による分析から自動化への転換を目指す。',
          objectives: [
            'AI技術による顧客データ分析の自動化',
            '営業効率の向上',
            '成約率15%向上'
          ],
          implementation: [
            'AIシステムの選定・導入',
            '既存データの整理・移行',
            '社員向けAI活用研修の実施',
            '効果測定システムの構築'
          ],
          results: [
            '営業活動時間30%短縮',
            '成約率18%向上（目標15%を上回る）',
            '月間新規案件数25%増加',
            '顧客満足度向上'
          ],
          keySuccessFactors: [
            '導入前の詳細な現状分析',
            '社員の積極的な研修参加',
            '段階的な導入による混乱回避',
            '継続的な効果測定と改善'
          ],
          similarityScore: 88,
          year: '2023',
          category: 'IT導入'
        },
        {
          id: '003',
          title: '新商品開発・ブランディング強化事業',
          companyName: '〇〇製造株式会社',
          industry: '製造業',
          employeeCount: '22名',
          grantAmount: '50万円',
          projectOverview: '地域の伝統技術を活かした新商品開発と、ブランディング強化による高付加価値化を図る事業。海外展開も視野に入れた取組み。',
          objectives: [
            '伝統技術を活かした新商品開発',
            'ブランドイメージの向上',
            '売上単価20%向上'
          ],
          implementation: [
            '新商品の企画・開発',
            'ブランドデザインの刷新',
            '展示会への出展',
            'プロモーション動画制作'
          ],
          results: [
            '新商品の売上が月間200万円達成',
            'ブランド認知度30%向上',
            '売上単価22%向上',
            '海外からの引き合い獲得'
          ],
          keySuccessFactors: [
            '地域性を活かした独自性',
            '統一されたブランドイメージ',
            '効果的な展示会出展',
            '動画による訴求力強化'
          ],
          similarityScore: 82,
          year: '2022',
          category: '新商品開発'
        },
        {
          id: '004',
          title: 'デジタルマーケティング導入による集客強化',
          companyName: '〇〇サービス有限会社',
          industry: 'サービス業',
          employeeCount: '6名',
          grantAmount: '35万円',
          projectOverview: 'デジタルマーケティングツールを導入し、SNS広告やコンテンツマーケティングによる新規顧客獲得を図る事業。',
          objectives: [
            'デジタルマーケティングの本格導入',
            '新規顧客獲得数50%向上',
            'Web経由の問い合わせ数増加'
          ],
          implementation: [
            'マーケティング支援ツール導入',
            'SNS広告運用開始',
            'コンテンツ制作体制構築',
            '効果測定ダッシュボード構築'
          ],
          results: [
            '新規顧客獲得数65%向上',
            'Web経由の問い合わせ数3倍増',
            'マーケティングROI改善',
            '顧客単価15%向上'
          ],
          keySuccessFactors: [
            'ターゲット顧客の明確化',
            '継続的なコンテンツ制作',
            'データ分析に基づく改善',
            '複数チャネルの活用'
          ],
          similarityScore: 91,
          year: '2023',
          category: 'マーケティング'
        }
      ]

      // 企業情報に基づいて類似度スコアを調整
      const userIndustry = step2Results?.companyInfo?.industry
      const adjustedCases = mockCases.map(case_ => {
        let score = case_.similarityScore
        if (case_.industry === userIndustry) {
          score += 10
        }
        return { ...case_, similarityScore: Math.min(100, score) }
      }).sort((a, b) => b.similarityScore - a.similarityScore)

      setAdoptionCases(adjustedCases)

      // 分析結果を設定
      const mockAnalysis: AnalysisResult = {
        totalCases: 127,
        relevantCases: adjustedCases.length,
        commonSuccessFactors: [
          '明確な目標設定と効果測定',
          '段階的な実施計画',
          '継続的な改善活動',
          '市場ニーズに基づく取組み',
          '従業員の積極的な参画'
        ],
        recommendedApproach: [
          '現状分析の徹底実施',
          '具体的な数値目標の設定',
          '実施スケジュールの詳細化',
          '効果測定方法の明確化',
          'リスク対策の検討'
        ],
        keyInsights: [
          '採択される事業は具体的な効果測定指標を持っている',
          '従業員規模が近い事例では90%以上が目標を達成',
          '同業種での成功要因は「差別化」と「継続性」',
          'デジタル化関連の取組みは特に高い効果を示している'
        ],
        industryStats: {
          adoptionRate: 73,
          averageAmount: '42万円',
          commonCategories: ['販路開拓', 'IT導入', 'マーケティング強化']
        }
      }

      setAnalysisResult(mockAnalysis)
      
    } catch (error) {
      console.error('Failed to load adoption cases:', error)
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCaseSelect = (case_: AdoptionCase) => {
    setSelectedCase(case_)
  }

  const handleNext = () => {
    // ステップ5の結果を保存
    const results = {
      adoptionCases,
      analysisResult,
      selectedCase,
      timestamp: new Date().toISOString()
    }
    sessionStorage.setItem('step5-results', JSON.stringify(results))
    router.push('/dashboard/applications/new/step6')
  }

  const handleBack = () => {
    router.push('/dashboard/applications/new/step4')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SparklesIcon className="h-12 w-12 text-brand-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">採択事例を分析中...</h2>
          <p className="text-gray-600">AIが過去の成功事例から最適なパターンを抽出しています</p>
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
              ステップ5: 採択事例の確認
            </h2>
            <div className="text-sm text-gray-600">
              5 / 7
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-brand-600 h-2 rounded-full" style={{ width: '71.4%' }}></div>
          </div>
        </div>

        {/* AI分析サマリー */}
        {analysisResult && (
          <div className="card mb-8">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📊 採択事例分析サマリー
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ChartBarIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">総事例数</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{analysisResult.totalCases}</p>
                  <p className="text-sm text-blue-700">件の過去事例</p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrophyIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">関連事例</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{analysisResult.relevantCases}</p>
                  <p className="text-sm text-green-700">件が類似事例</p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserGroupIcon className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-900">採択率</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{analysisResult.industryStats.adoptionRate}%</p>
                  <p className="text-sm text-purple-700">同業種平均</p>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CurrencyYenIcon className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-900">平均金額</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{analysisResult.industryStats.averageAmount}</p>
                  <p className="text-sm text-orange-700">同業種平均</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">🏆 共通成功要因</h4>
                  <ul className="space-y-2">
                    {analysisResult.commonSuccessFactors.map((factor, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">💡 重要インサイト</h4>
                  <ul className="space-y-2">
                    {analysisResult.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <LightBulbIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">📋 推奨アプローチ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {analysisResult.recommendedApproach.map((approach, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">{approach}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 採択事例一覧 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              🎯 あなたの事業に近い採択事例
            </h3>
            <button
              onClick={() => setShowAllCases(!showAllCases)}
              className="btn-outline flex items-center"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              {showAllCases ? '関連事例のみ表示' : 'すべての事例を表示'}
            </button>
          </div>

          <div className="space-y-6">
            {(showAllCases ? adoptionCases : adoptionCases.slice(0, 2)).map((case_, index) => (
              <div
                key={case_.id}
                className={`card cursor-pointer transition-all duration-200 ${
                  selectedCase?.id === case_.id
                    ? 'ring-2 ring-brand-500 bg-brand-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleCaseSelect(case_)}
              >
                <div className="card-body">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {index === 0 && (
                          <div className="bg-yellow-100 p-2 rounded-lg">
                            <StarIcon className="h-6 w-6 text-yellow-600" />
                          </div>
                        )}
                        {index > 0 && (
                          <div className="bg-gray-100 p-2 rounded-lg">
                            <TrophyIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-xl font-semibold text-gray-900">
                            {case_.title}
                          </h4>
                          {index === 0 && (
                            <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                              最類似
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                          <div>
                            <span className="text-gray-500">企業:</span>
                            <p className="font-medium">{case_.companyName}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">業界:</span>
                            <p className="font-medium">{case_.industry}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">従業員:</span>
                            <p className="font-medium">{case_.employeeCount}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">補助額:</span>
                            <p className="font-medium text-green-600">{case_.grantAmount}</p>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {case_.projectOverview}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end space-y-2">
                      <div className="bg-brand-100 px-3 py-1 rounded-full">
                        <span className="text-sm font-medium text-brand-600">
                          類似度 {case_.similarityScore}%
                        </span>
                      </div>
                      {selectedCase?.id === case_.id && (
                        <CheckCircleIcon className="h-6 w-6 text-brand-600" />
                      )}
                    </div>
                  </div>

                  {/* 詳細情報（選択された場合のみ表示） */}
                  {selectedCase?.id === case_.id && (
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">🎯 事業目標</h5>
                          <ul className="space-y-2">
                            {case_.objectives.map((objective, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-gray-700">{objective}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">🛠️ 実施内容</h5>
                          <ul className="space-y-2">
                            {case_.implementation.map((item, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">📈 達成成果</h5>
                          <ul className="space-y-2">
                            {case_.results.map((result, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{result}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">🔑 成功要因</h5>
                          <ul className="space-y-2">
                            {case_.keySuccessFactors.map((factor, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <LightBulbIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <h5 className="font-medium text-green-900 mb-2">💡 この事例から学べること</h5>
                        <p className="text-sm text-green-800">
                          類似度{case_.similarityScore}%のこの事例では、明確な目標設定と段階的な実施が成功の鍵となっています。
                          特に「{case_.keySuccessFactors[0]}」は、あなたの事業でも参考にできる重要なポイントです。
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 学習ポイント */}
        <div className="card mb-8">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📚 採択事例から学ぶべきポイント
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">申請書作成のコツ</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• 具体的な数値目標を設定する</li>
                  <li>• 実施スケジュールを詳細に記載する</li>
                  <li>• 効果測定方法を明確にする</li>
                  <li>• 市場ニーズとの関連性を説明する</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">事業実施のポイント</h4>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• 段階的な実施計画を立てる</li>
                  <li>• 定期的な進捗確認を行う</li>
                  <li>• 従業員の理解と協力を得る</li>
                  <li>• 継続的な改善活動を実施する</li>
                </ul>
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
            className="btn-primary flex items-center"
          >
            次のステップへ
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </button>
        </div>

        {/* 進捗状況 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {selectedCase ? (
              <span className="text-green-600">
                ✅ 参考事例を選択しました: {selectedCase.title}
              </span>
            ) : (
              <span className="text-blue-600">
                💡 事例を選択すると詳細情報が表示されます
              </span>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}