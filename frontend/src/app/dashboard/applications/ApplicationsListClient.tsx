'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks'

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
  estimatedAmount: number
  progressPercentage: number
}

export function ApplicationsListClient() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const { user } = useAuth()

  useEffect(() => {
    // デモ用のサンプルデータ
    setTimeout(() => {
      setApplications([
        {
          id: 'demo-1',
          title: 'DX推進による業務効率化プロジェクト',
          status: 'COMPLETED',
          subsidyProgram: {
            name: '小規模事業者持続化補助金',
            category: '一般型'
          },
          createdAt: '2024-06-01T10:00:00Z',
          updatedAt: '2024-06-10T10:00:00Z',
          estimatedAmount: 1000000,
          progressPercentage: 100
        },
        {
          id: '2',
          title: 'AI活用による顧客サービス向上事業',
          status: 'SUBMITTED',
          subsidyProgram: {
            name: 'IT導入補助金',
            category: 'デジタル化基盤導入類型'
          },
          createdAt: '2024-06-08T14:00:00Z',
          updatedAt: '2024-06-11T16:30:00Z',
          estimatedAmount: 1500000,
          progressPercentage: 100
        },
        {
          id: '3',
          title: '新商品開発・市場投入プロジェクト',
          status: 'GENERATING',
          subsidyProgram: {
            name: 'ものづくり補助金',
            category: '一般・グローバル展開型'
          },
          createdAt: '2024-06-12T09:00:00Z',
          updatedAt: '2024-06-12T09:15:00Z',
          estimatedAmount: 3000000,
          progressPercentage: 35
        },
        {
          id: '4',
          title: '地域連携による事業拡大計画',
          status: 'DRAFT',
          subsidyProgram: {
            name: '事業再構築補助金',
            category: '成長枠'
          },
          createdAt: '2024-06-13T15:30:00Z',
          updatedAt: '2024-06-13T15:30:00Z',
          estimatedAmount: 5000000,
          progressPercentage: 15
        },
        {
          id: '5',
          title: 'テレワーク環境整備事業',
          status: 'EDITING',
          subsidyProgram: {
            name: '働き方改革推進支援助成金',
            category: 'テレワークコース'
          },
          createdAt: '2024-06-14T11:00:00Z',
          updatedAt: '2024-06-14T14:45:00Z',
          estimatedAmount: 800000,
          progressPercentage: 70
        }
      ])
      setIsLoading(false)
    }, 500)
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: '下書き', color: 'bg-gray-100 text-gray-800', icon: ClockIcon },
      GENERATING: { label: 'AI生成中', color: 'bg-blue-100 text-blue-800', icon: SparklesIcon },
      GENERATED: { label: '生成完了', color: 'bg-purple-100 text-purple-800', icon: CheckCircleIcon },
      EDITING: { label: '編集中', color: 'bg-yellow-100 text-yellow-800', icon: PencilIcon },
      COMPLETED: { label: '完成', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      SUBMITTED: { label: '提出済み', color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon },
      FAILED: { label: '生成失敗', color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon }
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.subsidyProgram.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || app.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">申請書一覧を読み込み中...</p>
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
              <DocumentTextIcon className="h-6 w-6 text-brand-600" />
              <h1 className="text-xl font-bold text-gray-900">申請書管理</h1>
            </div>
            <Link
              href="/dashboard/applications/new"
              className="inline-flex items-center bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              新規作成
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 検索・フィルター */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="申請書名または補助金名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="all">すべて</option>
                <option value="DRAFT">下書き</option>
                <option value="GENERATING">AI生成中</option>
                <option value="EDITING">編集中</option>
                <option value="COMPLETED">完成</option>
                <option value="SUBMITTED">提出済み</option>
              </select>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">総申請書数</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">完成済み</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => app.status === 'COMPLETED' || app.status === 'SUBMITTED').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">作成中</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => ['DRAFT', 'GENERATING', 'EDITING'].includes(app.status)).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <SparklesIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">総予算額</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(applications.reduce((sum, app) => sum + app.estimatedAmount, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 申請書一覧 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              申請書一覧 ({filteredApplications.length}件)
            </h2>
          </div>
          
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">申請書がありません</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? '検索条件に一致する申請書が見つかりませんでした' 
                  : '新しい申請書を作成して始めましょう'}
              </p>
              <Link
                href="/dashboard/applications/new"
                className="inline-flex items-center bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                新規申請書を作成
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {application.title}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {application.subsidyProgram.name} ({application.subsidyProgram.category})
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span>作成: {formatDate(application.createdAt)}</span>
                        <span>更新: {formatDate(application.updatedAt)}</span>
                        <span>予算: {formatAmount(application.estimatedAmount)}</span>
                      </div>
                      
                      {application.status === 'GENERATING' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>AI生成進捗</span>
                            <span>{application.progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${application.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/dashboard/applications/${application.id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        詳細
                      </Link>
                      
                      {application.status !== 'GENERATING' && (
                        <Link
                          href={`/dashboard/applications/${application.id}/edit`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          編集
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* デモ環境の案内 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">💡 デモ環境について</h4>
              <p className="text-sm text-blue-700 mt-1">
                現在はデモ環境のため、サンプルデータを表示しています。
                「DX推進による業務効率化プロジェクト」をクリックすると、実際の申請書内容とPDF出力機能をお試しいただけます。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}