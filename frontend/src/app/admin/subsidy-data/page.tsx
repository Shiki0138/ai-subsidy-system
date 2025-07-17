'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { 
  Upload, 
  FileText, 
  Database, 
  ArrowLeft,
  Plus,
  Folder,
  FileUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface SubsidyData {
  id: string;
  name: string;
  documents: {
    guidelines?: string; // 募集要項
    application?: string; // 申請書様式
    examples?: string[]; // 採択事例
  };
  lastUpdated: Date;
}

export default function SubsidyDataPage() {
  const [selectedSubsidy, setSelectedSubsidy] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const subsidies = [
    { id: 'jizokuka', name: '小規模企業持続化補助金' },
    { id: 'gyomukaizen', name: '業務改善助成金' },
    { id: 'it', name: 'IT導入補助金' },
    { id: 'monozukuri', name: 'ものづくり補助金' },
    { id: 'saikochiku', name: '事業再構築補助金' }
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus(`${type}をアップロード中...`);
    
    try {
      // ドキュメントタイプの判定
      let documentType = 'other';
      if (type === '募集要項') documentType = 'guidelines';
      else if (type === '採択事例') documentType = 'examples';
      
      // ファイルをアップロードして分析
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', documentType);
      
      const response = await fetch('/api/analyze-documents', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUploadStatus(`${type}の分析が完了しました`);
        console.log('分析結果:', result.analysis);
        // TODO: 分析結果を保存または表示
      } else {
        setUploadStatus(`${type}の分析に失敗しました`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`${type}のアップロードに失敗しました`);
    }
    
    setTimeout(() => setUploadStatus(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Database className="h-6 w-6 text-gray-600" />
                <h1 className="text-2xl font-bold text-gray-900">補助金データ管理</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 補助金選択 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">補助金選択</h2>
            <div className="space-y-2">
              {subsidies.map((subsidy) => (
                <Button
                  key={subsidy.id}
                  variant={selectedSubsidy === subsidy.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedSubsidy(subsidy.id)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  {subsidy.name}
                </Button>
              ))}
            </div>
          </Card>

          {/* データアップロード */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">データアップロード</h2>
            
            {selectedSubsidy ? (
              <div className="space-y-6">
                {/* 募集要項 */}
                <div>
                  <Label className="text-base font-semibold mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    募集要項
                  </Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, '募集要項')}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      PDF、Word形式に対応
                    </p>
                  </div>
                </div>

                {/* 申請書様式 */}
                <div>
                  <Label className="text-base font-semibold mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    申請書様式
                  </Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept=".pdf,.xls,.xlsx"
                      onChange={(e) => handleFileUpload(e, '申請書様式')}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      PDF、Excel形式に対応
                    </p>
                  </div>
                </div>

                {/* 採択事例 */}
                <div>
                  <Label className="text-base font-semibold mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    採択事例（複数可）
                  </Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      onChange={(e) => handleFileUpload(e, '採択事例')}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      複数ファイルを選択可能
                    </p>
                  </div>
                </div>

                {/* URL入力 */}
                <div>
                  <Label className="text-base font-semibold mb-2">
                    または、URLから取得
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/guidelines.pdf"
                      className="flex-1"
                    />
                    <Button>
                      <FileUp className="h-4 w-4 mr-2" />
                      取得
                    </Button>
                  </div>
                </div>

                {/* ステータス表示 */}
                {uploadStatus && (
                  <div className={`p-4 rounded-lg flex items-center ${
                    uploadStatus.includes('完了') 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {uploadStatus.includes('完了') ? (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-2" />
                    )}
                    {uploadStatus}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>左側から補助金を選択してください</p>
              </div>
            )}
          </Card>
        </div>

        {/* アップロード済みデータ一覧 */}
        {selectedSubsidy && (
          <Card className="mt-6 p-6">
            <h3 className="text-lg font-bold mb-4">アップロード済みデータ</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-3 text-gray-600" />
                  <div>
                    <p className="font-medium">募集要項_第17次.pdf</p>
                    <p className="text-sm text-gray-500">2024/12/25 アップロード</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">削除</Button>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}