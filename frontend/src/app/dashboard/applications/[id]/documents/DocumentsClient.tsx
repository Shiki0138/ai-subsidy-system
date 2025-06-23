'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AutoFillForm } from '@/components/forms/AutoFillForm'
import { applicationsApi } from '@/services/api/applications'
import { 
  DocumentTextIcon,
  DocumentDuplicateIcon,
  CloudArrowDownIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface DocumentsClientProps {
  applicationId: string
}

export function DocumentsClient({ applicationId }: DocumentsClientProps) {
  const router = useRouter()
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'templates' | 'autofill'>('templates')

  useEffect(() => {
    loadApplication()
  }, [applicationId])

  const loadApplication = async () => {
    try {
      const data = await applicationsApi.getApplication(applicationId)
      setApplication(data)
    } catch (error) {
      console.error('Failed to load application:', error)
      toast.error('申請書情報の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">申請書が見つかりません</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <a href="/dashboard" className="text-gray-400 hover:text-gray-500">
                ダッシュボード
              </a>
            </li>
            <li className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <a href="/dashboard/applications" className="ml-4 text-gray-400 hover:text-gray-500">
                申請書一覧
              </a>
            </li>
            <li className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-4 text-gray-700">申請書類管理</span>
            </li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">申請書類管理</h1>
        <p className="mt-2 text-lg text-gray-600">
          {application.title} - {application.subsidyProgram?.name}
        </p>
      </div>

      {/* タブナビゲーション */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('templates')}
              className={`
                py-4 px-6 border-b-2 font-medium text-sm focus:outline-none
                ${activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <DocumentTextIcon className="h-5 w-5 inline mr-2" />
              書類テンプレート
            </button>
            <button
              onClick={() => setActiveTab('autofill')}
              className={`
                py-4 px-6 border-b-2 font-medium text-sm focus:outline-none
                ${activeTab === 'autofill'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <DocumentDuplicateIcon className="h-5 w-5 inline mr-2" />
              自動入力申請書
            </button>
          </nav>
        </div>
      </div>

      {/* コンテンツ */}
      {activeTab === 'templates' ? (
        <TemplatesTab subsidyProgram={application.subsidyProgram} />
      ) : (
        <AutoFillTab 
          subsidyId={application.subsidyProgramId}
          applicationData={application}
          onDownload={handleDownload}
        />
      )}
    </div>
  )
}

// 書類テンプレートタブ
function TemplatesTab({ subsidyProgram }: { subsidyProgram: any }) {
  const templates = [
    {
      name: '経営計画書',
      description: '企業の現状と将来の経営方針を記載',
      fileName: 'business-plan-template.pdf'
    },
    {
      name: '補助事業計画書',
      description: '補助金を活用して実施する事業の詳細',
      fileName: 'project-plan-template.pdf'
    },
    {
      name: '収支計画書',
      description: '事業の収支計画と資金調達計画',
      fileName: 'budget-plan-template.pdf'
    }
  ]

  const handleDownloadTemplate = (template: any) => {
    // 実際の実装では、APIからテンプレートを取得
    toast.success(`${template.name}をダウンロードしました`)
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {subsidyProgram?.name} 関連書類テンプレート
      </h3>
      
      <div className="space-y-4">
        {templates.map((template, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{template.description}</p>
            </div>
            
            <button
              onClick={() => handleDownloadTemplate(template)}
              className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CloudArrowDownIcon className="h-4 w-4 mr-1.5" />
              ダウンロード
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>注意:</strong> これらのテンプレートは参考用です。
          自動入力機能を使用すると、システムに保存されたデータが自動的に入力されます。
        </p>
      </div>
    </div>
  )
}

// 自動入力タブ
function AutoFillTab({ 
  subsidyId, 
  applicationData, 
  onDownload 
}: {
  subsidyId: string
  applicationData: any
  onDownload: (blob: Blob, fileName: string) => void
}) {
  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">
              申請書自動入力機能
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              作成した申請書データから、各種申請書類に必要な情報を自動的に入力します。
              入力された内容は編集可能です。
            </p>
          </div>
        </div>
      </div>

      <AutoFillForm 
        subsidyId={subsidyId}
        applicationData={applicationData}
        onDownload={onDownload}
      />
    </div>
  )
}