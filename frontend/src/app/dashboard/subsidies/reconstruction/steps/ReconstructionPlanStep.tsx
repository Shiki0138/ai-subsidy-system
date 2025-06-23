'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Lightbulb, 
  ArrowRight, 
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface ReconstructionPlanStepProps {
  data: any;
  onComplete: (data: any) => void;
  onSave: (data: any) => void;
  eligibilityResult?: any;
  allData?: any;
}

const reconstructionTypes = [
  { 
    value: '新分野展開', 
    label: '新分野展開', 
    description: '主たる業種を変更することなく、新たな製品・サービスで新たな市場に進出',
    examples: '既存の技術を活かした新製品開発、新たな顧客層への展開'
  },
  { 
    value: '事業転換', 
    label: '事業転換', 
    description: '新たな製品・サービスを製造等することにより、主たる業種を変更',
    examples: '製造業からサービス業への転換、BtoBからBtoCへの転換'
  },
  { 
    value: '業種転換', 
    label: '業種転換', 
    description: '新たな製品の製造等により、主たる業種を変更',
    examples: '機械製造から食品製造への転換'
  },
  { 
    value: '業態転換', 
    label: '業態転換', 
    description: '製品の製造方法等を相当程度変更',
    examples: 'デジタル化による製造プロセスの変更、販売方法の根本的変更'
  },
  { 
    value: '事業再編', 
    label: '事業再編', 
    description: '事業再編を通じて新分野展開、事業転換、業種転換、業態転換のいずれかを行う',
    examples: 'M&A、分社化等を通じた事業構造の変更'
  }
];

const timelines = [
  { value: '6', label: '6ヶ月以内' },
  { value: '12', label: '1年以内' },
  { value: '18', label: '1年半以内' },
  { value: '24', label: '2年以内' },
  { value: '36', label: '3年以内' }
];

export function ReconstructionPlanStep({ data, onComplete, onSave, eligibilityResult, allData }: ReconstructionPlanStepProps) {
  const [formData, setFormData] = useState({
    type: data.type || (eligibilityResult?.reconstruction_type || ''),
    reason: data.reason || '',
    objectives: data.objectives || '',
    timeline: data.timeline || '',
    transformation_strategy: data.transformation_strategy || '',
    expected_outcomes: data.expected_outcomes || '',
    success_metrics: data.success_metrics || '',
    critical_success_factors: data.critical_success_factors || '',
    background_analysis: data.background_analysis || '',
    necessity: data.necessity || ''
  });

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSave(newData);
  };

  const handleComplete = () => {
    const requiredFields = ['type', 'reason', 'objectives', 'timeline', 'transformation_strategy'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      alert('必須項目をすべて入力してください');
      return;
    }

    onComplete(formData);
  };

  const isFormValid = () => {
    const requiredFields = ['type', 'reason', 'objectives', 'timeline', 'transformation_strategy'];
    return requiredFields.every(field => formData[field].trim());
  };

  const selectedType = reconstructionTypes.find(type => type.value === formData.type);

  return (
    <div className="space-y-6">
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          再構築計画は補助金審査の中核となる部分です。現在の課題と新たな方向性を明確に示してください。
        </AlertDescription>
      </Alert>

      {/* 再構築の種類選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            再構築の種類
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>再構築のタイプ*</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="再構築のタイプを選択" />
              </SelectTrigger>
              <SelectContent>
                {reconstructionTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedType && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">{selectedType.label}</h4>
              <p className="text-sm text-blue-800 mb-2">{selectedType.description}</p>
              <p className="text-sm text-blue-700">
                <strong>例:</strong> {selectedType.examples}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 再構築の背景・理由 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            再構築の背景・必要性
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="reason">再構築を行う理由・背景*</Label>
            <Textarea
              id="reason"
              placeholder="なぜ事業再構築が必要なのか、現在の事業環境の変化や課題を踏まえて詳しく説明してください。"
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              COVID-19の影響、市場変化、競合状況の変化なども含めて説明してください
            </p>
          </div>

          <div>
            <Label htmlFor="background_analysis">環境変化の分析</Label>
            <Textarea
              id="background_analysis"
              placeholder="業界全体の変化、顧客ニーズの変化、技術革新などの外部環境の変化について分析してください。"
              value={formData.background_analysis}
              onChange={(e) => handleChange('background_analysis', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="necessity">再構築の必要性・緊急性</Label>
            <Textarea
              id="necessity"
              placeholder="なぜ今、この再構築が必要なのか、緊急性や重要性について説明してください。"
              value={formData.necessity}
              onChange={(e) => handleChange('necessity', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 再構築の目標・戦略 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            目標・戦略
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="objectives">再構築の目標・目的*</Label>
            <Textarea
              id="objectives"
              placeholder="再構築によって何を達成したいのか、具体的な目標を設定してください。"
              value={formData.objectives}
              onChange={(e) => handleChange('objectives', e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="transformation_strategy">変革戦略*</Label>
            <Textarea
              id="transformation_strategy"
              placeholder="現在の事業から新たな事業へどのように転換していくのか、具体的な戦略を説明してください。"
              value={formData.transformation_strategy}
              onChange={(e) => handleChange('transformation_strategy', e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="critical_success_factors">成功の重要要因</Label>
            <Textarea
              id="critical_success_factors"
              placeholder="再構築を成功させるために重要な要因や条件について説明してください。"
              value={formData.critical_success_factors}
              onChange={(e) => handleChange('critical_success_factors', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 期待される成果 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            期待される成果
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="expected_outcomes">期待される成果・効果</Label>
            <Textarea
              id="expected_outcomes"
              placeholder="再構築によって期待される具体的な成果や効果を説明してください。売上、利益、市場シェアなど。"
              value={formData.expected_outcomes}
              onChange={(e) => handleChange('expected_outcomes', e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="success_metrics">成功指標・KPI</Label>
            <Textarea
              id="success_metrics"
              placeholder="再構築の成功を測定するための具体的な指標やKPIを設定してください。"
              value={formData.success_metrics}
              onChange={(e) => handleChange('success_metrics', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 実施時期 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            実施スケジュール
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>再構築完了までの期間*</Label>
            <Select value={formData.timeline} onValueChange={(value) => handleChange('timeline', value)}>
              <SelectTrigger>
                <SelectValue placeholder="実施期間を選択" />
              </SelectTrigger>
              <SelectContent>
                {timelines.map(timeline => (
                  <SelectItem key={timeline.value} value={timeline.value}>
                    {timeline.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              補助事業の実施期間は原則として2年以内です
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 現在の事業との関連性 */}
      {allData?.currentBusiness && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowRight className="w-5 h-5 mr-2" />
              現在の事業からの発展
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                現在の「{allData.currentBusiness.description?.substring(0, 50)}...」から
                どのように発展・転換していくかを明確にすることで、審査における一貫性と説得力が向上します。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* 完了ボタン */}
      <div className="flex justify-end">
        <Button
          onClick={handleComplete}
          disabled={!isFormValid()}
          className="px-8"
        >
          再構築計画を完了
        </Button>
      </div>
    </div>
  );
}