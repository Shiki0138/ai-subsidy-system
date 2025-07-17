'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, CheckCircle, AlertCircle, Eye, Settings } from 'lucide-react';
import { UniversalPDFFiller } from '@/utils/universal-pdf-filler';
import { PDFTemplateInfo, FieldMapping } from '@/types/pdf-template';
import { templateManager } from '@/utils/pdf-template-manager';
import FieldMappingEditor from './FieldMappingEditor';

interface PDFTemplateUploadProps {
  onTemplateUploaded?: (templateInfo: PDFTemplateInfo) => void;
}

export default function PDFTemplateUpload({ onTemplateUploaded }: PDFTemplateUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfAnalysis, setPdfAnalysis] = useState<any>(null);
  const [templateInfo, setTemplateInfo] = useState<Partial<PDFTemplateInfo>>({
    subsidyType: '',
    name: '',
    description: '',
    isGovernmentOfficial: true
  });
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [step, setStep] = useState<'upload' | 'analyze' | 'mapping' | 'confirm' | 'complete'>('upload');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subsidyTypes = [
    { value: 'gyomu-kaizen', label: '業務改善助成金' },
    { value: 'it-introduction', label: 'IT導入補助金' },
    { value: 'jizokukas', label: '小規模事業者持続化補助金' },
    { value: 'monozukuri', label: 'ものづくり補助金' },
    { value: 'career-development', label: 'キャリアアップ助成金' },
    { value: 'green-innovation', label: 'グリーンイノベーション基金' },
    { value: 'dx-investment', label: 'DX投資促進税制' },
    { value: 'custom', label: 'その他' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setStep('analyze');
    } else {
      setError('PDFファイルを選択してください');
    }
  };

  const analyzePDF = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const filler = new UniversalPDFFiller();
      
      // 空のテンプレート情報で初期化
      const tempTemplate: PDFTemplateInfo = {
        id: 'temp',
        subsidyType: templateInfo.subsidyType || '',
        name: templateInfo.name || selectedFile.name,
        description: templateInfo.description || '',
        fileName: selectedFile.name,
        uploadDate: new Date().toISOString(),
        isActive: true,
        fieldMapping: {},
        pageCount: 0,
        hasFormFields: false,
        isGovernmentOfficial: templateInfo.isGovernmentOfficial || true
      };

      await filler.loadTemplate(arrayBuffer, tempTemplate);
      const analysis = await filler.analyzeTemplate();
      
      setPdfAnalysis(analysis);
      setStep('mapping');
      
    } catch (err) {
      setError('PDFの分析中にエラーが発生しました: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleMappingComplete = (mapping: FieldMapping) => {
    setFieldMapping(mapping);
    setStep('confirm');
  };

  const saveTemplate = async () => {
    if (!selectedFile || !templateInfo.subsidyType) return;

    setProcessing(true);
    setError(null);

    try {
      const templateId = await templateManager.registerTemplate(
        templateInfo.subsidyType,
        selectedFile,
        fieldMapping,
        {
          ...templateInfo,
          pageCount: pdfAnalysis?.pageCount || 0,
          hasFormFields: pdfAnalysis?.hasFormFields || false
        }
      );

      const savedTemplate = templateManager.getTemplate(templateId);
      if (savedTemplate) {
        setStep('complete');
        onTemplateUploaded?.(savedTemplate);
      }
      
    } catch (err) {
      setError('テンプレートの保存中にエラーが発生しました: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPdfAnalysis(null);
    setTemplateInfo({
      subsidyType: '',
      name: '',
      description: '',
      isGovernmentOfficial: true
    });
    setFieldMapping({});
    setStep('upload');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PDF申請書テンプレートのアップロード</CardTitle>
          <CardDescription>
            政府指定の申請書PDFをアップロードし、フィールドマッピングを設定します
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* ステップインジケーター */}
          <div className="flex items-center space-x-4 mb-6">
            {[
              { key: 'upload', label: 'アップロード', icon: Upload },
              { key: 'analyze', label: '分析', icon: Eye },
              { key: 'mapping', label: 'マッピング', icon: Settings },
              { key: 'confirm', label: '確認', icon: CheckCircle },
              { key: 'complete', label: '完了', icon: CheckCircle }
            ].map(({ key, label, icon: Icon }, index) => (
              <div key={key} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === key ? 'bg-blue-500 text-white' : 
                  ['upload', 'analyze', 'mapping', 'confirm', 'complete'].indexOf(step) > index ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="ml-2 text-sm font-medium">{label}</span>
                {index < 4 && <div className="w-8 h-px bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>

          {error && (
            <Alert className="mb-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subsidyType">補助金タイプ</Label>
                  <Select
                    value={templateInfo.subsidyType}
                    onValueChange={(value) => setTemplateInfo(prev => ({ ...prev, subsidyType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="補助金タイプを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {subsidyTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="name">テンプレート名</Label>
                  <Input
                    id="name"
                    value={templateInfo.name}
                    onChange={(e) => setTemplateInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例: 業務改善助成金申請書"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={templateInfo.description}
                  onChange={(e) => setTemplateInfo(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="テンプレートの詳細説明"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="pdf-file">PDFファイル</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  disabled={!templateInfo.subsidyType}
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">PDFファイルをアップロード</p>
                  </div>
                </Button>
              </div>

              {selectedFile && (
                <Alert>
                  <FileText className="w-4 h-4" />
                  <AlertDescription>
                    選択されたファイル: {selectedFile.name}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 2: Analyze */}
          {step === 'analyze' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">PDFを分析しています</h3>
                <p className="text-gray-600 mb-4">
                  フォームフィールドとページ構造を検出中...
                </p>
                <Button onClick={analyzePDF} disabled={processing}>
                  {processing ? '分析中...' : '分析を開始'}
                </Button>
              </div>

              {pdfAnalysis && (
                <Alert>
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>✅ ページ数: {pdfAnalysis.pageCount}</p>
                      <p>✅ フォームフィールド: {pdfAnalysis.hasFormFields ? `${pdfAnalysis.fieldNames.length}個` : 'なし'}</p>
                      {pdfAnalysis.hasFormFields && (
                        <p>✅ 検出されたフィールド: {pdfAnalysis.fieldNames.join(', ')}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 3: Mapping */}
          {step === 'mapping' && pdfAnalysis && (
            <div>
              <h3 className="text-lg font-semibold mb-4">フィールドマッピング設定</h3>
              <FieldMappingEditor
                detectedFields={pdfAnalysis.fieldNames}
                onMappingChange={setFieldMapping}
                onSave={handleMappingComplete}
              />
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">設定確認</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>補助金タイプ</Label>
                  <p className="text-sm text-gray-600">
                    {subsidyTypes.find(t => t.value === templateInfo.subsidyType)?.label}
                  </p>
                </div>
                <div>
                  <Label>テンプレート名</Label>
                  <p className="text-sm text-gray-600">{templateInfo.name}</p>
                </div>
                <div>
                  <Label>ファイル名</Label>
                  <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                </div>
                <div>
                  <Label>マッピング数</Label>
                  <p className="text-sm text-gray-600">{Object.keys(fieldMapping).length}個</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('mapping')}>
                  マッピングを編集
                </Button>
                <Button onClick={saveTemplate} disabled={processing}>
                  {processing ? '保存中...' : 'テンプレートを保存'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold">テンプレートの保存が完了しました</h3>
              <p className="text-gray-600">
                申請書テンプレートの設定が完了しました。
                申請時にこのテンプレートを使用できます。
              </p>
              <Button onClick={resetUpload}>
                新しいテンプレートをアップロード
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}