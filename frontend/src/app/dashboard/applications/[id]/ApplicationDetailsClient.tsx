'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { generateStyledApplicationPDF, openHTMLPreview, downloadHTMLFile } from '@/utils/pdfGenerator'
import { ApplicationEditForm } from '@/components/application/ApplicationEditForm'

interface Application {
  id: string
  title: string
  status: string
  progress?: number
  errorMessage?: string
  inputData?: any
  generatedContent?: any
  estimatedScore?: number
  wordCount?: number
  createdAt: string
  updatedAt: string
  subsidyProgram: {
    name: string
    category: string
    maxAmount: number
  }
}

interface ApplicationDetailsClientProps {
  applicationId: string
}

export function ApplicationDetailsClient({ applicationId }: ApplicationDetailsClientProps) {
  const [application, setApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const router = useRouter()

  const loadApplication = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      
      // デモ環境での充実したサンプルデータ
      if (!token || applicationId === 'demo-1') {
        const demoApplication = {
          id: applicationId,
          title: 'DX推進による業務効率化プロジェクト',
          status: 'COMPLETED',
          progress: 100,
          estimatedScore: 87.5,
          wordCount: 3420,
          createdAt: '2024-06-15T10:00:00Z',
          updatedAt: '2024-06-15T14:30:00Z',
          subsidyProgram: {
            name: '小規模事業者持続化補助金',
            category: '一般型',
            maxAmount: 5000000
          },
          generatedContent: {
            sections: {
              companyOverview: `デモ株式会社は2018年に設立された、地域密着型のITソリューション企業です。従業員15名の小規模企業でありながら、独自の技術力と地域特性を活かしたサービス提供により、安定した成長を続けています。

【事業実績】
- 年間売上：8,500万円（2023年度）
- 主要顧客：地域中小企業50社以上
- リピート率：92%

【企業の強み】
1. 地域企業のニーズを深く理解した提案力
2. 導入後の手厚いサポート体制
3. 最新技術と実用性を両立したソリューション設計
4. 価格競争力のあるサービス提供

当社は地域のデジタル化推進において重要な役割を担っており、本補助事業の実施により更なる価値提供が可能となります。`,
              projectDescription: `本事業は、当社の業務プロセスにおけるデジタル変革（DX）を推進し、業務効率化と競争力強化を図ることを目的としています。

【事業の概要】
既存の手作業による業務プロセスを自動化システムに置き換え、クラウドベースの顧客管理システムの導入により、営業効率の向上と顧客満足度の向上を実現します。

【具体的な実施内容】
1. 顧客管理システム（CRM）の導入・カスタマイズ
2. プロジェクト管理ツールの統合
3. 業務自動化ツールの開発・導入
4. 社内コミュニケーション基盤の整備
5. データ分析・レポート機能の構築

【技術的特徴】
- クラウドベースのスケーラブルなアーキテクチャ
- AI機能を活用したデータ分析
- モバイル対応によるリモートワーク支援
- セキュリティを重視した設計

これらの施策により、業務効率の大幅な改善と新たな付加価値の創出を目指します。`,
              marketAnalysis: `【市場環境分析】
国内の中小企業向けDX支援市場は年率15%の成長を続けており、特にコロナ禍以降、デジタル化への需要が急拡大しています。

【ターゲット市場】
- 従業員数20-100名の中小企業
- 年商1億円-10億円規模の企業
- 製造業、卸売業、サービス業が中心

【市場機会】
- 政府のDX推進政策による後押し
- 人手不足解消のニーズ拡大
- リモートワーク対応の必要性

【競合分析】
大手ITベンダーは大企業向けに特化しており、中小企業向けのきめ細かいサービスを提供する企業は限定的です。当社の地域密着型アプローチは大きな競争優位性となります。

【市場規模】
- 対象市場規模：約500億円（地域内）
- 当社のターゲット市場：約50億円
- 3年後の目標シェア：2%（売上目標：10億円）`,
              businessPlan: `【事業戦略】
本事業では段階的なアプローチにより、リスクを最小化しながら確実な成果を実現します。

【第1段階】基盤整備期（1-3ヶ月）
- 現状業務の詳細分析
- システム要件の明確化
- 導入計画の策定
- チーム体制の構築

【第2段階】システム構築期（4-8ヶ月）
- CRMシステムの導入・カスタマイズ
- 既存データの移行・整備
- 自動化ツールの開発
- ユーザーテストの実施

【第3段階】本格運用期（9-12ヶ月）
- 全社での本格運用開始
- 従業員研修の実施
- 運用状況の監視・改善
- 効果測定と最適化

【実施体制】
- プロジェクトマネージャー：1名
- システムエンジニア：3名
- UI/UXデザイナー：1名
- 品質管理担当：1名

【品質保証】
- 段階的な導入によるリスク管理
- 定期的な進捗確認とレビュー
- 外部専門家による技術監査`,
              expectedOutcomes: `【定量的効果】
1. 営業活動効率化：作業時間30%削減
2. 顧客対応速度：平均レスポンス時間50%短縮
3. 売上向上：年間15%増加（約1,275万円）
4. コスト削減：運営費10%削減（約320万円）
5. 生産性向上：1人当たり生産性25%向上

【定性的効果】
1. 従業員満足度の向上
2. 顧客満足度の改善
3. 新規事業創出の基盤構築
4. 企業ブランド価値の向上
5. 地域経済への貢献

【社会的インパクト】
- 地域中小企業のDXモデルケース創出
- 雇用創出：新規採用3-5名予定
- 地域IT人材の育成・定着促進
- 地方創生への貢献

【波及効果】
本事業の成功により、地域の他企業への展開モデルとして活用し、地域全体のDX推進に貢献します。`,
              implementation: `【実施スケジュール】

■第1段階：分析・設計期（1-3ヶ月）
- Week 1-2：現状業務プロセス分析
- Week 3-4：要件定義・システム設計
- Week 5-8：詳細設計・開発計画策定
- Week 9-12：プロトタイプ開発・検証

■第2段階：開発・構築期（4-8ヶ月）
- Month 4-5：基盤システム構築
- Month 6-7：カスタマイズ開発・機能実装
- Month 8：統合テスト・調整

■第3段階：導入・運用期（9-12ヶ月）
- Month 9：パイロット導入
- Month 10：全社展開・研修実施
- Month 11-12：運用定着・効果測定

【マイルストーン】
- 3ヶ月目：システム設計完了
- 6ヶ月目：基本機能開発完了
- 9ヶ月目：パイロット運用開始
- 12ヶ月目：全社運用・効果検証完了

【リスク管理】
- 定期的な進捗レビュー（月1回）
- 技術的課題の早期発見・対処
- 変更管理プロセスの確立`
            }
          },
          inputData: {
            companyName: 'デモ株式会社',
            industry: 'ITサービス',
            employeeCount: '15名',
            businessDescription: 'クラウドソリューションの提供とDXコンサルティング事業'
          }
        }
        setApplication(demoApplication)
        setIsLoading(false)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/applications/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('申請書が見つかりません')
          router.push('/dashboard')
          return
        }
        throw new Error('申請書の取得に失敗しました')
      }

      const result = await response.json()
      const applicationData = result.application || result.data || result
      setApplication({
        ...applicationData,
        subsidyProgram: {
          name: applicationData.subsidyType || '補助金',
          category: 'IT・デジタル',
          maxAmount: 5000000
        },
        generatedContent: {
          sections: {
            projectDescription: applicationData.projectDescription || '',
            businessPlan: applicationData.businessPlan || '',
            marketAnalysis: applicationData.budget || '',
            expectedOutcomes: applicationData.expectedResults || '',
            implementation: applicationData.schedule || ''
          }
        },
        inputData: applicationData.companyInfo || {}
      })
    } catch (error) {
      console.error('Application load error:', error)
      toast.error('申請書の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [applicationId, router])

  const checkGenerationStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/${applicationId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setApplication(prev => prev ? { ...prev, ...result.data } : null)
        
        // 生成完了または失敗の場合は詳細データを再取得
        if (result.data.status === 'GENERATED' || result.data.status === 'FAILED') {
          loadApplication()
        }
      }
    } catch (error) {
      console.error('Status check error:', error)
    }
  }, [applicationId, loadApplication])

  useEffect(() => {
    loadApplication()
    
    // 生成中の場合は定期的にステータスをチェック
    let intervalId: NodeJS.Timeout | null = null
    
    if (application?.status === 'GENERATING') {
      intervalId = setInterval(checkGenerationStatus, 2000)
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [applicationId, application?.status, loadApplication, checkGenerationStatus])

  // 申請書更新
  const handleUpdate = async (updatedData: any) => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.error('認証が必要です')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      })

      if (!response.ok) {
        throw new Error('申請書の更新に失敗しました')
      }

      const result = await response.json()
      setApplication(result.data)
      setIsEditing(false)
      toast.success('申請書を更新しました')
    } catch (error) {
      console.error('Update error:', error)
      toast.error('申請書の更新に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  // PDF/プレビュー生成（デモ対応版）
  const handlePDFGeneration = async () => {
    if (!application) return

    setIsGeneratingPDF(true)
    try {
      const token = localStorage.getItem('token')

      // デモ環境の場合はクライアントサイドPDF生成を使用
      if (!token || applicationId === 'demo-1') {
        // デモ用のApplicationDataに変換
        const pdfData = {
          id: application.id,
          title: application.title,
          subsidyProgramName: application.subsidyProgram.name,
          subsidyProgramCategory: application.subsidyProgram.category,
          projectDescription: application.generatedContent?.sections?.projectDescription || '',
          purpose: application.generatedContent?.sections?.companyOverview || '',
          targetMarket: application.generatedContent?.sections?.marketAnalysis || '',
          expectedEffects: application.generatedContent?.sections?.expectedOutcomes || '',
          budget: 3500000,
          timeline: application.generatedContent?.sections?.implementation || '',
          challenges: '従来システムの老朽化と効率性の課題、リモートワーク対応の遅れ',
          innovation: 'AI機能搭載の統合DXプラットフォーム、地域特化型カスタマイズ機能',
          companyName: application.inputData?.companyName || 'デモ株式会社',
          representativeName: '田中 太郎',
          createdAt: application.createdAt,
          status: application.status
        }

        await generateStyledApplicationPDF(pdfData)
        toast.success('📄 デモPDFを生成しました！実際の申請書として使用可能な形式です。')
        return
      }

      // 本番環境の場合のAPI呼び出し
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pdf/generate/${application.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `application_${application.id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('PDFをダウンロードしました')
      } else {
        const result = await response.json()
        if (result.fallbackToHTML) {
          const previewUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pdf/preview/${application.id}`
          window.open(previewUrl, '_blank')
          toast('HTMLプレビューを表示しました。ブラウザの印刷機能でPDF保存可能です。', { icon: 'ℹ️' })
        } else {
          throw new Error(result.error?.message || 'PDF生成に失敗しました')
        }
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('PDF生成に失敗しました')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // HTMLプレビュー表示
  const handleHTMLPreview = async () => {
    if (!application) return

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.error('認証が必要です')
        return
      }

      // HTMLプレビューを新しいタブで開く
      const previewUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pdf/preview/${application.id}?token=${token}`
      window.open(previewUrl, '_blank')
      toast.success('HTMLプレビューを表示しました')
    } catch (error) {
      console.error('HTML preview error:', error)
      toast.error('HTMLプレビューの表示に失敗しました')
    }
  }

  // 申請書完成
  const handleComplete = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.error('認証が必要です')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/${applicationId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('申請書の完成処理に失敗しました')
      }

      const result = await response.json()
      setApplication(result.data)
      toast.success('申請書を完成しました')
    } catch (error) {
      console.error('Complete error:', error)
      toast.error('申請書の完成処理に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: '下書き', color: 'bg-gray-100 text-gray-800', icon: ClockIcon },
      GENERATING: { label: 'AI生成中', color: 'bg-blue-100 text-blue-800', icon: SparklesIcon },
      GENERATED: { label: '生成完了', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      FAILED: { label: '生成失敗', color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon },
      EDITING: { label: '編集中', color: 'bg-yellow-100 text-yellow-800', icon: PencilIcon },
      COMPLETED: { label: '完成', color: 'bg-purple-100 text-purple-800', icon: CheckCircleIcon },
    }

    const config = statusConfig[status] || statusConfig.DRAFT
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">申請書を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">申請書が見つかりません</p>
          <Link href="/dashboard" className="btn-primary mt-4">
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-6 w-6 text-brand-600" />
                <h1 className="text-lg font-semibold text-gray-900">
                  申請書詳細
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(application.status)}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        {/* 申請書情報 */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">
              {application.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {application.subsidyProgram.name} ({application.subsidyProgram.category})
            </p>
          </div>
          
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">作成日時</h3>
                <p className="text-gray-900">{formatDate(application.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">最終更新</h3>
                <p className="text-gray-900">{formatDate(application.updatedAt)}</p>
              </div>
              {application.estimatedScore && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">推定スコア</h3>
                  <p className="text-gray-900 font-semibold">
                    {application.estimatedScore.toFixed(1)}点 / 100点
                  </p>
                </div>
              )}
              {application.wordCount && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">文字数</h3>
                  <p className="text-gray-900">{application.wordCount.toLocaleString()}文字</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 生成中の場合の進捗表示 */}
        {application.status === 'GENERATING' && (
          <div className="card mb-8">
            <div className="card-body text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-brand-100 rounded-full p-4">
                  <SparklesIcon className="h-12 w-12 text-brand-600 animate-pulse" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                🤖 AI申請書生成中
              </h3>
              
              <p className="text-gray-600 mb-6">
                GPT-4o × Claude 3.5 Sonnetが<br />
                世界最高レベルの申請書を作成しています...
              </p>
              
              {application.progress !== undefined && (
                <div className="progress-bar mb-4">
                  <div 
                    className="progress-fill"
                    style={{ width: `${application.progress}%` }}
                  />
                </div>
              )}
              
              <p className="text-sm text-gray-500">
                {(application.progress || 0) < 25 && '📊 企業情報を分析しています...'}
                {(application.progress || 0) >= 25 && (application.progress || 0) < 75 && '✍️ AI申請書を生成しています...'}
                {(application.progress || 0) >= 75 && '✨ 最終調整を行っています...'}
              </p>
            </div>
          </div>
        )}

        {/* エラーの場合 */}
        {application.status === 'FAILED' && (
          <div className="card mb-8 border-red-200">
            <div className="card-body">
              <div className="flex items-center text-red-600 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
                <h3 className="text-lg font-semibold">生成に失敗しました</h3>
              </div>
              {application.errorMessage && (
                <p className="text-gray-600 mb-4">{application.errorMessage}</p>
              )}
              <button
                onClick={loadApplication}
                className="btn-primary"
              >
                再試行
              </button>
            </div>
          </div>
        )}

        {/* 申請書内容表示 */}
        {(application.status === 'GENERATED' || application.status === 'DRAFT') && application.generatedContent && (
          <div className="space-y-6">
            {/* アクションバー */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">申請書内容</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    内容を確認し、必要に応じて編集やPDF出力ができます
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {!isEditing && (
                    <>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        編集
                      </button>
                      
                      <button 
                        onClick={handlePDFGeneration}
                        disabled={isGeneratingPDF}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        {isGeneratingPDF ? 'PDF生成中...' : 'PDF出力'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 申請書内容 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {isEditing ? (
                <div className="p-6">
                  <ApplicationEditForm
                    application={application}
                    onSave={handleUpdate}
                    onCancel={() => setIsEditing(false)}
                    isSaving={isSaving}
                  />
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {Object.entries(application.generatedContent.sections || {}).map(([sectionKey, content]) => (
                    <div key={sectionKey} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                          {getSectionTitle(sectionKey)}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {(content as string).length} 文字
                        </span>
                      </div>
                      <div className="prose max-w-none">
                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4">
                          {content as string}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex justify-between pt-6">
          <Link href="/dashboard" className="btn-outline">
            ダッシュボードに戻る
          </Link>
          
          {(application.status === 'GENERATED' || application.status === 'DRAFT') && !isEditing && (
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsEditing(true)}
                className="btn-outline"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                編集
              </button>
              <button 
                onClick={handleComplete}
                disabled={isSaving}
                className="btn-primary"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                {isSaving ? '処理中...' : '申請書を完成する'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function getSectionTitle(sectionKey: string): string {
  const sectionTitles: Record<string, string> = {
    companyOverview: '企業概要',
    projectDescription: 'プロジェクト概要',
    marketAnalysis: '予算計画',
    businessPlan: '事業計画',
    expectedOutcomes: '期待される成果',
    budgetPlan: '予算計画',
    implementation: '実施スケジュール',
    conclusion: 'まとめ',
  }
  
  return sectionTitles[sectionKey] || sectionKey
}