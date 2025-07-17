'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { PDFTemplateInfo, StandardApplicationFields } from '@/types/pdf-template';
import { templateManager } from '@/utils/pdf-template-manager';
import { fillPDFWithUniversalFiller } from '@/utils/universal-pdf-filler';

interface UniversalPDFApplicationProps {
  applicationData: StandardApplicationFields;
  subsidyType?: string;
}

export default function UniversalPDFApplication({ 
  applicationData, 
  subsidyType 
}: UniversalPDFApplicationProps) {
  const [availableTemplates, setAvailableTemplates] = useState<PDFTemplateInfo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplateInfo | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    downloadUrl?: string;
    errors?: string[];
  } | null>(null);

  useEffect(() => {
    templateManager.initialize();
    loadTemplates();
  }, [subsidyType]);

  const loadTemplates = () => {
    const templates = subsidyType 
      ? [templateManager.getTemplateBySubsidyType(subsidyType)].filter(Boolean) as PDFTemplateInfo[]
      : templateManager.getActiveTemplates();
    setAvailableTemplates(templates);
    
    if (templates.length > 0) {
      setSelectedTemplate(templates[0]);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setResult(null);
    }
  };

  const processApplicationPDF = async () => {
    const templateToUse = selectedTemplate || uploadedFile;
    if (!templateToUse) return;

    setProcessing(true);
    setResult(null);

    try {
      let pdfBytes: ArrayBuffer;
      let templateInfo: PDFTemplateInfo;

      if (selectedTemplate) {
        // 登録済みテンプレートを使用
        // 注意: 実際の実装では、テンプレートファイルを保存・取得する仕組みが必要
        setResult({
          success: false,
          message: 'テンプレートファイルの取得機能を実装してください'
        });
        return;
      } else if (uploadedFile) {
        // アップロードファイルを使用
        pdfBytes = await uploadedFile.arrayBuffer();
        
        // 動的にテンプレート情報を作成
        templateInfo = {
          id: 'dynamic',
          subsidyType: subsidyType || 'custom',
          name: uploadedFile.name,
          description: '動的アップロードテンプレート',
          fileName: uploadedFile.name,
          uploadDate: new Date().toISOString(),
          isActive: true,
          fieldMapping: generateDefaultMapping(subsidyType || 'custom'),
          pageCount: 1,
          hasFormFields: false,
          isGovernmentOfficial: true
        };
      } else {
        throw new Error('テンプレートまたはファイルが選択されていません');
      }

      // PDF記入処理
      const fillResult = await fillPDFWithUniversalFiller(
        pdfBytes,
        templateInfo,
        applicationData
      );

      if (fillResult.success && fillResult.pdfBytes) {
        // ダウンロード用のBlobを作成
        const blob = new Blob([fillResult.pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        setResult({
          success: true,
          message: '申請書の記入が完了しました！',
          downloadUrl: url
        });
      } else {
        setResult({
          success: false,
          message: fillResult.error || 'PDF処理中にエラーが発生しました',
          errors: fillResult.error ? [fillResult.error] : undefined
        });
      }
      
    } catch (error) {
      console.error('PDF処理エラー:', error);
      setResult({
        success: false,
        message: 'PDF処理中にエラーが発生しました: ' + (error as Error).message
      });
    } finally {
      setProcessing(false);
    }
  };

  const generateDefaultMapping = (subsidyType: string) => {
    // 基本的なフィールドマッピングを生成
    const baseMapping = {
      companyName: {
        type: 'text' as const,
        label: '事業者名',
        coordinates: { page: 1, x: 200, y: 700 },
        format: { fontSize: 12, fontColor: '#000000' }
      },
      representative: {
        type: 'text' as const,
        label: '代表者名',
        coordinates: { page: 1, x: 200, y: 670 },
        format: { fontSize: 12, fontColor: '#000000' }
      },
      address: {
        type: 'text' as const,
        label: '所在地',
        coordinates: { page: 1, x: 200, y: 640 },
        format: { fontSize: 10, fontColor: '#000000' }
      },
      phoneNumber: {
        type: 'text' as const,
        label: '電話番号',
        coordinates: { page: 1, x: 200, y: 610 },
        format: { fontSize: 10, fontColor: '#000000' }
      },
      applicationDate: {
        type: 'date' as const,
        label: '申請日',
        coordinates: { page: 1, x: 450, y: 750 },
        format: { fontSize: 10, fontColor: '#000000' }
      },
      businessPlan: {
        type: 'multiline' as const,
        label: '事業計画',
        coordinates: { page: 2, x: 50, y: 700, width: 500 },
        format: { fontSize: 10, fontColor: '#000000', lineHeight: 15 }
      }
    };

    return baseMapping;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>申請書PDF生成</CardTitle>
          <CardDescription>
            設定済みのテンプレートまたは新規PDFに申請内容を記入します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* テンプレート選択 */}
          {availableTemplates.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">登録済みテンプレート</h3>
              <Select
                value={selectedTemplate?.id || ''}
                onValueChange={(value) => {
                  const template = availableTemplates.find(t => t.id === value);
                  setSelectedTemplate(template || null);
                  setUploadedFile(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="テンプレートを選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.subsidyType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ファイルアップロード */}
          <div>
            <h3 className="font-semibold mb-2">
              {availableTemplates.length > 0 ? 'または新規PDFをアップロード' : 'PDFテンプレートをアップロード'}
            </h3>
            <label className="block">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full cursor-pointer"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  PDFファイルを選択
                </span>
              </Button>
            </label>
            
            {uploadedFile && (
              <Alert className="mt-2">
                <FileText className="w-4 h-4" />
                <AlertDescription>
                  アップロード済み: {uploadedFile.name}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* 申請データプレビュー */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">記入される申請データ</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>事業者名:</strong> {applicationData.companyName}</div>
              <div><strong>代表者名:</strong> {applicationData.representative}</div>
              <div><strong>所在地:</strong> {applicationData.address}</div>
              <div><strong>電話番号:</strong> {applicationData.phoneNumber}</div>
              <div><strong>従業員数:</strong> {applicationData.employeeCount}名</div>
              <div><strong>申請額:</strong> ¥{applicationData.subsidyRequestAmount?.toLocaleString()}</div>
            </div>
            {applicationData.businessPlan && (
              <div className="mt-2">
                <strong>事業計画:</strong>
                <p className="text-xs mt-1 p-2 bg-white rounded">
                  {applicationData.businessPlan.substring(0, 100)}...
                </p>
              </div>
            )}
          </div>

          {/* 実行ボタン */}
          <Button
            onClick={processApplicationPDF}
            disabled={(!selectedTemplate && !uploadedFile) || processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              '処理中...'
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                申請書PDF生成
              </>
            )}
          </Button>

          {/* 結果表示 */}
          {result && (
            <Alert className={result.success ? 'border-green-500' : 'border-red-500'}>
              {result.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p>{result.message}</p>
                  {result.downloadUrl && (
                    <a
                      href={result.downloadUrl}
                      download={`${subsidyType || 'application'}_filled.pdf`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <FileDown className="w-4 h-4" />
                      記入済み申請書をダウンロード
                    </a>
                  )}
                  {result.errors && (
                    <div className="text-sm">
                      <p className="font-semibold">エラー詳細:</p>
                      <ul className="list-disc list-inside">
                        {result.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 注意事項 */}
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p className="font-semibold">ご利用上の注意:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>生成されたPDFは原本のレイアウトを保持したまま、空欄部分のみに記入されます</li>
                  <li>フォームフィールドがある場合は自動検出して記入、ない場合は座標ベースで配置されます</li>
                  <li>記入後のPDFは印刷して正式な申請書として提出可能です</li>
                  <li>テンプレートを事前登録すると、より正確な位置に記入できます</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}