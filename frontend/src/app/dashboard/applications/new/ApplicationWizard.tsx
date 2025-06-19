'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  EnhancedWizard, 
  WizardStep,
  StepProps,
  StepContainer,
  StepSection
} from '@/components/enhanced'
import {
  AIBusinessDescriptionField,
  AIProjectSummaryField,
  AIObjectivesField,
  AIBackgroundField
} from '@/components/ai/AITextAssistant'
import { toast } from 'react-hot-toast'
import {
  BuildingOfficeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CurrencyYenIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

// ステップ1: 補助金選択
function SubsidySelectionStep({ data, onChange, onNext }: StepProps) {
  const subsidyPrograms = [
    {
      id: 'jizokukahojokin',
      name: '小規模事業者持続化補助金',
      category: '一般型',
      description: '小規模事業者の販路開拓・業務効率化を支援',
      maxAmount: 500000,
      subsidyRate: 0.67,
      deadline: '2024年6月30日',
      requirements: ['従業員20人以下', '商工会議所の支援']
    },
    {
      id: 'itdounyu',
      name: 'IT導入補助金',
      category: 'デジタル化基盤導入類型',
      description: 'ITツール導入による業務効率化・DX推進を支援',
      maxAmount: 4500000,
      subsidyRate: 0.75,
      deadline: '2024年7月15日',
      requirements: ['IT導入支援事業者と連携', 'クラウドツール導入']
    },
    {
      id: 'monozukuri',
      name: 'ものづくり補助金',
      category: '一般・グローバル展開型',
      description: '革新的サービス開発・生産プロセス改善を支援',
      maxAmount: 10000000,
      subsidyRate: 0.5,
      deadline: '2024年8月20日',
      requirements: ['3年以上の事業実績', '付加価値向上計画']
    }
  ]

  const selectedProgram = subsidyPrograms.find(p => p.id === data.subsidyProgramId)

  return (
    <StepContainer>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          申請する補助金を選択してください
        </h3>
        
        {subsidyPrograms.map((program) => (
          <div
            key={program.id}
            onClick={() => {
              onChange({ subsidyProgramId: program.id, subsidyProgram: program })
              setTimeout(onNext, 300)
            }}
            className={`
              border rounded-lg p-4 cursor-pointer transition-all
              ${data.subsidyProgramId === program.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{program.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{program.category}</p>
                <p className="text-sm text-gray-600 mt-2">{program.description}</p>
                
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  <span className="text-gray-700">
                    最大 <strong className="text-blue-600">¥{program.maxAmount.toLocaleString()}</strong>
                  </span>
                  <span className="text-gray-700">
                    補助率 <strong className="text-blue-600">{Math.round(program.subsidyRate * 100)}%</strong>
                  </span>
                  <span className="text-gray-700">
                    締切 <strong className="text-red-600">{program.deadline}</strong>
                  </span>
                </div>
                
                <div className="mt-3">
                  <p className="text-xs text-gray-500">主な要件:</p>
                  <ul className="mt-1 space-y-1">
                    {program.requirements.map((req, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-center">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {data.subsidyProgramId === program.id && (
                <div className="ml-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedProgram && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">選択中の補助金</h4>
          <p className="text-sm text-blue-800">{selectedProgram.name}</p>
          <button
            onClick={onNext}
            className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            次へ進む
          </button>
        </div>
      )}
    </StepContainer>
  )
}

// ステップ2: 企業情報
function CompanyInfoStep({ data, onChange, onNext }: StepProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value })
  }

  return (
    <StepContainer>
      <StepSection title="基本情報" required>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              企業名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.companyName || ''}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="株式会社○○"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              業種 <span className="text-red-500">*</span>
            </label>
            <select
              value={data.industry || ''}
              onChange={(e) => handleChange('industry', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">選択してください</option>
              <option value="製造業">製造業</option>
              <option value="情報通信業">情報通信業</option>
              <option value="卸売業">卸売業</option>
              <option value="小売業">小売業</option>
              <option value="サービス業">サービス業</option>
              <option value="建設業">建設業</option>
              <option value="その他">その他</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              従業員数 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={data.employeeCount || ''}
              onChange={(e) => handleChange('employeeCount', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              設立年
            </label>
            <input
              type="number"
              value={data.establishedYear || ''}
              onChange={(e) => handleChange('establishedYear', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="2000"
            />
          </div>
        </div>
      </StepSection>

      <StepSection title="事業内容" required>
        <AIBusinessDescriptionField
          value={data.businessDescription || ''}
          onChange={(value) => handleChange('businessDescription', value)}
          label="事業内容の詳細"
          placeholder="貴社の主要な事業内容、製品・サービス、顧客層などを説明してください"
          maxLength={800}
        />
      </StepSection>

      <StepSection title="企業の強み・課題">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              企業の強み（箇条書き）
            </label>
            <textarea
              value={data.strengths || ''}
              onChange={(e) => handleChange('strengths', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="・独自の技術力&#10;・地域ネットワーク&#10;・顧客満足度の高さ"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              現在の課題（箇条書き）
            </label>
            <textarea
              value={data.challenges || ''}
              onChange={(e) => handleChange('challenges', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="・生産性の向上&#10;・新規顧客の開拓&#10;・デジタル化の遅れ"
            />
          </div>
        </div>
      </StepSection>

      <div className="flex justify-end mt-6">
        <button
          onClick={onNext}
          disabled={!data.companyName || !data.industry || !data.employeeCount || !data.businessDescription}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          次へ進む
        </button>
      </div>
    </StepContainer>
  )
}

// ステップ3: 事業計画
function ProjectPlanStep({ data, onChange, onNext }: StepProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value })
  }

  return (
    <StepContainer>
      <StepSection title="事業計画の基本情報" required>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              事業タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.projectTitle || ''}
              onChange={(e) => handleChange('projectTitle', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="DXによる業務効率化と新規顧客開拓事業"
            />
          </div>

          <AIProjectSummaryField
            value={data.projectSummary || ''}
            onChange={(value) => handleChange('projectSummary', value)}
            label="事業概要"
            placeholder="この事業で何を実現したいか、簡潔に説明してください"
            maxLength={500}
          />
        </div>
      </StepSection>

      <StepSection title="事業の背景と目的" required>
        <div className="space-y-4">
          <AIBackgroundField
            value={data.projectBackground || ''}
            onChange={(value) => handleChange('projectBackground', value)}
            label="事業実施の背景"
            placeholder="なぜこの事業を実施する必要があるのか、現状の課題を含めて説明してください"
            maxLength={600}
          />

          <AIObjectivesField
            value={data.projectObjectives || ''}
            onChange={(value) => handleChange('projectObjectives', value)}
            label="事業目標"
            placeholder="この事業で達成したい具体的な目標を記載してください"
            maxLength={400}
          />
        </div>
      </StepSection>

      <StepSection title="実施内容と期待効果">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              実施内容
            </label>
            <textarea
              value={data.implementation || ''}
              onChange={(e) => handleChange('implementation', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="具体的な実施内容、導入するシステムやサービス、実施スケジュールなど"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              期待される効果（数値目標含む）
            </label>
            <textarea
              value={data.expectedResults || ''}
              onChange={(e) => handleChange('expectedResults', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="・売上20%向上&#10;・業務時間30%削減&#10;・新規顧客50件獲得"
            />
          </div>
        </div>
      </StepSection>

      <div className="flex justify-end mt-6">
        <button
          onClick={onNext}
          disabled={!data.projectTitle || !data.projectSummary || !data.projectBackground || !data.projectObjectives}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          次へ進む
        </button>
      </div>
    </StepContainer>
  )
}

// ステップ4: 予算計画
function BudgetPlanStep({ data, onChange, onNext }: StepProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value })
  }

  const calculateTotal = () => {
    const items = data.budgetItems || []
    return items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
  }

  const addBudgetItem = () => {
    const items = data.budgetItems || []
    onChange({
      budgetItems: [...items, { category: '', description: '', amount: 0 }]
    })
  }

  const updateBudgetItem = (index: number, field: string, value: any) => {
    const items = [...(data.budgetItems || [])]
    items[index] = { ...items[index], [field]: value }
    onChange({ budgetItems: items })
  }

  const removeBudgetItem = (index: number) => {
    const items = [...(data.budgetItems || [])]
    items.splice(index, 1)
    onChange({ budgetItems: items })
  }

  const subsidyProgram = data.subsidyProgram || {}
  const totalBudget = calculateTotal()
  const subsidyAmount = Math.min(totalBudget * subsidyProgram.subsidyRate, subsidyProgram.maxAmount)

  return (
    <StepContainer>
      <StepSection title="事業予算" required>
        <div className="space-y-4">
          {(data.budgetItems || []).map((item: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    費目
                  </label>
                  <select
                    value={item.category || ''}
                    onChange={(e) => updateBudgetItem(index, 'category', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">選択してください</option>
                    <option value="機械装置費">機械装置費</option>
                    <option value="システム開発費">システム開発費</option>
                    <option value="技術導入費">技術導入費</option>
                    <option value="専門家経費">専門家経費</option>
                    <option value="運搬費">運搬費</option>
                    <option value="クラウド利用費">クラウド利用費</option>
                    <option value="原材料費">原材料費</option>
                    <option value="外注費">外注費</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    内容
                  </label>
                  <input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => updateBudgetItem(index, 'description', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="具体的な内容"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    金額（円）
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => updateBudgetItem(index, 'amount', parseInt(e.target.value) || 0)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="1000000"
                    />
                    <button
                      onClick={() => removeBudgetItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <button
            onClick={addBudgetItem}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            + 費目を追加
          </button>
        </div>
      </StepSection>

      <StepSection title="予算サマリー">
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">事業費合計</span>
            <span className="text-lg font-semibold">¥{totalBudget.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700">
              補助率（{Math.round(subsidyProgram.subsidyRate * 100)}%）
            </span>
            <span className="text-gray-600">¥{Math.round(totalBudget * subsidyProgram.subsidyRate).toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700">補助上限額</span>
            <span className="text-gray-600">¥{subsidyProgram.maxAmount?.toLocaleString()}</span>
          </div>
          
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-medium text-gray-900">補助金額（予定）</span>
            <span className="text-xl font-bold text-blue-600">¥{Math.round(subsidyAmount).toLocaleString()}</span>
          </div>
        </div>
      </StepSection>

      <div className="flex justify-end mt-6">
        <button
          onClick={onNext}
          disabled={!data.budgetItems || data.budgetItems.length === 0}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          次へ進む
        </button>
      </div>
    </StepContainer>
  )
}

// ステップ5: AI分析・最適化
function AIAnalysisStep({ data, onChange, onNext, isLoading }: StepProps) {
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    
    try {
      // AI分析を実行
      const response = await fetch('/api/applications/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subsidyProgramId: data.subsidyProgramId,
          companyProfile: {
            companyName: data.companyName,
            industry: data.industry,
            employeeCount: data.employeeCount,
            businessDescription: data.businessDescription,
            strengths: data.strengths?.split('\n').filter(Boolean) || [],
            challenges: data.challenges?.split('\n').filter(Boolean) || []
          },
          projectPlan: {
            title: data.projectTitle,
            purpose: data.projectObjectives,
            background: data.projectBackground,
            implementation: data.implementation,
            expectedResults: data.expectedResults?.split('\n').filter(Boolean) || [],
            budget: data.budgetItems?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysisResult(result)
        onChange({ analysisResult: result })
        
        // 最適化された内容を自動適用
        if (result.generatedContent) {
          onChange({
            optimizedTitle: result.generatedContent.optimizedTitle,
            optimizedPurpose: result.generatedContent.optimizedPurpose,
            optimizedBackground: result.generatedContent.optimizedBackground,
            keyPhrases: result.generatedContent.keyPhrases
          })
        }
        
        toast.success('AI分析が完了しました')
      } else {
        toast.error('分析に失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <StepContainer>
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <SparklesIcon className="h-8 w-8 text-blue-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          AI分析・最適化
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          入力された情報をAIが分析し、募集要項に最適化された申請書を生成します。
          採択率を最大化するための提案も行います。
        </p>

        {!analysisResult && (
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                分析中...
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5 mr-2" />
                AI分析を開始
              </>
            )}
          </button>
        )}

        {analysisResult && (
          <div className="mt-8 space-y-6">
            {/* マッチスコア */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">適合度スコア</h4>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      マッチ度
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-blue-600">
                      {analysisResult.matchScore}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-blue-100">
                  <div 
                    style={{ width: `${analysisResult.matchScore}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                  />
                </div>
              </div>
            </div>

            {/* 適格性チェック */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">適格性チェック</h4>
              {analysisResult.eligibility.isEligible ? (
                <div className="text-green-600 flex items-center">
                  <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  申請要件を満たしています
                </div>
              ) : (
                <div>
                  <div className="text-red-600 flex items-center mb-3">
                    <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    要件を満たしていない項目があります
                  </div>
                  <ul className="space-y-1">
                    {analysisResult.eligibility.missingRequirements.map((req: string, i: number) => (
                      <li key={i} className="text-sm text-red-600 pl-8">• {req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 改善提案 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">改善提案</h4>
              
              {analysisResult.recommendations.strengths.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-green-700 mb-2">強み</h5>
                  <ul className="space-y-1">
                    {analysisResult.recommendations.strengths.map((strength: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.recommendations.improvements.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-blue-700 mb-2">改善ポイント</h5>
                  <ul className="space-y-1">
                    {analysisResult.recommendations.improvements.map((improvement: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start">
                        <span className="text-blue-500 mr-2">→</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={onNext}
                className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
              >
                申請書を生成
                <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </StepContainer>
  )
}

// ステップ6: 申請書確認・編集
function ApplicationReviewStep({ data, onChange, onNext }: StepProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<any>(null)

  const generateDocument = async () => {
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/applications/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const result = await response.json()
        setGeneratedDocument(result.document)
        onChange({ generatedDocument: result.document })
        toast.success('申請書が生成されました')
      }
    } catch (error) {
      toast.error('申請書生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  React.useEffect(() => {
    if (!generatedDocument) {
      generateDocument()
    }
  }, [])

  if (isGenerating) {
    return (
      <div className="text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-gray-600">申請書を生成中...</p>
      </div>
    )
  }

  if (!generatedDocument) {
    return null
  }

  return (
    <StepContainer>
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            生成された申請書をご確認ください。必要に応じて編集することができます。
          </p>
        </div>

        {/* 申請書プレビュー */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {data.optimizedTitle || data.projectTitle}
          </h3>

          <div className="space-y-6">
            <section>
              <h4 className="text-lg font-medium text-gray-900 mb-2">1. 事業概要</h4>
              <div className="bg-gray-50 rounded p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {data.optimizedPurpose || data.projectSummary}
                </p>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-medium text-gray-900 mb-2">2. 事業実施の背景</h4>
              <div className="bg-gray-50 rounded p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {data.optimizedBackground || data.projectBackground}
                </p>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-medium text-gray-900 mb-2">3. 実施内容</h4>
              <div className="bg-gray-50 rounded p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {data.implementation}
                </p>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-medium text-gray-900 mb-2">4. 期待される効果</h4>
              <div className="bg-gray-50 rounded p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {data.expectedResults}
                </p>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-medium text-gray-900 mb-2">5. 事業予算</h4>
              <div className="bg-gray-50 rounded p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">費目</th>
                      <th className="text-left py-2">内容</th>
                      <th className="text-right py-2">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.budgetItems || []).map((item: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">{item.category}</td>
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-right">¥{item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td colSpan={2} className="py-2">合計</td>
                      <td className="py-2 text-right">
                        ¥{data.budgetItems?.reduce((sum: number, item: any) => sum + item.amount, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => toast.info('編集機能は準備中です')}
            className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors"
          >
            編集する
          </button>
          
          <button
            onClick={onNext}
            className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
          >
            確定して保存
          </button>
        </div>
      </div>
    </StepContainer>
  )
}

// メインコンポーネント
export function ApplicationWizard() {
  const router = useRouter()
  
  const wizardSteps: WizardStep[] = [
    {
      id: 'subsidy-selection',
      title: '補助金選択',
      description: '申請する補助金プログラムを選択',
      component: SubsidySelectionStep,
      estimatedTime: 2
    },
    {
      id: 'company-info',
      title: '企業情報',
      description: '企業の基本情報と事業内容',
      component: CompanyInfoStep,
      estimatedTime: 10,
      validation: (data) => {
        const errors = []
        if (!data.companyName) errors.push('企業名は必須です')
        if (!data.industry) errors.push('業種は必須です')
        if (!data.employeeCount) errors.push('従業員数は必須です')
        if (!data.businessDescription) errors.push('事業内容は必須です')
        return { isValid: errors.length === 0, errors }
      }
    },
    {
      id: 'project-plan',
      title: '事業計画',
      description: '実施する事業の詳細',
      component: ProjectPlanStep,
      estimatedTime: 15,
      validation: (data) => {
        const errors = []
        if (!data.projectTitle) errors.push('事業タイトルは必須です')
        if (!data.projectSummary) errors.push('事業概要は必須です')
        if (!data.projectBackground) errors.push('事業背景は必須です')
        if (!data.projectObjectives) errors.push('事業目標は必須です')
        return { isValid: errors.length === 0, errors }
      }
    },
    {
      id: 'budget-plan',
      title: '予算計画',
      description: '事業予算の詳細',
      component: BudgetPlanStep,
      estimatedTime: 10,
      validation: (data) => {
        const errors = []
        if (!data.budgetItems || data.budgetItems.length === 0) {
          errors.push('予算項目を1つ以上入力してください')
        }
        return { isValid: errors.length === 0, errors }
      }
    },
    {
      id: 'ai-analysis',
      title: 'AI分析',
      description: '募集要項との適合性を分析',
      component: AIAnalysisStep,
      estimatedTime: 3
    },
    {
      id: 'review',
      title: '確認・編集',
      description: '生成された申請書の確認',
      component: ApplicationReviewStep,
      estimatedTime: 5
    }
  ]

  const handleComplete = async (data: any) => {
    try {
      // 申請書を保存
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          status: 'COMPLETED'
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('申請書が保存されました')
        router.push(`/dashboard/applications/${result.id}`)
      } else {
        toast.error('保存に失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    }
  }

  const handleSave = async (data: any) => {
    try {
      // 下書き保存
      const response = await fetch('/api/applications/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success('下書きを保存しました')
      }
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← 戻る
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">
                新規申請書作成
              </h1>
            </div>
          </div>
        </div>
      </div>

      <EnhancedWizard
        steps={wizardSteps}
        onComplete={handleComplete}
        onSave={handleSave}
        enableAutosave={true}
        autoSaveInterval={30}
        showProgress={true}
        showTimeEstimate={true}
      />
    </div>
  )
}