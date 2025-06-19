'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  InformationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  CurrencyYenIcon,
  BuildingOfficeIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface SubsidyProgram {
  id: string
  name: string
  category: string
  description: string
  maxAmount: number
  applicationPeriod: {
    start: string
    end: string
  }
  targetBusinesses: string[]
  requirements: string[]
  status: 'accepting' | 'closed' | 'upcoming'
  difficulty: 'easy' | 'medium' | 'hard'
  popularity: number
  successRate: number
}

export function SubsidyProgramsClient() {
  const [programs, setPrograms] = useState<SubsidyProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    // デモ用のサンプルデータ
    setTimeout(() => {
      setPrograms([
        {
          id: 'jizokukahojokin',
          name: '小規模事業者持続化補助金',
          category: '販路開拓・業務効率化',
          description: '小規模事業者が経営計画を作成し、その計画に沿って地域の商工会議所等の支援を受けながら取り組む販路開拓等の経費の一部を補助します。',
          maxAmount: 500000,
          applicationPeriod: {
            start: '2024-04-01',
            end: '2024-12-31'
          },
          targetBusinesses: ['小規模事業者', '個人事業主'],
          requirements: [
            '従業員数20名以下（業種により異なる）',
            '経営計画書の作成',
            '商工会議所等の支援を受けること'
          ],
          status: 'accepting',
          difficulty: 'easy',
          popularity: 95,
          successRate: 65
        },
        {
          id: 'itdounyu',
          name: 'IT導入補助金',
          category: 'IT・デジタル化',
          description: 'ITツールの導入による業務効率化・売上向上を支援する補助金です。デジタル化基盤導入類型では最大350万円まで補助されます。',
          maxAmount: 4500000,
          applicationPeriod: {
            start: '2024-03-29',
            end: '2024-10-31'
          },
          targetBusinesses: ['中小企業', '小規模事業者'],
          requirements: [
            'ITツールの導入計画',
            '生産性向上の効果測定',
            '認定ベンダーからの導入'
          ],
          status: 'accepting',
          difficulty: 'medium',
          popularity: 88,
          successRate: 72
        },
        {
          id: 'jigyousaikouchiku',
          name: '事業再構築補助金',
          category: '事業転換・新分野展開',
          description: 'ポストコロナ時代の経済社会の変化に対応するため、思い切った事業再構築に意欲を有する中小企業等の挑戦を支援します。',
          maxAmount: 100000000,
          applicationPeriod: {
            start: '2024-04-15',
            end: '2024-11-30'
          },
          targetBusinesses: ['中小企業', '中堅企業'],
          requirements: [
            '売上減少の実績',
            '事業再構築の要件を満たす',
            '認定経営革新等支援機関の確認'
          ],
          status: 'accepting',
          difficulty: 'hard',
          popularity: 82,
          successRate: 45
        },
        {
          id: 'monozukuri',
          name: 'ものづくり補助金',
          category: '設備投資・技術開発',
          description: '中小企業・小規模事業者等が今後複数年にわたり相次いで直面する制度変更等に対応するため、革新的サービス開発・試作品開発・生産プロセスの改善を行うための設備投資等を支援します。',
          maxAmount: 10000000,
          applicationPeriod: {
            start: '2024-05-08',
            end: '2024-08-31'
          },
          targetBusinesses: ['中小企業', '小規模事業者'],
          requirements: [
            '3-5年の事業計画の策定',
            '革新的な設備・システムの導入',
            '付加価値額年率平均3%以上の向上'
          ],
          status: 'accepting',
          difficulty: 'medium',
          popularity: 75,
          successRate: 58
        },
        {
          id: 'hataraikatakaizen',
          name: '働き方改革推進支援助成金',
          category: '労働環境改善',
          description: '生産性を向上させ、労働時間の縮減や年次有給休暇の促進に向けた環境整備に取り組む中小企業事業主に対して、その実施に要した費用の一部を助成します。',
          maxAmount: 1000000,
          applicationPeriod: {
            start: '2024-04-01',
            end: '2025-01-31'
          },
          targetBusinesses: ['中小企業'],
          requirements: [
            '労働者災害補償保険の適用事業主',
            '年5日の年次有給休暇取得に向けた就業規則等の整備',
            'テレワーク実施のための環境整備'
          ],
          status: 'accepting',
          difficulty: 'easy',
          popularity: 68,
          successRate: 78
        },
        {
          id: 'carbon-neutral',
          name: 'カーボンニュートラル投資促進税制',
          category: '環境・エネルギー',
          description: '2050年カーボンニュートラルの実現に向けて、脱炭素化効果の高い投資を促進するため、一定の要件を満たす設備投資について、特別償却または税額控除を選択適用できます。',
          maxAmount: 50000000,
          applicationPeriod: {
            start: '2024-06-01',
            end: '2025-03-31'
          },
          targetBusinesses: ['中小企業', '中堅企業', '大企業'],
          requirements: [
            '脱炭素化効果の高い設備投資',
            '投資計画の認定',
            '効果測定・報告の実施'
          ],
          status: 'upcoming',
          difficulty: 'hard',
          popularity: 45,
          successRate: 42
        }
      ])
      setIsLoading(false)
    }, 500)
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      accepting: { label: '申請受付中', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      closed: { label: '受付終了', color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon },
      upcoming: { label: '近日受付開始', color: 'bg-blue-100 text-blue-800', icon: ClockIcon }
    }

    const config = statusConfig[status] || statusConfig.accepting
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const getDifficultyBadge = (difficulty: string) => {
    const difficultyConfig = {
      easy: { label: '初級', color: 'bg-green-100 text-green-800' },
      medium: { label: '中級', color: 'bg-yellow-100 text-yellow-800' },
      hard: { label: '上級', color: 'bg-red-100 text-red-800' }
    }

    const config = difficultyConfig[difficulty] || difficultyConfig.medium

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || program.category === filterCategory
    const matchesStatus = filterStatus === 'all' || program.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const categories = Array.from(new Set(programs.map(p => p.category)))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">補助金情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <InformationCircleIcon className="h-6 w-6 text-brand-600" />
              <h1 className="text-xl font-bold text-gray-900">補助金情報</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 検索・フィルター */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="補助金名、説明、カテゴリで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="all">すべてのカテゴリ</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="all">すべてのステータス</option>
                <option value="accepting">申請受付中</option>
                <option value="upcoming">近日開始</option>
                <option value="closed">受付終了</option>
              </select>
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <InformationCircleIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">利用可能</p>
                <p className="text-2xl font-bold text-gray-900">{programs.filter(p => p.status === 'accepting').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <CurrencyYenIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">最大補助額</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(Math.max(...programs.map(p => p.maxAmount)))}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">対象企業</p>
                <p className="text-2xl font-bold text-gray-900">全規模</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <SparklesIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">平均成功率</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(programs.reduce((sum, p) => sum + p.successRate, 0) / programs.length)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 補助金一覧 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              補助金プログラム一覧 ({filteredPrograms.length}件)
            </h2>
          </div>

          {filteredPrograms.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
              <InformationCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">該当する補助金がありません</h3>
              <p className="text-gray-600">検索条件を変更してお試しください</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPrograms.map((program) => (
                <div key={program.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {program.name}
                          </h3>
                          {getStatusBadge(program.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {program.category}
                        </p>
                      </div>
                      {getDifficultyBadge(program.difficulty)}
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                      {program.description}
                    </p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">最大補助額</span>
                        <span className="font-semibold text-gray-900">
                          {formatAmount(program.maxAmount)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">申請期間</span>
                        <span className="text-gray-900">
                          {formatDate(program.applicationPeriod.start)} - {formatDate(program.applicationPeriod.end)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">成功率</span>
                        <span className="text-gray-900">{program.successRate}%</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">対象事業者</p>
                      <div className="flex flex-wrap gap-1">
                        {program.targetBusinesses.map((target, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {target}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        人気度: {program.popularity}%
                      </div>
                      <Link
                        href={`/dashboard/applications/new?program=${program.id}`}
                        className="inline-flex items-center text-brand-600 hover:text-brand-700 text-sm font-medium"
                      >
                        申請書を作成
                        <ArrowRightIcon className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* デモ環境の案内 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <SparklesIcon className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-lg font-semibold text-blue-900 mb-2">💡 デモ環境について</h4>
              <p className="text-blue-700 mb-4">
                現在はデモ環境のため、実際の補助金情報とは異なる場合があります。
                各補助金の「申請書を作成」リンクをクリックすると、AIによる申請書作成を体験できます。
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  ✨ AI自動生成
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  📄 PDF出力対応
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  🚀 即座に体験可能
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}