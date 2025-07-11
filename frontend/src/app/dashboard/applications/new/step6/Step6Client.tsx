'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  EyeIcon,
  ClockIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline'

interface AIQuestion {
  id: string
  category: string
  question: string
  placeholder: string
  required: boolean
  helpText?: string
  examples?: string[]
  maxLength?: number
  type: 'text' | 'textarea' | 'number' | 'select'
  options?: string[]
}

interface ApplicationDraft {
  projectTitle: string
  projectOverview: string
  objectives: string
  implementation: string
  timeline: string
  budget: string
  expectedResults: string
  marketAnalysis: string
  riskMitigation: string
  sustainability: string
}

export function Step6Client() {
  const router = useRouter()
  const [allPreviousResults, setAllPreviousResults] = useState<any>({})
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(true)
  const [isGeneratingApplication, setIsGeneratingApplication] = useState(false)
  const [applicationDraft, setApplicationDraft] = useState<ApplicationDraft | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [aiProgress, setAiProgress] = useState(0)

  useEffect(() => {
    // 全ステップの結果を取得
    const step1Data = sessionStorage.getItem('step1-results')
    const step2Data = sessionStorage.getItem('step2-results')
    const step3Data = sessionStorage.getItem('step3-results')
    const step4Data = sessionStorage.getItem('step4-results')
    const step5Data = sessionStorage.getItem('step5-results')
    
    const allResults = {
      step1: step1Data ? JSON.parse(step1Data) : null,
      step2: step2Data ? JSON.parse(step2Data) : null,
      step3: step3Data ? JSON.parse(step3Data) : null,
      step4: step4Data ? JSON.parse(step4Data) : null,
      step5: step5Data ? JSON.parse(step5Data) : null,
    }
    
    setAllPreviousResults(allResults)
    generateAIQuestions(allResults)
  }, [])

  const generateAIQuestions = async (results: any) => {
    setIsGeneratingQuestions(true)
    try {
      // 実際の実装では、過去のステップの情報を基にAIが質問を生成
      // ここではモック実装
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const mockQuestions: AIQuestion[] = [
        {
          id: 'project_title',
          category: 'プロジェクト基本情報',
          question: 'あなたの事業プロジェクトのタイトルを教えてください',
          placeholder: '例: ECサイト構築による販路拡大事業',
          required: true,
          helpText: '申請書の表紙に記載される重要なタイトルです。事業内容が一目でわかるよう具体的に記載してください。',
          type: 'text',
          maxLength: 50
        },
        {
          id: 'business_challenge',
          category: '現状課題',
          question: '現在あなたの会社が抱えている具体的な課題は何ですか？',
          placeholder: '売上減少、業務効率の悪さ、新規顧客獲得の困難など',
          required: true,
          helpText: '補助金で解決したい課題を具体的に記載してください。数値があると説得力が増します。',
          examples: [
            'コロナ禍により店舗売上が30%減少している',
            '手作業による業務が多く、1日2時間の無駄な作業が発生している',
            '新規顧客開拓が進まず、既存顧客への依存度が高い'
          ],
          type: 'textarea',
          maxLength: 300
        },
        {
          id: 'solution_approach',
          category: '解決アプローチ',
          question: 'その課題をどのような方法で解決しようと考えていますか？',
          placeholder: 'ITツール導入、新サービス開発、販路拡大など',
          required: true,
          helpText: '課題解決のための具体的な手法や取組み内容を記載してください。',
          examples: [
            'ECサイトを構築してオンライン販売チャネルを確立',
            'AIを活用した在庫管理システムを導入して業務効率化',
            'デジタルマーケティングを導入して新規顧客を獲得'
          ],
          type: 'textarea',
          maxLength: 400
        },
        {
          id: 'target_customers',
          category: 'ターゲット・市場',
          question: 'この事業のターゲット顧客や対象市場について教えてください',
          placeholder: '個人消費者、中小企業、特定業界など',
          required: true,
          helpText: 'ターゲットを明確にすることで事業の実現可能性を示すことができます。',
          type: 'textarea',
          maxLength: 250
        },
        {
          id: 'competitive_advantage',
          category: '競争優位性',
          question: '競合他社と比較して、あなたの会社や事業の強みは何ですか？',
          placeholder: '技術力、顧客との関係性、地域特性など',
          required: true,
          helpText: '他社との差別化ポイントを具体的に記載してください。',
          type: 'textarea',
          maxLength: 300
        },
        {
          id: 'implementation_timeline',
          category: '実施計画',
          question: 'この事業をどのようなスケジュールで進める予定ですか？',
          placeholder: '第1段階（1-3ヶ月）、第2段階（4-6ヶ月）など',
          required: true,
          helpText: '具体的な時期と実施内容を段階的に記載してください。',
          examples: [
            '第1段階（1-2ヶ月）：システム選定・設計',
            '第2段階（3-4ヶ月）：開発・テスト',
            '第3段階（5-6ヶ月）：運用開始・効果測定'
          ],
          type: 'textarea',
          maxLength: 400
        },
        {
          id: 'budget_breakdown',
          category: '予算計画',
          question: '補助金をどのような用途に使用する予定ですか？',
          placeholder: 'システム開発費、設備費、広告宣伝費など',
          required: true,
          helpText: '補助対象経費について具体的な使途と金額を記載してください。',
          examples: [
            'ウェブサイト構築費: 30万円',
            '広告宣伝費: 15万円',
            '研修費: 5万円'
          ],
          type: 'textarea',
          maxLength: 300
        },
        {
          id: 'success_metrics',
          category: '効果測定',
          question: 'この事業の成功をどのような指標で測定しますか？',
          placeholder: '売上増加率、顧客数、業務効率改善など',
          required: true,
          helpText: '数値目標を設定することで事業の効果を明確に示すことができます。',
          examples: [
            '売上20%向上（年間）',
            '新規顧客100件獲得',
            '業務時間30%短縮'
          ],
          type: 'textarea',
          maxLength: 250
        },
        {
          id: 'long_term_vision',
          category: '将来展望',
          question: 'この事業を通じて、3年後にはどのような状態を目指していますか？',
          placeholder: '事業拡大、新サービス展開、市場シェア拡大など',
          required: false,
          helpText: '長期的なビジョンを示すことで事業の持続可能性をアピールできます。',
          type: 'textarea',
          maxLength: 300
        }
      ]

      setAiQuestions(mockQuestions)
      
    } catch (error) {
      console.error('Failed to generate AI questions:', error)
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < aiQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const generateApplication = async () => {
    setIsGeneratingApplication(true)
    setAiProgress(0)
    
    try {
      // 進捗シミュレーション
      const progressSteps = [
        { progress: 20, message: '企業情報を分析中...' },
        { progress: 40, message: '採択事例と比較中...' },
        { progress: 60, message: '回答内容を最適化中...' },
        { progress: 80, message: '申請書を生成中...' },
        { progress: 100, message: '申請書生成完了' }
      ]

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        setAiProgress(step.progress)
      }

      // 実際の実装では、回答内容と過去のステップの情報を基にAIが申請書を生成
      const mockDraft: ApplicationDraft = {
        projectTitle: answers.project_title || 'ECサイト構築による販路拡大事業',
        projectOverview: `${allPreviousResults.step2?.companyInfo?.companyName || 'デモ株式会社'}は、${answers.business_challenge || 'コロナ禍による売上減少'}という課題を抱えており、${answers.solution_approach || 'ECサイト構築による新たな販売チャネルの確立'}を通じて事業の持続的発展を図る事業です。`,
        objectives: `1. ${answers.business_challenge || '既存の課題'}の解決\n2. ${answers.target_customers || 'ターゲット顧客'}への新たなアプローチ\n3. ${answers.success_metrics || '売上向上'}の実現`,
        implementation: answers.implementation_timeline || '第1段階（1-2ヶ月）：システム設計・開発\n第2段階（3-4ヶ月）：テスト・調整\n第3段階（5-6ヶ月）：本格運用・効果測定',
        timeline: '事業実施期間：交付決定日から2024年12月31日まで（約6ヶ月間）\n実績報告提出：2025年1月10日',
        budget: answers.budget_breakdown || 'ウェブサイト構築費：350,000円\n広告宣伝費：100,000円\n研修費：50,000円\n合計：500,000円（補助額：333,000円）',
        expectedResults: answers.success_metrics || '売上20%向上、新規顧客100件獲得、業務効率30%改善',
        marketAnalysis: `${allPreviousResults.step2?.companyInfo?.industry || 'IT業界'}における市場環境を分析すると、デジタル化の進展により${answers.target_customers || 'ターゲット市場'}のニーズが高まっています。当社の${answers.competitive_advantage || '技術力と顧客基盤'}を活かすことで、十分な市場競争力を発揮できると考えます。`,
        riskMitigation: '技術的リスク：事前検証により回避\n市場リスク：段階的導入によりリスク最小化\nスケジュールリスク：余裕を持った計画設定',
        sustainability: answers.long_term_vision || 'この事業により構築したプラットフォームを基に、3年後には事業規模の倍増と新サービス展開を目指します。'
      }

      setApplicationDraft(mockDraft)
      
    } catch (error) {
      console.error('Failed to generate application:', error)
    } finally {
      setIsGeneratingApplication(false)
    }
  }

  const getCompletionRate = () => {
    const requiredQuestions = aiQuestions.filter(q => q.required)
    const answeredRequired = requiredQuestions.filter(q => answers[q.id]?.trim())
    return requiredQuestions.length > 0 ? (answeredRequired.length / requiredQuestions.length) * 100 : 0
  }

  const canGenerateApplication = () => {
    const requiredQuestions = aiQuestions.filter(q => q.required)
    return requiredQuestions.every(q => answers[q.id]?.trim())
  }

  const handleNext = () => {
    if (applicationDraft) {
      // ステップ6の結果を保存
      const results = {
        aiQuestions,
        answers,
        applicationDraft,
        timestamp: new Date().toISOString()
      }
      sessionStorage.setItem('step6-results', JSON.stringify(results))
      router.push('/dashboard/applications/new/step7')
    }
  }

  const handleBack = () => {
    router.push('/dashboard/applications/new/step5')
  }

  if (isGeneratingQuestions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CpuChipIcon className="h-12 w-12 text-brand-600 animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">AI質問を生成中...</h2>
          <p className="text-gray-600">
            これまでの情報を基に、最適な質問を作成しています
          </p>
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
              <button onClick={handleBack} className="text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                申請書作成フロー
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              ステップ6: AI申請書作成支援
            </h2>
            <div className="text-sm text-gray-600">
              6 / 7
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-brand-600 h-2 rounded-full" style={{ width: '85.7%' }}></div>
          </div>
        </div>

        {/* AI生成申請書プレビュー */}
        {applicationDraft && (
          <div className="card mb-8">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  🤖 AI生成申請書
                </h3>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="btn-outline flex items-center"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  {showPreview ? '概要表示' : '詳細プレビュー'}
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">申請書生成完了</span>
                </div>
                <p className="text-sm text-green-800">
                  あなたの回答を基に、採択率の高い申請書を自動生成しました。
                  内容を確認し、必要に応じて修正してください。
                </p>
              </div>

              {showPreview && (
                <div className="space-y-6 border border-gray-200 rounded-lg p-6 bg-white">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">事業名</h4>
                    <p className="text-gray-700">{applicationDraft.projectTitle}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">事業概要</h4>
                    <p className="text-gray-700 leading-relaxed">{applicationDraft.projectOverview}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">事業目標</h4>
                    <pre className="text-gray-700 whitespace-pre-line">{applicationDraft.objectives}</pre>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">実施内容・スケジュール</h4>
                    <pre className="text-gray-700 whitespace-pre-line">{applicationDraft.implementation}</pre>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">予算計画</h4>
                    <pre className="text-gray-700 whitespace-pre-line">{applicationDraft.budget}</pre>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">期待される効果</h4>
                    <p className="text-gray-700">{applicationDraft.expectedResults}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">市場分析</h4>
                    <p className="text-gray-700 leading-relaxed">{applicationDraft.marketAnalysis}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">リスク対策</h4>
                    <pre className="text-gray-700 whitespace-pre-line">{applicationDraft.riskMitigation}</pre>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">持続可能性</h4>
                    <p className="text-gray-700 leading-relaxed">{applicationDraft.sustainability}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 申請書生成中 */}
        {isGeneratingApplication && (
          <div className="card mb-8">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🤖 申請書を生成中...
              </h3>
              <div className="space-y-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-brand-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${aiProgress}%` }}
                  ></div>
                </div>
                <div className="flex items-center space-x-3">
                  <SparklesIcon className="h-5 w-5 text-brand-600 animate-spin" />
                  <span className="text-sm text-gray-700">
                    {aiProgress < 20 && '企業情報を分析中...'}
                    {aiProgress >= 20 && aiProgress < 40 && '採択事例と比較中...'}
                    {aiProgress >= 40 && aiProgress < 60 && '回答内容を最適化中...'}
                    {aiProgress >= 60 && aiProgress < 80 && '申請書を生成中...'}
                    {aiProgress >= 80 && '申請書生成完了'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 質問セクション */}
        {!applicationDraft && (
          <>
            {/* 進捗状況 */}
            <div className="card mb-8">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    💬 AI質問回答 ({currentQuestionIndex + 1} / {aiQuestions.length})
                  </h3>
                  <div className="text-sm text-gray-600">
                    完了率: {Math.round(getCompletionRate())}%
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${getCompletionRate()}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  AIが生成した質問に答えることで、最適な申請書を自動作成します。
                </p>
              </div>
            </div>

            {/* 現在の質問 */}
            {aiQuestions.length > 0 && (
              <div className="card mb-8">
                <div className="card-body">
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="bg-brand-100 text-brand-600 px-3 py-1 rounded-full text-sm font-medium">
                        {aiQuestions[currentQuestionIndex].category}
                      </span>
                      {aiQuestions[currentQuestionIndex].required && (
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                          必須
                        </span>
                      )}
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">
                      {aiQuestions[currentQuestionIndex].question}
                    </h4>
                    {aiQuestions[currentQuestionIndex].helpText && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start space-x-2">
                          <LightBulbIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-800">
                            {aiQuestions[currentQuestionIndex].helpText}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {aiQuestions[currentQuestionIndex].type === 'textarea' ? (
                      <textarea
                        value={answers[aiQuestions[currentQuestionIndex].id] || ''}
                        onChange={(e) => handleAnswerChange(aiQuestions[currentQuestionIndex].id, e.target.value)}
                        placeholder={aiQuestions[currentQuestionIndex].placeholder}
                        className="form-textarea w-full h-32"
                        maxLength={aiQuestions[currentQuestionIndex].maxLength}
                      />
                    ) : (
                      <input
                        type="text"
                        value={answers[aiQuestions[currentQuestionIndex].id] || ''}
                        onChange={(e) => handleAnswerChange(aiQuestions[currentQuestionIndex].id, e.target.value)}
                        placeholder={aiQuestions[currentQuestionIndex].placeholder}
                        className="form-input w-full"
                        maxLength={aiQuestions[currentQuestionIndex].maxLength}
                      />
                    )}

                    {aiQuestions[currentQuestionIndex].maxLength && (
                      <div className="text-right text-xs text-gray-500">
                        {(answers[aiQuestions[currentQuestionIndex].id] || '').length} / {aiQuestions[currentQuestionIndex].maxLength}
                      </div>
                    )}

                    {aiQuestions[currentQuestionIndex].examples && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">💡 記載例</h5>
                        <div className="space-y-2">
                          {aiQuestions[currentQuestionIndex].examples!.map((example, index) => (
                            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <p className="text-sm text-gray-700">{example}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 質問ナビゲーション */}
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIndex === 0}
                      className={`btn-outline flex items-center ${
                        currentQuestionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-2" />
                      前の質問
                    </button>

                    <div className="flex space-x-3">
                      {currentQuestionIndex < aiQuestions.length - 1 ? (
                        <button
                          onClick={handleNextQuestion}
                          className="btn-primary flex items-center"
                        >
                          次の質問
                          <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </button>
                      ) : (
                        <button
                          onClick={generateApplication}
                          disabled={!canGenerateApplication() || isGeneratingApplication}
                          className={`btn flex items-center ${
                            canGenerateApplication() && !isGeneratingApplication
                              ? 'btn-primary'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          申請書を生成
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 質問一覧 */}
            <div className="card mb-8">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📋 質問一覧
                </h3>
                <div className="space-y-3">
                  {aiQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        index === currentQuestionIndex
                          ? 'border-brand-500 bg-brand-50'
                          : answers[question.id]
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {answers[question.id] ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className={`w-5 h-5 rounded-full border-2 ${
                              index === currentQuestionIndex ? 'border-brand-600' : 'border-gray-300'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{question.question}</h4>
                            {question.required && (
                              <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                                必須
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{question.category}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ナビゲーション */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="btn-outline flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            前のステップ
          </button>

          <button
            onClick={handleNext}
            disabled={!applicationDraft}
            className={`btn flex items-center ${
              applicationDraft
                ? 'btn-primary'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            次のステップへ
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </button>
        </div>

        {/* 進捗状況 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {applicationDraft ? (
              <span className="text-green-600">
                ✅ 申請書の生成が完了しました
              </span>
            ) : canGenerateApplication() ? (
              <span className="text-blue-600">
                📝 すべての必須質問に回答済み - 申請書を生成できます
              </span>
            ) : (
              <span className="text-orange-600">
                📝 必須質問に回答してください ({Math.round(getCompletionRate())}%完了)
              </span>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}