'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  StarIcon,
  ClockIcon,
  CurrencyYenIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'

interface SubsidyProgram {
  id: string
  name: string
  category: string
  description: string
  maxAmount: string
  eligibility: string[]
  applicationPeriod: string
  processingTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  recommendationScore: number
  advantages: string[]
  requirements: string[]
  deadlines: string[]
}

const subsidyPrograms: SubsidyProgram[] = [
  {
    id: 'jizokukahojokin',
    name: '小規模事業者持続化補助金',
    category: '一般型',
    description: '小規模事業者の販路開拓や業務効率化の取組を支援する補助金です。',
    maxAmount: '50万円',
    eligibility: [
      '常時使用する従業員数が20名以下（商業・サービス業は5名以下）',
      '法人または個人事業主',
      '申請時点で事業を営んでいること'
    ],
    applicationPeriod: '2024年3月15日～2024年6月7日',
    processingTime: '約3-4ヶ月',
    difficulty: 'easy',
    recommendationScore: 95,
    advantages: [
      '比較的申請しやすい',
      '幅広い用途に対応',
      '採択率が高い（約60-70%）'
    ],
    requirements: [
      '事業計画書の作成',
      '経費明細の提出',
      '見積書の添付'
    ],
    deadlines: ['2024年6月7日 17:00まで']
  },
  {
    id: 'itdounyu',
    name: 'IT導入補助金',
    category: 'デジタル化基盤導入類型',
    description: 'ITツールの導入による業務効率化・売上向上を支援する補助金です。',
    maxAmount: '450万円',
    eligibility: [
      '中小企業または小規模事業者',
      'ITツールを導入して業務効率化を図る事業者',
      '生産性向上に取り組む意欲がある事業者'
    ],
    applicationPeriod: '2024年4月1日～2024年7月31日',
    processingTime: '約2-3ヶ月',
    difficulty: 'medium',
    recommendationScore: 88,
    advantages: [
      '高額な補助が可能',
      'IT導入に特化',
      '導入後のサポートも充実'
    ],
    requirements: [
      'IT導入支援事業者との連携',
      '導入計画書の作成',
      '効果測定計画の策定'
    ],
    deadlines: ['2024年7月31日 17:00まで']
  },
  {
    id: 'jigyousaikouchiku',
    name: '事業再構築補助金',
    category: '成長枠',
    description: '新分野展開、業態転換、事業・業種転換等の事業再構築を支援する補助金です。',
    maxAmount: '7,000万円',
    eligibility: [
      '中小企業または中堅企業',
      '事業再構築に取り組む意欲がある事業者',
      '認定経営革新等支援機関と連携できる事業者'
    ],
    applicationPeriod: '2024年4月18日～2024年7月26日',
    processingTime: '約4-6ヶ月',
    difficulty: 'hard',
    recommendationScore: 72,
    advantages: [
      '非常に高額な補助',
      '革新的な事業展開が可能',
      '成長産業への参入支援'
    ],
    requirements: [
      '認定経営革新等支援機関との連携',
      '詳細な事業計画書の作成',
      '市場分析・競合分析の実施'
    ],
    deadlines: ['2024年7月26日 18:00まで']
  },
  {
    id: 'monozukuri',
    name: 'ものづくり補助金',
    category: '一般・グローバル展開型',
    description: '中小企業の生産性向上に向けた革新的サービス開発・試作品開発・生産プロセスの改善を支援する補助金です。',
    maxAmount: '1,000万円',
    eligibility: [
      '中小企業または小規模事業者',
      '革新的な製品・サービス開発に取り組む事業者',
      '生産性向上に資する設備投資を行う事業者'
    ],
    applicationPeriod: '2024年3月28日～2024年6月20日',
    processingTime: '約4-5ヶ月',
    difficulty: 'medium',
    recommendationScore: 81,
    advantages: [
      '製造業に特化した支援',
      '設備投資に対応',
      '技術力向上が期待できる'
    ],
    requirements: [
      '技術的優位性の証明',
      '設備投資計画の策定',
      '生産性向上効果の算出'
    ],
    deadlines: ['2024年6月20日 17:00まで']
  }
]

export function Step3Client() {
  const router = useRouter()
  const [step1Results, setStep1Results] = useState<any>(null)
  const [step2Results, setStep2Results] = useState<any>(null)
  const [selectedProgram, setSelectedProgram] = useState<SubsidyProgram | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    // 前のステップの結果を取得
    const step1Data = sessionStorage.getItem('step1-results')
    const step2Data = sessionStorage.getItem('step2-results')
    
    if (step1Data) setStep1Results(JSON.parse(step1Data))
    if (step2Data) setStep2Results(JSON.parse(step2Data))
  }, [])

  // 企業情報と申請目的に基づいて補助金をスコアリング
  const getRecommendedPrograms = () => {
    if (!step1Results || !step2Results) return subsidyPrograms

    const { selectedCategories } = step1Results
    const { companyInfo } = step2Results

    return subsidyPrograms.map(program => {
      let score = program.recommendationScore

      // 申請目的に基づくスコア調整
      if (selectedCategories.includes('digitalization') && program.id === 'itdounyu') {
        score += 10
      }
      if (selectedCategories.includes('sales_expansion') && program.id === 'jizokukahojokin') {
        score += 10
      }
      if (selectedCategories.includes('business_restructuring') && program.id === 'jigyousaikouchiku') {
        score += 15
      }
      if (selectedCategories.includes('innovation') && program.id === 'monozukuri') {
        score += 12
      }

      // 企業規模に基づくスコア調整
      const employeeCount = companyInfo.employeeCount
      if (employeeCount === '1-5名' || employeeCount === '6-20名') {
        if (program.id === 'jizokukahojokin') score += 15
        if (program.id === 'jigyousaikouchiku') score -= 10
      }

      // 業界に基づくスコア調整
      const industry = companyInfo.industry
      if (industry === 'IT・ソフトウェア' && program.id === 'itdounyu') {
        score += 15
      }
      if (industry === '製造業' && program.id === 'monozukuri') {
        score += 20
      }

      return { ...program, recommendationScore: Math.min(100, score) }
    }).sort((a, b) => b.recommendationScore - a.recommendationScore)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '易しい'
      case 'medium': return '普通'
      case 'hard': return '難しい'
      default: return '不明'
    }
  }

  const handleProgramSelect = (program: SubsidyProgram) => {
    setSelectedProgram(program)
  }

  const handleNext = () => {
    if (selectedProgram) {
      // ステップ3の結果を保存
      const results = {
        selectedProgram,
        allPrograms: getRecommendedPrograms(),
        timestamp: new Date().toISOString()
      }
      sessionStorage.setItem('step3-results', JSON.stringify(results))
      router.push('/dashboard/applications/new/step4')
    }
  }

  const handleBack = () => {
    router.push('/dashboard/applications/new/step2')
  }

  const recommendedPrograms = getRecommendedPrograms()

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
              ステップ3: 補助金の確定
            </h2>
            <div className="text-sm text-gray-600">
              3 / 7
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-brand-600 h-2 rounded-full" style={{ width: '42.9%' }}></div>
          </div>
        </div>

        {/* AI分析結果 */}
        <div className="card mb-8">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🤖 AI分析による推奨結果
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <SparklesIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">分析完了</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    あなたの事業内容と申請目的を分析し、最適な補助金を推奨順に表示しています。
                  </p>
                  {step2Results && (
                    <div className="text-xs text-blue-700">
                      <p>企業: {step2Results.companyInfo.companyName}</p>
                      <p>業界: {step2Results.companyInfo.industry}</p>
                      <p>従業員: {step2Results.companyInfo.employeeCount}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 補助金プログラム一覧 */}
        <div className="space-y-6 mb-8">
          {recommendedPrograms.map((program, index) => (
            <div
              key={program.id}
              className={`card cursor-pointer transition-all duration-200 ${
                selectedProgram?.id === program.id
                  ? 'ring-2 ring-brand-500 bg-brand-50'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleProgramSelect(program)}
            >
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {index === 0 && (
                        <div className="bg-brand-100 p-2 rounded-lg">
                          <StarIcon className="h-6 w-6 text-brand-600" />
                        </div>
                      )}
                      {index > 0 && (
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <DocumentTextIcon className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {program.name}
                        </h3>
                        {index === 0 && (
                          <span className="bg-brand-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            最推奨
                          </span>
                        )}
                        <span className="text-gray-500 text-sm">
                          ({program.category})
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">
                        {program.description}
                      </p>
                      
                      {/* 基本情報 */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <CurrencyYenIcon className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-500">補助上限</p>
                            <p className="font-semibold text-green-600">{program.maxAmount}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-500">審査期間</p>
                            <p className="font-semibold text-blue-600">{program.processingTime}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ChartBarIcon className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-500">推奨度</p>
                            <p className="font-semibold text-purple-600">{program.recommendationScore}%</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-xs text-gray-500">難易度</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(program.difficulty)}`}>
                              {getDifficultyLabel(program.difficulty)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 申請期間と締切 */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CalendarDaysIcon className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-gray-900">申請期間・締切</span>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-800 mb-1">
                            申請期間: {program.applicationPeriod}
                          </p>
                          {program.deadlines.map((deadline, idx) => (
                            <p key={idx} className="text-sm font-semibold text-red-900">
                              締切: {deadline}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* メリット */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">✨ この補助金のメリット</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {program.advantages.map((advantage, idx) => (
                            <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-2">
                              <p className="text-sm text-green-800">{advantage}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 申請要件 */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">📋 主な申請要件</h4>
                        <div className="space-y-1">
                          {program.requirements.map((requirement, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <CheckCircleIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-700">{requirement}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 対象者要件 */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">👥 対象者要件</h4>
                        <div className="space-y-1">
                          {program.eligibility.map((requirement, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-sm text-gray-700">{requirement}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {selectedProgram?.id === program.id && (
                      <CheckCircleIcon className="h-6 w-6 text-brand-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 選択された補助金の詳細 */}
        {selectedProgram && (
          <div className="card mb-8">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ✅ 選択された補助金: {selectedProgram.name}
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 mb-2">
                  この補助金での申請手続きを続行します。次のステップでは、募集要項と採択事例を確認します。
                </p>
                <div className="text-sm text-green-700">
                  <p>• 最大補助額: {selectedProgram.maxAmount}</p>
                  <p>• 審査期間: {selectedProgram.processingTime}</p>
                  <p>• 申請難易度: {getDifficultyLabel(selectedProgram.difficulty)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 比較表示ボタン */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="btn-outline"
          >
            {showComparison ? '比較表を閉じる' : '補助金比較表を表示'}
          </button>
        </div>

        {/* 比較表 */}
        {showComparison && (
          <div className="card mb-8">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 補助金比較表</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">補助金名</th>
                      <th className="text-left py-3 px-4">上限額</th>
                      <th className="text-left py-3 px-4">難易度</th>
                      <th className="text-left py-3 px-4">審査期間</th>
                      <th className="text-left py-3 px-4">推奨度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendedPrograms.map((program) => (
                      <tr key={program.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium">{program.name}</td>
                        <td className="py-3 px-4">{program.maxAmount}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(program.difficulty)}`}>
                            {getDifficultyLabel(program.difficulty)}
                          </span>
                        </td>
                        <td className="py-3 px-4">{program.processingTime}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-brand-600 h-2 rounded-full" 
                                style={{ width: `${program.recommendationScore}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{program.recommendationScore}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            disabled={!selectedProgram}
            className={`btn flex items-center ${
              selectedProgram
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
            {selectedProgram ? (
              <span className="text-green-600">
                ✓ {selectedProgram.name} を選択しました
              </span>
            ) : (
              <span className="text-orange-600">
                📝 申請する補助金を選択してください
              </span>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}