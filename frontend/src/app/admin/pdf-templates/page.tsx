'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Settings, Trash2, Eye, Edit, Download } from 'lucide-react';
import { PDFTemplateInfo } from '@/types/pdf-template';
import { templateManager } from '@/utils/pdf-template-manager';
import PDFTemplateUpload from '@/components/pdf-template/PDFTemplateUpload';
import { AdminLayout } from '@/components/layout/AdminHeader';

function PDFTemplatesPage() {
  const [templates, setTemplates] = useState<PDFTemplateInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'upload'>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplateInfo | null>(null);

  useEffect(() => {
    templateManager.initialize();
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const allTemplates = templateManager.getAllTemplates();
    setTemplates(allTemplates);
  };

  const handleTemplateUploaded = (template: PDFTemplateInfo) => {
    loadTemplates();
    setActiveTab('list');
  };

  const handleToggleActive = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      templateManager.updateTemplate(templateId, { isActive: !template.isActive });
      loadTemplates();
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('このテンプレートを削除しますか？')) {
      templateManager.deleteTemplate(templateId);
      loadTemplates();
    }
  };

  const getSubsidyTypeLabel = (subsidyType: string) => {
    const labels: { [key: string]: string } = {
      'gyomu-kaizen': '業務改善助成金',
      'it-introduction': 'IT導入補助金',
      'jizokukas': '小規模事業者持続化補助金',
      'monozukuri': 'ものづくり補助金',
      'career-development': 'キャリアアップ助成金',
      'green-innovation': 'グリーンイノベーション基金',
      'dx-investment': 'DX投資促進税制',
      'custom': 'その他'
    };
    return labels[subsidyType] || subsidyType;
  };

  const renderTemplateCard = (template: PDFTemplateInfo) => (
    <Card key={template.id} className={`${!template.isActive ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={template.isActive ? 'default' : 'secondary'}>
              {template.isActive ? 'アクティブ' : '無効'}
            </Badge>
            <Badge variant="outline">
              {getSubsidyTypeLabel(template.subsidyType)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">ファイル名</p>
            <p className="text-sm font-medium">{template.fileName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">アップロード日</p>
            <p className="text-sm font-medium">
              {new Date(template.uploadDate).toLocaleDateString('ja-JP')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">ページ数</p>
            <p className="text-sm font-medium">{template.pageCount}ページ</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">フォームフィールド</p>
            <p className="text-sm font-medium">
              {template.hasFormFields ? 'あり' : 'なし'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">マッピング数</p>
            <p className="text-sm font-medium">
              {Object.keys(template.fieldMapping).length}個
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">政府公式</p>
            <p className="text-sm font-medium">
              {template.isGovernmentOfficial ? 'はい' : 'いいえ'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedTemplate(template)}
          >
            <Eye className="w-4 h-4 mr-2" />
            詳細
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleActive(template.id)}
          >
            <Settings className="w-4 h-4 mr-2" />
            {template.isActive ? '無効化' : '有効化'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteTemplate(template.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            削除
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PDF申請書テンプレート管理</h1>
            <p className="text-gray-600 mt-2">
              補助金申請書のPDFテンプレートをアップロードし、フィールドマッピングを設定します
            </p>
          </div>
        </div>
        
        <Alert className="bg-blue-50 border-blue-200">
          <FileText className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>重要:</strong> 一度設定したテンプレートは、対応する補助金の申請時に自動的に使用されます。
            正確なフィールドマッピングを設定することで、申請書の記入精度が向上します。
          </AlertDescription>
        </Alert>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">テンプレート一覧</TabsTrigger>
          <TabsTrigger value="upload">新規アップロード</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">登録済みテンプレート</h2>
            <Button onClick={() => setActiveTab('upload')}>
              <Plus className="w-4 h-4 mr-2" />
              新規アップロード
            </Button>
          </div>

          {templates.length === 0 ? (
            <Alert>
              <FileText className="w-4 h-4" />
              <AlertDescription>
                まだテンプレートが登録されていません。
                「新規アップロード」タブから申請書PDFをアップロードしてください。
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {templates.map(renderTemplateCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload">
          <PDFTemplateUpload onTemplateUploaded={handleTemplateUploaded} />
        </TabsContent>
      </Tabs>

      {/* テンプレート詳細モーダル */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedTemplate.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTemplate(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">基本情報</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">補助金タイプ</p>
                      <p>{getSubsidyTypeLabel(selectedTemplate.subsidyType)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">ファイル名</p>
                      <p>{selectedTemplate.fileName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">ページ数</p>
                      <p>{selectedTemplate.pageCount}ページ</p>
                    </div>
                    <div>
                      <p className="text-gray-600">フォームフィールド</p>
                      <p>{selectedTemplate.hasFormFields ? 'あり' : 'なし'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">フィールドマッピング</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedTemplate.fieldMapping).map(([key, field]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{field.label}</p>
                          <p className="text-sm text-gray-600">
                            {field.fieldName || `座標: (${field.coordinates?.x}, ${field.coordinates?.y})`}
                          </p>
                        </div>
                        <Badge variant="outline">{field.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function PDFTemplatesPageWithLayout() {
  return (
    <AdminLayout>
      <PDFTemplatesPage />
    </AdminLayout>
  );
}