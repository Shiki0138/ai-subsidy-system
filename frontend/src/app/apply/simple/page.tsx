'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { 
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Building,
  FileText,
  Download,
  Copy,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { generateWordDocument } from '@/utils/word-generator';

interface ApplicationData {
  subsidyType: string;
  companyInfo: {
    name: string;
    address: string;
    employees: number;
    revenue: string;
    industry: string;
  };
  projectInfo: {
    title: string;
    purpose: string;
    content: string;
    budget: string;
    period: string;
  };
}

export default function SimpleApplicationPage() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string>('');
  
  const [formData, setFormData] = useState<ApplicationData>({
    subsidyType: '',
    companyInfo: {
      name: '',
      address: '',
      employees: 0,
      revenue: '',
      industry: ''
    },
    projectInfo: {
      title: '',
      purpose: '',
      content: '',
      budget: '',
      period: ''
    }
  });

  const subsidies = [
    { id: 'jizokuka', name: '小規模企業持続化補助金' },
    { id: 'gyomukaizen', name: '業務改善助成金' },
    { id: 'it', name: 'IT導入補助金' },
    { id: 'monozukuri', name: 'ものづくり補助金' },
    { id: 'saikochiku', name: '事業再構築補助金' }
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-application-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subsidyType: formData.subsidyType,
          companyInfo: formData.companyInfo,
          projectInfo: formData.projectInfo,
          uploadedDocuments: {} // TODO: アップロードされたドキュメントの分析結果を含める
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setGeneratedContent(result.data);
        setStep(4);
      } else {
        alert('申請書の生成に失敗しました');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('エラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (field: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">補助金を選択</h2>
            <div className="space-y-3">
              {subsidies.map((subsidy) => (
                <Button
                  key={subsidy.id}
                  variant={formData.subsidyType === subsidy.id ? 'default' : 'outline'}
                  className="w-full justify-start p-4 h-auto"
                  onClick={() => setFormData({ ...formData, subsidyType: subsidy.id })}
                >
                  <div className="text-left">
                    <p className="font-semibold">{subsidy.name}</p>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        );

      case 2:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">企業情報</h2>
            <div className="space-y-4">
              <div>
                <Label>企業名</Label>
                <Input
                  value={formData.companyInfo.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    companyInfo: { ...formData.companyInfo, name: e.target.value }
                  })}
                  placeholder="株式会社〇〇"
                />
              </div>
              <div>
                <Label>所在地</Label>
                <Input
                  value={formData.companyInfo.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    companyInfo: { ...formData.companyInfo, address: e.target.value }
                  })}
                  placeholder="東京都〇〇区..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>従業員数</Label>
                  <Input
                    type="number"
                    value={formData.companyInfo.employees}
                    onChange={(e) => setFormData({
                      ...formData,
                      companyInfo: { ...formData.companyInfo, employees: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label>年間売上高</Label>
                  <Input
                    value={formData.companyInfo.revenue}
                    onChange={(e) => setFormData({
                      ...formData,
                      companyInfo: { ...formData.companyInfo, revenue: e.target.value }
                    })}
                    placeholder="1,000万円"
                  />
                </div>
              </div>
              <div>
                <Label>業種</Label>
                <Input
                  value={formData.companyInfo.industry}
                  onChange={(e) => setFormData({
                    ...formData,
                    companyInfo: { ...formData.companyInfo, industry: e.target.value }
                  })}
                  placeholder="製造業、サービス業など"
                />
              </div>
            </div>
          </Card>
        );

      case 3:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">事業計画</h2>
            <div className="space-y-4">
              <div>
                <Label>事業名</Label>
                <Input
                  value={formData.projectInfo.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    projectInfo: { ...formData.projectInfo, title: e.target.value }
                  })}
                  placeholder="〇〇システム導入による生産性向上事業"
                />
              </div>
              <div>
                <Label>事業目的</Label>
                <Textarea
                  value={formData.projectInfo.purpose}
                  onChange={(e) => setFormData({
                    ...formData,
                    projectInfo: { ...formData.projectInfo, purpose: e.target.value }
                  })}
                  placeholder="どのような課題を解決したいか"
                  rows={3}
                />
              </div>
              <div>
                <Label>事業内容</Label>
                <Textarea
                  value={formData.projectInfo.content}
                  onChange={(e) => setFormData({
                    ...formData,
                    projectInfo: { ...formData.projectInfo, content: e.target.value }
                  })}
                  placeholder="具体的に何を行うか"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>事業費用</Label>
                  <Input
                    value={formData.projectInfo.budget}
                    onChange={(e) => setFormData({
                      ...formData,
                      projectInfo: { ...formData.projectInfo, budget: e.target.value }
                    })}
                    placeholder="500万円"
                  />
                </div>
                <div>
                  <Label>実施期間</Label>
                  <Input
                    value={formData.projectInfo.period}
                    onChange={(e) => setFormData({
                      ...formData,
                      projectInfo: { ...formData.projectInfo, period: e.target.value }
                    })}
                    placeholder="6ヶ月"
                  />
                </div>
              </div>
            </div>
          </Card>
        );

      case 4:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">生成された申請内容</h2>
            <div className="space-y-6">
              {generatedContent && Object.entries(generatedContent).map(([key, value]) => (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{key}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(key, value as string)}
                    >
                      {copiedField === key ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          コピー済み
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          コピー
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{value as string}</p>
                </div>
              ))}
              
              <div className="flex gap-4 mt-6">
                <Button 
                  className="flex-1" 
                  variant="outline"
                  onClick={() => generateWordDocument(generatedContent, formData)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Word形式でダウンロード
                </Button>
                <Button className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  添付書類を生成
                </Button>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">補助金申請書作成</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 進捗インジケーター */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`flex items-center ${num < 4 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= num
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {num}
              </div>
              {num < 4 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    step > num ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between max-w-3xl mx-auto mt-2 text-sm">
          <span className={step >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
            補助金選択
          </span>
          <span className={step >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
            企業情報
          </span>
          <span className={step >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
            事業計画
          </span>
          <span className={step >= 4 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
            申請書生成
          </span>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {renderStep()}

        {/* ナビゲーションボタン */}
        <div className="flex justify-between mt-6">
          {step > 1 && step < 4 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          )}
          
          {step < 3 && (
            <Button
              className="ml-auto"
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !formData.subsidyType) ||
                (step === 2 && !formData.companyInfo.name)
              }
            >
              次へ
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          
          {step === 3 && (
            <Button
              className="ml-auto"
              onClick={handleGenerate}
              disabled={isGenerating || !formData.projectInfo.title}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  申請書を生成
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}