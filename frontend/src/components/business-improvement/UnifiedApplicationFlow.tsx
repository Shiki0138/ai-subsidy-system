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
  FileText,
  ChevronRight,
  CheckCircle,
  Edit3,
  Copy,
  RefreshCw,
  Save,
  Clock,
  Trash2
} from 'lucide-react';
import { BusinessImprovementAI, CompanyProfile } from '@/services/business-improvement-ai';
import { generateBusinessImprovementPDF, generateBusinessImprovementWord } from '@/utils/business-improvement-pdf';

interface BasicInfo {
  companyName: string;
  industry: string;
  employeeCount: number;
  currentMinWage: number;
  targetWageIncrease: number;
  representative: string;
  phone: string;
  email: string;
  address: string;
  currentChallenges: string;
  currentProcesses: string;
  desiredEquipment?: string;
}

interface GeneratedContent {
  necessity: string;
  businessPlan: string;
  effectPlan: string;
  sustainability: string;
  recommendedEquipment: string;
  estimatedCost: number;
  expectedEffect: string;
}

const STORAGE_KEY = 'business-improvement-draft';

export default function UnifiedApplicationFlow() {
  const [step, setStep] = useState(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    companyName: '',
    industry: '',
    employeeCount: 0,
    currentMinWage: 1000,
    targetWageIncrease: 45,
    representative: '',
    phone: '',
    email: '',
    address: '',
    currentChallenges: '',
    currentProcesses: '',
    desiredEquipment: ''
  });

  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [finalApplication, setFinalApplication] = useState<any>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const industries = [
    '製造業', '建設業', '運輸業', '飲食サービス業', 
    '小売業', '介護・福祉', 'IT・情報通信業', 'その他'
  ];

  // 一時保存機能
  useEffect(() => {
    loadDraft();
  }, []);

  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(() => {
        saveDraft();
      }, 2000); // 2秒後に自動保存
      return () => clearTimeout(timer);
    }
  }, [basicInfo, generatedContent, step, hasUnsavedChanges]);

  const saveDraft = () => {
    try {
      const draftData = {
        step,
        basicInfo,
        generatedContent,
        finalApplication,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('一時保存エラー:', error);
    }
  };

  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const draftData = JSON.parse(saved);
        setStep(draftData.step || 1);
        setBasicInfo(draftData.basicInfo || basicInfo);
        setGeneratedContent(draftData.generatedContent || null);
        setFinalApplication(draftData.finalApplication || null);
        setLastSaved(new Date(draftData.timestamp));
      }
    } catch (error) {
      console.error('下書き読み込みエラー:', error);
    }
  };

  const clearDraft = () => {
    if (confirm('下書きデータを削除しますか？この操作は取り消せません。')) {
      localStorage.removeItem(STORAGE_KEY);
      setStep(1);
      setBasicInfo({
        companyName: '',
        industry: '',
        employeeCount: 0,
        currentMinWage: 1000,
        targetWageIncrease: 45,
        representative: '',
        phone: '',
        email: '',
        address: '',
        currentChallenges: '',
        currentProcesses: '',
        desiredEquipment: ''
      });
      setGeneratedContent(null);
      setFinalApplication(null);
      setLastSaved(null);
      setHasUnsavedChanges(false);
    }
  };

  const handleInputChange = (field: keyof BasicInfo, value: any) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const generateAIContent = async () => {
    setIsGenerating(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not found');
      }

      const ai = new BusinessImprovementAI(apiKey);
      
      // 基本情報からCompanyProfileを作成
      const profile: CompanyProfile = {
        name: basicInfo.companyName,
        industry: basicInfo.industry,
        employeeCount: basicInfo.employeeCount,
        currentMinWage: basicInfo.currentMinWage,
        targetWageIncrease: basicInfo.targetWageIncrease,
        businessChallenges: basicInfo.currentChallenges.split('、').filter(c => c.trim()),
        currentProcesses: basicInfo.currentProcesses,
        targetEquipment: basicInfo.desiredEquipment
      };

      const result = await ai.analyzeAndGenerate(profile);
      
      setGeneratedContent({
        necessity: result.generatedSections.necessity,
        businessPlan: result.generatedSections.plan,
        effectPlan: result.generatedSections.effect,
        sustainability: result.generatedSections.sustainability,
        recommendedEquipment: result.recommendedEquipment.equipment,
        estimatedCost: result.recommendedEquipment.estimatedCost,
        expectedEffect: result.recommendedEquipment.expectedEffect
      });

      setStep(3);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('AI生成エラー:', error);
      alert('AI生成中にエラーが発生しました。入力内容を確認して再試行してください。');
    } finally {
      setIsGenerating(false);
    }
  };

  const optimizeSection = async (section: keyof GeneratedContent, currentText: string) => {
    if (!generatedContent) return;
    
    setIsGenerating(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API key not found');

      const ai = new BusinessImprovementAI(apiKey);
      const profile: CompanyProfile = {
        name: basicInfo.companyName,
        industry: basicInfo.industry,
        employeeCount: basicInfo.employeeCount,
        currentMinWage: basicInfo.currentMinWage,
        targetWageIncrease: basicInfo.targetWageIncrease,
        businessChallenges: basicInfo.currentChallenges.split('、').filter(c => c.trim()),
        currentProcesses: basicInfo.currentProcesses
      };

      const optimizedText = await ai.optimizeApplicationText(currentText, section, profile);
      
      setGeneratedContent(prev => prev ? {
        ...prev,
        [section]: optimizedText
      } : null);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('最適化エラー:', error);
      alert('文章の最適化中にエラーが発生しました。');
    } finally {
      setIsGenerating(false);
      setEditingSection(null);
    }
  };

  const generateFinalApplication = () => {
    if (!generatedContent) return;

    // 最終申請書データを構築
    const applicationData = {
      basicInfo: {
        companyName: basicInfo.companyName,
        representative: basicInfo.representative,
        address: basicInfo.address,
        phone: basicInfo.phone,
        email: basicInfo.email,
        industry: basicInfo.industry,
        employeeCount: basicInfo.employeeCount
      },
      course: {
        name: `${basicInfo.targetWageIncrease}円コース`,
        wageIncrease: basicInfo.targetWageIncrease,
        targetEmployees: basicInfo.employeeCount,
        maxSubsidy: calculateMaxSubsidy()
      },
      equipment: {
        equipment: generatedContent.recommendedEquipment,
        estimatedCost: generatedContent.estimatedCost,
        expectedEffect: generatedContent.expectedEffect
      },
      plan: {
        necessity: generatedContent.necessity,
        businessPlan: generatedContent.businessPlan,
        effectPlan: generatedContent.effectPlan,
        sustainability: generatedContent.sustainability
      },
      costs: {
        equipmentCost: generatedContent.estimatedCost,
        totalCost: generatedContent.estimatedCost,
        subsidyAmount: Math.min(
          generatedContent.estimatedCost * getSubsidyRate(),
          calculateMaxSubsidy()
        )
      }
    };

    setFinalApplication(applicationData);
    setStep(4);
    setHasUnsavedChanges(true);
  };

  const calculateMaxSubsidy = () => {
    const employeeRanges = {
      1: { 30: 300000, 45: 450000, 60: 600000, 90: 900000 },
      3: { 30: 500000, 45: 700000, 60: 900000, 90: 1500000 },
      6: { 30: 700000, 45: 1000000, 60: 1500000, 90: 2000000 },
      999: { 30: 1000000, 45: 1500000, 60: 2000000, 90: 3000000 }
    };

    const range = basicInfo.employeeCount <= 1 ? 1 :
                  basicInfo.employeeCount <= 3 ? 3 :
                  basicInfo.employeeCount <= 6 ? 6 : 999;

    return employeeRanges[range][basicInfo.targetWageIncrease as keyof typeof employeeRanges[1]] || 500000;
  };

  const getSubsidyRate = () => {
    return basicInfo.targetWageIncrease >= 90 ? 0.8 : 0.75;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('クリップボードにコピーしました');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>基本情報の入力</CardTitle>
              <p className="text-sm text-gray-600">
                申請に必要な基本情報を入力してください。この情報を基にAIが最適な申請書を生成します。
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">事業者名 *</Label>
                  <Input
                    id="companyName"
                    value={basicInfo.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="株式会社〇〇"
                  />
                </div>
                <div>
                  <Label htmlFor="representative">代表者名 *</Label>
                  <Input
                    id="representative"
                    value={basicInfo.representative}
                    onChange={(e) => handleInputChange('representative', e.target.value)}
                    placeholder="山田太郎"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">業種 *</Label>
                  <Select
                    value={basicInfo.industry}
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
                <div>
                  <Label htmlFor="employeeCount">従業員数 *</Label>
                  <Input
                    id="employeeCount"
                    type="number"
                    value={basicInfo.employeeCount || ''}
                    onChange={(e) => handleInputChange('employeeCount', parseInt(e.target.value) || 0)}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentMinWage">現在の最低賃金（時給）*</Label>
                  <Input
                    id="currentMinWage"
                    type="number"
                    value={basicInfo.currentMinWage}
                    onChange={(e) => handleInputChange('currentMinWage', parseInt(e.target.value) || 0)}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="targetWageIncrease">希望賃金引上げ額（円）*</Label>
                  <Select
                    value={basicInfo.targetWageIncrease.toString()}
                    onValueChange={(value) => handleInputChange('targetWageIncrease', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="引上げ額を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30円</SelectItem>
                      <SelectItem value="45">45円</SelectItem>
                      <SelectItem value="60">60円</SelectItem>
                      <SelectItem value="90">90円</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">所在地 *</Label>
                <Input
                  id="address"
                  value={basicInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="東京都〇〇区〇〇 1-2-3"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">電話番号 *</Label>
                  <Input
                    id="phone"
                    value={basicInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="03-1234-5678"
                  />
                </div>
                <div>
                  <Label htmlFor="email">メールアドレス *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={basicInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@company.co.jp"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currentChallenges">現在の業務課題 *</Label>
                <Textarea
                  id="currentChallenges"
                  value={basicInfo.currentChallenges}
                  onChange={(e) => handleInputChange('currentChallenges', e.target.value)}
                  placeholder="人手不足、作業効率の低下、品質のばらつき等、具体的な課題を記載してください"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="currentProcesses">現在の業務プロセス *</Label>
                <Textarea
                  id="currentProcesses"
                  value={basicInfo.currentProcesses}
                  onChange={(e) => handleInputChange('currentProcesses', e.target.value)}
                  placeholder="現在の業務の流れ、作業手順、使用している設備や手法について具体的に記述してください"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="desiredEquipment">希望する設備・機器（任意）</Label>
                <Input
                  id="desiredEquipment"
                  value={basicInfo.desiredEquipment}
                  onChange={(e) => handleInputChange('desiredEquipment', e.target.value)}
                  placeholder="導入を検討している設備があれば記載してください"
                />
              </div>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                disabled={!basicInfo.companyName || !basicInfo.industry || !basicInfo.currentChallenges}
              >
                次へ：AI生成準備
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>AI申請書生成</CardTitle>
              <p className="text-sm text-gray-600">
                入力された情報、募集要項、成功事例を総合的に分析し、採択確率を最大化する申請書を生成します。
              </p>
            </CardHeader>
            <CardContent className="text-center py-12">
              <div className="max-w-md mx-auto space-y-6">
                <div className="bg-blue-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                  <Sparkles className="h-12 w-12 text-blue-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-2">AI分析・生成内容</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✓ 募集要項との適合性分析</li>
                    <li>✓ 業界別成功パターンの適用</li>
                    <li>✓ 効果的なフレーズの選定</li>
                    <li>✓ 採択確率の最適化</li>
                  </ul>
                </div>

                <Alert className="text-left">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <strong>企業情報:</strong> {basicInfo.companyName}（{basicInfo.industry}・{basicInfo.employeeCount}名）<br />
                    <strong>目標:</strong> 時給{basicInfo.targetWageIncrease}円引上げ
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={generateAIContent}
                  disabled={isGenerating}
                  className="w-full py-3"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      AI生成中...（最適化処理実行中）
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      申請書を生成する
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                AI分析が完了しました！生成された内容を確認し、必要に応じて編集してください。
              </AlertDescription>
            </Alert>

            {generatedContent && (
              <>
                {/* 推奨設備 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      推奨設備・投資計画
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedContent.recommendedEquipment)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">推奨設備:</span>
                        <p>{generatedContent.recommendedEquipment}</p>
                      </div>
                      <div>
                        <span className="font-semibold">推定費用:</span>
                        <p>{generatedContent.estimatedCost.toLocaleString()}円</p>
                      </div>
                      <div>
                        <span className="font-semibold">期待効果:</span>
                        <p>{generatedContent.expectedEffect}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 申請書セクション */}
                {Object.entries({
                  necessity: '導入の必要性',
                  businessPlan: '事業実施計画',
                  effectPlan: '効果・目標',
                  sustainability: '持続性・発展性'
                }).map(([key, title]) => (
                  <Card key={key}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>{title}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(generatedContent[key as keyof GeneratedContent] as string)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSection(editingSection === key ? null : key)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => optimizeSection(key as keyof GeneratedContent, generatedContent[key as keyof GeneratedContent] as string)}
                            disabled={isGenerating}
                          >
                            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {editingSection === key ? (
                        <div className="space-y-3">
                          <Textarea
                            value={generatedContent[key as keyof GeneratedContent] as string}
                            onChange={(e) => {
                              setGeneratedContent(prev => prev ? {
                                ...prev,
                                [key]: e.target.value
                              } : null);
                              setHasUnsavedChanges(true);
                            }}
                            rows={8}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => setEditingSection(null)}>
                              保存
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingSection(null)}>
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {generatedContent[key as keyof GeneratedContent]}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-center">
                  <Button onClick={generateFinalApplication} size="lg" className="px-8">
                    申請書として完成させる
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <FileText className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                申請書が完成しました！PDF/Word形式でダウンロードして提出してください。
              </AlertDescription>
            </Alert>

            {finalApplication && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>申請概要</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>事業者名:</span>
                        <span className="font-semibold">{finalApplication.basicInfo.companyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>申請コース:</span>
                        <span className="font-semibold">{finalApplication.course.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>対象従業員:</span>
                        <span className="font-semibold">{finalApplication.course.targetEmployees}名</span>
                      </div>
                      <div className="flex justify-between">
                        <span>設備名:</span>
                        <span className="font-semibold">{finalApplication.equipment.equipment}</span>
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
                        <span className="font-semibold">{finalApplication.costs.totalCost.toLocaleString()}円</span>
                      </div>
                      <div className="flex justify-between">
                        <span>申請助成額:</span>
                        <span className="font-semibold text-blue-600">{finalApplication.costs.subsidyAmount.toLocaleString()}円</span>
                      </div>
                      <div className="flex justify-between">
                        <span>助成率:</span>
                        <span className="font-semibold">{Math.round((finalApplication.costs.subsidyAmount / finalApplication.costs.totalCost) * 100)}%</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>自己負担額:</span>
                        <span className="font-semibold">{(finalApplication.costs.totalCost - finalApplication.costs.subsidyAmount).toLocaleString()}円</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button onClick={() => generateBusinessImprovementPDF(finalApplication)} size="lg">
                    <Download className="h-4 w-4 mr-2" />
                    PDF形式でダウンロード
                  </Button>
                  <Button variant="outline" onClick={() => generateBusinessImprovementWord(finalApplication)}>
                    <Download className="h-4 w-4 mr-2" />
                    テキスト形式
                  </Button>
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">業務改善助成金 申請書作成</h1>
            <p className="text-gray-600">
              必要な情報を入力するだけで、募集要項と成功事例を踏まえた最適な申請書をAIが生成します
            </p>
          </div>
          
          {/* 一時保存状況表示 */}
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="outline" size="sm" onClick={saveDraft}>
                <Save className="h-4 w-4 mr-1" />
                手動保存
              </Button>
              <Button variant="outline" size="sm" onClick={clearDraft}>
                <Trash2 className="h-4 w-4 mr-1" />
                下書き削除
              </Button>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lastSaved ? (
                <span>最終保存: {lastSaved.toLocaleTimeString()}</span>
              ) : (
                <span>未保存</span>
              )}
              {hasUnsavedChanges && (
                <span className="text-orange-600 ml-2">●未保存の変更</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 下書き復元通知 */}
      {lastSaved && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Save className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>下書きが復元されました</strong><br />
            最終保存: {lastSaved.toLocaleString()} のデータを読み込みました。
          </AlertDescription>
        </Alert>
      )}

      {/* プログレスバー */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {['情報入力', 'AI生成', '内容確認', '申請書完成'].map((label, index) => (
            <div key={index} className={`flex items-center ${index + 1 <= step ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                index + 1 <= step ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {index + 1 < step ? '✓' : index + 1}
              </div>
              <span className="ml-2 text-sm font-medium hidden md:block">{label}</span>
            </div>
          ))}
        </div>
        <Progress value={(step / 4) * 100} className="h-2" />
      </div>

      {renderStep()}

      {/* ナビゲーション */}
      {step > 1 && step < 4 && (
        <div className="flex justify-between mt-6">
          <Button onClick={() => setStep(step - 1)} variant="outline">
            前へ
          </Button>
          {step === 3 && (
            <Button onClick={() => setStep(4)} variant="outline">
              完成画面へ
            </Button>
          )}
        </div>
      )}
    </div>
  );
}