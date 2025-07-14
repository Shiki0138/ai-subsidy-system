'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  SparklesIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { KnowledgeBaseManager } from './KnowledgeBaseManager'
import { KnowledgeBaseService } from '@/services/knowledge-base-service'
import { AnalysisResult } from '@/types/knowledge-base'
import { SUBSIDY_TEMPLATES } from '@/config/subsidy-templates'

interface KnowledgeBasedApplicationFormProps {
  subsidyId: string
  subsidyName: string
}

export function KnowledgeBasedApplicationForm({
  subsidyId,
  subsidyName
}: KnowledgeBasedApplicationFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'knowledge' | 'form'>('knowledge')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentField, setCurrentField] = useState('')
  const [service] = useState(() => new KnowledgeBaseService())

  // テンプレートを取得
  const template = SUBSIDY_TEMPLATES[subsidyId] || null

  useEffect(() => {
    // 初期フォームデータを設定
    if (template) {
      const initialData: Record<string, string> = {}
      template.sections.forEach(section => {
        section.fields.forEach(field => {
          initialData[field.id] = ''
        })
      })
      setFormData(initialData)
    }
  }, [template])

  const handleAnalysisComplete = (analysisResult: AnalysisResult) => {
    setAnalysis(analysisResult)
    toast.success('分析が完了しました。申請書作成タブで活用できます。')
  }

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const generateFieldContent = async (fieldId: string, fieldLabel: string) => {
    setCurrentField(fieldId)
    setIsGenerating(true)

    try {
      const knowledgeBase = await service.getKnowledgeBase(subsidyId)
      if (!knowledgeBase || knowledgeBase.documents.length === 0) {
        toast.error('先に知識ベースにドキュメントを登録してください')
        return
      }

      const content = await service.generateApplicationContent(
        subsidyId,
        fieldLabel,
        {
          companyName: formData.company_name || '企業名',
          industry: formData.industry || '業種',
          employeeCount: formData.employees || '従業員数',
          // その他の企業情報
        }
      )

      handleFieldChange(fieldId, content)
      toast.success(`${fieldLabel}を生成しました`)
    } catch (error) {
      console.error('生成エラー:', error)
      toast.error('生成に失敗しました')
    } finally {
      setIsGenerating(false)
      setCurrentField('')
    }
  }

  const generateAllFields = async () => {
    if (!template) return

    const knowledgeBase = await service.getKnowledgeBase(subsidyId)
    if (!knowledgeBase || knowledgeBase.documents.length === 0) {
      toast.error('先に知識ベースにドキュメントを登録してください')
      return
    }

    for (const section of template.sections) {
      for (const field of section.fields) {
        if (field.aiSuggestion) {
          await generateFieldContent(field.id, field.label)
          // API制限を考慮
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    toast.success('すべてのフィールドを生成しました')
  }

  const downloadApplication = () => {
    // 申請書をダウンロード
    let content = `${subsidyName} 申請書\n\n`
    content += `作成日: ${new Date().toLocaleDateString('ja-JP')}\n`
    content += `${'='.repeat(50)}\n\n`

    if (analysis) {
      content += `【知識ベース分析結果】\n`
      content += `要約: ${analysis.summary}\n`
      content += `推奨アプローチ: ${analysis.recommendedApproach}\n\n`
    }

    if (template) {
      template.sections.forEach(section => {
        content += `【${section.title}】\n`
        section.fields.forEach(field => {
          const value = formData[field.id] || '（未入力）'
          content += `${field.label}:\n${value}\n\n`
        })
      })
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${subsidyName}_申請書_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('申請書をダウンロードしました')
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">このタイプの補助金はまだ対応していません</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-brand-600 hover:text-brand-700 underline"
        >
          戻る
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* タブ */}
      <div className="bg-white border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'knowledge'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            知識ベース構築
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'form'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            申請書作成
          </button>
        </nav>
      </div>

      {/* コンテンツ */}
      {activeTab === 'knowledge' ? (
        <KnowledgeBaseManager
          subsidyId={subsidyId}
          subsidyName={subsidyName}
          onAnalysisComplete={handleAnalysisComplete}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 分析結果表示 */}
          {analysis && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">
                    知識ベース分析結果を活用中
                  </h4>
                  <p className="text-sm text-blue-800">{analysis.summary}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <button
              onClick={generateAllFields}
              disabled={isGenerating}
              className="w-full px-6 py-3 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              {isGenerating ? '生成中...' : '知識ベースから一括生成'}
            </button>
          </div>

          {/* フォームフィールド */}
          <div className="space-y-8">
            {template.sections.map(section => (
              <div key={section.id}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {section.title}
                </h3>
                
                <div className="space-y-4">
                  {section.fields.map(field => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      <div className="relative">
                        {field.type === 'textarea' ? (
                          <textarea
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            rows={field.rows || 4}
                            maxLength={field.maxLength}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                          >
                            <option value="">選択してください</option>
                            {field.options?.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            maxLength={field.maxLength}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                          />
                        )}
                        
                        {field.aiSuggestion && (
                          <button
                            onClick={() => generateFieldContent(field.id, field.label)}
                            disabled={isGenerating && currentField === field.id}
                            className="absolute right-2 top-2 text-brand-600 hover:text-brand-700"
                          >
                            <SparklesIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      
                      {field.maxLength && (
                        <p className="text-xs text-gray-500 mt-1">
                          {(formData[field.id] || '').length}/{field.maxLength}文字
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ダウンロードボタン */}
          <div className="mt-8 text-center">
            <button
              onClick={downloadApplication}
              className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center mx-auto"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              申請書をダウンロード
            </button>
          </div>
        </div>
      )}
    </div>
  )
}