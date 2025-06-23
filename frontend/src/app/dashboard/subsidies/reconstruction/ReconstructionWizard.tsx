'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  TrendingDown, 
  Target, 
  Lightbulb, 
  BarChart3, 
  Calculator,
  Calendar,
  FileCheck,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Step Components
import { EligibilityStep } from './steps/EligibilityStep';
import { CurrentBusinessStep } from './steps/CurrentBusinessStep';
import { ReconstructionPlanStep } from './steps/ReconstructionPlanStep';
import { NewBusinessStep } from './steps/NewBusinessStep';
import { MarketAnalysisStep } from './steps/MarketAnalysisStep';
import { FinancialPlanStep } from './steps/FinancialPlanStep';
import { ImplementationStep } from './steps/ImplementationStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { ReviewStep } from './steps/ReviewStep';

interface WizardData {
  eligibility?: any;
  currentBusiness?: any;
  reconstructionPlan?: any;
  newBusiness?: any;
  marketAnalysis?: any;
  financialPlan?: any;
  implementation?: any;
  documents?: any;
}

interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  isOptional?: boolean;
  estimatedTime?: number;
}

const wizardSteps: StepConfig[] = [
  {
    id: 'eligibility',
    title: '申請資格確認',
    description: '売上減少率と基本要件を確認',
    icon: FileCheck,
    component: EligibilityStep,
    estimatedTime: 5
  },
  {
    id: 'current-business',
    title: '現在の事業',
    description: '現在の事業内容と課題の分析',
    icon: Building2,
    component: CurrentBusinessStep,
    estimatedTime: 15
  },
  {
    id: 'reconstruction-plan',
    title: '再構築計画',
    description: '再構築の種類と方向性を決定',
    icon: Target,
    component: ReconstructionPlanStep,
    estimatedTime: 20
  },
  {
    id: 'new-business',
    title: '新規事業',
    description: '新規事業の詳細内容を計画',
    icon: Lightbulb,
    component: NewBusinessStep,
    estimatedTime: 25
  },
  {
    id: 'market-analysis',
    title: '市場分析',
    description: '市場性と競合優位性を分析',
    icon: BarChart3,
    component: MarketAnalysisStep,
    estimatedTime: 20
  },
  {
    id: 'financial-plan',
    title: '資金計画',
    description: '投資計画と収益予測を策定',
    icon: Calculator,
    component: FinancialPlanStep,
    estimatedTime: 30
  },
  {
    id: 'implementation',
    title: '実施計画',
    description: 'スケジュールと体制を計画',
    icon: Calendar,
    component: ImplementationStep,
    estimatedTime: 15
  },
  {
    id: 'documents',
    title: '必要書類',
    description: '認定支援機関と添付書類の準備',
    icon: FileCheck,
    component: DocumentsStep,
    estimatedTime: 10
  },
  {
    id: 'review',
    title: '確認・生成',
    description: '申請書の最終確認と生成',
    icon: CheckCircle,
    component: ReviewStep,
    estimatedTime: 10
  }
];

export function ReconstructionWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);

  // ドラフトの自動保存
  useEffect(() => {
    const autoSave = setTimeout(() => {
      saveDraft();
    }, 30000); // 30秒ごと

    return () => clearTimeout(autoSave);
  }, [wizardData]);

  // 初回ロード時にドラフトを復元
  useEffect(() => {
    loadDraft();
  }, []);

  const saveDraft = async () => {
    try {
      const response = await fetch('/api/reconstruction-subsidy/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          applicationData: wizardData,
          step: currentStep
        })
      });

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const loadDraft = async () => {
    try {
      const response = await fetch('/api/reconstruction-subsidy/load-draft', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.draft) {
          setWizardData(result.draft.data || {});
          setCurrentStep(result.draft.currentStep || 0);
          setLastSaved(new Date(result.draft.lastSaved));
        }
      }
    } catch (error) {
      console.error('Draft load error:', error);
    }
  };

  const handleStepComplete = (stepData: any) => {
    const currentStepId = wizardSteps[currentStep].id;
    
    setWizardData(prev => ({
      ...prev,
      [currentStepId]: stepData
    }));

    // 申請資格確認ステップの特別処理
    if (currentStepId === 'eligibility') {
      setEligibilityResult(stepData);
      
      // 申請不可の場合は警告を表示
      if (!stepData.eligible) {
        toast.error('申請要件を満たしていません。詳細を確認してください。');
        return;
      }
    }

    // 次のステップに進む
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      toast.success(`${wizardSteps[currentStep].title}を完了しました`);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // 資格確認が未完了の場合は最初のステップまでしか進めない
    if (!eligibilityResult?.eligible && stepIndex > 0) {
      toast.warning('まず申請資格の確認を完了してください');
      return;
    }
    
    setCurrentStep(stepIndex);
  };

  const handleGenerateApplication = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/reconstruction-subsidy/generate-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(wizardData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('事業再構築補助金申請書を生成しました！');
        
        // 生成結果をセッションストレージに保存
        sessionStorage.setItem('generatedApplication', JSON.stringify({
          type: 'reconstruction',
          data: result,
          generatedAt: new Date().toISOString()
        }));
        
        router.push(`/dashboard/applications/${result.applicationId}`);
      } else {
        throw new Error(result.message || '申請書の生成に失敗しました');
      }
    } catch (error) {
      console.error('Application generation error:', error);
      toast.error(error instanceof Error ? error.message : '申請書の生成中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepConfig = wizardSteps[currentStep];
  const CurrentStepComponent = currentStepConfig.component;
  const progress = ((currentStep + 1) / wizardSteps.length) * 100;
  
  // 完了したステップ数を計算
  const completedSteps = Object.keys(wizardData).length;
  const totalEstimatedTime = wizardSteps.reduce((sum, step) => sum + (step.estimatedTime || 0), 0);
  const remainingTime = wizardSteps.slice(currentStep).reduce((sum, step) => sum + (step.estimatedTime || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                ← 戻る
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  事業再構築補助金申請
                </h1>
                <p className="text-sm text-gray-500">
                  最大1億5000万円の大型補助金に対応
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {lastSaved && (
                <div className="text-sm text-gray-500">
                  <Save className="w-4 h-4 inline mr-1" />
                  {lastSaved.toLocaleTimeString()}に保存
                </div>
              )}
              <Badge variant="info">
                残り約{remainingTime}分
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ステップナビゲーション */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">申請の進捗</CardTitle>
                <Progress value={progress} className="mt-2" />
                <p className="text-sm text-gray-600 mt-1">
                  {completedSteps} / {wizardSteps.length} ステップ完了
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {wizardSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = wizardData[step.id];
                  const isCurrent = index === currentStep;
                  const isAccessible = index === 0 || eligibilityResult?.eligible || index <= currentStep;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(index)}
                      disabled={!isAccessible}
                      className={`
                        w-full text-left p-3 rounded-lg transition-all
                        ${isCurrent 
                          ? 'bg-blue-50 border-2 border-blue-200 text-blue-900' 
                          : isCompleted 
                            ? 'bg-green-50 border border-green-200 text-green-900 hover:bg-green-100'
                            : isAccessible
                              ? 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                              : 'bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center mr-3
                          ${isCurrent 
                            ? 'bg-blue-500 text-white'
                            : isCompleted 
                              ? 'bg-green-500 text-white'
                              : isAccessible
                                ? 'bg-gray-300 text-gray-600'
                                : 'bg-gray-200 text-gray-400'
                          }
                        `}>
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{step.title}</div>
                          <div className="text-xs opacity-75">{step.description}</div>
                          {step.estimatedTime && (
                            <div className="text-xs opacity-60 mt-1">
                              約{step.estimatedTime}分
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* 申請資格の状況表示 */}
            {eligibilityResult && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    {eligibilityResult.eligible ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                    )}
                    申請資格
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>売上減少率</span>
                      <span className={`font-medium ${eligibilityResult.sales_decline_rate >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                        {eligibilityResult.sales_decline_rate?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>最大補助金額</span>
                      <span className="font-medium text-blue-600">
                        ¥{eligibilityResult.max_subsidy_amount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* メインコンテンツ */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <currentStepConfig.icon className="w-6 h-6 mr-2" />
                      {currentStepConfig.title}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">{currentStepConfig.description}</p>
                  </div>
                  <Badge variant="secondary">
                    ステップ {currentStep + 1} / {wizardSteps.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CurrentStepComponent
                  data={wizardData[currentStepConfig.id] || {}}
                  onComplete={handleStepComplete}
                  onSave={(data: any) => setWizardData(prev => ({ ...prev, [currentStepConfig.id]: data }))}
                  eligibilityResult={eligibilityResult}
                  allData={wizardData}
                />
              </CardContent>
            </Card>

            {/* ナビゲーションボタン */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                前のステップ
              </Button>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={saveDraft}
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  ドラフト保存
                </Button>

                {currentStep === wizardSteps.length - 1 ? (
                  <Button
                    onClick={handleGenerateApplication}
                    disabled={isLoading || !eligibilityResult?.eligible}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        申請書生成中...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4 mr-2" />
                        申請書を生成
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    disabled={!wizardData[currentStepConfig.id] || (currentStep === 0 && !eligibilityResult?.eligible)}
                  >
                    次のステップ
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}