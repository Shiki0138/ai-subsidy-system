'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BuildingOfficeIcon, 
  RocketLaunchIcon,
  SparklesIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { applicationsApi } from '@/services/api/applications'
import { toast } from 'react-hot-toast'
import { IndustryCode } from '@/types/application'

// 都道府県リスト
const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

interface FormData {
  // 企業情報
  companyName: string
  industry: IndustryCode | ''
  employees: string
  location_pref: string
  
  // プロジェクト情報
  objective: string
  budget: string
  expected_effect: string
}

export function QuickApplyWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [matchResults, setMatchResults] = useState<any[]>([])
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    industry: '',
    employees: '',
    location_pref: '',
    objective: '',
    budget: '',
    expected_effect: ''
  })

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && validateStep2()) {
      processApplication()
    }
  }

  const validateStep1 = (): boolean => {
    if (!formData.companyName.trim()) {
      toast.error('企業名を入力してください')
      return false
    }
    if (!formData.industry) {
      toast.error('業種を選択してください')
      return false
    }
    if (!formData.employees || parseInt(formData.employees) < 1) {
      toast.error('従業員数を正しく入力してください')
      return false
    }
    if (!formData.location_pref) {
      toast.error('都道府県を選択してください')
      return false
    }
    return true
  }

  const validateStep2 = (): boolean => {
    if (!formData.objective || formData.objective.length < 20) {
      toast.error('事業目的を20文字以上で入力してください')
      return false
    }
    if (!formData.budget || parseInt(formData.budget) < 100000) {
      toast.error('予算は10万円以上で入力してください')
      return false
    }
    return true
  }

  const processApplication = async () => {
    setIsProcessing(true)
    
    try {
      // 1. 補助金マッチング - API が利用できない場合はモックデータを使用
      let matchData
      
      try {
        const matchResponse = await fetch('http://localhost:7001/api/match-subsidy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: {
              name: formData.companyName,
              industry: formData.industry,
              employees: parseInt(formData.employees),
              location_pref: formData.location_pref
            },
            project: {
              objective: formData.objective,
              budget: parseInt(formData.budget),
              expected_effect: formData.expected_effect || undefined
            }
          })
        })

        if (matchResponse.ok) {
          matchData = await matchResponse.json()
        } else {
          throw new Error('API not available')
        }
      } catch (apiError) {
        console.warn('API not available, using mock data:', apiError)
        
        // モックデータの生成
        const budget = parseInt(formData.budget) || 1000000
        const industry = formData.industry
        
        matchData = {
          matches: [
            {
              subsidyId: 'jizokukahojokin',
              name: '小規模事業者持続化補助金',
              score: 85,
              remarks: `${formData.companyName}様の${industry}業での取り組みに最適な補助金です。`,
              recommendations: [
                '商工会議所への事前相談をお勧めします',
                '事業計画書の詳細化により採択率が向上します'
              ]
            },
            {
              subsidyId: 'itdounyu',
              name: 'IT導入補助金',
              score: 72,
              remarks: 'デジタル化推進により業務効率化が期待されます。',
              recommendations: [
                'IT導入支援事業者との連携が必要です',
                'クラウドサービスの導入を検討してください'
              ]
            },
            {
              subsidyId: 'monozukuri',
              name: 'ものづくり補助金',
              score: 68,
              remarks: '革新的な取り組みとして評価される可能性があります。',
              recommendations: [
                '技術的優位性の明確化が重要です',
                '市場分析データの充実を図ってください'
              ]
            }
          ]
        }
      }
      
      setMatchResults(matchData.matches || [])
      setCurrentStep(3)
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('処理中にエラーが発生しました')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSelectSubsidy = async (subsidyId: string) => {
    // 持続化補助金の場合は直接API呼び出し
    if (subsidyId === 'jizokukahojokin') {
      setIsProcessing(true)
      
      try {
        // 持続化補助金API用のデータ形式に変換
        const sustainabilityData = {
          companyInfo: {
            companyName: formData.companyName,
            representativeName: '代表取締役', // 後で入力画面追加
            businessType: formData.industry,
            foundedYear: 2020, // 後で入力画面追加
            employeeCount: parseInt(formData.employees),
            address: formData.location_pref,
            phone: '03-0000-0000', // 後で入力画面追加
            email: 'info@example.com' // 後で入力画面追加
          },
          businessPlan: {
            businessOverview: formData.objective,
            marketTrends: '市場動向分析',
            strengths: '自社の強み',
            managementPolicy: '経営方針',
            projectName: formData.objective.substring(0, 30),
            salesExpansion: formData.objective,
            efficiencyImprovement: '業務効率化計画',
            expectedEffects: formData.expected_effect || '売上向上・コスト削減'
          },
          budgetPlan: {
            totalProjectCost: parseInt(formData.budget),
            subsidyAmount: Math.floor(parseInt(formData.budget) * 2 / 3), // 補助率2/3
            selfFunding: Math.floor(parseInt(formData.budget) * 1 / 3),
            expenseDetails: [
              {
                category: 'machinery_equipment',
                item: 'システム導入費',
                quantity: 1,
                unitPrice: parseInt(formData.budget),
                totalPrice: parseInt(formData.budget),
                description: formData.objective
              }
            ]
          }
        }
        
        // 持続化補助金APIを呼び出し
        const response = await fetch('http://localhost:7001/api/sustainability-subsidy/generate-all-documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(sustainabilityData)
        })
        
        if (response.ok) {
          const result = await response.json()
          toast.success('持続化補助金の申請書類を生成しました！')
          
          // 結果を保存して申請管理画面へ遷移
          sessionStorage.setItem('generatedDocuments', JSON.stringify(result))
          router.push('/dashboard/applications?generated=true')
        } else {
          throw new Error('API error')
        }
        
      } catch (error) {
        console.error('Error generating documents:', error)
        toast.error('申請書類の生成に失敗しました')
      } finally {
        setIsProcessing(false)
      }
      
    } else if (subsidyId === 'monozukuri') {
      // ものづくり補助金の場合は専用フォームへ遷移
      const applicationData = {
        company: {
          name: formData.companyName,
          industry: formData.industry,
          employees: parseInt(formData.employees),
          location_pref: formData.location_pref
        },
        project: {
          objective: formData.objective,
          budget: parseInt(formData.budget),
          expected_effect: formData.expected_effect
        },
        subsidyId
      }
      
      // セッションストレージに保存
      sessionStorage.setItem('quickApplyData', JSON.stringify(applicationData))
      
      // ものづくり補助金専用フォームへ遷移
      router.push('/dashboard/applications/new/monozukuri?quickApply=true')
      
    } else {
      // その他の補助金は従来通り
      const applicationData = {
        company: {
          name: formData.companyName,
          industry: formData.industry,
          employees: parseInt(formData.employees),
          location_pref: formData.location_pref
        },
        project: {
          objective: formData.objective,
          budget: parseInt(formData.budget),
          expected_effect: formData.expected_effect
        },
        subsidyId
      }
      
      // セッションストレージに保存
      sessionStorage.setItem('quickApplyData', JSON.stringify(applicationData))
      
      // 申請書作成ページへ遷移
      router.push(`/dashboard/applications/new?subsidyId=${subsidyId}&quickApply=true`)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* プログレスバー */}
      <div className="bg-gray-100 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <StepIndicator 
              number={1} 
              label="企業情報" 
              isActive={currentStep >= 1}
              isCompleted={currentStep > 1}
            />
            <div className="w-24 h-1 bg-gray-300 relative">
              <div 
                className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300"
                style={{ width: currentStep > 1 ? '100%' : '0%' }}
              />
            </div>
            <StepIndicator 
              number={2} 
              label="プロジェクト" 
              isActive={currentStep >= 2}
              isCompleted={currentStep > 2}
            />
            <div className="w-24 h-1 bg-gray-300 relative">
              <div 
                className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300"
                style={{ width: currentStep > 2 ? '100%' : '0%' }}
              />
            </div>
            <StepIndicator 
              number={3} 
              label="マッチング結果" 
              isActive={currentStep >= 3}
              isCompleted={false}
            />
          </div>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  企業情報を入力
                </h2>
                <p className="text-gray-600">
                  基本的な企業情報を入力してください
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    企業名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="株式会社サンプル"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      業種 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">選択してください</option>
                      <option value="manufacturing">製造業</option>
                      <option value="retail">小売業</option>
                      <option value="service">サービス業</option>
                      <option value="it">情報通信業</option>
                      <option value="construction">建設業</option>
                      <option value="healthcare">医療・福祉</option>
                      <option value="hospitality">宿泊・飲食業</option>
                      <option value="beauty">美容業</option>
                      <option value="education">教育・学習支援業</option>
                      <option value="other">その他</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      従業員数 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.employees}
                      onChange={(e) => handleInputChange('employees', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="10"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    都道府県 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.location_pref}
                    onChange={(e) => handleInputChange('location_pref', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">選択してください</option>
                    {PREFECTURES.map(pref => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  プロジェクト情報を入力
                </h2>
                <p className="text-gray-600">
                  実施したい事業の内容を入力してください
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    事業目的 <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">（20文字以上）</span>
                  </label>
                  <textarea
                    value={formData.objective}
                    onChange={(e) => handleInputChange('objective', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="例：ネット予約システムを導入し、顧客の利便性向上と業務効率化を実現する"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    現在: {formData.objective.length}文字
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    予算（税込・円） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="3000000"
                    min="100000"
                    step="10000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    10万円以上で入力してください
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    期待される効果
                    <span className="text-xs text-gray-500 ml-2">（任意）</span>
                  </label>
                  <input
                    type="text"
                    value={formData.expected_effect}
                    onChange={(e) => handleInputChange('expected_effect', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例：来店予約率20%向上、業務時間30%削減"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  マッチング完了！
                </h2>
                <p className="text-gray-600">
                  あなたの事業に最適な補助金が見つかりました
                </p>
              </div>

              <div className="space-y-4">
                {matchResults.map((match, index) => (
                  <div
                    key={match.subsidyId}
                    className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${
                      index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => handleSelectSubsidy(match.subsidyId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {match.name}
                          </h3>
                          {index === 0 && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                              おすすめ
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold text-blue-600">
                              {match.score}
                            </div>
                            <div className="text-sm text-gray-500">点</div>
                          </div>
                          
                          <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                              style={{ width: `${match.score}%` }}
                            />
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {match.remarks}
                        </p>
                        
                        {match.recommendations && (
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">
                              推奨アクション:
                            </p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {match.recommendations.slice(0, 2).map((rec, i) => (
                                <li key={i}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <button className="ml-4 text-blue-600 hover:text-blue-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* アクションボタン */}
        {currentStep < 3 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              戻る
            </button>
            
            <button
              onClick={handleNext}
              disabled={isProcessing}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  処理中...
                </>
              ) : currentStep === 2 ? (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  マッチング開始
                </>
              ) : (
                '次へ'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ステップインジケーターコンポーネント
function StepIndicator({ 
  number, 
  label, 
  isActive, 
  isCompleted 
}: { 
  number: number
  label: string
  isActive: boolean
  isCompleted: boolean
}) {
  return (
    <div className="flex items-center">
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
        ${isCompleted ? 'bg-green-500 text-white' : 
          isActive ? 'bg-blue-600 text-white' : 
          'bg-gray-300 text-gray-600'}
      `}>
        {isCompleted ? (
          <CheckCircleIcon className="h-6 w-6" />
        ) : (
          number
        )}
      </div>
      <span className={`ml-3 font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  )
}