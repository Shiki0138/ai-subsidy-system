'use client'

import React, { useState, useEffect } from 'react'
import { subsidiesApi } from '@/services/api/subsidies'
import { 
  DocumentArrowDownIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface AutoFillFormProps {
  subsidyId: string
  applicationData: any
  onDownload: (pdfBlob: Blob, fileName: string) => void
}

interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'tel'
  value: string
  required: boolean
}

export function AutoFillForm({ subsidyId, applicationData, onDownload }: AutoFillFormProps) {
  const [formData, setFormData] = useState<any>({})
  const [formFields, setFormFields] = useState<any>({ sections: [] })
  const [loading, setLoading] = useState(false)
  const [autoFilled, setAutoFilled] = useState(false)

  useEffect(() => {
    if (applicationData && !autoFilled) {
      generateFormData()
    }
  }, [applicationData])

  const generateFormData = async () => {
    setLoading(true)
    try {
      const result = await subsidiesApi.generateFormData(subsidyId, applicationData)
      setFormData(result.formData)
      setFormFields(result.fields)
      setAutoFilled(true)
      toast.success('申請書データが自動入力されました')
    } catch (error) {
      console.error('Form data generation error:', error)
      toast.error('データの自動入力に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleGeneratePDF = async () => {
    setLoading(true)
    try {
      // PDFフォームに入力データを適用して生成
      const pdfBlob = await generatePDFWithData(subsidyId, formData)
      const fileName = `申請書_${subsidyId}_${Date.now()}.pdf`
      onDownload(pdfBlob, fileName)
      toast.success('申請書PDFを生成しました')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('PDF生成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !autoFilled) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">データを自動入力中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 自動入力完了通知 */}
      {autoFilled && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-green-900">
              申請書データが自動入力されました
            </h4>
            <p className="text-sm text-green-700 mt-1">
              システムが保存されたデータから申請書の各項目を自動的に入力しました。
              内容を確認し、必要に応じて修正してください。
            </p>
          </div>
        </div>
      )}

      {/* フォームセクション */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            申請書フォーム
          </h3>
        </div>

        <div className="p-6 space-y-8">
          {formFields.sections?.map((section: any, sectionIndex: number) => (
            <div key={sectionIndex}>
              <h4 className="text-md font-medium text-gray-900 mb-4">
                {section.title}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields?.map((field: any) => (
                  <div 
                    key={field.id}
                    className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        required={field.required}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required={field.required}
                      >
                        <option value="">選択してください</option>
                        {field.options?.map((option: string) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required={field.required}
                      />
                    )}
                    
                    {/* 自動入力されたフィールドのハイライト */}
                    {formData[field.id] && autoFilled && (
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                        <SparklesIcon className="h-3 w-3 mr-1" />
                        自動入力済み
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              すべての必須項目に入力してください
            </p>
            
            <button
              onClick={handleGeneratePDF}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  生成中...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  入力済みPDFをダウンロード
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ヒント */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          💡 自動入力機能について
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• システムに保存された企業情報や事業計画が自動的に入力されます</li>
          <li>• 自動入力された内容は、申請前に必ず確認・修正してください</li>
          <li>• PDFダウンロード後も、申請書の内容を編集できます</li>
          <li>• 生成されたPDFは、そのまま補助金申請に使用できます</li>
        </ul>
      </div>
    </div>
  )
}

// PDF生成処理（実際にはバックエンドAPIを呼び出す）
async function generatePDFWithData(subsidyId: string, formData: any): Promise<Blob> {
  // 実装では、pdf-libやpuppeteerを使用してPDFフォームに入力
  // ここではモックデータを返す
  return new Blob(['PDF content'], { type: 'application/pdf' })
}