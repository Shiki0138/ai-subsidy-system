'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DocumentTextIcon,
  DocumentArrowUpIcon,
  LinkIcon,
  TrashIcon,
  SparklesIcon,
  CheckCircleIcon,
  FolderOpenIcon,
  DocumentDuplicateIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { KnowledgeBaseService } from '@/services/knowledge-base-service'
import { SubsidyKnowledgeBase, DocumentUploadRequest, KnowledgeDocument } from '@/types/knowledge-base'
import { KnowledgeBaseBackupService } from '@/utils/knowledge-base-backup'

const SUBSIDY_TYPES = [
  {
    id: 'jizokuka',
    name: '小規模事業者持続化補助金',
    description: '販路開拓等の取組を支援',
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'it-subsidy',
    name: 'IT導入補助金',
    description: 'ITツール導入による生産性向上を支援',
    color: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-800'
  },
  {
    id: 'monozukuri',
    name: 'ものづくり補助金',
    description: '革新的サービス開発・試作品開発を支援',
    color: 'bg-purple-50 border-purple-200',
    badgeColor: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'gyomu-kaizen',
    name: '業務改善助成金',
    description: '生産性向上と賃金引上げを支援',
    color: 'bg-orange-50 border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-800'
  }
]

export function IntegratedKnowledgeBaseManager() {
  const [knowledgeBases, setKnowledgeBases] = useState<Record<string, SubsidyKnowledgeBase>>({})
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [uploadType, setUploadType] = useState<DocumentUploadRequest['type']>('guideline')
  const [uploadUrl, setUploadUrl] = useState('')
  const [currentSubsidyId, setCurrentSubsidyId] = useState<string | null>(null)
  const [service] = useState(() => new KnowledgeBaseService())

  useEffect(() => {
    loadAllKnowledgeBases()
  }, [])

  const loadAllKnowledgeBases = async () => {
    const bases: Record<string, SubsidyKnowledgeBase> = {}
    for (const subsidy of SUBSIDY_TYPES) {
      const base = await service.getKnowledgeBase(subsidy.id)
      if (base) {
        bases[subsidy.id] = base
      }
    }
    setKnowledgeBases(bases)
  }

  const toggleSection = (subsidyId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [subsidyId]: !prev[subsidyId]
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, subsidyId: string) => {
    const file = e.target.files?.[0]
    if (!file || !currentSubsidyId) return

    setIsUploading(true)
    try {
      const subsidy = SUBSIDY_TYPES.find(s => s.id === subsidyId)
      const request: DocumentUploadRequest = {
        type: uploadType,
        file: file,
        name: file.name
      }

      const updatedBase = await service.addDocument(subsidyId, subsidy?.name || '', request)
      setKnowledgeBases(prev => ({ ...prev, [subsidyId]: updatedBase }))
      toast.success('ドキュメントをアップロードしました')
      
      e.target.value = ''
      setCurrentSubsidyId(null)
    } catch (error) {
      console.error('アップロードエラー:', error)
      toast.error('アップロードに失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlAdd = async (subsidyId: string) => {
    if (!uploadUrl) {
      toast.error('URLを入力してください')
      return
    }

    setIsUploading(true)
    try {
      const subsidy = SUBSIDY_TYPES.find(s => s.id === subsidyId)
      const request: DocumentUploadRequest = {
        type: 'website',
        url: uploadUrl,
        name: new URL(uploadUrl).hostname
      }

      const updatedBase = await service.addDocument(subsidyId, subsidy?.name || '', request)
      setKnowledgeBases(prev => ({ ...prev, [subsidyId]: updatedBase }))
      toast.success('Webサイトを追加しました')
      setUploadUrl('')
    } catch (error) {
      console.error('URL追加エラー:', error)
      toast.error('URLの追加に失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveDocument = async (subsidyId: string, documentId: string) => {
    try {
      await service.removeDocument(subsidyId, documentId)
      await loadAllKnowledgeBases()
      toast.success('ドキュメントを削除しました')
    } catch (error) {
      console.error('削除エラー:', error)
      toast.error('削除に失敗しました')
    }
  }

  const handleAnalyze = async (subsidyId: string) => {
    setIsAnalyzing(subsidyId)
    try {
      console.log('分析開始:', subsidyId)
      const analysis = await service.analyzeKnowledgeBase(subsidyId)
      console.log('分析結果:', analysis)
      
      if (analysis) {
        toast.success('知識ベースの分析が完了しました')
        await loadAllKnowledgeBases()
      } else {
        toast.error('分析結果が空でした')
      }
    } catch (error: any) {
      console.error('分析エラー詳細:', error)
      if (error.message?.includes('Gemini APIキー')) {
        toast.error('Gemini APIキーが設定されていません')
      } else if (error.message?.includes('API')) {
        toast.error('API呼び出しエラーが発生しました')
      } else {
        toast.error(`分析エラー: ${error.message || '不明なエラー'}`)
      }
    } finally {
      setIsAnalyzing(null)
    }
  }

  const handleExportBackup = () => {
    try {
      KnowledgeBaseBackupService.exportToFile()
      toast.success('全知識ベースをバックアップしました')
    } catch (error) {
      console.error('バックアップエラー:', error)
      toast.error('バックアップに失敗しました')
    }
  }

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      await KnowledgeBaseBackupService.importFromFile(file)
      await loadAllKnowledgeBases()
      toast.success('知識ベースを復元しました')
      e.target.value = ''
    } catch (error) {
      console.error('インポートエラー:', error)
      toast.error('復元に失敗しました')
    } finally {
      setIsImporting(false)
    }
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'guideline': return DocumentTextIcon
      case 'application': return DocumentDuplicateIcon
      case 'example': return AcademicCapIcon
      case 'website': return GlobeAltIcon
      default: return DocumentTextIcon
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'guideline': return '募集要項'
      case 'application': return '申請書'
      case 'example': return '採択事例'
      case 'website': return 'Webサイト'
      default: return 'その他'
    }
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSubsidyStats = (subsidyId: string) => {
    const base = knowledgeBases[subsidyId]
    if (!base) return { documents: 0, lastUpdate: null, hasAnalysis: false }
    
    return {
      documents: base.documents.length,
      lastUpdate: base.updatedAt,
      hasAnalysis: !!base.analysis
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                📚 知識ベース統合管理
              </h1>
              <p className="text-sm text-gray-600">全補助金の知識ベースを1ページで完結管理</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/test-print"
                className="text-sm text-gray-600 hover:text-brand-600"
              >
                印刷テスト
              </Link>
              <Link
                href="/dashboard"
                className="text-brand-600 hover:text-brand-700 underline"
              >
                ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 全体バックアップ・復元 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔄 全体バックアップ・復元
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={handleExportBackup}
                className="flex items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 transition-colors"
              >
                <ArrowDownTrayIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">全体バックアップ</div>
                  <div className="text-sm text-gray-600">全補助金の知識ベースをJSONで保存</div>
                </div>
              </button>
              
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  disabled={isImporting}
                  className="hidden"
                  id="global-backup-import"
                />
                <label
                  htmlFor="global-backup-import"
                  className="flex items-center justify-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 transition-colors cursor-pointer"
                >
                  <ArrowUpTrayIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {isImporting ? '復元中...' : '全体復元'}
                    </div>
                    <div className="text-sm text-gray-600">バックアップファイルから復元</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* 補助金別知識ベース管理 */}
          <div className="space-y-6">
            {SUBSIDY_TYPES.map((subsidy) => {
              const stats = getSubsidyStats(subsidy.id)
              const isExpanded = expandedSections[subsidy.id]
              const base = knowledgeBases[subsidy.id]

              return (
                <div key={subsidy.id} className={`bg-white rounded-lg shadow-sm border border-gray-200 ${subsidy.color}`}>
                  {/* ヘッダー部分 */}
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => toggleSection(subsidy.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          {isExpanded ? (
                            <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                          ) : (
                            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {subsidy.name}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${subsidy.badgeColor}`}>
                              {stats.documents}件
                            </span>
                            {stats.hasAnalysis && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                分析済み
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{subsidy.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {stats.lastUpdate && (
                          <div className="text-right text-sm text-gray-500">
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              最終更新
                            </div>
                            <div>{formatDate(stats.lastUpdate)}</div>
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          <Link
                            href={`/apply/${subsidy.id}`}
                            className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            テンプレート申請
                          </Link>
                          <Link
                            href={`/apply/knowledge-based/${subsidy.id}`}
                            className="px-3 py-1 text-xs bg-brand-600 text-white rounded hover:bg-brand-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            知識ベース申請
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 展開コンテンツ */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-6">
                      {/* アップロードエリア */}
                      <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* ファイルアップロード */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">📎 ファイルアップロード</h4>
                          
                          <div className="mb-3">
                            <select
                              value={uploadType}
                              onChange={(e) => setUploadType(e.target.value as any)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                            >
                              <option value="guideline">募集要項</option>
                              <option value="application">申請書テンプレート</option>
                              <option value="example">採択事例</option>
                              <option value="other">その他</option>
                            </select>
                          </div>

                          <input
                            type="file"
                            accept=".pdf,.docx,.txt,.xlsx,.xls"
                            onChange={(e) => handleFileUpload(e, subsidy.id)}
                            disabled={isUploading}
                            className="hidden"
                            id={`file-upload-${subsidy.id}`}
                          />
                          <label
                            htmlFor={`file-upload-${subsidy.id}`}
                            className="w-full cursor-pointer flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 text-sm"
                            onClick={() => setCurrentSubsidyId(subsidy.id)}
                          >
                            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                            {isUploading && currentSubsidyId === subsidy.id ? 'アップロード中...' : 'ファイルを選択'}
                          </label>
                        </div>

                        {/* URL追加 */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">🌐 Webサイト追加</h4>
                          
                          <input
                            type="url"
                            value={uploadUrl}
                            onChange={(e) => setUploadUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md mb-3"
                          />
                          
                          <button
                            onClick={() => handleUrlAdd(subsidy.id)}
                            disabled={isUploading || !uploadUrl}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm flex items-center justify-center"
                          >
                            <LinkIcon className="h-4 w-4 mr-2" />
                            URLを追加
                          </button>
                        </div>
                      </div>

                      {/* ドキュメント一覧 */}
                      {base && base.documents.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-4">
                            📄 登録済みドキュメント ({base.documents.length}件)
                          </h4>
                          
                          <div className="space-y-2">
                            {base.documents.map((doc) => {
                              const Icon = getDocumentIcon(doc.type)
                              return (
                                <div
                                  key={doc.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center space-x-3">
                                    <Icon className="h-5 w-5 text-gray-600" />
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <p className="font-medium text-gray-900">{doc.name}</p>
                                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                                          {getDocumentTypeLabel(doc.type)}
                                        </span>
                                      </div>
                                      <div className="flex items-center text-xs text-gray-500 mt-1">
                                        <CalendarIcon className="h-3 w-3 mr-1" />
                                        {formatDate(doc.uploadedAt)}
                                        {doc.url && (
                                          <>
                                            <span className="mx-2">•</span>
                                            <a 
                                              href={doc.url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:text-blue-700 underline"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {doc.url}
                                            </a>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={() => handleRemoveDocument(subsidy.id, doc.id)}
                                    className="text-red-600 hover:text-red-700 p-2"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* 分析セクション */}
                      {base && base.documents.length > 0 && (
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-green-900">🤖 AI分析</h4>
                            <p className="text-sm text-green-700">
                              登録された全資料を総合的に分析
                            </p>
                          </div>
                          
                          <button
                            onClick={() => handleAnalyze(subsidy.id)}
                            disabled={isAnalyzing === subsidy.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center text-sm"
                          >
                            <SparklesIcon className="h-4 w-4 mr-2" />
                            {isAnalyzing === subsidy.id ? '分析中...' : '分析実行'}
                          </button>
                        </div>
                      )}

                      {/* 分析結果表示 */}
                      {base?.analysis && (
                        <div className="mt-4 bg-blue-50 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <h5 className="font-medium text-blue-900 mb-2">分析完了</h5>
                              
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="font-medium text-blue-800 mb-1">必須要件:</p>
                                  <ul className="list-disc list-inside text-blue-700">
                                    {base.analysis.requirements.slice(0, 3).map((req, i) => (
                                      <li key={i}>{req}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div>
                                  <p className="font-medium text-blue-800 mb-1">重要キーワード:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {base.analysis.keywords.slice(0, 6).map((keyword, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                                      >
                                        {keyword}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 空の状態 */}
                      {(!base || base.documents.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <FolderOpenIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>まだドキュメントが登録されていません</p>
                          <p className="text-sm mt-1">募集要項や採択事例をアップロードしましょう</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 注意事項 */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="h-6 w-6 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">📢 データの永続化について</h3>
                <div className="text-sm text-amber-800 space-y-1">
                  <p>• 現在はローカル開発環境のため、データはブラウザに保存されます</p>
                  <p>• 定期的に「全体バックアップ」でJSONファイルを保存してください</p>
                  <p>• 本番環境移行時は、バックアップファイルで全データを移行可能です</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}