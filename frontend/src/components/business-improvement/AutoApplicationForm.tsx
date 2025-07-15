'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Sparkles, 
  Download, 
  Eye, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { BusinessImprovementAI, CompanyProfile, AIAnalysisResult } from '@/services/business-improvement-ai';
import { EQUIPMENT_CATEGORIES, SUBSIDY_RATES } from '@/data/business-improvement-guideline';
import { generateBusinessImprovementWord } from '@/utils/business-improvement-pdf';
import SafePDFButton from '@/components/ui/SafePDFButton';
import { Tooltip } from '@/components/ui/Tooltip';

interface FormData extends CompanyProfile {
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export default function AutoApplicationForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    industry: '',
    employeeCount: 0,
    currentMinWage: 1000,
    targetWageIncrease: 45,
    businessChallenges: [],
    currentProcesses: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<Record<string, boolean>>({});
  const [generatedApplication, setGeneratedApplication] = useState<any>(null);

  const steps = [
    { id: 1, title: '企業情報', icon: '🏢' },
    { id: 2, title: '業務課題', icon: '⚠️' },
    { id: 3, title: 'AI分析', icon: '🤖' },
    { id: 4, title: '申請書生成', icon: '📄' },
    { id: 5, title: '最終確認', icon: '✅' }
  ];

  const industries = [
    '製造業', '建設業', '運輸業', '飲食サービス業', 
    '小売業', '介護・福祉', 'IT・情報通信業', 'その他'
  ];

  const commonChallenges = [
    '人手不足', '作業効率の低下', '品質のばらつき', 'コスト増加',
    '納期遅延', '従業員の負担増', '競争力低下', 'デジタル化の遅れ'
  ];

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChallengeToggle = (challenge: string) => {
    setFormData(prev => ({
      ...prev,
      businessChallenges: prev.businessChallenges.includes(challenge)
        ? prev.businessChallenges.filter(c => c !== challenge)
        : [...prev.businessChallenges, challenge]
    }));
  };

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

  const performAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not found');
      }

      const ai = new BusinessImprovementAI(apiKey);
      const result = await ai.analyzeAndGenerate(formData);
      setAnalysisResult(result);
      
      // 申請書データの構築
      buildApplicationData(result);
    } catch (error) {
      console.error('AI分析エラー:', error);
      alert('AI分析中にエラーが発生しました。しばらく時間をおいてから再試行してください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const buildApplicationData = (result: AIAnalysisResult) => {
    const courseInfo = SUBSIDY_RATES.courses.find(c => 
      c.name === result.recommendedCourse
    ) || SUBSIDY_RATES.courses[1];

    const maxAmount = Object.values(courseInfo.maxAmount)[
      formData.employeeCount <= 1 ? 0 :
      formData.employeeCount <= 3 ? 1 :
      formData.employeeCount <= 6 ? 2 : 3
    ];

    setGeneratedApplication({
      basicInfo: {
        companyName: formData.name,
        representative: formData.contactPerson,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        industry: formData.industry,
        employeeCount: formData.employeeCount
      },
      course: {
        name: result.recommendedCourse,
        wageIncrease: courseInfo.wageIncrease,
        targetEmployees: formData.employeeCount,
        maxSubsidy: maxAmount
      },
      equipment: result.recommendedEquipment,
      plan: {
        necessity: result.generatedSections.necessity,
        businessPlan: result.generatedSections.plan,
        effectPlan: result.generatedSections.effect,
        sustainability: result.generatedSections.sustainability
      },
      costs: {
        equipmentCost: result.recommendedEquipment.estimatedCost,
        totalCost: result.recommendedEquipment.estimatedCost,
        subsidyAmount: Math.min(
          result.recommendedEquipment.estimatedCost * courseInfo.subsidyRate,
          maxAmount
        )
      }
    });
  };

  const optimizeSection = async (section: string, currentText: string) => {
    setIsOptimizing(prev => ({ ...prev, [section]: true }));
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API key not found');

      const ai = new BusinessImprovementAI(apiKey);
      const optimizedText = await ai.optimizeApplicationText(currentText, section, formData);
      
      setGeneratedApplication((prev: any) => ({
        ...prev,
        plan: {
          ...prev.plan,
          [section]: optimizedText
        }
      }));
    } catch (error) {
      console.error('最適化エラー:', error);
      alert('文章の最適化中にエラーが発生しました。');
    } finally {
      setIsOptimizing(prev => ({ ...prev, [section]: false }));
    }
  };

  const downloadApplicationWord = () => {
    if (!generatedApplication) return;
    generateBusinessImprovementWord(generatedApplication);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">事業者名 *</Label>
                <Input
                  id="companyName"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="株式会社〇〇"
                />
              </div>
              <div>
                <Label htmlFor="industry">業種 *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => handleInputChange('industry', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="業種を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeCount">従業員数 *</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  value={formData.employeeCount || ''}
                  onChange={(e) => handleInputChange('employeeCount', parseInt(e.target.value) || 0)}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="currentMinWage">現在の最低賃金（時給）*</Label>
                <Input
                  id="currentMinWage"
                  type="number"
                  value={formData.currentMinWage}
                  onChange={(e) => handleInputChange('currentMinWage', parseInt(e.target.value) || 0)}
                  placeholder="1000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="targetWageIncrease">希望賃金引上げ額（円/時間）*</Label>
              <Select
                value={formData.targetWageIncrease.toString()}
                onValueChange={(value) => handleInputChange('targetWageIncrease', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="引上げ額を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30円（30円コース）</SelectItem>
                  <SelectItem value="45">45円（45円コース）</SelectItem>
                  <SelectItem value="60">60円（60円コース）</SelectItem>
                  <SelectItem value="90">90円（90円コース）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPerson">担当者名 *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  placeholder="山田太郎"
                />
              </div>
              <div>
                <Label htmlFor="phone">電話番号 *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="03-1234-5678"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@company.co.jp"
              />
            </div>

            <div>
              <Label htmlFor="address">所在地 *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="東京都〇〇区〇〇 1-2-3"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>現在の業務課題（複数選択可）*</Label>
              <div className="grid md:grid-cols-2 gap-2 mt-3">
                {commonChallenges.map(challenge => (
                  <label key={challenge} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.businessChallenges.includes(challenge)}
                      onChange={() => handleChallengeToggle(challenge)}
                      className="rounded"
                    />
                    <span className="text-sm">{challenge}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="currentProcesses">現在の業務プロセス（詳細）*</Label>
              <Textarea
                id="currentProcesses"
                value={formData.currentProcesses}
                onChange={(e) => handleInputChange('currentProcesses', e.target.value)}
                placeholder="現在の業務の流れ、作業手順、使用している設備や手法について具体的に記述してください"
                rows={6}
              />
            </div>

            {formData.businessChallenges.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  選択された課題: {formData.businessChallenges.join('、')}
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {!analysisResult ? (
              <div className="text-center py-8">
                <div className="mb-6">
                  <TrendingUp className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">AI分析を開始</h3>
                  <p className="text-gray-600">
                    入力された情報を基に、最適な申請戦略を分析します
                  </p>
                </div>
                <Button
                  onClick={performAIAnalysis}
                  disabled={isAnalyzing}
                  className="px-8 py-3"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI分析を開始
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <h4 className="font-semibold text-green-800">AI分析完了</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">総合スコア:</span>
                      <span className="font-semibold ml-2">{analysisResult.overallScore}/100</span>
                    </div>
                    <div>
                      <span className="text-green-700">推定採択率:</span>
                      <span className="font-semibold ml-2">{analysisResult.estimatedApprovalRate}%</span>
                    </div>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">推奨申請戦略</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h5 className="font-semibold mb-2">推奨コース</h5>
                      <p className="text-sm bg-blue-50 p-3 rounded">
                        {analysisResult.recommendedCourse}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-semibold mb-2">推奨設備</h5>
                      <div className="text-sm bg-blue-50 p-3 rounded">
                        <p><strong>設備:</strong> {analysisResult.recommendedEquipment.equipment}</p>
                        <p><strong>推定費用:</strong> {analysisResult.recommendedEquipment.estimatedCost.toLocaleString()}円</p>
                        <p><strong>期待効果:</strong> {analysisResult.recommendedEquipment.expectedEffect}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {analysisResult.improvementSuggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">改善提案</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {analysisResult.improvementSuggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {generatedApplication && (
              <>
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    AIが申請書を自動生成しました。各セクションの内容を確認し、必要に応じて最適化できます。
                  </AlertDescription>
                </Alert>

                {Object.entries({
                  necessity: '導入の必要性',
                  businessPlan: '事業実施計画',
                  effectPlan: '効果・目標',
                  sustainability: '持続性・発展性'
                }).map(([key, title]) => (
                  <Card key={key}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <Tooltip content="AI文章最適化" placement="top">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => optimizeSection(key, generatedApplication.plan[key])}
                            disabled={isOptimizing[key]}
                          >
                            {isOptimizing[key] ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            {isOptimizing[key] ? '最適化中...' : 'AI最適化'}
                          </Button>
                        </Tooltip>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={generatedApplication.plan[key]}
                        onChange={(e) => setGeneratedApplication((prev: any) => ({
                          ...prev,
                          plan: { ...prev.plan, [key]: e.target.value }
                        }))}
                        rows={8}
                        className="text-sm"
                      />
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {generatedApplication && (
              <>
                <Alert className="bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    申請書の作成が完了しました！内容を最終確認してダウンロードしてください。
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>申請概要</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>事業者名:</span>
                        <span className="font-semibold">{generatedApplication.basicInfo.companyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>申請コース:</span>
                        <span className="font-semibold">{generatedApplication.course.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>設備名:</span>
                        <span className="font-semibold">{generatedApplication.equipment.equipment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>設備費:</span>
                        <span className="font-semibold">{generatedApplication.costs.equipmentCost.toLocaleString()}円</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>助成金試算</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>総事業費:</span>
                        <span className="font-semibold">{generatedApplication.costs.totalCost.toLocaleString()}円</span>
                      </div>
                      <div className="flex justify-between">
                        <span>申請助成額:</span>
                        <span className="font-semibold text-blue-600">{generatedApplication.costs.subsidyAmount.toLocaleString()}円</span>
                      </div>
                      <div className="flex justify-between">
                        <span>助成率:</span>
                        <span className="font-semibold">{Math.round((generatedApplication.costs.subsidyAmount / generatedApplication.costs.totalCost) * 100)}%</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>自己負担額:</span>
                        <span className="font-semibold">{(generatedApplication.costs.totalCost - generatedApplication.costs.subsidyAmount).toLocaleString()}円</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-4 justify-center">
                  {generatedApplication && (
                    <SafePDFButton 
                      data={generatedApplication} 
                      fileName={`業務改善助成金申請書_${generatedApplication.basicInfo.companyName}_${new Date().toISOString().split('T')[0]}.pdf`}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8"
                    />
                  )}
                  <Tooltip content="Word形式でダウンロード" placement="top">
                    <Button variant="outline" onClick={downloadApplicationWord}>
                      <Download className="h-4 w-4 mr-2" />
                      テキスト形式
                    </Button>
                  </Tooltip>
                  <Tooltip content="申請内容を確認" placement="top">
                    <Button variant="outline" onClick={() => setCurrentStep(4)}>
                      <Eye className="h-4 w-4 mr-2" />
                      内容を再確認
                    </Button>
                  </Tooltip>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">業務改善助成金 AI申請書作成</h1>
        <p className="text-gray-600">
          AIが最適な申請戦略を分析し、採択確率を最大化する申請書を自動生成します
        </p>
      </div>

      {/* プログレスバー */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map(step => (
            <div
              key={step.id}
              className={`flex items-center ${
                step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step.id <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {step.id < currentStep ? '✓' : step.icon}
              </div>
              <span className="ml-2 text-sm font-medium hidden md:block">{step.title}</span>
            </div>
          ))}
        </div>
        <Progress value={(currentStep / 5) * 100} className="h-2" />
      </div>

      {/* ステップコンテンツ */}
      <Card>
        <CardHeader>
          <CardTitle>
            ステップ {currentStep}: {steps[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* ナビゲーションボタン */}
      <div className="flex justify-between mt-6">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          variant="outline"
        >
          前へ
        </Button>
        <Button
          onClick={handleNext}
          disabled={
            currentStep === 5 ||
            (currentStep === 3 && !analysisResult) ||
            (currentStep === 4 && !generatedApplication)
          }
        >
          {currentStep === 5 ? '完了' : '次へ'}
        </Button>
      </div>
    </div>
  );
}