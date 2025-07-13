'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SUBSIDY_TEMPLATES, FormField, FormSection } from '@/config/subsidy-templates'
import { generateApplicationPDF, createApplicationFormHTML, ApplicationFormData } from '@/utils/pdf-template-engine'
import { toast } from 'react-hot-toast'
import { SparklesIcon, DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface TemplateFormClientProps {
  subsidyType: string
}

export function TemplateFormClient({ subsidyType }: TemplateFormClientProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<ApplicationFormData>({
    templateId: '',
    sections: {}
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({})

  // テンプレートを取得
  const template = SUBSIDY_TEMPLATES[subsidyType]
  
  useEffect(() => {
    if (template) {
      setFormData({
        templateId: template.id,
        sections: {}
      })
    }
  }, [template])

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            テンプレートが見つかりません
          </h1>
          <button
            onClick={() => router.push('/apply')}
            className="btn-primary"
          >
            補助金選択に戻る
          </button>
        </div>
      </div>
    )
  }

  const handleFieldChange = (sectionId: string, fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionId]: {
          ...prev.sections[sectionId],
          [fieldId]: value
        }
      }
    }))
  }

  const handleAISuggestion = async (sectionId: string, field: FormField) => {
    try {
      // AI提案を生成（デモ用）
      const suggestion = await generateAISuggestion(field, formData)
      setAiSuggestions(prev => ({
        ...prev,
        [`${sectionId}-${field.id}`]: suggestion
      }))
      
      // フォームに反映
      handleFieldChange(sectionId, field.id, suggestion)
      toast.success('AI提案を生成しました')
    } catch (error) {
      toast.error('AI提案の生成に失敗しました')
    }
  }

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      // バリデーション
      const isValid = validateForm()
      if (!isValid) {
        toast.error('必須項目を入力してください')
        return
      }

      // PDF生成
      const blob = await generateApplicationPDF(formData, template.id)
      
      // ダウンロード
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${template.name}_申請書_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('申請書PDFを生成しました')
    } catch (error) {
      console.error('PDF生成エラー:', error)
      // フォールバック: HTMLプレビュー
      handleHTMLPreview()
    } finally {
      setIsGenerating(false)
    }
  }

  const handleHTMLPreview = () => {
    const element = createApplicationFormHTML(formData, template.id)
    const previewWindow = window.open('', '_blank', 'width=800,height=600')
    
    if (previewWindow) {
      const html = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <title>${template.name} 申請書プレビュー</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { margin: 0; font-family: 'Noto Sans JP', sans-serif; }
            .no-print { position: fixed; top: 10px; right: 10px; }
            @media print { .no-print { display: none; } }
            .print-button { 
              background: #3B82F6; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 6px; 
              cursor: pointer; 
              font-size: 14px; 
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button class="print-button" onclick="window.print()">印刷・PDF保存</button>
          </div>
          ${element.outerHTML}
        </body>
        </html>
      `
      previewWindow.document.write(html)
      previewWindow.document.close()
    }
  }

  const validateForm = (): boolean => {
    for (const section of template.sections) {
      const sectionData = formData.sections[section.id] || {}
      for (const field of section.fields) {
        if (field.required && !sectionData[field.id]) {
          return false
        }
      }
    }
    return true
  }

  const renderField = (section: FormSection, field: FormField) => {
    const value = formData.sections[section.id]?.[field.id] || ''
    const suggestionKey = `${section.id}-${field.id}`

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
              />
              {field.aiSuggestion && (
                <button
                  onClick={() => handleAISuggestion(section.id, field)}
                  className="absolute right-2 top-2 text-brand-600 hover:text-brand-700"
                  title="AI提案"
                >
                  <SparklesIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            {field.maxLength && (
              <p className="text-xs text-gray-500 mt-1">
                {value.length}/{field.maxLength}文字
              </p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <textarea
                value={value}
                onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
                maxLength={field.maxLength}
                rows={field.rows || 4}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
              />
              {field.aiSuggestion && (
                <button
                  onClick={() => handleAISuggestion(section.id, field)}
                  className="absolute right-2 top-2 text-brand-600 hover:text-brand-700"
                  title="AI提案"
                >
                  <SparklesIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            {field.maxLength && (
              <p className="text-xs text-gray-500 mt-1">
                {value.length}/{field.maxLength}文字
              </p>
            )}
          </div>
        )

      case 'number':
        return (
          <div key={field.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
              min={field.validation?.min}
              max={field.validation?.max}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        )

      case 'date':
        return (
          <div key={field.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="">選択してください</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )

      default:
        return null
    }
  }

  const currentSectionData = template.sections[currentSection]
  const isLastSection = currentSection === template.sections.length - 1
  const progress = ((currentSection + 1) / template.sections.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <DocumentTextIcon className="h-6 w-6 text-brand-600" />
              <h1 className="text-lg font-semibold text-gray-900">
                {template.name} 申請書作成
              </h1>
            </div>
            <button
              onClick={handleHTMLPreview}
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              プレビュー
            </button>
          </div>
        </div>
      </header>

      {/* プログレスバー */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              セクション {currentSection + 1} / {template.sections.length}
            </span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* フォーム */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {currentSectionData.title}
          </h2>
          
          {currentSectionData.description && (
            <p className="text-sm text-gray-600 mb-6">
              {currentSectionData.description}
            </p>
          )}

          <div className="space-y-6">
            {currentSectionData.fields.map(field => renderField(currentSectionData, field))}
          </div>

          {/* ナビゲーションボタン */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
              disabled={currentSection === 0}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前のセクション
            </button>

            {isLastSection ? (
              <button
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 flex items-center"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                {isGenerating ? 'PDF生成中...' : '申請書を生成'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentSection(prev => Math.min(template.sections.length - 1, prev + 1))}
                className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
              >
                次のセクション
              </button>
            )}
          </div>
        </div>

        {/* セクションナビゲーション */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-4">セクション一覧</h3>
          <div className="space-y-2">
            {template.sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(index)}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  index === currentSection
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

// AI提案生成（デモ用）
async function generateAISuggestion(field: FormField, formData: ApplicationFormData): Promise<string> {
  // 実際の実装では、AIサービスを呼び出す
  const suggestions: Record<string, string> = {
    'project_title': 'デジタル技術活用による顧客体験向上と業務効率化事業',
    'project_purpose': `【現状の課題】
当社では、顧客管理が紙ベースで行われており、顧客情報の検索に時間がかかり、営業機会の損失が発生しています。また、在庫管理も手作業で行っているため、在庫の過不足が頻繁に発生し、機会損失や廃棄ロスが年間約200万円発生しています。

【補助事業の必要性】
これらの課題を解決するため、統合型の業務管理システムを導入し、顧客管理と在庫管理をデジタル化する必要があります。本補助事業により、業務効率を大幅に改善し、売上向上と経費削減を同時に実現します。`,
    'project_content': `【実施内容】
1. 統合型業務管理システムの導入
   - クラウド型CRMシステムの導入により、顧客情報を一元管理
   - 在庫管理システムとの連携により、リアルタイムでの在庫把握を実現
   
2. モバイル対応による営業力強化
   - タブレット端末を活用し、外出先でも顧客情報にアクセス可能に
   - 商談履歴の即時入力により、情報共有をスムーズに
   
3. データ分析機能の活用
   - 購買履歴の分析により、顧客ニーズを的確に把握
   - 需要予測機能により、適正在庫の維持を実現

4. 従業員研修の実施
   - システム操作研修（全従業員対象、計3回実施）
   - データ活用研修（営業担当対象、月1回実施）`,
    'expected_effects': `【定量的効果】
- 顧客対応時間：現在の平均15分から5分に短縮（66%削減）
- 在庫回転率：年6回から年10回に向上（67%向上）
- 売上高：前年比15%増加（約1,500万円増）
- 廃棄ロス：年間200万円から50万円に削減（75%削減）

【定性的効果】
- 顧客満足度の向上による顧客定着率の改善
- 従業員の業務負担軽減によるモチベーション向上
- データに基づく経営判断の実現`
  }

  // フィールドIDに基づいて適切な提案を返す
  return suggestions[field.id] || `${field.label}に関する具体的な内容を記載してください。`
}