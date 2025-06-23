'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { subsidiesApi } from '@/services/api/subsidies'
import { 
  DocumentTextIcon, 
  CloudArrowDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CurrencyYenIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface SubsidyDetailClientProps {
  subsidyId: string
}

interface RequiredDocument {
  name: string
  description: string
  templateUrl?: string
  isRequired: boolean
  category: 'mandatory' | 'conditional' | 'optional'
}

export function SubsidyDetailClient({ subsidyId }: SubsidyDetailClientProps) {
  const router = useRouter()
  const [subsidyData, setSubsidyData] = useState<any>(null)
  const [documents, setDocuments] = useState<RequiredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingDocs, setDownloadingDocs] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSubsidyData()
  }, [subsidyId])

  const loadSubsidyData = async () => {
    try {
      const data = await subsidiesApi.getSubsidyDetail(subsidyId)
      setSubsidyData(data)
      
      // 必要書類の整理
      const docs: RequiredDocument[] = [
        // 必須書類
        ...(data.guideline?.requiredDocuments?.mandatory || []).map((doc: string) => ({
          name: doc,
          description: getDocumentDescription(doc),
          templateUrl: getDocumentTemplateUrl(subsidyId, doc),
          isRequired: true,
          category: 'mandatory' as const
        })),
        // 条件付き書類
        ...(data.guideline?.requiredDocuments?.conditional || []).map((doc: string) => ({
          name: doc,
          description: getDocumentDescription(doc),
          templateUrl: getDocumentTemplateUrl(subsidyId, doc),
          isRequired: false,
          category: 'conditional' as const
        }))
      ]
      
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to load subsidy data:', error)
      toast.error('補助金情報の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadDocument = async (doc: RequiredDocument) => {
    if (!doc.templateUrl) {
      toast.error('テンプレートファイルがありません')
      return
    }

    setDownloadingDocs(prev => new Set(prev).add(doc.name))
    
    try {
      // 実際の実装では、APIからPDFを取得
      const response = await fetch(doc.templateUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.name}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`${doc.name}をダウンロードしました`)
    } catch (error) {
      toast.error('ダウンロードに失敗しました')
    } finally {
      setDownloadingDocs(prev => {
        const next = new Set(prev)
        next.delete(doc.name)
        return next
      })
    }
  }

  const handleStartApplication = () => {
    router.push(`/dashboard/applications/new?subsidyId=${subsidyId}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!subsidyData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">補助金情報が見つかりません</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* パンくずリスト */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
                ダッシュボード
              </Link>
            </li>
            <li className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <Link href="/subsidies" className="ml-4 text-gray-400 hover:text-gray-500">
                補助金一覧
              </Link>
            </li>
            <li className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-4 text-gray-700">{subsidyData.name}</span>
            </li>
          </ol>
        </nav>

        {/* ヘッダー */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {subsidyData.name}
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                {subsidyData.officialName}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {subsidyData.category}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {subsidyData.organizationName}
                </span>
              </div>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={handleStartApplication}
                className="ml-3 inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                申請を開始する
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：詳細情報 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 概要 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">概要</h2>
              <p className="text-gray-700">{subsidyData.description}</p>
              {subsidyData.guideline?.overview && (
                <p className="mt-3 text-gray-700">{subsidyData.guideline.overview}</p>
              )}
            </div>

            {/* 目的 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">事業目的</h2>
              <p className="text-gray-700">{subsidyData.purpose}</p>
              {subsidyData.guideline?.purpose && (
                <p className="mt-3 text-gray-700">{subsidyData.guideline.purpose}</p>
              )}
            </div>

            {/* 申請要件 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">申請要件</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">対象事業者</h3>
                  <p className="text-gray-700">{subsidyData.targetBusiness}</p>
                </div>

                {subsidyData.guideline?.eligibilityRequirements?.mandatory && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">必須要件</h3>
                    <ul className="space-y-2">
                      {subsidyData.guideline.eligibilityRequirements.mandatory.map((req: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {subsidyData.guideline?.eligibilityRequirements?.optional && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">任意要件</h3>
                    <ul className="space-y-2">
                      {subsidyData.guideline.eligibilityRequirements.optional.map((req: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <ExclamationCircleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* 必要書類 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">提出書類</h2>
              
              <div className="space-y-6">
                {/* 必須書類 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-red-500" />
                    必須書類
                  </h3>
                  <div className="space-y-3">
                    {documents.filter(doc => doc.category === 'mandatory').map((doc, i) => (
                      <DocumentItem 
                        key={i} 
                        document={doc}
                        onDownload={() => handleDownloadDocument(doc)}
                        isDownloading={downloadingDocs.has(doc.name)}
                      />
                    ))}
                  </div>
                </div>

                {/* 条件付き書類 */}
                {documents.filter(doc => doc.category === 'conditional').length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <DocumentDuplicateIcon className="h-5 w-5 mr-2 text-yellow-500" />
                      条件付き書類
                    </h3>
                    <div className="space-y-3">
                      {documents.filter(doc => doc.category === 'conditional').map((doc, i) => (
                        <DocumentItem 
                          key={i} 
                          document={doc}
                          onDownload={() => handleDownloadDocument(doc)}
                          isDownloading={downloadingDocs.has(doc.name)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>ヒント:</strong> 申請書作成ウィザードを使用すると、これらの書類に必要な情報が自動的に入力されます。
                </p>
              </div>
            </div>
          </div>

          {/* 右側：サイドバー */}
          <div className="space-y-6">
            {/* 補助金額情報 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">補助金額</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">最大補助額</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ¥{subsidyData.maxAmount?.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">補助率</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(subsidyData.subsidyRate * 100)}%
                  </p>
                </div>

                {subsidyData.guideline && (
                  <>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500">最小補助額</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ¥{subsidyData.guideline.minAmount?.toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 申請期間 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">申請期間</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">開始日</p>
                    <p className="font-medium">
                      {new Date(subsidyData.applicationStart).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">締切日</p>
                    <p className="font-medium text-red-600">
                      {new Date(subsidyData.applicationEnd).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 残り日数の表示 */}
              {(() => {
                const daysLeft = Math.ceil(
                  (new Date(subsidyData.applicationEnd).getTime() - new Date().getTime()) / 
                  (1000 * 60 * 60 * 24)
                )
                return daysLeft > 0 ? (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      締切まで残り <strong>{daysLeft}日</strong>
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      申請期間は終了しました
                    </p>
                  </div>
                )
              })()}
            </div>

            {/* クイックアクション */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">クイックアクション</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleStartApplication}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  申請書を作成する
                </button>
                
                <button
                  onClick={() => router.push(`/subsidies/${subsidyId}/guide`)}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  申請ガイドを見る
                </button>
                
                <button
                  onClick={() => router.push(`/subsidies/${subsidyId}/examples`)}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  採択事例を見る
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 書類アイテムコンポーネント
function DocumentItem({ 
  document, 
  onDownload, 
  isDownloading 
}: {
  document: RequiredDocument
  onDownload: () => void
  isDownloading: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{document.name}</h4>
        <p className="text-sm text-gray-500 mt-1">{document.description}</p>
      </div>
      
      {document.templateUrl && (
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              ダウンロード中...
            </>
          ) : (
            <>
              <CloudArrowDownIcon className="h-4 w-4 mr-1.5" />
              PDFダウンロード
            </>
          )}
        </button>
      )}
    </div>
  )
}

// ドキュメントの説明を取得
function getDocumentDescription(docName: string): string {
  const descriptions: Record<string, string> = {
    '経営計画書': '企業の現状と将来の経営方針を記載する書類',
    '補助事業計画書': '補助金を活用して実施する事業の詳細計画',
    '事業支援計画書（商工会議所発行）': '商工会議所が発行する事業計画の妥当性を証明する書類',
    '決算書（直近2期分）': '企業の財務状況を示す決算報告書',
    '見積書（単価50万円以上の場合）': '高額な設備・サービスの購入見積もり',
    '許認可証の写し（該当業種の場合）': '事業に必要な許認可を取得していることを証明する書類',
    '従業員数を証明する書類': '雇用保険被保険者数等を証明する書類'
  }
  
  return descriptions[docName] || '申請に必要な書類'
}

// テンプレートURLを生成（実際にはAPIから取得）
function getDocumentTemplateUrl(subsidyId: string, docName: string): string | undefined {
  // 実際の実装では、APIからテンプレートのURLを取得
  const templates: Record<string, string> = {
    '経営計画書': `/api/subsidies/${subsidyId}/templates/business-plan`,
    '補助事業計画書': `/api/subsidies/${subsidyId}/templates/project-plan`,
    '事業支援計画書（商工会議所発行）': undefined, // 外部機関発行のため
    '決算書（直近2期分）': undefined, // 企業固有の書類のため
    '見積書（単価50万円以上の場合）': `/api/subsidies/${subsidyId}/templates/quotation`
  }
  
  return templates[docName]
}