'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CurrencyYenIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface FormData {
  companyInfo: {
    name: string
    industry: string
    employeeCount: number
    currentMinimumWage: number
    regionalMinimumWage: number
    address: string
    businessType: string
    yearlyRevenue?: number
    representativeName?: string
  }
  wageIncreasePlan: {
    course: '30' | '45' | '60' | '90'
    targetWage: number
    affectedEmployees: number
    implementationDate: string
    sustainabilityPlan: string
  }
  investmentPlan: {
    items: Array<{
      category: string
      description: string
      cost: number
      vendor: string
      expectedEffect: string
    }>
    totalCost: number
    financingMethod: string
  }
  productivityPlan: {
    currentProductivity: string
    targetProductivity: string
    improvementMeasures: string[]
    measurementMethod: string
    expectedROI?: number
  }
  businessPlan: {
    challenges: string
    objectives: string
    implementation: string
    riskManagement: string
    localContribution: string
  }
}

const COURSE_OPTIONS = [
  { value: '30', label: '30円コース', maxAmount: 1200000, description: '最大120万円' },
  { value: '45', label: '45円コース', maxAmount: 1800000, description: '最大180万円' },
  { value: '60', label: '60円コース', maxAmount: 3000000, description: '最大300万円' },
  { value: '90', label: '90円コース', maxAmount: 6000000, description: '最大600万円' },
]

const INVESTMENT_CATEGORIES = [
  '機械装置等購入費',
  'システム構築費',
  '外注費',
  '専門家謝金',
  '広告宣伝・販売促進費',
  '建物改修費',
  '設備等リース費',
  '委託費',
  '設備廃棄費',
  'その他'
]

export function BusinessImprovementApplicationForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [eligibilityCheck, setEligibilityCheck] = useState<any>(null)
  const [subsidyCalculation, setSubsidyCalculation] = useState<any>(null)
  
  const [formData, setFormData] = useState<FormData>({
    companyInfo: {
      name: '',
      industry: '',
      employeeCount: 0,
      currentMinimumWage: 0,
      regionalMinimumWage: 1013, // 東京都の最低賃金（2024年）
      address: '',
      businessType: '',
      yearlyRevenue: undefined,
      representativeName: ''
    },
    wageIncreasePlan: {
      course: '30',
      targetWage: 0,
      affectedEmployees: 0,
      implementationDate: '',
      sustainabilityPlan: ''
    },
    investmentPlan: {
      items: [],
      totalCost: 0,
      financingMethod: ''
    },
    productivityPlan: {
      currentProductivity: '',
      targetProductivity: '',
      improvementMeasures: [],
      measurementMethod: '',
      expectedROI: undefined
    },
    businessPlan: {
      challenges: '',
      objectives: '',
      implementation: '',
      riskManagement: '',
      localContribution: ''
    }
  })

  const steps = [
    { number: 1, title: '企業情報', description: '基本的な会社情報を入力' },
    { number: 2, title: '賃金引上げ計画', description: '賃金引上げの詳細計画' },
    { number: 3, title: '設備投資計画', description: '生産性向上のための投資' },
    { number: 4, title: '生産性向上計画', description: '具体的な改善計画' },
    { number: 5, title: '事業計画', description: '事業の目標と実施計画' },
    { number: 6, title: '確認・生成', description: '内容確認と申請書生成' }
  ]

  const updateFormData = (section: keyof FormData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }))
  }

  const addInvestmentItem = () => {
    const newItem = {
      category: '',
      description: '',
      cost: 0,
      vendor: '',
      expectedEffect: ''
    }
    updateFormData('investmentPlan', {
      items: [...formData.investmentPlan.items, newItem]
    })
  }

  const updateInvestmentItem = (index: number, field: string, value: any) => {
    const items = [...formData.investmentPlan.items]
    items[index] = { ...items[index], [field]: value }
    const totalCost = items.reduce((sum, item) => sum + (item.cost || 0), 0)
    updateFormData('investmentPlan', { items, totalCost })
  }

  const removeInvestmentItem = (index: number) => {
    const items = formData.investmentPlan.items.filter((_, i) => i !== index)
    const totalCost = items.reduce((sum, item) => sum + (item.cost || 0), 0)
    updateFormData('investmentPlan', { items, totalCost })
  }

  const addImprovementMeasure = () => {
    updateFormData('productivityPlan', {
      improvementMeasures: [...formData.productivityPlan.improvementMeasures, '']
    })
  }

  const updateImprovementMeasure = (index: number, value: string) => {
    const measures = [...formData.productivityPlan.improvementMeasures]
    measures[index] = value
    updateFormData('productivityPlan', { improvementMeasures: measures })
  }

  const removeImprovementMeasure = (index: number) => {
    updateFormData('productivityPlan', {
      improvementMeasures: formData.productivityPlan.improvementMeasures.filter((_, i) => i !== index)
    })
  }

  const checkEligibility = async () => {
    try {
      const response = await fetch('/api/business-improvement-subsidy/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyInfo: formData.companyInfo })
      })
      const result = await response.json()
      setEligibilityCheck(result.data)
    } catch (error) {
      console.error('申請資格チェックエラー:', error)
    }
  }

  const calculateSubsidy = async () => {
    try {
      const response = await fetch('/api/business-improvement-subsidy/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: formData.wageIncreasePlan.course,
          totalCost: formData.investmentPlan.totalCost,
          hasProductivityRequirement: formData.productivityPlan.expectedROI && formData.productivityPlan.expectedROI > 20
        })
      })
      const result = await response.json()
      setSubsidyCalculation(result.data)
    } catch (error) {
      console.error('補助金額計算エラー:', error)
    }
  }

  const generateApplication = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/business-improvement-subsidy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result = await response.json()
      
      if (result.success) {
        router.push(`/dashboard/applications/${result.data.applicationId}`)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('申請書生成エラー:', error)
      alert('申請書の生成に失敗しました。入力内容を確認してください。')
    } finally {
      setIsGenerating(false)
    }
  }

  const nextStep = () => {
    if (currentStep === 1) {
      checkEligibility()
    }
    if (currentStep === 3) {
      calculateSubsidy()
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">企業情報</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会社名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyInfo.name}
                  onChange={(e) => updateFormData('companyInfo', { name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="株式会社〇〇"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  業種 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.companyInfo.industry}
                  onChange={(e) => updateFormData('companyInfo', { industry: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="製造業">製造業</option>
                  <option value="建設業">建設業</option>
                  <option value="卸売業">卸売業</option>
                  <option value="小売業">小売業</option>
                  <option value="サービス業">サービス業</option>
                  <option value="情報通信業">情報通信業</option>
                  <option value="運輸業">運輸業</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  従業員数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.companyInfo.employeeCount}
                  onChange={(e) => updateFormData('companyInfo', { employeeCount: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現在の事業場内最低賃金 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.companyInfo.currentMinimumWage}
                    onChange={(e) => updateFormData('companyInfo', { currentMinimumWage: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1050"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">円/時</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  地域別最低賃金 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.companyInfo.regionalMinimumWage}
                    onChange={(e) => updateFormData('companyInfo', { regionalMinimumWage: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1013"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">円/時</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  代表者名
                </label>
                <input
                  type="text"
                  value={formData.companyInfo.representativeName}
                  onChange={(e) => updateFormData('companyInfo', { representativeName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="山田太郎"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所在地 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyInfo.address}
                onChange={(e) => updateFormData('companyInfo', { address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="東京都中央区○○1-2-3"
              />
            </div>

            {eligibilityCheck && (
              <div className={`p-4 rounded-lg ${eligibilityCheck.isEligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start space-x-3">
                  {eligibilityCheck.isEligible ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5" />
                  ) : (
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <h4 className={`font-medium ${eligibilityCheck.isEligible ? 'text-green-900' : 'text-red-900'}`}>
                      {eligibilityCheck.isEligible ? '申請資格を満たしています' : '申請資格を満たしていません'}
                    </h4>
                    {eligibilityCheck.reasons?.length > 0 && (
                      <ul className={`mt-2 text-sm ${eligibilityCheck.isEligible ? 'text-green-700' : 'text-red-700'}`}>
                        {eligibilityCheck.reasons.map((reason: string, index: number) => (
                          <li key={index}>• {reason}</li>
                        ))}
                      </ul>
                    )}
                    {eligibilityCheck.recommendations?.length > 0 && (
                      <ul className={`mt-2 text-sm ${eligibilityCheck.isEligible ? 'text-green-700' : 'text-red-700'}`}>
                        {eligibilityCheck.recommendations.map((rec: string, index: number) => (
                          <li key={index}>💡 {rec}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">賃金引上げ計画</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                引上げコース <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {COURSE_OPTIONS.map((course) => (
                  <div
                    key={course.value}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.wageIncreasePlan.course === course.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => updateFormData('wageIncreasePlan', { course: course.value })}
                  >
                    <div className="text-center">
                      <h4 className="font-semibold text-gray-900">{course.label}</h4>
                      <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                      <p className="text-xs text-gray-500 mt-2">補助率：75-90%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  引上げ後の事業場内最低賃金 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.wageIncreasePlan.targetWage}
                    onChange={(e) => updateFormData('wageIncreasePlan', { targetWage: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`${formData.companyInfo.currentMinimumWage + parseInt(formData.wageIncreasePlan.course)}`}
                  />
                  <span className="absolute right-3 top-2 text-gray-500">円/時</span>
                </div>
                {formData.companyInfo.currentMinimumWage > 0 && formData.wageIncreasePlan.targetWage > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    引上げ額: {formData.wageIncreasePlan.targetWage - formData.companyInfo.currentMinimumWage}円
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  対象労働者数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.wageIncreasePlan.affectedEmployees}
                  onChange={(e) => updateFormData('wageIncreasePlan', { affectedEmployees: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  実施予定日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.wageIncreasePlan.implementationDate}
                  onChange={(e) => updateFormData('wageIncreasePlan', { implementationDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                賃金引上げの持続可能性 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.wageIncreasePlan.sustainabilityPlan}
                onChange={(e) => updateFormData('wageIncreasePlan', { sustainabilityPlan: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="生産性向上により収益性が改善することで、継続的な賃金引上げが可能となります..."
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">設備投資計画</h2>
              <button
                onClick={addInvestmentItem}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <InformationCircleIcon className="h-4 w-4 mr-2" />
                投資項目を追加
              </button>
            </div>

            <div className="space-y-4">
              {formData.investmentPlan.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        カテゴリ <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => updateInvestmentItem(index, 'category', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">選択してください</option>
                        {INVESTMENT_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        費用 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={item.cost}
                          onChange={(e) => updateInvestmentItem(index, 'cost', parseInt(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="1000000"
                        />
                        <span className="absolute right-3 top-2 text-gray-500">円</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        内容説明 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateInvestmentItem(index, 'description', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="CNC旋盤の導入"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        業者名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.vendor}
                        onChange={(e) => updateInvestmentItem(index, 'vendor', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="株式会社○○機械"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        期待される効果 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={item.expectedEffect}
                        onChange={(e) => updateInvestmentItem(index, 'expectedEffect', e.target.value)}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="加工精度向上と作業時間30％削減"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => removeInvestmentItem(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {formData.investmentPlan.items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                投資項目を追加してください
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                資金調達方法 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.investmentPlan.financingMethod}
                onChange={(e) => updateFormData('investmentPlan', { financingMethod: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="自己資金50％、金融機関借入50％"
              />
            </div>

            {formData.investmentPlan.totalCost > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">投資総額:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formData.investmentPlan.totalCost.toLocaleString()}円
                  </span>
                </div>
              </div>
            )}

            {subsidyCalculation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">💰 補助金額試算</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">補助率:</span>
                    <span className="text-blue-900 font-medium">{(subsidyCalculation.subsidyRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">推定補助金額:</span>
                    <span className="text-blue-900 font-bold">{subsidyCalculation.estimatedAmount.toLocaleString()}円</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">上限額:</span>
                    <span className="text-blue-900">{subsidyCalculation.maxSubsidy.toLocaleString()}円</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">生産性向上計画</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現在の生産性 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.productivityPlan.currentProductivity}
                  onChange={(e) => updateFormData('productivityPlan', { currentProductivity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1人1時間あたり10個生産"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目標生産性 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.productivityPlan.targetProductivity}
                  onChange={(e) => updateFormData('productivityPlan', { targetProductivity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1人1時間あたり13個生産（30％向上）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  期待投資収益率（ROI）
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.productivityPlan.expectedROI || ''}
                    onChange={(e) => updateFormData('productivityPlan', { expectedROI: parseFloat(e.target.value) || undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="25.0"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">20%以上で生産性要件を満たし、補助率が向上します</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                効果測定方法 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.productivityPlan.measurementMethod}
                onChange={(e) => updateFormData('productivityPlan', { measurementMethod: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="月次での生産個数と労働時間の記録・分析"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  改善施策 <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={addImprovementMeasure}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + 施策を追加
                </button>
              </div>
              
              <div className="space-y-2">
                {formData.productivityPlan.improvementMeasures.map((measure, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={measure}
                      onChange={(e) => updateImprovementMeasure(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="CNC旋盤導入による加工時間短縮"
                    />
                    <button
                      onClick={() => removeImprovementMeasure(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>

              {formData.productivityPlan.improvementMeasures.length === 0 && (
                <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  改善施策を追加してください
                </div>
              )}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">事業計画</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                現在の課題 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.businessPlan.challenges}
                onChange={(e) => updateFormData('businessPlan', { challenges: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="設備の老朽化による生産性低下と、人材確保の困難さ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                事業目標 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.businessPlan.objectives}
                onChange={(e) => updateFormData('businessPlan', { objectives: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="最新設備導入による生産性向上と、賃金引上げによる人材定着"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                実施計画 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.businessPlan.implementation}
                onChange={(e) => updateFormData('businessPlan', { implementation: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="段階的な設備導入と並行した従業員研修の実施"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                リスク管理 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.businessPlan.riskManagement}
                onChange={(e) => updateFormData('businessPlan', { riskManagement: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="設備故障時のバックアップ体制構築と、複数名での技術習得"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                地域経済への貢献 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.businessPlan.localContribution}
                onChange={(e) => updateFormData('businessPlan', { localContribution: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="地域の雇用創出と、取引先企業への安定供給による地域経済活性化"
              />
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">申請書生成</h2>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">入力内容の確認</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">企業情報</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>会社名: {formData.companyInfo.name}</p>
                    <p>業種: {formData.companyInfo.industry}</p>
                    <p>従業員数: {formData.companyInfo.employeeCount}人</p>
                    <p>現在の最低賃金: {formData.companyInfo.currentMinimumWage}円/時</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">賃金引上げ計画</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>コース: {formData.wageIncreasePlan.course}円コース</p>
                    <p>目標賃金: {formData.wageIncreasePlan.targetWage}円/時</p>
                    <p>対象労働者: {formData.wageIncreasePlan.affectedEmployees}人</p>
                    <p>実施日: {formData.wageIncreasePlan.implementationDate}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">設備投資計画</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>投資項目数: {formData.investmentPlan.items.length}件</p>
                    <p>投資総額: {formData.investmentPlan.totalCost.toLocaleString()}円</p>
                    {subsidyCalculation && (
                      <p>推定補助金額: {subsidyCalculation.estimatedAmount.toLocaleString()}円</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">生産性向上計画</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>改善施策数: {formData.productivityPlan.improvementMeasures.length}件</p>
                    {formData.productivityPlan.expectedROI && (
                      <p>期待ROI: {formData.productivityPlan.expectedROI}%</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">生成される申請書類</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 交付申請書（様式第1号）</li>
                    <li>• 事業実施計画書（様式第1号別紙2）</li>
                    <li>• 賃金引上げ計画書</li>
                    <li>• 見積書一覧</li>
                    <li>• 生産性向上計画詳細</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={generateApplication}
                disabled={isGenerating}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    申請書を生成中...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    申請書を生成
                  </>
                )}
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                戻る
              </button>
              <h1 className="text-xl font-bold text-gray-900">業務改善助成金申請書作成</h1>
            </div>
          </div>
        </div>
      </header>

      {/* ステップ表示 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 ml-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderStepContent()}
          
          {/* ナビゲーションボタン */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              前へ
            </button>
            
            {currentStep < steps.length && (
              <button
                onClick={nextStep}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                次へ
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}