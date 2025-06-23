'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ImplementationStepProps {
  data: any;
  onComplete: (data: any) => void;
  onSave: (data: any) => void;
}

export function ImplementationStep({ data, onComplete, onSave }: ImplementationStepProps) {
  const [formData, setFormData] = useState({
    phases: data.phases || [
      { phase: '準備・計画段階', duration: '', activities: '', milestones: '' },
      { phase: '実行段階', duration: '', activities: '', milestones: '' },
      { phase: '完了・評価段階', duration: '', activities: '', milestones: '' }
    ],
    risk_mitigation: data.risk_mitigation || ''
  });

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSave(newData);
  };

  const handlePhaseChange = (index: number, field: string, value: string) => {
    const newPhases = [...formData.phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    handleChange('phases', newPhases);
  };

  const handleComplete = () => {
    const hasValidPhases = formData.phases.every(phase => 
      phase.duration && phase.activities && phase.milestones
    );
    
    if (!hasValidPhases || !formData.risk_mitigation) {
      alert('すべての実施段階と リスク対策を入力してください');
      return;
    }

    onComplete(formData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>実施スケジュール</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {formData.phases.map((phase, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium mb-4">{phase.phase}</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`duration_${index}`}>実施期間</Label>
                    <Textarea
                      id={`duration_${index}`}
                      placeholder="例: 1〜3ヶ月目"
                      value={phase.duration}
                      onChange={(e) => handlePhaseChange(index, 'duration', e.target.value)}
                      rows={1}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`activities_${index}`}>主な活動内容</Label>
                    <Textarea
                      id={`activities_${index}`}
                      placeholder="この段階で実施する具体的な活動を記載してください"
                      value={phase.activities}
                      onChange={(e) => handlePhaseChange(index, 'activities', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`milestones_${index}`}>達成目標・マイルストーン</Label>
                    <Textarea
                      id={`milestones_${index}`}
                      placeholder="この段階で達成すべき目標や成果物を記載してください"
                      value={phase.milestones}
                      onChange={(e) => handlePhaseChange(index, 'milestones', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>リスク管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="risk_mitigation">リスク対策*</Label>
            <Textarea
              id="risk_mitigation"
              placeholder="実施過程で想定されるリスクとその対策について詳しく説明してください。"
              value={formData.risk_mitigation}
              onChange={(e) => handleChange('risk_mitigation', e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleComplete}>
          実施計画を完了
        </Button>
      </div>
    </div>
  );
}