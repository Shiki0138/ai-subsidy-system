'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  DocumentTextIcon, 
  CheckIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline'

const editSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(100),
  sections: z.object({
    companyOverview: z.string().optional(),
    projectDescription: z.string().optional(),
    marketAnalysis: z.string().optional(),
    businessPlan: z.string().optional(),
    expectedOutcomes: z.string().optional(),
    budgetPlan: z.string().optional(),
    implementation: z.string().optional(),
    conclusion: z.string().optional(),
  }),
})

type EditFormData = z.infer<typeof editSchema>

interface ApplicationEditFormProps {
  application: any
  onSave: (data: any) => void
  onCancel: () => void
  isSaving: boolean
}

export function ApplicationEditForm({ 
  application, 
  onSave, 
  onCancel, 
  isSaving 
}: ApplicationEditFormProps) {
  const [activeSection, setActiveSection] = useState<string>('projectDescription')
  const [wordCounts, setWordCounts] = useState<{ [key: string]: number }>({})

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: application.title,
      sections: application.generatedContent?.sections || {},
    },
  })

  const watchedSections = watch('sections')

  // 文字数カウント
  useEffect(() => {
    const counts: { [key: string]: number } = {}
    Object.entries(watchedSections).forEach(([key, value]) => {
      counts[key] = (value as string)?.length || 0
    })
    setWordCounts(counts)
  }, [watchedSections])

  const onSubmit = (data: EditFormData) => {
    onSave({
      title: data.title,
      generatedContent: {
        ...application.generatedContent,
        sections: data.sections,
      },
      status: 'EDITING',
    })
  }

  const sections = [
    { key: 'companyOverview', title: '企業概要', recommended: 300 },
    { key: 'projectDescription', title: '事業内容', recommended: 500 },
    { key: 'marketAnalysis', title: '市場分析', recommended: 400 },
    { key: 'businessPlan', title: '事業計画', recommended: 600 },
    { key: 'expectedOutcomes', title: '期待される効果', recommended: 300 },
    { key: 'budgetPlan', title: '予算計画', recommended: 400 },
    { key: 'implementation', title: '実施体制', recommended: 300 },
    { key: 'conclusion', title: 'まとめ', recommended: 200 },
  ]

  const getWordCountColor = (count: number, recommended: number) => {
    const ratio = count / recommended
    if (ratio < 0.5) return 'text-red-600'
    if (ratio < 0.8) return 'text-yellow-600'
    if (ratio > 1.5) return 'text-orange-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">申請書編集</h3>
          {isDirty && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              未保存
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-outline btn-sm"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            キャンセル
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            className="btn-primary btn-sm"
          >
            <CheckIcon className="h-4 w-4 mr-1" />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* タイトル編集 */}
        <div>
          <label htmlFor="title" className="form-label">
            申請書タイトル *
          </label>
          <input
            {...register('title')}
            type="text"
            className={`form-input ${errors.title ? 'border-error-500' : ''}`}
            placeholder="事業名を入力してください"
          />
          {errors.title && (
            <p className="form-error">{errors.title.message}</p>
          )}
        </div>

        {/* セクション選択タブ */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === section.key
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {section.title}
                <span className={`ml-2 text-xs ${
                  getWordCountColor(wordCounts[section.key] || 0, section.recommended)
                }`}>
                  ({wordCounts[section.key] || 0})
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* セクション編集エリア */}
        {sections.map((section) => (
          <div
            key={section.key}
            className={activeSection === section.key ? 'block' : 'hidden'}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium text-gray-900">
                {section.title}
              </h4>
              <div className="text-sm text-gray-500">
                推奨文字数: {section.recommended}文字 / 
                <span className={getWordCountColor(wordCounts[section.key] || 0, section.recommended)}>
                  現在: {wordCounts[section.key] || 0}文字
                </span>
              </div>
            </div>
            
            <textarea
              {...register(`sections.${section.key}` as keyof EditFormData)}
              rows={12}
              className="form-textarea resize-none"
              placeholder={`${section.title}の内容を入力してください...`}
            />
            
            {/* リアルタイム文字数表示 */}
            <div className="mt-2 flex items-center justify-between text-sm">
              <div className="text-gray-500">
                Ctrl/Cmd + S で保存できます
              </div>
              <div className={`font-medium ${
                getWordCountColor(wordCounts[section.key] || 0, section.recommended)
              }`}>
                {wordCounts[section.key] || 0} / {section.recommended} 文字
              </div>
            </div>
          </div>
        ))}

        {/* 編集ヒント */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-5 w-5 text-blue-400 mt-0.5" />
            </div>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">💡 編集のヒント</p>
              <ul className="space-y-1 text-xs">
                <li>• 推奨文字数の80-120%の範囲で記述すると評価が高くなります</li>
                <li>• 具体的な数値や事例を含めると説得力が増します</li>
                <li>• 各セクションの内容に一貫性を持たせましょう</li>
                <li>• 変更は自動的に保存されます</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}