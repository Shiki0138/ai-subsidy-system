'use client'

import { useState, useRef } from 'react'
import { 
  DocumentTextIcon, 
  DocumentArrowUpIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  readDocxContent,
  readPdfGuidelines,
  parseGuidelines,
  fillDocxTemplate,
  generateFieldPrompt,
  GYOMU_KAIZEN_FIELDS,
  GuidelineData
} from '@/utils/document-processor'

interface GuidelineBasedFormProps {
  subsidyType?: string
}

export function GuidelineBasedForm({ subsidyType }: GuidelineBasedFormProps) {
  const [guideline, setGuideline] = useState<GuidelineData | null>(null)
  const [templateContent, setTemplateContent] = useState<string>('')
  const [templateBuffer, setTemplateBuffer] = useState<Buffer | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentField, setCurrentField] = useState<string>('')
  
  const guidelineInputRef = useRef<HTMLInputElement>(null)
  const templateInputRef = useRef<HTMLInputElement>(null)

  // 募集要項をアップロード
  const handleGuidelineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    try {
      let text = ''
      
      if (file.type === 'application/pdf') {
        text = await readPdfGuidelines(file)
      } else if (file.name.endsWith('.docx')) {
        text = await readDocxContent(file)
      } else {
        throw new Error('PDFまたはDOCXファイルをアップロードしてください')
      }

      const parsedGuideline = parseGuidelines(text)
      setGuideline(parsedGuideline)
      
      toast.success('募集要項を読み込みました')
    } catch (error) {
      console.error('募集要項読み込みエラー:', error)
      toast.error('募集要項の読み込みに失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  // 申請書テンプレートをアップロード
  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.name.endsWith('.docx')) {
      toast.error('DOCXファイルをアップロードしてください')
      return
    }

    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      setTemplateBuffer(buffer)
      
      const content = await readDocxContent(file)
      setTemplateContent(content)
      
      // フィールドを抽出
      const fields: Record<string, string> = {}
      Object.keys(GYOMU_KAIZEN_FIELDS).forEach(fieldName => {
        fields[GYOMU_KAIZEN_FIELDS[fieldName]] = ''
      })
      setFormData(fields)
      
      toast.success('申請書テンプレートを読み込みました')
    } catch (error) {
      console.error('テンプレート読み込みエラー:', error)
      toast.error('テンプレートの読み込みに失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  // Gemini APIで要項に基づいた文章を生成
  const generateFieldContent = async (fieldName: string) => {
    if (!guideline) {
      toast.error('先に募集要項をアップロードしてください')
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      toast.error('Gemini APIキーが設定されていません')
      return
    }

    setCurrentField(fieldName)
    setIsProcessing(true)

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

      const prompt = generateFieldPrompt(fieldName, guideline, {
        companyName: formData.companyName || '株式会社サンプル',
        industry: formData.industry || '製造業',
        employeeCount: formData.employeeCount || '50名',
        // 他の企業情報...
      })

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      const fieldKey = GYOMU_KAIZEN_FIELDS[fieldName]
      setFormData(prev => ({
        ...prev,
        [fieldKey]: text
      }))
      
      toast.success(`${fieldName}を生成しました`)
    } catch (error) {
      console.error('文章生成エラー:', error)
      toast.error('文章の生成に失敗しました')
    } finally {
      setIsProcessing(false)
      setCurrentField('')
    }
  }

  // すべてのフィールドを自動生成
  const generateAllFields = async () => {
    if (!guideline) {
      toast.error('先に募集要項をアップロードしてください')
      return
    }

    const fields = Object.keys(GYOMU_KAIZEN_FIELDS)
    
    for (const fieldName of fields) {
      await generateFieldContent(fieldName)
      // API制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    toast.success('すべてのフィールドを生成しました')
  }

  // 申請書をダウンロード
  const downloadApplication = async () => {
    if (!templateBuffer) {
      toast.error('申請書テンプレートをアップロードしてください')
      return
    }

    setIsProcessing(true)
    try {
      // プレースホルダーを実際の値に置換
      const data: Record<string, string> = {}
      Object.entries(GYOMU_KAIZEN_FIELDS).forEach(([fieldName, fieldKey]) => {
        data[fieldName] = formData[fieldKey] || ''
      })

      const filledBuffer = await fillDocxTemplate(templateBuffer, data)
      
      // ダウンロード
      const blob = new Blob([filledBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `業務改善助成金申請書_${new Date().toISOString().split('T')[0]}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('申請書をダウンロードしました')
    } catch (error) {
      console.error('ダウンロードエラー:', error)
      toast.error('申請書のダウンロードに失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          募集要項ベース申請書作成
        </h2>
        
        {/* ステップ1: 募集要項アップロード */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-brand-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
              1
            </span>
            募集要項をアップロード
          </h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              募集要項のPDFまたはDOCXファイルをアップロードしてください
            </p>
            <input
              ref={guidelineInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleGuidelineUpload}
              className="hidden"
            />
            <button
              onClick={() => guidelineInputRef.current?.click()}
              disabled={isProcessing}
              className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50"
            >
              ファイルを選択
            </button>
            
            {guideline && (
              <div className="mt-4 text-left bg-green-50 p-4 rounded-md">
                <CheckCircleIcon className="h-5 w-5 text-green-600 inline mr-2" />
                <span className="text-green-800">
                  {guideline.subsidyName} の募集要項を読み込みました
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ステップ2: 申請書テンプレートアップロード */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-brand-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
              2
            </span>
            申請書テンプレートをアップロード
          </h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              申請書のDOCXファイルをアップロードしてください
            </p>
            <input
              ref={templateInputRef}
              type="file"
              accept=".docx"
              onChange={handleTemplateUpload}
              className="hidden"
            />
            <button
              onClick={() => templateInputRef.current?.click()}
              disabled={isProcessing}
              className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50"
            >
              ファイルを選択
            </button>
            
            {templateContent && (
              <div className="mt-4 text-left bg-green-50 p-4 rounded-md">
                <CheckCircleIcon className="h-5 w-5 text-green-600 inline mr-2" />
                <span className="text-green-800">
                  申請書テンプレートを読み込みました
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ステップ3: 内容生成 */}
        {guideline && templateContent && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-brand-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
                3
              </span>
              申請内容を生成
            </h3>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <button
                onClick={generateAllFields}
                disabled={isProcessing}
                className="w-full px-6 py-3 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center mb-6"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                {isProcessing ? 'AI生成中...' : 'すべての項目をAI生成'}
              </button>
              
              {/* フィールドごとの生成ボタン */}
              <div className="space-y-4">
                {Object.keys(GYOMU_KAIZEN_FIELDS).map(fieldName => {
                  const fieldKey = GYOMU_KAIZEN_FIELDS[fieldName]
                  const value = formData[fieldKey] || ''
                  
                  return (
                    <div key={fieldName} className="border border-gray-200 rounded-md p-4 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-medium text-gray-900">
                          {fieldName}
                        </label>
                        <button
                          onClick={() => generateFieldContent(fieldName)}
                          disabled={isProcessing}
                          className="px-3 py-1 bg-brand-100 text-brand-700 rounded-md hover:bg-brand-200 disabled:opacity-50 flex items-center"
                        >
                          <SparklesIcon className="h-4 w-4 mr-1" />
                          {currentField === fieldName ? '生成中...' : 'AI生成'}
                        </button>
                      </div>
                      <textarea
                        value={value}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          [fieldKey]: e.target.value
                        }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ダウンロードボタン */}
        {Object.values(formData).some(v => v) && (
          <div className="text-center">
            <button
              onClick={downloadApplication}
              disabled={isProcessing}
              className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center mx-auto"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              {isProcessing ? 'ダウンロード準備中...' : '申請書をダウンロード'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}