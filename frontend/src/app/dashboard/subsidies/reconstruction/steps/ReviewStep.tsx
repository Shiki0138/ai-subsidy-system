'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, FileText, Download } from 'lucide-react';

interface ReviewStepProps {
  data: any;
  onComplete: (data: any) => void;
  onSave: (data: any) => void;
}

export function ReviewStep({ data, onComplete, onSave }: ReviewStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateApplication = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/reconstruction-subsidy/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('申請書の生成に失敗しました');
      }

      const result = await response.json();
      setGenerationResult(result);
      
      // 生成結果を保存
      const finalData = {
        ...data,
        generated_application: result,
        generated_at: new Date().toISOString()
      };
      
      onSave(finalData);
      onComplete(finalData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadApplication = () => {
    if (!generationResult) return;
    
    // PDF生成のAPIを呼び出し
    window.open(`/api/reconstruction-subsidy/download-pdf?id=${generationResult.id}`, '_blank');
  };

  const getSectionStatus = (section: any) => {
    if (!section) return { status: 'incomplete', count: 0 };
    
    if (typeof section === 'string') {
      return section.trim() ? { status: 'complete', count: 1 } : { status: 'incomplete', count: 0 };
    }
    
    if (typeof section === 'object') {
      const fields = Object.values(section).filter(value => 
        value && (typeof value === 'string' ? value.trim() : true)
      );
      return {
        status: fields.length > 0 ? 'complete' : 'incomplete',
        count: fields.length
      };
    }
    
    return { status: 'incomplete', count: 0 };
  };

  const sections = [
    { key: 'eligibility', name: '申請資格確認', data: data.eligibility },
    { key: 'currentBusiness', name: '現在の事業', data: data.currentBusiness },
    { key: 'newBusiness', name: '新規事業計画', data: data.newBusiness },
    { key: 'marketAnalysis', name: '市場分析', data: data.marketAnalysis },
    { key: 'financialPlan', name: '財務計画', data: data.financialPlan },
    { key: 'implementation', name: '実施計画', data: data.implementation },
    { key: 'documents', name: '必要書類', data: data.documents }
  ];

  const completedSections = sections.filter(section => 
    getSectionStatus(section.data).status === 'complete'
  ).length;

  const totalSections = sections.length;
  const completionRate = Math.round((completedSections / totalSections) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            申請書最終確認
            <Badge variant={completionRate === 100 ? "default" : "secondary"}>
              {completionRate}% 完了
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sections.map(section => {
              const status = getSectionStatus(section.data);
              return (
                <div key={section.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {status.status === 'complete' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="font-medium">{section.name}</span>
                  </div>
                  <Badge variant={status.status === 'complete' ? "default" : "secondary"}>
                    {status.status === 'complete' ? '完了' : '未完了'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 詳細データ表示 */}
      <Card>
        <CardHeader>
          <CardTitle>入力データ概要</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.eligibility && (
            <div>
              <h4 className="font-medium mb-2">申請資格</h4>
              <p className="text-sm text-gray-600">
                売上減少率: {data.eligibility.decline_rate}%
                {data.eligibility.eligible && (
                  <Badge className="ml-2" variant="default">適格</Badge>
                )}
              </p>
            </div>
          )}

          {data.currentBusiness && (
            <div>
              <h4 className="font-medium mb-2">現在の事業</h4>
              <p className="text-sm text-gray-600">
                {data.currentBusiness.description?.substring(0, 100)}...
              </p>
            </div>
          )}

          {data.newBusiness && (
            <div>
              <h4 className="font-medium mb-2">新規事業</h4>
              <p className="text-sm text-gray-600">
                {data.newBusiness.description?.substring(0, 100)}...
              </p>
            </div>
          )}

          {data.financialPlan && (
            <div>
              <h4 className="font-medium mb-2">財務計画</h4>
              <p className="text-sm text-gray-600">
                総投資額: {data.financialPlan.total_investment ? 
                  Number(data.financialPlan.total_investment).toLocaleString() + '円' : '未入力'}
                <br />
                申請補助金額: {data.financialPlan.requested_subsidy ? 
                  Number(data.financialPlan.requested_subsidy).toLocaleString() + '円' : '未入力'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 生成結果 */}
      {generationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              申請書生成完了
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                事業再構築補助金の申請書が正常に生成されました。
                採択予想スコア: {generationResult.adoption_score || 'N/A'}点
              </AlertDescription>
            </Alert>

            <div className="flex space-x-4">
              <Button onClick={downloadApplication} className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                PDF版をダウンロード
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('/dashboard/applications', '_blank')}
              >
                申請一覧で確認
              </Button>
            </div>

            {generationResult.quality_analysis && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">品質分析結果</h4>
                <ul className="text-sm space-y-1">
                  {generationResult.quality_analysis.strengths?.map((strength: string, index: number) => (
                    <li key={index} className="flex items-center text-green-600">
                      <CheckCircle className="w-3 h-3 mr-2" />
                      {strength}
                    </li>
                  ))}
                  {generationResult.quality_analysis.improvements?.map((improvement: string, index: number) => (
                    <li key={index} className="flex items-center text-yellow-600">
                      <AlertTriangle className="w-3 h-3 mr-2" />
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* アクションボタン */}
      <div className="flex justify-end space-x-4">
        {!generationResult && (
          <>
            {completionRate < 100 && (
              <Alert className="flex-1">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  すべてのセクションを完了してから申請書を生成してください。
                </AlertDescription>
              </Alert>
            )}
            
            <Button
              onClick={generateApplication}
              disabled={isGenerating || completionRate < 100}
              className="px-8"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  申請書生成中...
                </>
              ) : (
                '申請書を生成'
              )}
            </Button>
          </>
        )}

        {generationResult && (
          <Button 
            onClick={() => window.location.href = '/dashboard/applications'}
            className="px-8"
          >
            申請管理画面へ
          </Button>
        )}
      </div>
    </div>
  );
}