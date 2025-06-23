'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Alert } from '@/components/ui/Alert';
import {
  BuildingOfficeIcon,
  CurrencyYenIcon,
  CogIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface BusinessImprovementWizardProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

export default function BusinessImprovementWizard({ 
  onComplete, 
  initialData 
}: BusinessImprovementWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    // 申請者情報
    applicant: {
      companyName: '',
      corporateNumber: '',
      representativeName: '',
      address: '',
      phone: '',
      email: '',
      industry: '',
      employeeCount: 0,
      foundedYear: new Date().getFullYear()
    },
    // 事業所情報
    workplace: {
      workplaceName: '',
      workplaceAddress: '',
      workplacePhone: '',
      managerName: '',
      employeeCount: 0,
      currentMinimumWage: 900,
      targetMinimumWage: 960,
      wageIncreaseAmount: 60
    },
    // 選択コース
    selectedCourse: {
      courseName: '60円コース',
      wageIncrease: 60,
      maxSubsidy: 600000,
      requiredEmployees: '1人以上'
    },
    // 業務改善計画
    improvementPlan: {
      currentSituation: '',
      challenges: '',
      improvementGoals: '',
      expectedEffects: '',
      productivityImprovements: []
    },
    // 設備投資計画
    equipmentPlan: {
      equipmentList: [],
      totalInvestment: 0,
      subsidyRequest: 0,
      selfFunding: 0
    },
    // 賃金引上げ計画
    wageIncreasePlan: {
      targetEmployees: [],
      implementationDate: '',
      sustainabilityMeasures: ''
    },
    // 事業実施体制
    implementationStructure: {
      projectManager: '',
      responsibleDepartment: '',
      implementationSchedule: [],
      riskManagement: ''
    }
  });

  const steps = [
    {
      id: 'applicant',
      title: '申請者情報',
      icon: BuildingOfficeIcon,
      description: '企業の基本情報を入力してください'
    },
    {
      id: 'workplace',
      title: '事業所情報',
      icon: UserGroupIcon,
      description: '対象事業所の詳細情報を入力してください'
    },
    {
      id: 'course',
      title: 'コース選択',
      icon: CurrencyYenIcon,
      description: '申請するコースを選択してください'
    },
    {
      id: 'improvement',
      title: '業務改善計画',
      icon: CogIcon,
      description: '生産性向上の計画を入力してください'
    },
    {
      id: 'equipment',
      title: '設備投資計画',
      icon: DocumentTextIcon,
      description: '導入予定設備の詳細を入力してください'
    },
    {
      id: 'wage',
      title: '賃金引上げ計画',
      icon: CurrencyYenIcon,
      description: '賃金引上げの詳細を入力してください'
    },
    {
      id: 'implementation',
      title: '実施体制',
      icon: ClockIcon,
      description: 'プロジェクトの実施体制を入力してください'
    },
    {
      id: 'review',
      title: '確認・生成',
      icon: CheckCircleIcon,
      description: '入力内容を確認し、申請書を生成します'
    }
  ];

  const courses = [
    { name: '30円コース', wageIncrease: 30, maxSubsidy: 300000, requiredEmployees: '1人以上' },
    { name: '45円コース', wageIncrease: 45, maxSubsidy: 450000, requiredEmployees: '1人以上' },
    { name: '60円コース', wageIncrease: 60, maxSubsidy: 600000, requiredEmployees: '1人以上' },
    { name: '90円コース', wageIncrease: 90, maxSubsidy: 1500000, requiredEmployees: '2人以上7人以下' },
    { name: '120円コース', wageIncrease: 120, maxSubsidy: 3000000, requiredEmployees: '3人以上10人以下' },
    { name: '150円コース', wageIncrease: 150, maxSubsidy: 6000000, requiredEmployees: '4人以上' }
  ];

  const industries = [
    '製造業', '建設業', '情報通信業', '運輸・郵便業', 
    '卸売・小売業', '宿泊・飲食サービス業', 'サービス業', 'その他'
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData]);

  const updateFormData = (section: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], ...data }
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 0: // 申請者情報
        if (!formData.applicant.companyName.trim()) {
          newErrors.companyName = '事業所名は必須です';
        }
        if (!formData.applicant.representativeName.trim()) {
          newErrors.representativeName = '代表者氏名は必須です';
        }
        if (!formData.applicant.address.trim()) {
          newErrors.address = '所在地は必須です';
        }
        if (!formData.applicant.phone.trim()) {
          newErrors.phone = '電話番号は必須です';
        }
        if (!formData.applicant.industry) {
          newErrors.industry = '業種の選択は必須です';
        }
        if (formData.applicant.employeeCount <= 0) {
          newErrors.employeeCount = '従業員数は1人以上で入力してください';
        }
        break;
        
      case 1: // 事業所情報
        if (!formData.workplace.workplaceName.trim()) {
          newErrors.workplaceName = '事業所名は必須です';
        }
        if (formData.workplace.currentMinimumWage >= 1000) {
          newErrors.currentMinimumWage = '現在の最低賃金は1,000円未満である必要があります';
        }
        if (formData.workplace.wageIncreaseAmount < 30) {
          newErrors.wageIncreaseAmount = '賃金引上げ額は30円以上である必要があります';
        }
        break;
        
      case 3: // 業務改善計画
        if (!formData.improvementPlan.currentSituation.trim()) {
          newErrors.currentSituation = '現在の業務状況の記述は必須です';
        }
        if (!formData.improvementPlan.challenges.trim()) {
          newErrors.challenges = '解決すべき課題の記述は必須です';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // バックエンドサービス用の形式にデータを変換
      const applicationData = {
        companyInfo: {
          name: formData.applicant.companyName,
          industry: formData.applicant.industry,
          employeeCount: formData.applicant.employeeCount,
          currentMinimumWage: formData.workplace.currentMinimumWage,
          regionalMinimumWage: 900, // デフォルト値（実際は地域に応じて取得）
          address: formData.applicant.address,
          businessType: formData.applicant.industry,
          yearlyRevenue: 50000000, // デフォルト値（フォームで収集していない）
        },
        wageIncreasePlan: {
          course: formData.selectedCourse.wageIncrease.toString() as '30' | '45' | '60' | '90',
          targetWage: formData.workplace.targetMinimumWage,
          affectedEmployees: formData.workplace.employeeCount,
          implementationDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30日後
          sustainabilityPlan: formData.wageIncreasePlan.sustainabilityMeasures || '生産性向上により継続的な賃金引上げを実現します。',
        },
        investmentPlan: {
          items: formData.equipmentPlan.equipmentList.map((equipment: any) => ({
            category: equipment.type || '機械装置',
            description: equipment.name || '生産性向上設備',
            cost: equipment.totalPrice || equipment.unitPrice * equipment.quantity || 1000000,
            vendor: equipment.supplier || '設備業者',
            expectedEffect: equipment.purpose || '作業効率の向上',
          })),
          totalCost: formData.equipmentPlan.totalInvestment || 1000000,
          financingMethod: '自己資金およびローン',
        },
        productivityPlan: {
          currentProductivity: formData.improvementPlan.currentSituation || '現在の生産性に課題があります。',
          targetProductivity: formData.improvementPlan.improvementGoals || '生産性の大幅な向上を目指します。',
          improvementMeasures: formData.improvementPlan.productivityImprovements.map((item: any) => item.item || '生産性向上施策') || [
            '設備導入による作業効率化',
            'デジタル化による業務改善',
            '従業員のスキルアップ'
          ],
          measurementMethod: '月次での生産量および品質指標による測定',
          expectedROI: 25, // 25%のROIを想定
        },
        businessPlan: {
          challenges: formData.improvementPlan.challenges || '現在の業務における課題を解決する必要があります。',
          objectives: formData.improvementPlan.improvementGoals || '生産性向上と賃金引上げを実現します。',
          implementation: formData.implementationStructure.riskManagement || '段階的な実施により確実な成果を上げます。',
          riskManagement: formData.implementationStructure.riskManagement || 'リスク要因を事前に把握し、適切な対策を講じます。',
          localContribution: '地域雇用の安定と経済活性化に貢献します。',
        },
      };

      // 業務改善助成金専用API呼び出し
      const response = await fetch('/api/business-improvement-subsidy/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        const result = await response.json();
        onComplete(result);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '申請書の生成に失敗しました');
      }
    } catch (error) {
      console.error('Error generating application:', error);
      setErrors({ submit: '申請書の生成に失敗しました。再度お試しください。' });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 申請者情報
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  事業所名 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.applicant.companyName}
                  onChange={(e) => updateFormData('applicant', { companyName: e.target.value })}
                  placeholder="株式会社○○"
                  error={errors.companyName}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  法人番号
                </label>
                <Input
                  value={formData.applicant.corporateNumber}
                  onChange={(e) => updateFormData('applicant', { corporateNumber: e.target.value })}
                  placeholder="1234567890123"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  代表者氏名 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.applicant.representativeName}
                  onChange={(e) => updateFormData('applicant', { representativeName: e.target.value })}
                  placeholder="山田太郎"
                  error={errors.representativeName}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  value={formData.applicant.phone}
                  onChange={(e) => updateFormData('applicant', { phone: e.target.value })}
                  placeholder="03-1234-5678"
                  error={errors.phone}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所在地 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.applicant.address}
                onChange={(e) => updateFormData('applicant', { address: e.target.value })}
                placeholder="東京都千代田区○○1-1-1"
                error={errors.address}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  業種 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.applicant.industry}
                  onChange={(e) => updateFormData('applicant', { industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                {errors.industry && (
                  <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  従業員数 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.applicant.employeeCount.toString()}
                  onChange={(e) => updateFormData('applicant', { employeeCount: parseInt(e.target.value) || 0 })}
                  placeholder="10"
                  error={errors.employeeCount}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  設立年
                </label>
                <Input
                  type="number"
                  value={formData.applicant.foundedYear.toString()}
                  onChange={(e) => updateFormData('applicant', { foundedYear: parseInt(e.target.value) || new Date().getFullYear() })}
                  placeholder="2020"
                />
              </div>
            </div>
          </div>
        );

      case 1: // 事業所情報
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  事業所名 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.workplace.workplaceName}
                  onChange={(e) => updateFormData('workplace', { workplaceName: e.target.value })}
                  placeholder="本社事業所"
                  error={errors.workplaceName}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  事業所責任者
                </label>
                <Input
                  value={formData.workplace.managerName}
                  onChange={(e) => updateFormData('workplace', { managerName: e.target.value })}
                  placeholder="田中次郎"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                事業所所在地
              </label>
              <Input
                value={formData.workplace.workplaceAddress}
                onChange={(e) => updateFormData('workplace', { workplaceAddress: e.target.value })}
                placeholder="東京都千代田区○○1-1-1"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現在の事業場内最低賃金（時給） <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.workplace.currentMinimumWage.toString()}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    updateFormData('workplace', { 
                      currentMinimumWage: value,
                      targetMinimumWage: value + formData.workplace.wageIncreaseAmount
                    });
                  }}
                  placeholder="900"
                  error={errors.currentMinimumWage}
                />
                <p className="text-xs text-gray-500 mt-1">1,000円未満である必要があります</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  賃金引上げ額（時給） <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.workplace.wageIncreaseAmount.toString()}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    updateFormData('workplace', { 
                      wageIncreaseAmount: value,
                      targetMinimumWage: formData.workplace.currentMinimumWage + value
                    });
                  }}
                  placeholder="60"
                  error={errors.wageIncreaseAmount}
                />
                <p className="text-xs text-gray-500 mt-1">30円以上200円以下</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  引上げ後の最低賃金（時給）
                </label>
                <Input
                  type="number"
                  value={formData.workplace.targetMinimumWage.toString()}
                  readOnly
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">自動計算</p>
              </div>
            </div>
          </div>
        );

      case 2: // コース選択
        return (
          <div className="space-y-6">
            <Alert variant="info">
              <InformationCircleIcon className="h-5 w-5" />
              <div>
                <p className="font-medium">コース選択について</p>
                <p className="text-sm mt-1">
                  賃金引上げ額に応じて申請可能なコースが決まります。
                  コースによって助成金の上限額と対象従業員数が異なります。
                </p>
              </div>
            </Alert>
            
            <div className="grid gap-4">
              {courses.map((course) => {
                const isRecommended = course.wageIncrease === formData.workplace.wageIncreaseAmount;
                const isAvailable = course.wageIncrease <= formData.workplace.wageIncreaseAmount;
                
                return (
                  <div
                    key={course.name}
                    className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.selectedCourse.courseName === course.name
                        ? 'border-blue-500 bg-blue-50'
                        : isAvailable
                        ? 'border-gray-300 hover:border-gray-400'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    }`}
                    onClick={() => {
                      if (isAvailable) {
                        updateFormData('selectedCourse', course);
                      }
                    }}
                  >
                    {isRecommended && (
                      <Badge variant="success" className="absolute top-2 right-2">
                        推奨
                      </Badge>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        checked={formData.selectedCourse.courseName === course.name}
                        onChange={() => {}}
                        disabled={!isAvailable}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{course.name}</h3>
                        <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-gray-600">賃金引上げ:</span>
                            <span className="font-medium ml-1">+{course.wageIncrease}円/時</span>
                          </div>
                          <div>
                            <span className="text-gray-600">助成上限:</span>
                            <span className="font-medium ml-1 text-blue-600">
                              {course.maxSubsidy.toLocaleString()}円
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">対象:</span>
                            <span className="font-medium ml-1">{course.requiredEmployees}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 7: // 確認・生成
        return (
          <div className="space-y-6">
            <Alert variant="info">
              <CheckCircleIcon className="h-5 w-5" />
              <div>
                <p className="font-medium">申請書生成の準備が整いました</p>
                <p className="text-sm mt-1">
                  入力された情報をもとに、AIが業務改善助成金の申請書を自動生成します。
                  生成には数分かかる場合があります。
                </p>
              </div>
            </Alert>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">入力内容サマリー</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">申請者:</span>
                  <span className="font-medium">{formData.applicant.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">選択コース:</span>
                  <span className="font-medium">{formData.selectedCourse.courseName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">賃金引上げ:</span>
                  <span className="font-medium">
                    {formData.workplace.currentMinimumWage}円 → {formData.workplace.targetMinimumWage}円
                    （+{formData.workplace.wageIncreaseAmount}円）
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">申請予定額:</span>
                  <span className="font-medium text-blue-600">
                    最大 {formData.selectedCourse.maxSubsidy.toLocaleString()}円
                  </span>
                </div>
              </div>
            </div>

            {errors.submit && (
              <Alert variant="error">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <p>{errors.submit}</p>
              </Alert>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">このステップは開発中です。</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* プログレスバー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">業務改善助成金申請書作成</h2>
          <Badge variant="primary">
            ステップ {currentStep + 1} / {steps.length}
          </Badge>
        </div>
        <Progress value={(currentStep / (steps.length - 1)) * 100} className="mb-4" />
        
        {/* ステップナビゲーション */}
        <div className="flex items-center space-x-4 overflow-x-auto pb-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div
                key={step.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : isCompleted 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{step.title}</span>
                {isCompleted && <CheckCircleIcon className="h-4 w-4" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ステップ内容 */}
      <Card className="mb-8">
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h3>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>
          
          {renderStepContent()}
        </div>
      </Card>

      {/* ナビゲーションボタン */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          前へ
        </Button>
        
        <div className="space-x-3">
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              次へ
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  申請書生成中...
                </>
              ) : (
                <>
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  申請書を生成
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}