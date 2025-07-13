'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  CheckIcon, 
  XMarkIcon,
  DocumentTextIcon,
  PencilIcon 
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { AITextAssistant } from '@/components/apply/AITextAssistant'

interface EditApplicationClientProps {
  applicationId: string
}

interface ApplicationData {
  id: string
  title: string
  subsidyProgram: {
    name: string
    category: string
  }
  projectDescription: string
  purpose: string
  targetMarket: string
  expectedEffects: string
  timeline: string
  challenges: string
  innovation: string
  status: string
}

export function EditApplicationClient({ applicationId }: EditApplicationClientProps) {
  const router = useRouter()
  const [application, setApplication] = useState<ApplicationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editedData, setEditedData] = useState<Partial<ApplicationData>>({})

  useEffect(() => {
    loadApplication()
  }, [applicationId])

  const loadApplication = async () => {
    try {
      // デモ用のモックデータ
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockApplication: ApplicationData = {
        id: applicationId,
        title: 'DX推進による業務効率化プロジェクト',
        subsidyProgram: {
          name: '小規模事業者持続化補助金',
          category: '一般型'
        },
        projectDescription: `本事業は、デジタル技術を活用した業務プロセス改革により、当社の持続的な成長と競争力強化を目指すものです。

【事業の背景】
現在、当社では多くの業務が手作業に依存しており、効率性や正確性の面で課題を抱えています。特に顧客管理、在庫管理、売上分析等の業務において、デジタル化による抜本的な改善が急務となっています。

【実施内容】
1. 顧客管理システムの導入
2. 在庫管理の自動化
3. データ分析ツールの活用
4. スタッフのデジタルスキル向上

これらの取り組みにより、業務効率を30%向上させ、売上の20%増加を目指します。`,
        purpose: '業務プロセスのデジタル化により生産性を向上し、持続的な事業成長を実現するため',
        targetMarket: '地域の中小企業及び個人顧客を対象としたBtoB・BtoC複合型サービス市場',
        expectedEffects: '業務効率30%向上、売上20%増加、顧客満足度向上、新規顧客開拓の促進',
        timeline: `【第1段階】システム導入期（1-3ヶ月）
- 顧客管理システム導入
- スタッフ研修実施

【第2段階】運用改善期（4-6ヶ月）
- 在庫管理自動化
- データ分析基盤構築

【第3段階】効果測定期（7-12ヶ月）
- 効果測定と改善
- 追加機能導入`,
        challenges: '手作業による非効率性、データの分散管理、分析機能の不足',
        innovation: 'AI技術を活用した予測分析機能により、従来にない精度での需要予測を実現',
        status: 'EDITING'
      }
      
      setApplication(mockApplication)
      setEditedData(mockApplication)
    } catch (error) {
      toast.error('申請書の読み込みに失敗しました')
      console.error('Load application error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldUpdate = (field: keyof ApplicationData, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!application) return

    setIsSaving(true)
    try {
      // デモ用の保存処理
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setApplication(prev => prev ? { ...prev, ...editedData } : null)
      toast.success('申請書を保存しました')
      
      // 詳細ページに戻る
      router.push(`/dashboard/applications/${applicationId}`)
    } catch (error) {
      toast.error('保存に失敗しました')
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/applications/${applicationId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600">申請書を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">申請書が見つかりません</h1>
          <p className="text-gray-600 mb-6">指定された申請書が存在しないか、削除されている可能性があります。</p>
          <Link
            href="/dashboard/applications"
            className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
          >
            申請書一覧に戻る
          </Link>
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
              <Link
                href={`/dashboard/applications/${applicationId}`}
                className="flex items-center text-gray-600 hover:text-brand-600 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                詳細に戻る
              </Link>
              
              <div className="flex items-center space-x-2">
                <PencilIcon className="h-6 w-6 text-brand-600" />
                <h1 className="text-lg font-semibold text-gray-900">申請書編集</h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                キャンセル
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    保存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">{application.title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {application.subsidyProgram.name} ({application.subsidyProgram.category})
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* 事業概要 */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                事業概要
              </label>
              <div className="relative">
                <textarea
                  value={editedData.projectDescription || ''}
                  onChange={(e) => handleFieldUpdate('projectDescription', e.target.value)}
                  rows={12}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="事業の概要を入力してください..."
                />
                <div className="mt-2">
                  <AITextAssistant
                    currentValue={editedData.projectDescription || ''}
                    onUpdate={(value) => handleFieldUpdate('projectDescription', value)}
                    fieldLabel="事業概要"
                    subsidyType={application.subsidyProgram.name}
                  />
                </div>
              </div>
            </div>

            {/* 事業の目的 */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                事業の目的・背景
              </label>
              <div className="relative">
                <textarea
                  value={editedData.purpose || ''}
                  onChange={(e) => handleFieldUpdate('purpose', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="事業の目的・背景を入力してください..."
                />
                <div className="mt-2">
                  <AITextAssistant
                    currentValue={editedData.purpose || ''}
                    onUpdate={(value) => handleFieldUpdate('purpose', value)}
                    fieldLabel="事業の目的・背景"
                    subsidyType={application.subsidyProgram.name}
                  />
                </div>
              </div>
            </div>

            {/* ターゲット市場 */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                ターゲット市場
              </label>
              <div className="relative">
                <textarea
                  value={editedData.targetMarket || ''}
                  onChange={(e) => handleFieldUpdate('targetMarket', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="ターゲット市場を入力してください..."
                />
                <div className="mt-2">
                  <AITextAssistant
                    currentValue={editedData.targetMarket || ''}
                    onUpdate={(value) => handleFieldUpdate('targetMarket', value)}
                    fieldLabel="ターゲット市場"
                    subsidyType={application.subsidyProgram.name}
                  />
                </div>
              </div>
            </div>

            {/* 期待される効果 */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                期待される効果
              </label>
              <div className="relative">
                <textarea
                  value={editedData.expectedEffects || ''}
                  onChange={(e) => handleFieldUpdate('expectedEffects', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="期待される効果を入力してください..."
                />
                <div className="mt-2">
                  <AITextAssistant
                    currentValue={editedData.expectedEffects || ''}
                    onUpdate={(value) => handleFieldUpdate('expectedEffects', value)}
                    fieldLabel="期待される効果"
                    subsidyType={application.subsidyProgram.name}
                  />
                </div>
              </div>
            </div>

            {/* 実施スケジュール */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                実施スケジュール
              </label>
              <div className="relative">
                <textarea
                  value={editedData.timeline || ''}
                  onChange={(e) => handleFieldUpdate('timeline', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="実施スケジュールを入力してください..."
                />
                <div className="mt-2">
                  <AITextAssistant
                    currentValue={editedData.timeline || ''}
                    onUpdate={(value) => handleFieldUpdate('timeline', value)}
                    fieldLabel="実施スケジュール"
                    subsidyType={application.subsidyProgram.name}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存して戻る'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}