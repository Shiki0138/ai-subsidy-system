'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FinancialPlanStepProps {
  data: any;
  onComplete: (data: any) => void;
  onSave: (data: any) => void;
}

export function FinancialPlanStep({ data, onComplete, onSave }: FinancialPlanStepProps) {
  const [formData, setFormData] = useState({
    total_investment: data.total_investment || '',
    requested_subsidy: data.requested_subsidy || '',
    funding_sources: data.funding_sources || '',
    revenue_projections: data.revenue_projections || [
      { year: 1, revenue: '', profit: '' },
      { year: 2, revenue: '', profit: '' },
      { year: 3, revenue: '', profit: '' }
    ],
    break_even_point: data.break_even_point || ''
  });

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSave(newData);
  };

  const handleProjectionChange = (index: number, field: string, value: string) => {
    const newProjections = [...formData.revenue_projections];
    newProjections[index] = { ...newProjections[index], [field]: value };
    handleChange('revenue_projections', newProjections);
  };

  const handleComplete = () => {
    if (!formData.total_investment || !formData.requested_subsidy || !formData.funding_sources) {
      alert('必須項目をすべて入力してください');
      return;
    }

    const finalData = {
      ...formData,
      total_investment: parseFloat(formData.total_investment),
      requested_subsidy: parseFloat(formData.requested_subsidy),
      revenue_projections: formData.revenue_projections.map(proj => ({
        year: proj.year,
        revenue: parseFloat(proj.revenue) || 0,
        profit: parseFloat(proj.profit) || 0
      }))
    };

    onComplete(finalData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>投資計画</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="total_investment">総投資額（円）*</Label>
            <Input
              id="total_investment"
              type="number"
              placeholder="例: 50000000"
              value={formData.total_investment}
              onChange={(e) => handleChange('total_investment', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="requested_subsidy">申請補助金額（円）*</Label>
            <Input
              id="requested_subsidy"
              type="number"
              placeholder="例: 37500000"
              value={formData.requested_subsidy}
              onChange={(e) => handleChange('requested_subsidy', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="funding_sources">資金調達計画*</Label>
            <Textarea
              id="funding_sources"
              placeholder="補助金以外の資金調達方法について説明してください。"
              value={formData.funding_sources}
              onChange={(e) => handleChange('funding_sources', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>収益予測</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.revenue_projections.map((projection, index) => (
              <div key={projection.year} className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{projection.year}年目</Label>
                </div>
                <div>
                  <Label htmlFor={`revenue_${index}`}>売上（円）</Label>
                  <Input
                    id={`revenue_${index}`}
                    type="number"
                    placeholder="例: 100000000"
                    value={projection.revenue}
                    onChange={(e) => handleProjectionChange(index, 'revenue', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`profit_${index}`}>利益（円）</Label>
                  <Input
                    id={`profit_${index}`}
                    type="number"
                    placeholder="例: 10000000"
                    value={projection.profit}
                    onChange={(e) => handleProjectionChange(index, 'profit', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Label htmlFor="break_even_point">損益分岐点</Label>
            <Textarea
              id="break_even_point"
              placeholder="事業の損益分岐点について説明してください。"
              value={formData.break_even_point}
              onChange={(e) => handleChange('break_even_point', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleComplete}>
          財務計画を完了
        </Button>
      </div>
    </div>
  );
}