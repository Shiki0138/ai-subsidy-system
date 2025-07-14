'use client'

import { useState, useEffect } from 'react'
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
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { KnowledgeBaseService } from '@/services/knowledge-base-service'
import { SubsidyKnowledgeBase, DocumentUploadRequest } from '@/types/knowledge-base'
import { KnowledgeBaseBackupService } from '@/utils/knowledge-base-backup'

interface KnowledgeBaseManagerProps {
  subsidyId: string
  subsidyName: string
  onAnalysisComplete?: (analysis: any) => void
}

export function KnowledgeBaseManager({ 
  subsidyId, 
  subsidyName,
  onAnalysisComplete 
}: KnowledgeBaseManagerProps) {
  const [knowledgeBase, setKnowledgeBase] = useState<SubsidyKnowledgeBase | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadType, setUploadType] = useState<DocumentUploadRequest['type']>('guideline')
  const [uploadUrl, setUploadUrl] = useState('')
  const [service] = useState(() => new KnowledgeBaseService())
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    loadKnowledgeBase()
  }, [subsidyId])

  const loadKnowledgeBase = async () => {
    const base = await service.getKnowledgeBase(subsidyId)
    setKnowledgeBase(base)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const request: DocumentUploadRequest = {
        type: uploadType,
        file: file,
        name: file.name
      }

      const updatedBase = await service.addDocument(subsidyId, subsidyName, request)
      setKnowledgeBase(updatedBase)
      toast.success('ドキュメントをアップロードしました')
      
      // ファイル入力をリセット
      e.target.value = ''
    } catch (error) {
      console.error('アップロードエラー:', error)
      toast.error('アップロードに失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlAdd = async () => {
    if (!uploadUrl) {
      toast.error('URLを入力してください')
      return
    }

    setIsUploading(true)
    try {
      const request: DocumentUploadRequest = {
        type: 'website',
        url: uploadUrl,
        name: new URL(uploadUrl).hostname
      }

      const updatedBase = await service.addDocument(subsidyId, subsidyName, request)
      setKnowledgeBase(updatedBase)
      toast.success('Webサイトを追加しました')
      setUploadUrl('')
    } catch (error) {
      console.error('URL追加エラー:', error)
      toast.error('URLの追加に失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveDocument = async (documentId: string) => {
    try {
      await service.removeDocument(subsidyId, documentId)
      await loadKnowledgeBase()
      toast.success('ドキュメントを削除しました')
    } catch (error) {
      console.error('削除エラー:', error)
      toast.error('削除に失敗しました')
    }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const analysis = await service.analyzeKnowledgeBase(subsidyId)
      if (analysis) {
        toast.success('知識ベースの分析が完了しました')
        if (onAnalysisComplete) {
          onAnalysisComplete(analysis)
        }
        await loadKnowledgeBase()
      }
    } catch (error) {
      console.error('分析エラー:', error)
      toast.error('分析に失敗しました')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleExportBackup = () => {
    try {
      KnowledgeBaseBackupService.exportToFile()
      toast.success('知識ベースをバックアップしました')
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
      await loadKnowledgeBase()
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
      case 'guideline':
        return DocumentTextIcon
      case 'application':
        return DocumentDuplicateIcon
      case 'example':
        return AcademicCapIcon
      case 'website':
        return GlobeAltIcon
      default:
        return DocumentTextIcon
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'guideline':
        return '募集要項'
      case 'application':
        return '申請書'
      case 'example':
        return '採択事例'
      case 'website':
        return 'Webサイト'
      default:
        return 'その他'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              知識ベース管理
            </h3>
            <p className="text-sm text-gray-600">
              募集要項、申請書、採択事例など、参考となる資料をアップロードして、
              AIがより精度の高い申請書を生成できるようにします。
            </p>
          </div>
          
          {/* バックアップ・復元ボタン */}
          <div className="flex space-x-2">
            <button
              onClick={handleExportBackup}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              バックアップ
            </button>
            
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              disabled={isImporting}
              className="hidden"
              id="backup-import"
            />
            <label
              htmlFor="backup-import"
              className="cursor-pointer px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center text-sm"
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
              {isImporting ? '復元中...' : '復元'}
            </label>
          </div>
        </div>
      </div>

      {/* アップロードセクション */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* ファイルアップロード */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">ファイルアップロード</h4>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ドキュメントタイプ
            </label>
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="guideline">募集要項</option>
              <option value="application">申請書テンプレート</option>
              <option value="example">採択事例</option>
              <option value="other">その他</option>
            </select>
          </div>

          <div className="text-center">
            <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept=".pdf,.docx,.txt,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50"
            >
              {isUploading ? 'アップロード中...' : 'ファイルを選択'}
            </label>
            <p className="text-xs text-gray-500 mt-2">
              PDF, DOCX, XLSX, XLS, TXTファイルに対応
            </p>
          </div>
        </div>

        {/* URL追加 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Webサイト追加</h4>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              参考URL
            </label>
            <input
              type="url"
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="text-center">
            <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <button
              onClick={handleUrlAdd}
              disabled={isUploading || !uploadUrl}
              className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50"
            >
              {isUploading ? '追加中...' : 'URLを追加'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              公的機関のサイトのみ対応
            </p>
          </div>
        </div>
      </div>

      {/* 登録済みドキュメント */}
      {knowledgeBase && knowledgeBase.documents.length > 0 && (
        <div className="mb-8">
          <h4 className="font-semibold text-gray-900 mb-4">
            登録済みドキュメント ({knowledgeBase.documents.length}件)
          </h4>
          
          <div className="space-y-2">
            {knowledgeBase.documents.map((doc) => {
              const Icon = getDocumentIcon(doc.type)
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {getDocumentTypeLabel(doc.type)} • 
                        {new Date(doc.uploadedAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveDocument(doc.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 分析セクション */}
      {knowledgeBase && knowledgeBase.documents.length > 0 && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-gray-900">AI分析</h4>
              <p className="text-sm text-gray-600">
                登録された全ての資料を総合的に分析します
              </p>
            </div>
            
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              {isAnalyzing ? '分析中...' : '知識ベースを分析'}
            </button>
          </div>

          {/* 分析結果 */}
          {knowledgeBase.analysis && (
            <div className="bg-green-50 rounded-lg p-4 mt-4">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-semibold text-green-900 mb-2">
                    分析完了
                  </h5>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-green-800">必須要件:</p>
                      <ul className="list-disc list-inside text-green-700 mt-1">
                        {knowledgeBase.analysis.requirements.slice(0, 3).map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <p className="font-medium text-green-800">重要キーワード:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {knowledgeBase.analysis.keywords.map((keyword, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium text-green-800">予算規模:</p>
                      <p className="text-green-700">
                        {knowledgeBase.analysis.budget.min.toLocaleString()}円 〜 
                        {knowledgeBase.analysis.budget.max.toLocaleString()}円
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 空の状態 */}
      {(!knowledgeBase || knowledgeBase.documents.length === 0) && (
        <div className="text-center py-8">
          <FolderOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            まだドキュメントが登録されていません
          </p>
          <p className="text-sm text-gray-500 mt-1">
            募集要項や採択事例をアップロードして、知識ベースを構築しましょう
          </p>
        </div>
      )}
    </div>
  )
}