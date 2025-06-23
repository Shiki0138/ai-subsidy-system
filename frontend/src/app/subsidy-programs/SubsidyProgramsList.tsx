'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/services/api/base';
import {
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  ChevronRightIcon,
  NewspaperIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface LatestDocument {
  id: string;
  subsidyProgramId: string;
  subsidyProgramName: string;
  category: string;
  type: string;
  title: string;
  publishedDate: string;
  publishedDateFormatted: string;
  isNew: boolean;
}

const documentTypeLabels: Record<string, string> = {
  OVERVIEW: '概要説明資料',
  GUIDELINE: '募集要項',
  APPLICATION_FORM: '申請書様式',
  CHECKLIST: 'チェックリスト',
  FAQ: 'よくある質問',
  PRESENTATION: '説明会資料',
  EXAMPLE: '記入例',
  OTHER: 'その他'
};

export default function SubsidyProgramsList() {
  const [latestDocuments, setLatestDocuments] = useState<LatestDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestDocuments();
  }, []);

  const fetchLatestDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subsidy-documents/latest-updates?limit=20');
      setLatestDocuments(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || '最新情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error" className="max-w-2xl mx-auto mt-8">
        {error}
      </Alert>
    );
  }

  // 補助金プログラムごとにグループ化
  const groupedByProgram = latestDocuments.reduce((acc, doc) => {
    if (!acc[doc.subsidyProgramId]) {
      acc[doc.subsidyProgramId] = {
        programName: doc.subsidyProgramName,
        category: doc.category,
        documents: []
      };
    }
    acc[doc.subsidyProgramId].documents.push(doc);
    return acc;
  }, {} as Record<string, { programName: string; category: string; documents: LatestDocument[] }>);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">補助金・助成金情報</h1>
        <p className="text-lg text-gray-600">
          各種補助金・助成金の最新情報と募集要項をご確認いただけます。
          資料の更新日時を必ずご確認の上、最新の情報に基づいて申請準備を進めてください。
        </p>
      </div>

      {/* 最新更新情報 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <NewspaperIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">最新更新情報</h2>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <ExclamationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              以下は最近更新された資料です。申請前に必ず公式サイトで最新情報をご確認ください。
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {latestDocuments.slice(0, 5).map(doc => (
            <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {doc.subsidyProgramName} - {documentTypeLabels[doc.type]}
                    </p>
                    <p className="text-sm text-gray-600">{doc.title}</p>
                  </div>
                  {doc.isNew && (
                    <Badge variant="success" size="sm">NEW</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    {doc.publishedDateFormatted}
                  </span>
                  <Link href={`/subsidy-programs/${doc.subsidyProgramId}`}>
                    <Button variant="primary" size="sm">
                      詳細を見る
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 補助金プログラム一覧 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">補助金プログラム一覧</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedByProgram).map(([programId, { programName, category, documents }]) => (
            <Card key={programId} className="p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{programName}</h3>
                  <Badge variant="default">{category}</Badge>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 font-medium">利用可能な資料:</p>
                <div className="flex flex-wrap gap-2">
                  {documents.map(doc => (
                    <Badge key={doc.id} variant="outline" size="sm">
                      {documentTypeLabels[doc.type]}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  最終更新: {documents[0].publishedDateFormatted}
                </span>
                <Link href={`/subsidy-programs/${programId}`}>
                  <Button size="sm" className="flex items-center gap-1">
                    詳細・資料を見る
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* フッター注意事項 */}
      <Alert type="info" className="mt-8">
        <p className="font-medium mb-1">ご利用にあたって</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>掲載情報は参考情報です。必ず各補助金の公式サイトで最新情報をご確認ください。</li>
          <li>募集要項や申請様式は予告なく変更される場合があります。</li>
          <li>申請にあたっては、専門家（認定経営革新等支援機関等）への相談をお勧めします。</li>
        </ul>
      </Alert>
    </div>
  );
}