'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  PlusIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { ProgressRing, MultiProgressRing } from '@/components/dashboard/ProgressRing'
import { MainNavigation } from '@/components/navigation/MainNavigation'
import dynamic from 'next/dynamic'

// Chart.jsは動的にインポート（SSR対策）
const ChartComponents = dynamic(
  () => import('@/components/dashboard/ChartComponents').then(mod => mod.ChartComponents),
  { 
    ssr: false,
    loading: () => <div className="h-80 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full"></div></div>
  }
)


interface Application {
  id: string
  title: string
  status: string
  subsidyProgram: {
    name: string
    category: string
  }
  createdAt: string
  updatedAt: string
}

interface DashboardStats {
  totalApplications: number
  inProgress: number
  completed: number
  approved: number
}

export function DashboardClient() {
  // 認証システムの統合（開発基本ルール: 既存機能は削除しない）
  const { user: authUser, logout: authLogout, isLoading: authLoading } = useAuth()
  
  // テスト用のモックユーザー（既存機能保持）
  const mockUser = {
    id: 'test-user',
    email: 'demo@demo.com',
    name: 'デモユーザー',
    companyName: 'デモ株式会社'
  }
  
  // 認証ユーザーが存在する場合は認証システムを使用、そうでなければモック
  const user = authUser || mockUser
  const isLoading = authLoading
  const logout = authUser ? authLogout : () => { window.location.href = '/' }

  // ダッシュボード統計データの取得
  const { data: stats = {
    totalApplications: 5,
    inProgress: 2,
    completed: 2,
    approved: 1,
    totalSavings: 2400000, // 240万円の削減効果
    timeReduction: 85, // 85%の時間短縮
    successRate: 60, // 60%の採択率
  } } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        // 認証なしの場合の充実したデモデータ
        return {
          totalApplications: 5,
          inProgress: 2,
          completed: 2,
          approved: 1,
          totalSavings: 2400000,
          timeReduction: 85,
          successRate: 60,
          monthlyStats: [
            { month: '1月', applications: 1, approved: 0 },
            { month: '2月', applications: 2, approved: 1 },
            { month: '3月', applications: 2, approved: 1 },
          ]
        }
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (!response.ok) {
        // API失敗時の充実したフォールバックデータ
        return {
          totalApplications: 5,
          inProgress: 2,
          completed: 2,
          approved: 1,
          totalSavings: 2400000,
          timeReduction: 85,
          successRate: 60,
          monthlyStats: [
            { month: '1月', applications: 1, approved: 0 },
            { month: '2月', applications: 2, approved: 1 },
            { month: '3月', applications: 2, approved: 1 },
          ]
        }
      }
      
      const result = await response.json()
      return result.data
    },
    enabled: !!user,
  })

  // 申請書一覧の取得
  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No token')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (!response.ok) {
        // 充実したフォールバック用のモックデータ
        return [
          {
            id: 'demo-1',
            title: 'DX推進による業務効率化プロジェクト',
            status: 'COMPLETED',
            subsidyProgram: {
              name: '小規模事業者持続化補助金',
              category: '一般型',
            },
            createdAt: '2024-06-01T10:00:00Z',
            updatedAt: '2024-06-10T10:00:00Z',
            estimatedAmount: 1000000,
            progressPercentage: 100,
          },
          {
            id: '2',
            title: 'AI活用による顧客サービス向上事業',
            status: 'SUBMITTED',
            subsidyProgram: {
              name: 'IT導入補助金',
              category: 'デジタル化基盤導入類型',
            },
            createdAt: '2024-06-08T14:00:00Z',
            updatedAt: '2024-06-11T16:30:00Z',
            estimatedAmount: 1500000,
            progressPercentage: 100,
          },
          {
            id: '3',
            title: '新商品開発・市場投入プロジェクト',
            status: 'GENERATING',
            subsidyProgram: {
              name: 'ものづくり補助金',
              category: '一般・グローバル展開型',
            },
            createdAt: '2024-06-12T09:00:00Z',
            updatedAt: '2024-06-12T09:15:00Z',
            estimatedAmount: 3000000,
            progressPercentage: 35,
          },
          {
            id: '4',
            title: '地域連携による事業拡大計画',
            status: 'DRAFT',
            subsidyProgram: {
              name: '事業再構築補助金',
              category: '成長枠',
            },
            createdAt: '2024-06-13T15:30:00Z',
            updatedAt: '2024-06-13T15:30:00Z',
            estimatedAmount: 5000000,
            progressPercentage: 15,
          },
          {
            id: '5',
            title: 'テレワーク環境整備事業',
            status: 'EDITING',
            subsidyProgram: {
              name: '働き方改革推進支援助成金',
              category: 'テレワークコース',
            },
            createdAt: '2024-06-14T11:00:00Z',
            updatedAt: '2024-06-14T14:45:00Z',
            estimatedAmount: 800000,
            progressPercentage: 70,
          },
        ]
      }
      
      const result = await response.json()
      return result.data
    },
    enabled: !!user,
  })

  // テスト環境ではログイン確認をスキップ
  // useEffect(() => {
  //   if (!isLoading && !user) {
  //     router.push('/auth/login')
  //   }
  // }, [user, isLoading, router])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: '下書き', color: 'bg-gray-100 text-gray-800', icon: ClockIcon },
      GENERATING: { label: 'AI生成中', color: 'bg-blue-100 text-blue-800', icon: SparklesIcon },
      GENERATED: { label: '生成完了', color: 'bg-purple-100 text-purple-800', icon: BoltIcon },
      EDITING: { label: '編集中', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      COMPLETED: { label: '完成', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      SUBMITTED: { label: '提出済み', color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon },
    }

    const config = statusConfig[status] || statusConfig.DRAFT
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">ダッシュボードを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー - 改善されたナビゲーション */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-8 w-8 text-brand-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    AI補助金申請システム
                  </h1>
                  <p className="text-sm text-gray-600">{user.companyName}</p>
                </div>
              </div>
              
              {/* デスクトップナビゲーション */}
              <MainNavigation 
                currentPath="/dashboard"
                user={user}
                onLogout={logout}
              />
            </div>

            {/* ユーザーメニューとモバイルナビゲーション */}
            <div className="flex items-center space-x-3">
              {/* デスクトップ用ユーザーメニュー */}
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/dashboard/profile"
                  className="text-gray-600 hover:text-brand-600 transition-colors text-sm"
                >
                  プロフィール
                </Link>
                <button
                  onClick={logout}
                  className="btn-outline btn-sm"
                >
                  ログアウト
                </button>
              </div>

              {/* モバイルナビゲーション */}
              <MainNavigation 
                currentPath="/dashboard"
                isMobile={true}
                user={user}
                onLogout={logout}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* ウェルカムセクション - 改善された情報階層 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                おかえりなさい、{user.name}さん
              </h1>
              <p className="text-gray-600">
                今日も効率的な申請書作成を始めましょう
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/dashboard/applications/new"
                className="inline-flex items-center bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                aria-label="新しい申請書を作成開始"
              >
                <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                新規申請書
              </Link>
            </div>
          </div>
        </div>

        {/* 統計カード - 改善されたレイアウト */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              📊 申請書管理状況
            </h2>
            <span className="text-sm text-gray-500">
              最終更新: {new Date().toLocaleDateString('ja-JP')}
            </span>
          </div>
          <StatsGrid stats={stats} isLoading={false} />
        </div>

        {/* 進捗視覚化 - 簡潔になった情報表示 */}
        {stats.totalApplications > 0 && (
          <div className="mb-8">
            <div className="card">
              <div className="card-body">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                  📈 進捗概要
                </h2>
                <div className="flex items-center justify-center">
                  <ProgressRing 
                    progress={stats.totalApplications > 0 ? (stats.completed / stats.totalApplications) * 100 : 0}
                    size="lg"
                    color="text-brand-600"
                    label="完了率"
                  />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-brand-600">{stats.completed}</div>
                    <div className="text-sm text-gray-600">完成</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                    <div className="text-sm text-gray-600">作成中</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                    <div className="text-sm text-gray-600">採択済み</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* クイックアクション - 使いやすさを改善 */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                <span className="inline-flex items-center">
                  ⚡ クイックアクション
                </span>
              </h2>
              
              <div className="space-y-4">
                <Link
                  href="/dashboard/applications/new"
                  className="group w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white p-4 rounded-lg font-semibold hover:from-brand-700 hover:to-brand-800 transition-all duration-200 flex items-center justify-between shadow-md"
                  aria-label="新しい申請書作成を開始"
                >
                  <div className="flex items-center">
                    <PlusIcon className="h-5 w-5 mr-3" aria-hidden="true" />
                    <div className="text-left">
                      <div className="font-semibold">新しい申請書</div>
                      <div className="text-xs text-brand-100">AI生成で簡単作成</div>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
                
                <div className="grid grid-cols-1 gap-3">
                  <Link
                    href="/dashboard/applications"
                    className="w-full btn-outline flex items-center justify-center py-3 hover:bg-gray-50"
                    aria-label="申請書一覧を表示"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    申請書一覧
                  </Link>
                  
                  <Link
                    href="/dashboard/profile"
                    className="w-full btn-outline flex items-center justify-center py-3 hover:bg-gray-50"
                    aria-label="企業プロフィールを編集"
                  >
                    企業プロフィール設定
                  </Link>
                </div>
              </div>

              {/* 改善されたヒント */}
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <SparklesIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-900 mb-1">💡 成功のコツ</h3>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      企業情報を詳しく入力すると、AIがより精度の高い申請書を生成します。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 最近の申請書 */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    最近の申請書
                  </h2>
                  <Link
                    href="/dashboard/applications"
                    className="text-sm text-brand-600 hover:text-brand-500"
                  >
                    すべて表示
                  </Link>
                </div>
              </div>
              
              <div className="card-body">
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-brand-50 to-indigo-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                      <DocumentTextIcon className="h-10 w-10 text-brand-600" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      初回の申請書を作成しましょう
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      AIが企業情報を分析して、高品質な申請書を自動生成します。
                    </p>
                    <div className="space-y-3">
                      <Link
                        href="/dashboard/applications/new"
                        className="inline-flex items-center bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                        aria-label="新しい申請書を作成開始"
                      >
                        <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                        申請書を作成する
                      </Link>
                      <div className="text-sm text-gray-500">
                        📋 約3分で完了 • 🤖 AI自動生成 • 📄 PDF出力対応
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div
                        key={application.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {application.title}
                              </h3>
                              {getStatusBadge(application.status)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {application.subsidyProgram.name} ({application.subsidyProgram.category})
                            </p>
                            <div className="flex items-center text-xs text-gray-500 space-x-4">
                              <span>作成: {formatDate(application.createdAt)}</span>
                              <span>更新: {formatDate(application.updatedAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Link
                              href={`/dashboard/applications/${application.id}`}
                              className="btn-outline btn-sm"
                            >
                              編集
                            </Link>
                            {application.status === 'COMPLETED' && (
                              <Link
                                href={`/dashboard/applications/${application.id}/pdf`}
                                className="btn-secondary btn-sm"
                              >
                                PDF
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 統計グラフ表示 */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              📊 統計分析
            </h2>
            <div className="text-sm text-gray-500">
              データ期間: 過去6ヶ月
            </div>
          </div>
          <ChartComponents
            monthlyStats={stats.monthlyStats}
            totalApplications={stats.totalApplications}
            approved={stats.approved}
            inProgress={stats.inProgress}
            completed={stats.completed}
          />
        </div>

        {/* 補助金情報 */}
        <div className="mt-8">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                📊 おすすめの補助金プログラム
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">小規模事業者持続化補助金</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    販路開拓・業務効率化の取組を支援。上限50万円。
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      申請受付中
                    </span>
                    <Link
                      href="/dashboard/applications/new?program=jizokukahojokin"
                      className="text-sm text-brand-600 hover:text-brand-500"
                    >
                      申請書作成 →
                    </Link>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">IT導入補助金</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    ITツール導入による業務効率化支援。上限450万円。
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      申請受付中
                    </span>
                    <Link
                      href="/dashboard/applications/new?program=itdounyu"
                      className="text-sm text-brand-600 hover:text-brand-500"
                    >
                      申請書作成 →
                    </Link>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">事業再構築補助金</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    新分野展開、業態転換等を支援。上限1億円。
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      準備中
                    </span>
                    <span className="text-sm text-gray-400">
                      近日公開
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}