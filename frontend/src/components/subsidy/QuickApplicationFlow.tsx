'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Building2, 
  Calculator,
  TrendingUp,
  DollarSign,
  FileText,
  Download,
  Sparkles
} from 'lucide-react';
import { SUCCESS_PATTERNS } from '@/data/gyomu-kaizen-success-patterns';
import { DocumentGenerator } from '@/utils/document-generator';
import { AIReviewer } from '@/services/ai-reviewer';
import { AIReviewResult } from '@/types/success-patterns';

interface StepData {
  step1?: {
    companyName: string;
    industry: string;
    employeeCount: string;
    currentMinimumWage: string;
  };
  step2?: {
    equipment: string;
    productivityMetric: string;
    improvementRate: string;
  };
  step3?: {
    targetWage: string;
    targetEmployeeCount: string;
    wageIncreaseDate: string;
  };
  step4?: {
    equipmentCost: string;
    installationCost: string;
    otherCost: string;
    totalCost: string;
  };
  step5?: {
    productivityPlan: string;
    necessity: string;
    effectiveness: string;
  };
}

const steps = [
  { 
    id: 1, 
    title: '基本情報', 
    icon: Building2,
    description: '事業者の基本情報を入力'
  },
  { 
    id: 2, 
    title: '生産性向上設備', 
    icon: TrendingUp,
    description: '導入する設備と効果を選択'
  },
  { 
    id: 3, 
    title: '賃金引上げ計画', 
    icon: DollarSign,
    description: '賃金引上げの詳細を設定'
  },
  { 
    id: 4, 
    title: '経費計算', 
    icon: Calculator,
    description: '必要経費を算出'
  },
  { 
    id: 5, 
    title: '申請書作成', 
    icon: FileText,
    description: 'AIが申請書を自動生成'
  }
];

export default function QuickApplicationFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<StepData>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [reviewResult, setReviewResult] = useState<AIReviewResult | null>(null);
  const [showReview, setShowReview] = useState(false);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateStepData = (step: keyof StepData, data: any) => {
    setStepData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }));
  };

  const generateApplication = async () => {
    setIsGenerating(true);
    try {
      // 業界別の成功パターンを取得
      const industryPattern = SUCCESS_PATTERNS.find(
        p => p.industry === stepData.step1?.industry
      );

      // 文章を生成
      const productivityPlan = `
【導入設備】
${stepData.step2?.equipment}

【期待される効果】
${industryPattern?.patterns.productivityMetrics[0]?.improvementTarget || '生産性30%向上'}を目指します。
${industryPattern?.patterns.productivityMetrics[0]?.name || ''}の測定により、${stepData.step2?.improvementRate || '30'}%の改善効果を検証します。

【必要性】
${stepData.step5?.necessity || ''}

【実現可能性】
${industryPattern?.patterns.commonPhrases[0] || '具体的な数値目標を設定し、PDCAサイクルで継続的に改善を行います。'}

【持続可能性】
生産性向上により生み出される収益増加分を従業員の賃金引上げ原資として確保します。
`;

      const applicationData = {
        companyName: stepData.step1?.companyName,
        industry: stepData.step1?.industry,
        employeeCount: stepData.step1?.employeeCount,
        currentMinimumWage: stepData.step1?.currentMinimumWage,
        equipment: stepData.step2?.equipment,
        productivityPlan,
        targetWage: stepData.step3?.targetWage,
        targetEmployeeCount: stepData.step3?.targetEmployeeCount,
        wageIncreaseDate: stepData.step3?.wageIncreaseDate,
        totalCost: stepData.step4?.totalCost,
        costBreakdown: `
設備費: ${stepData.step4?.equipmentCost}円
設置費: ${stepData.step4?.installationCost}円
その他: ${stepData.step4?.otherCost}円
`
      };

      setGeneratedContent(applicationData);

      // AI審査を実行
      if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        const reviewer = new AIReviewer(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
        const review = await reviewer.reviewApplication(applicationData);
        setReviewResult(review);
      }
    } catch (error) {
      console.error('生成エラー:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (generatedContent) {
      await DocumentGenerator.generatePDF(generatedContent, 'gyomu-kaizen');
    }
  };

  const downloadDOCX = async () => {
    if (generatedContent) {
      await DocumentGenerator.generateDOCX(generatedContent);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">事業者名</Label>
              <Input
                id="companyName"
                value={stepData.step1?.companyName || ''}
                onChange={(e) => updateStepData('step1', { companyName: e.target.value })}
                placeholder="株式会社〇〇"
              />
            </div>
            <div>
              <Label htmlFor="industry">業種</Label>
              <Select
                value={stepData.step1?.industry || ''}
                onValueChange={(value) => updateStepData('step1', { industry: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="業種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="製造業">製造業</SelectItem>
                  <SelectItem value="飲食サービス業">飲食サービス業</SelectItem>
                  <SelectItem value="小売業">小売業</SelectItem>
                  <SelectItem value="介護・福祉">介護・福祉</SelectItem>
                  <SelectItem value="建設業">建設業</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employeeCount">従業員数</Label>
              <Input
                id="employeeCount"
                type="number"
                value={stepData.step1?.employeeCount || ''}
                onChange={(e) => updateStepData('step1', { employeeCount: e.target.value })}
                placeholder="10"
              />
            </div>
            <div>
              <Label htmlFor="currentMinimumWage">現在の最低賃金（時給）</Label>
              <Input
                id="currentMinimumWage"
                type="number"
                value={stepData.step1?.currentMinimumWage || ''}
                onChange={(e) => updateStepData('step1', { currentMinimumWage: e.target.value })}
                placeholder="1000"
              />
            </div>
          </div>
        );

      case 2:
        const industryPattern = SUCCESS_PATTERNS.find(
          p => p.industry === stepData.step1?.industry
        );
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="equipment">導入予定の設備</Label>
              <Select
                value={stepData.step2?.equipment || ''}
                onValueChange={(value) => updateStepData('step2', { equipment: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="設備を選択" />
                </SelectTrigger>
                <SelectContent>
                  {industryPattern?.patterns.equipmentTypes.map((eq, idx) => (
                    <SelectItem key={idx} value={eq.name}>
                      {eq.name} - {eq.effect}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="productivityMetric">生産性向上指標</Label>
              <Select
                value={stepData.step2?.productivityMetric || ''}
                onValueChange={(value) => updateStepData('step2', { productivityMetric: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="指標を選択" />
                </SelectTrigger>
                <SelectContent>
                  {industryPattern?.patterns.productivityMetrics.map((metric, idx) => (
                    <SelectItem key={idx} value={metric.name}>
                      {metric.name} - {metric.improvementTarget}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="improvementRate">期待される生産性向上率（%）</Label>
              <Input
                id="improvementRate"
                type="number"
                value={stepData.step2?.improvementRate || ''}
                onChange={(e) => updateStepData('step2', { improvementRate: e.target.value })}
                placeholder="30"
              />
            </div>
            {industryPattern && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  {industryPattern.industry}の成功事例：{industryPattern.patterns.commonPhrases[0]}
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="targetWage">引上げ後の時給</Label>
              <Input
                id="targetWage"
                type="number"
                value={stepData.step3?.targetWage || ''}
                onChange={(e) => updateStepData('step3', { targetWage: e.target.value })}
                placeholder="1100"
              />
            </div>
            <div>
              <Label htmlFor="targetEmployeeCount">引上げ対象労働者数</Label>
              <Input
                id="targetEmployeeCount"
                type="number"
                value={stepData.step3?.targetEmployeeCount || ''}
                onChange={(e) => updateStepData('step3', { targetEmployeeCount: e.target.value })}
                placeholder="5"
              />
            </div>
            <div>
              <Label htmlFor="wageIncreaseDate">賃金引上げ実施予定日</Label>
              <Input
                id="wageIncreaseDate"
                type="date"
                value={stepData.step3?.wageIncreaseDate || ''}
                onChange={(e) => updateStepData('step3', { wageIncreaseDate: e.target.value })}
              />
            </div>
            <Alert>
              <AlertDescription>
                賃金引上げ額: {Number(stepData.step3?.targetWage || 0) - Number(stepData.step1?.currentMinimumWage || 0)}円/時間
              </AlertDescription>
            </Alert>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="equipmentCost">設備費</Label>
              <Input
                id="equipmentCost"
                type="number"
                value={stepData.step4?.equipmentCost || ''}
                onChange={(e) => {
                  updateStepData('step4', { equipmentCost: e.target.value });
                  calculateTotal();
                }}
                placeholder="1000000"
              />
            </div>
            <div>
              <Label htmlFor="installationCost">設置費</Label>
              <Input
                id="installationCost"
                type="number"
                value={stepData.step4?.installationCost || ''}
                onChange={(e) => {
                  updateStepData('step4', { installationCost: e.target.value });
                  calculateTotal();
                }}
                placeholder="200000"
              />
            </div>
            <div>
              <Label htmlFor="otherCost">その他経費</Label>
              <Input
                id="otherCost"
                type="number"
                value={stepData.step4?.otherCost || ''}
                onChange={(e) => {
                  updateStepData('step4', { otherCost: e.target.value });
                  calculateTotal();
                }}
                placeholder="100000"
              />
            </div>
            <Alert>
              <AlertDescription className="text-lg font-semibold">
                総額: {stepData.step4?.totalCost || 0}円
              </AlertDescription>
            </Alert>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            {!generatedContent ? (
              <>
                <div>
                  <Label htmlFor="necessity">導入の必要性（追加情報）</Label>
                  <Textarea
                    id="necessity"
                    value={stepData.step5?.necessity || ''}
                    onChange={(e) => updateStepData('step5', { necessity: e.target.value })}
                    placeholder="現在の課題や導入による改善点を具体的に記載"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={generateApplication}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>生成中...</>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AIで申請書を生成
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    申請書が生成されました！
                  </AlertDescription>
                </Alert>
                
                {reviewResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">AI審査結果</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>総合スコア:</span>
                          <span className="font-semibold">{reviewResult.overallScore}/100</span>
                        </div>
                        <Progress value={reviewResult.overallScore} className="h-2" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowReview(!showReview)}
                        >
                          詳細を{showReview ? '隠す' : '表示'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button onClick={downloadPDF} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  <Button onClick={downloadDOCX} variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Word
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  const calculateTotal = () => {
    const equipment = Number(stepData.step4?.equipmentCost || 0);
    const installation = Number(stepData.step4?.installationCost || 0);
    const other = Number(stepData.step4?.otherCost || 0);
    const total = equipment + installation + other;
    
    setStepData(prev => ({
      ...prev,
      step4: {
        ...prev.step4,
        equipmentCost: String(equipment),
        installationCost: String(installation),
        otherCost: String(other),
        totalCost: String(total)
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>業務改善助成金 クイック申請</CardTitle>
          <Progress value={(currentStep / 5) * 100} className="mt-4" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-8">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    currentStep >= step.id ? 'text-primary' : 'text-gray-400'
                  }`}
                >
                  <Icon className="h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
              );
            })}
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">
              {steps[currentStep - 1].title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {steps[currentStep - 1].description}
            </p>
            {renderStepContent()}
          </div>

          <div className="flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              前へ
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep === 5 || (currentStep === 5 && !generatedContent)}
            >
              次へ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {showReview && reviewResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>AI審査詳細結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">セクション別スコア</h4>
                <div className="space-y-2">
                  {Object.entries(reviewResult.sectionScores).map(([key, score]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <span>{score}/100</span>
                    </div>
                  ))}
                </div>
              </div>

              {reviewResult.weakPoints.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">改善が必要な点</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {reviewResult.weakPoints.map((point, idx) => (
                      <li key={idx} className="text-sm">
                        {point.issue} ({point.severity})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {reviewResult.suggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">改善提案</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {reviewResult.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm">
                        {suggestion.section}: {suggestion.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Alert>
                <AlertDescription>
                  改善可能性スコア: {reviewResult.improvementPotential}/100
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}