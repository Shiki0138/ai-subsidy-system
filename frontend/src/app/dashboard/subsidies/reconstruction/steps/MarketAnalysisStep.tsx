'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MarketAnalysisStepProps {
  data: any;
  onComplete: (data: any) => void;
  onSave: (data: any) => void;
}

export function MarketAnalysisStep({ data, onComplete, onSave }: MarketAnalysisStepProps) {
  const [formData, setFormData] = useState({
    market_size: data.market_size || '',
    growth_rate: data.growth_rate || '',
    target_customers: data.target_customers || '',
    competitive_landscape: data.competitive_landscape || '',
    trends: data.trends || ''
  });

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSave(newData);
  };

  const handleComplete = () => {
    const requiredFields = ['market_size', 'growth_rate', 'target_customers', 'competitive_landscape'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      alert('必須項目をすべて入力してください');
      return;
    }

    onComplete(formData);
  };

  const isFormValid = () => {
    const requiredFields = ['market_size', 'growth_rate', 'target_customers', 'competitive_landscape'];
    return requiredFields.every(field => formData[field].trim());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>市場規模・成長性</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="market_size">市場規模*</Label>
            <Textarea
              id="market_size"
              placeholder="対象市場の規模について、具体的な数値データとともに説明してください。"
              value={formData.market_size}
              onChange={(e) => handleChange('market_size', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="growth_rate">成長率・将来性*</Label>
            <Textarea
              id="growth_rate"
              placeholder="市場の成長率や将来性について、データに基づいて説明してください。"
              value={formData.growth_rate}
              onChange={(e) => handleChange('growth_rate', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>顧客・競合分析</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="target_customers">ターゲット顧客*</Label>
            <Textarea
              id="target_customers"
              placeholder="具体的な顧客層について詳しく分析してください。"
              value={formData.target_customers}
              onChange={(e) => handleChange('target_customers', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="competitive_landscape">競合環境*</Label>
            <Textarea
              id="competitive_landscape"
              placeholder="競合他社の状況と自社のポジショニングを分析してください。"
              value={formData.competitive_landscape}
              onChange={(e) => handleChange('competitive_landscape', e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleComplete} disabled={!isFormValid()}>
          市場分析を完了
        </Button>
      </div>
    </div>
  );
}