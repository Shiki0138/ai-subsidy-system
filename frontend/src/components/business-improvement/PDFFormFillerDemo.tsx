'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Upload, FileText, Download, AnalyzeIcon as Analysis } from 'lucide-react';
import { PDFFormFiller, fillBusinessImprovementPDF, analyzePDFTemplate } from '@/utils/pdf-form-filler';
import { BusinessImprovementApplicationData } from '@/utils/business-improvement-pdf';

export default function PDFFormFillerDemo() {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // デモ用のサンプルデータ
  const sampleApplicationData: BusinessImprovementApplicationData = {
    basicInfo: {
      companyName: '株式会社サンプル',
      representative: '田中太郎',
      address: '東京都渋谷区○○1-2-3',
      phone: '03-1234-5678',
      email: 'info@sample.co.jp',
      industry: '製造業',
      employeeCount: 25
    },
    course: {
      name: '30円コース',
      wageIncrease: 30,
      targetEmployees: 20,
      maxSubsidy: 600000
    },
    equipment: {
      equipment: '自動化システム一式',
      estimatedCost: 2000000,
      expectedEffect: '作業効率50%向上、品質安定化'
    },
    plan: {
      necessity: 'AIが分析した結果、現在の手作業による生産工程には多くの改善点があります。人手不足と品質のばらつきが課題となっており、自動化システムの導入により大幅な効率化が期待できます。',
      businessPlan: 'AIが推奨する実施計画として、第1段階で基礎システムを導入し、第2段階で全工程の自動化を実現します。計画期間は6ヶ月で、段階的に従業員の技術教育も実施します。',
      effectPlan: 'AIが予測する効果として、生産性50%向上、不良品率70%削減、残業時間30%減少を見込んでいます。これにより年間1,500万円のコスト削減効果が期待できます。',
      sustainability: 'AIが評価した持続性として、導入後の継続的な改善体制を構築し、定期的な効果測定とシステムの最適化を実施します。3年後には投資回収を完了し、長期的な競争力強化を実現します。'
    },
    costs: {
      equipmentCost: 2000000,
      totalCost: 2500000,
      subsidyAmount: 600000
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setTemplateFile(file);
      setAnalysisResult(null);
      setError(null);
    } else {
      setError('PDFファイルを選択してください。');
    }
  };

  const analyzeTemplate = async () => {
    if (!templateFile) {
      setError('PDFテンプレートを選択してください。');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const buffer = await templateFile.arrayBuffer();
      const result = await analyzePDFTemplate(buffer);
      setAnalysisResult(result);
    } catch (error) {
      console.error('PDF分析エラー:', error);
      setError('PDFテンプレートの分析中にエラーが発生しました。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fillPDFForm = async () => {
    if (!templateFile) {
      setError('PDFテンプレートを選択してください。');
      return;
    }

    setIsFilling(true);
    setError(null);

    try {
      const buffer = await templateFile.arrayBuffer();
      const filledPDF = await fillBusinessImprovementPDF(buffer, sampleApplicationData);
      
      // ダウンロードリンクを作成
      const blob = new Blob([filledPDF], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `業務改善助成金申請書_${sampleApplicationData.basicInfo.companyName}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF埋め込みエラー:', error);
      setError('PDFへの埋め込み中にエラーが発生しました。');
    } finally {
      setIsFilling(false);
    }
  };

  const downloadTemplate = () => {
    // サンプルテンプレートをダウンロード（実際のAPIエンドポイントに変更する必要があります）
    const link = document.createElement('a');
    link.href = '/api/templates/gyomu_kaizen_template.pdf';
    link.download = 'gyomu_kaizen_template.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF申請書フォーム埋め込みデモ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* エラー表示 */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* テンプレートファイルのアップロード */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                PDFテンプレートを選択
              </Button>
              <Button 
                onClick={downloadTemplate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                サンプルテンプレート
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {templateFile && (
              <div className="text-sm text-gray-600">
                選択されたファイル: {templateFile.name}
              </div>
            )}
          </div>

          {/* 分析ボタン */}
          <div className="flex gap-4">
            <Button 
              onClick={analyzeTemplate}
              disabled={!templateFile || isAnalyzing}
              className="flex items-center gap-2"
            >
              <Analysis className="h-4 w-4" />
              {isAnalyzing ? 'テンプレート分析中...' : 'テンプレート分析'}
            </Button>
            
            <Button 
              onClick={fillPDFForm}
              disabled={!templateFile || isFilling}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isFilling ? 'PDF生成中...' : 'サンプルデータで埋め込み'}
            </Button>
          </div>

          {/* 分析結果 */}
          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle>分析結果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">基本情報</h4>
                    <ul className="space-y-1 text-sm">
                      <li>ページ数: {analysisResult.pageCount}</li>
                      <li>フォームフィールド: {analysisResult.hasFormFields ? 'あり' : 'なし'}</li>
                      <li>フィールド数: {analysisResult.fieldNames.length}</li>
                    </ul>
                  </div>
                  
                  {analysisResult.hasFormFields && (
                    <div>
                      <h4 className="font-semibold mb-2">フォームフィールド</h4>
                      <div className="max-h-32 overflow-y-auto">
                        <ul className="space-y-1 text-sm">
                          {analysisResult.formFieldsInfo.map((field: any, index: number) => (
                            <li key={index} className="flex justify-between">
                              <span>{field.name}</span>
                              <span className="text-gray-500">{field.type}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* サンプルデータ表示 */}
          <Card>
            <CardHeader>
              <CardTitle>埋め込み予定データ（サンプル）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">基本情報</h4>
                  <ul className="space-y-1">
                    <li>会社名: {sampleApplicationData.basicInfo.companyName}</li>
                    <li>代表者: {sampleApplicationData.basicInfo.representative}</li>
                    <li>住所: {sampleApplicationData.basicInfo.address}</li>
                    <li>電話: {sampleApplicationData.basicInfo.phone}</li>
                    <li>業種: {sampleApplicationData.basicInfo.industry}</li>
                    <li>従業員数: {sampleApplicationData.basicInfo.employeeCount}名</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">申請コース</h4>
                  <ul className="space-y-1">
                    <li>コース: {sampleApplicationData.course.name}</li>
                    <li>賃金引上げ: {sampleApplicationData.course.wageIncrease}円/時間</li>
                    <li>対象従業員: {sampleApplicationData.course.targetEmployees}名</li>
                    <li>上限額: {sampleApplicationData.course.maxSubsidy.toLocaleString()}円</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold mb-2">AI生成テキスト例</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p><strong>必要性:</strong> {sampleApplicationData.plan.necessity.substring(0, 100)}...</p>
                  <p><strong>効果:</strong> {sampleApplicationData.plan.effectPlan.substring(0, 100)}...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}