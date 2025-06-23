'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, Target, Zap, Users } from 'lucide-react';

interface NewBusinessStepProps {
  data: any;
  onComplete: (data: any) => void;
  onSave: (data: any) => void;
  allData?: any;
}

export function NewBusinessStep({ data, onComplete, onSave, allData }: NewBusinessStepProps) {
  const [formData, setFormData] = useState({
    description: data.description || '',
    products_services: data.products_services || '',
    target_market: data.target_market || '',
    revenue_model: data.revenue_model || '',
    competitive_advantage: data.competitive_advantage || '',
    innovation_aspects: data.innovation_aspects || '',
    differentiation: data.differentiation || '',
    value_proposition: data.value_proposition || ''
  });

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSave(newData);
  };

  const handleComplete = () => {
    const requiredFields = ['description', 'products_services', 'target_market', 'revenue_model', 'competitive_advantage'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      alert('必須項目をすべて入力してください');
      return;
    }

    onComplete(formData);
  };

  const isFormValid = () => {
    const requiredFields = ['description', 'products_services', 'target_market', 'revenue_model', 'competitive_advantage'];
    return requiredFields.every(field => formData[field].trim());
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          新規事業の具体性と実現可能性が審査の重要なポイントです。詳細で説得力のある計画を作成してください。
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            新規事業の概要
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">新規事業の詳細説明*</Label>
            <Textarea
              id="description"
              placeholder="新規事業について具体的に説明してください。何を、どのように、誰に提供するのかを明確に記載してください。"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="products_services">提供する製品・サービス*</Label>
            <Textarea
              id="products_services"
              placeholder="新規事業で提供する製品やサービスの詳細、特徴、仕様などを具体的に説明してください。"
              value={formData.products_services}
              onChange={(e) => handleChange('products_services', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            市場・顧客
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="target_market">対象市場・顧客*</Label>
            <Textarea
              id="target_market"
              placeholder="新規事業の対象となる市場と顧客層について詳しく説明してください。市場規模、顧客特性なども含めてください。"
              value={formData.target_market}
              onChange={(e) => handleChange('target_market', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="value_proposition">顧客への価値提案</Label>
            <Textarea
              id="value_proposition"
              placeholder="顧客にとってどのような価値を提供するのか、どのような問題を解決するのかを説明してください。"
              value={formData.value_proposition}
              onChange={(e) => handleChange('value_proposition', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            競争優位性・革新性
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="competitive_advantage">競合優位性*</Label>
            <Textarea
              id="competitive_advantage"
              placeholder="競合他社と比較した際の優位性、差別化要因について具体的に説明してください。"
              value={formData.competitive_advantage}
              onChange={(e) => handleChange('competitive_advantage', e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="innovation_aspects">革新的な側面</Label>
            <Textarea
              id="innovation_aspects"
              placeholder="新規事業の革新的な要素、技術的な新しさ、市場への新しいアプローチなどを説明してください。"
              value={formData.innovation_aspects}
              onChange={(e) => handleChange('innovation_aspects', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="differentiation">差別化戦略</Label>
            <Textarea
              id="differentiation"
              placeholder="どのようにして競合他社と差別化を図るのか、具体的な戦略を説明してください。"
              value={formData.differentiation}
              onChange={(e) => handleChange('differentiation', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>収益モデル</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="revenue_model">ビジネスモデル・収益構造*</Label>
            <Textarea
              id="revenue_model"
              placeholder="どのような仕組みで収益を得るのか、価格設定、販売方法、収益の流れなどを詳しく説明してください。"
              value={formData.revenue_model}
              onChange={(e) => handleChange('revenue_model', e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* 現在の事業との関連性表示 */}
      {allData?.currentBusiness && (
        <Card>
          <CardHeader>
            <CardTitle>既存事業との関連性</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                既存の「{allData.currentBusiness.description?.substring(0, 50)}...」で培った経験や資源を
                新規事業でどのように活用するかを明確にすることで、実現可能性が向上します。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleComplete}
          disabled={!isFormValid()}
          className="px-8"
        >
          新規事業計画を完了
        </Button>
      </div>
    </div>
  );
}