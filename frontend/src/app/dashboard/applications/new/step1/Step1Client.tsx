'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  LightBulbIcon,
  BuildingOfficeIcon,
  CpuChipIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

interface ReasonCategory {
  id: string
  title: string
  description: string
  icon: any
  questions: string[]
  subsidyTypes: string[]
}

const reasonCategories: ReasonCategory[] = [
  {
    id: 'digitalization',
    title: 'デジタル化・IT導入',
    description: 'ITツールやシステムを導入して業務効率化を図りたい',
    icon: CpuChipIcon,
    questions: [
      '現在、業務の多くが手作業やアナログで行われていますか？',
      'ITツールの導入により業務効率化を図りたいですか？',
      'ECサイトやオンライン販売を始めたいですか？'
    ],
    subsidyTypes: ['IT導入補助金', '小規模事業者持続化補助金']
  },
  {
    id: 'sales_expansion',
    title: '販路開拓・マーケティング',
    description: '新規顧客獲得や販売チャネルの拡大を行いたい',
    icon: ChartBarIcon,
    questions: [
      '新しい顧客層にアプローチしたいですか？',
      'ウェブサイトやECサイトを構築・改善したいですか？',
      '展示会への出展や広告宣伝を強化したいですか？'
    ],
    subsidyTypes: ['小規模事業者持続化補助金', 'ものづくり補助金']
  },
  {
    id: 'business_restructuring',
    title: '事業再構築・新分野展開',
    description: '新しい事業分野への参入や既存事業の大幅な変更',
    icon: BuildingOfficeIcon,
    questions: [
      'コロナ禍の影響で売上が減少していますか？',
      '新しい事業分野に参入したいですか？',
      '既存の事業モデルを大幅に変更する予定ですか？'
    ],
    subsidyTypes: ['事業再構築補助金', 'ものづくり補助金']
  },
  {
    id: 'innovation',
    title: '技術開発・イノベーション',
    description: '新技術の開発や革新的な製品・サービスの開発',
    icon: LightBulbIcon,
    questions: [
      '新しい技術や製品の開発を行いたいですか？',
      '生産性向上のための設備投資を検討していますか？',
      '研究開発に投資したいですか？'
    ],
    subsidyTypes: ['ものづくり補助金', '事業再構築補助金']
  },
  {
    id: 'global_expansion',
    title: '海外展開・国際化',
    description: '海外市場への進出や国際的な事業展開',
    icon: GlobeAltIcon,
    questions: [
      '海外市場への進出を検討していますか？',
      '輸出を開始または拡大したいですか？',
      '海外での販路開拓を行いたいですか？'
    ],
    subsidyTypes: ['小規模事業者持続化補助金', 'ものづくり補助金']
  },
  {
    id: 'sustainability',
    title: '持続可能性・環境対応',
    description: '環境に配慮した取組みや持続可能な事業運営',
    icon: ShieldCheckIcon,
    questions: [
      '環境に配慮した設備や技術を導入したいですか？',
      'カーボンニュートラルに向けた取組みを行いたいですか？',
      'SDGsに関連した事業を展開したいですか？'
    ],
    subsidyTypes: ['ものづくり補助金', '事業再構築補助金']
  }
]

export function Step1Client() {
  const router = useRouter()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, boolean[]>>({})
  const [showQuestions, setShowQuestions] = useState<Record<string, boolean>>({})

  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId))
      setShowQuestions(prev => ({ ...prev, [categoryId]: false }))
      const newAnswered = { ...answeredQuestions }
      delete newAnswered[categoryId]
      setAnsweredQuestions(newAnswered)
    } else {
      setSelectedCategories([...selectedCategories, categoryId])
      setShowQuestions(prev => ({ ...prev, [categoryId]: true }))
    }
  }

  const handleQuestionAnswer = (categoryId: string, questionIndex: number, answer: boolean) => {
    setAnsweredQuestions(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [questionIndex]: answer
      }
    }))
  }

  const getRecommendedSubsidies = () => {
    const subsidyCount: Record<string, number> = {}
    
    selectedCategories.forEach(categoryId => {
      const category = reasonCategories.find(c => c.id === categoryId)
      if (category) {
        category.subsidyTypes.forEach(subsidyType => {
          subsidyCount[subsidyType] = (subsidyCount[subsidyType] || 0) + 1
        })
      }
    })

    return Object.entries(subsidyCount)
      .sort(([,a], [,b]) => b - a)
      .map(([subsidy]) => subsidy)
  }

  const canProceed = selectedCategories.length > 0 && 
    selectedCategories.every(categoryId => 
      answeredQuestions[categoryId] && 
      Object.keys(answeredQuestions[categoryId]).length > 0
    )

  const handleNext = () => {
    if (canProceed) {
      // 選択結果をセッションストレージに保存
      const results = {
        selectedCategories,
        answeredQuestions,
        recommendedSubsidies: getRecommendedSubsidies(),
        timestamp: new Date().toISOString()
      }
      sessionStorage.setItem('step1-results', JSON.stringify(results))
      router.push('/dashboard/applications/new/step2')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
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
              ステップ1: 補助金が必要な理由
            </h2>
            <div className="text-sm text-gray-600">
              1 / 7
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-brand-600 h-2 rounded-full" style={{ width: '14.3%' }}></div>
          </div>
        </div>

        {/* 説明セクション */}
        <div className="card mb-8">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📋 補助金申請の目的を教えてください
            </h3>
            <p className="text-gray-600 mb-4">
              あなたの事業目的に最適な補助金を提案するため、該当する項目を選択してください。複数選択可能です。
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <LightBulbIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">💡 診断のポイント</h4>
                  <p className="text-sm text-blue-800">
                    選択した項目に基づいて、最適な補助金プログラムを自動提案します。
                    各項目の詳細質問にお答えいただくことで、より精度の高い提案が可能になります。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* カテゴリー選択 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reasonCategories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategories.includes(category.id)
            
            return (
              <div key={category.id} className="space-y-4">
                {/* カテゴリーカード */}
                <div
                  className={`card cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-brand-500 bg-brand-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <div className="card-body">
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 p-2 rounded-lg ${
                        isSelected ? 'bg-brand-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          isSelected ? 'text-brand-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {category.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {category.description}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span>対象補助金: {category.subsidyTypes.join(', ')}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isSelected && (
                          <CheckCircleIcon className="h-5 w-5 text-brand-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 詳細質問 */}
                {showQuestions[category.id] && (
                  <div className="card bg-gray-50">
                    <div className="card-body">
                      <h4 className="font-medium text-gray-900 mb-3">詳細診断</h4>
                      <div className="space-y-3">
                        {category.questions.map((question, index) => (
                          <div key={index} className="space-y-2">
                            <p className="text-sm text-gray-700">{question}</p>
                            <div className="flex space-x-3">
                              <button
                                className={`btn btn-sm ${
                                  answeredQuestions[category.id]?.[index] === true
                                    ? 'btn-primary'
                                    : 'btn-outline'
                                }`}
                                onClick={() => handleQuestionAnswer(category.id, index, true)}
                              >
                                はい
                              </button>
                              <button
                                className={`btn btn-sm ${
                                  answeredQuestions[category.id]?.[index] === false
                                    ? 'btn-secondary'
                                    : 'btn-outline'
                                }`}
                                onClick={() => handleQuestionAnswer(category.id, index, false)}
                              >
                                いいえ
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 推奨補助金プレビュー */}
        {selectedCategories.length > 0 && (
          <div className="card mb-8">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎯 あなたにおすすめの補助金
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getRecommendedSubsidies().slice(0, 3).map((subsidy, index) => (
                  <div key={subsidy} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                        index === 0 ? 'bg-brand-600' : index === 1 ? 'bg-brand-500' : 'bg-brand-400'
                      }`}>
                        {index + 1}
                      </span>
                      <h4 className="font-medium text-gray-900">{subsidy}</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      選択された項目に基づく推奨度: {index === 0 ? '高' : index === 1 ? '中' : '低'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ナビゲーション */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="btn-outline flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            ダッシュボードに戻る
          </Link>

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
        {selectedCategories.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              選択済み: {selectedCategories.length} カテゴリー
              {canProceed && (
                <span className="text-green-600 ml-2">
                  ✓ 次のステップに進めます
                </span>
              )}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}