'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Users, 
  Target, 
  AlertTriangle,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface CurrentBusinessStepProps {
  data: any;
  onComplete: (data: any) => void;
  onSave: (data: any) => void;
  eligibilityResult?: any;
}

export function CurrentBusinessStep({ data, onComplete, onSave, eligibilityResult }: CurrentBusinessStepProps) {
  const [formData, setFormData] = useState({
    description: data.description || '',
    products: data.products || '',
    target_customers: data.target_customers || '',
    revenue_structure: data.revenue_structure || '',
    main_challenges: data.main_challenges || '',
    market_position: data.market_position || '',
    competitive_advantages: data.competitive_advantages || '',
    business_model: data.business_model || '',
    key_resources: data.key_resources || '',
    operational_issues: data.operational_issues || ''
  });

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSave(newData);
  };

  const handleComplete = () => {
    // 必須フィールドの検証
    const requiredFields = ['description', 'products', 'target_customers', 'revenue_structure', 'main_challenges'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      alert('必須項目をすべて入力してください');
      return;
    }

    onComplete(formData);
  };

  const isFormValid = () => {
    const requiredFields = ['description', 'products', 'target_customers', 'revenue_structure', 'main_challenges'];
    return requiredFields.every(field => formData[field].trim());
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          現在の事業について詳しく分析することで、再構築の方向性と成功確率を高めることができます。
        </AlertDescription>
      </Alert>

      {/* 事業概要 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            事業の概要
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">事業内容の詳細説明*</Label>
            <Textarea
              id="description"
              placeholder="現在の主力事業について詳しく説明してください。何を、どのように、誰に提供しているかを具体的に記載してください。"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500文字 | 具体的で詳細な説明をお願いします
            </p>
          </div>

          <div>
            <Label htmlFor="products">主要製品・サービス*</Label>
            <Textarea
              id="products"
              placeholder="提供している製品やサービスを具体的に記載してください。売上構成比なども含めると良いでしょう。"
              value={formData.products}
              onChange={(e) => handleChange('products', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="business_model">ビジネスモデル</Label>
            <Textarea
              id="business_model"
              placeholder="どのような仕組みで収益を得ているか、バリューチェーンの中でどの部分を担っているかを説明してください。"
              value={formData.business_model}
              onChange={(e) => handleChange('business_model', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 市場・顧客 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            市場・顧客
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="target_customers">対象顧客・市場*</Label>
            <Textarea
              id="target_customers"
              placeholder="主要な顧客層、対象市場について詳しく説明してください。BtoB、BtoC、地域性なども含めてください。"
              value={formData.target_customers}
              onChange={(e) => handleChange('target_customers', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="market_position">市場でのポジション</Label>
            <Textarea
              id="market_position"
              placeholder="競合他社と比較した際の自社の位置づけ、市場シェア、強みなどを説明してください。"
              value={formData.market_position}
              onChange={(e) => handleChange('market_position', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="competitive_advantages">競合優位性</Label>
            <Textarea
              id="competitive_advantages"
              placeholder="他社にはない自社の強み、差別化要因について具体的に説明してください。"
              value={formData.competitive_advantages}
              onChange={(e) => handleChange('competitive_advantages', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 収益構造 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            収益構造
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="revenue_structure">売上構成と収益モデル*</Label>
            <Textarea
              id="revenue_structure"
              placeholder="売上の構成比（製品別、顧客別など）、収益源、利益率などについて説明してください。"
              value={formData.revenue_structure}
              onChange={(e) => handleChange('revenue_structure', e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="key_resources">主要な経営資源</Label>
            <Textarea
              id="key_resources"
              placeholder="人材、技術、設備、ブランド、ネットワークなど、事業を支える重要な資源について説明してください。"
              value={formData.key_resources}
              onChange={(e) => handleChange('key_resources', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 課題・問題点 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            現在の課題・問題点
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="main_challenges">主要な課題*</Label>
            <Textarea
              id="main_challenges"
              placeholder="現在直面している主要な課題や問題点を具体的に説明してください。売上減少の要因なども含めてください。"
              value={formData.main_challenges}
              onChange={(e) => handleChange('main_challenges', e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="operational_issues">運営上の課題</Label>
            <Textarea
              id="operational_issues"
              placeholder="日常業務や運営面での課題、効率化が必要な部分について説明してください。"
              value={formData.operational_issues}
              onChange={(e) => handleChange('operational_issues', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 売上減少の影響 */}
      {eligibilityResult?.sales_decline_rate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              売上減少の影響分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                売上が{eligibilityResult.sales_decline_rate.toFixed(1)}%減少していることを踏まえ、
                その具体的な影響や背景をより詳しく分析してください。
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
          現在の事業分析を完了
        </Button>
      </div>
    </div>
  );
}