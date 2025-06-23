'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, FileText, Download, ExternalLink, AlertCircle } from 'lucide-react';
import DocumentCreationForm from '@/components/subsidies/sustainability/DocumentCreationForm';

export default function SustainabilitySubsidyPage() {
  const [showCreationForm, setShowCreationForm] = useState(false);

  const requiredDocuments = [
    {
      id: 'form1',
      name: '様式1：申請書',
      description: '小規模事業者持続化補助金に係る申請書',
      autoGenerable: true,
      status: 'ready',
      details: '企業基本情報を基に自動生成されます'
    },
    {
      id: 'form2',
      name: '様式2：経営計画書',
      description: '経営計画書兼補助事業計画書①',
      autoGenerable: true,
      aiAssisted: true,
      status: 'ready',
      details: 'AIが市場分析・競合分析を含む高品質な計画書を作成します'
    },
    {
      id: 'form3',
      name: '様式3：補助事業計画書',
      description: '補助事業計画書②（経費明細）',
      autoGenerable: true,
      status: 'ready',
      details: '予算計画と経費明細から自動生成されます'
    },
    {
      id: 'form4',
      name: '様式4：事業支援計画書',
      description: '商工会・商工会議所発行の支援計画書',
      autoGenerable: false,
      external: true,
      status: 'manual',
      details: '最寄りの商工会・商工会議所で事前相談が必要です',
      actionLink: 'https://www.shokokai.or.jp/',
      actionText: '商工会を探す'
    },
    {
      id: 'form5',
      name: '様式5：交付申請書',
      description: '補助金交付申請書',
      autoGenerable: true,
      status: 'ready',
      details: '申請内容から自動生成されます'
    },
    {
      id: 'form6',
      name: '様式6：宣誓・同意書',
      description: '宣誓・同意書',
      autoGenerable: true,
      status: 'ready',
      details: '標準フォーマットで自動生成されます'
    },
    {
      id: 'form7',
      name: '様式7：賃金引上げ枠誓約書',
      description: '賃金引上げ枠の申請に係る誓約書',
      autoGenerable: true,
      optional: true,
      status: 'conditional',
      details: '賃金引上げ枠で申請する場合のみ必要'
    }
  ];

  const additionalDocuments = [
    {
      id: 'financial',
      name: '財務関係書類',
      description: '確定申告書、決算書等（直近2期分）',
      autoGenerable: false,
      status: 'prepare',
      details: '税務署に提出した確定申告書の控え（個人事業主）または決算書（法人）が必要です'
    },
    {
      id: 'registration',
      name: '登記関係書類',
      description: '開業届、登記簿謄本等',
      autoGenerable: false,
      status: 'prepare',
      details: '個人事業主：開業届の控え、法人：履歴事項全部証明書（3か月以内）'
    },
    {
      id: 'quotations',
      name: '見積書',
      description: '単価50万円以上の機械装置等を購入する場合',
      autoGenerable: false,
      optional: true,
      status: 'prepare',
      details: '3社以上からの見積書が必要（相見積もり）'
    }
  ];

  const handleStartCreation = () => {
    setShowCreationForm(true);
  };

  if (showCreationForm) {
    return <DocumentCreationForm onBack={() => setShowCreationForm(false)} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">小規模企業持続化補助金 申請書類作成</h1>

      {/* 重要な注意事項 */}
      <Alert className="mb-8 border-orange-500 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-gray-800">
          <strong className="block mb-2">申請前の重要確認事項</strong>
          <ul className="list-disc pl-5 space-y-1">
            <li>商工会・商工会議所での事前相談が必須です（様式4取得のため）</li>
            <li>GビズIDプライムの取得には3-4週間かかります</li>
            <li>財務書類・登記書類は事前にご準備ください</li>
            <li>電子申請を推奨（郵送は減点対象となる場合があります）</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* 申請書類セクション */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">必須申請書類</h2>
        <div className="grid gap-4">
          {requiredDocuments.map((doc) => (
            <Card key={doc.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium">{doc.name}</h3>
                    {doc.autoGenerable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        自動生成可能
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        <XCircle className="h-3 w-3" />
                        手動準備必要
                      </span>
                    )}
                    {doc.aiAssisted && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        AI支援
                      </span>
                    )}
                    {doc.optional && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        条件付き
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                  <p className="text-sm text-gray-500">{doc.details}</p>
                </div>
                <div className="ml-4">
                  {doc.external && doc.actionLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.actionLink, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {doc.actionText}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 添付書類セクション */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">添付必須書類（ご自身でご準備ください）</h2>
        <div className="grid gap-4">
          {additionalDocuments.map((doc) => (
            <Card key={doc.id} className="p-6 bg-gray-50">
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium">{doc.name}</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                      <AlertCircle className="h-3 w-3" />
                      要準備
                    </span>
                    {doc.optional && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        条件付き
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                  <p className="text-sm text-gray-500">{doc.details}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 申請準備チェックリスト */}
      <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-blue-900">申請準備チェックリスト</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-4 w-4" />
            <span className="text-sm">GビズIDプライムを取得済み（または申請中）</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-4 w-4" />
            <span className="text-sm">商工会・商工会議所での事前相談予約済み</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-4 w-4" />
            <span className="text-sm">直近2期分の財務書類を準備済み</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-4 w-4" />
            <span className="text-sm">履歴事項全部証明書（3か月以内）を取得済み</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-4 w-4" />
            <span className="text-sm">必要な見積書（3社以上）を取得済み</span>
          </label>
        </div>
      </Card>

      {/* 書類作成開始ボタン */}
      <div className="text-center">
        <Button 
          onClick={handleStartCreation}
          className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
        >
          <FileText className="mr-2 h-5 w-5" />
          申請書類の作成を開始する
        </Button>
        <p className="text-sm text-gray-500 mt-2">
          自動生成可能な6書類をまとめて作成します
        </p>
      </div>
    </div>
  );
}