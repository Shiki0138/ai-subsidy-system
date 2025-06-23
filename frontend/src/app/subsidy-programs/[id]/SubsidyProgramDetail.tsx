'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/services/api/base';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon as DownloadIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  QuestionMarkCircleIcon,
  PresentationChartBarIcon
} from '@heroicons/react/24/outline';

interface SubsidyDocument {
  id: string;
  type: string;
  title: string;
  description?: string;
  content?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  version: string;
  publishedDate: string;
  publishedDateFormatted: string;
  lastCheckedFormatted: string;
  isLatest: boolean;
}

interface SubsidyProgramDetail {
  program: {
    id: string;
    name: string;
    category: string;
    organizationName: string;
    description?: string;
    maxAmount: number;
    requirements: any;
    applicationPeriod: {
      start: string;
      end: string;
      startFormatted: string;
      endFormatted: string;
      daysRemaining: number;
    };
    lastUpdatedFormatted: string;
    sourceUrl?: string;
  };
  documentsByType: Record<string, SubsidyDocument[]>;
  summary: {
    totalDocuments: number;
    hasOverview: boolean;
    hasGuideline: boolean;
    hasApplicationForm: boolean;
    lastDocumentUpdate: string | null;
  };
}

const documentTypeInfo = {
  OVERVIEW: {
    label: '概要説明資料',
    icon: InformationCircleIcon,
    color: 'blue'
  },
  GUIDELINE: {
    label: '募集要項',
    icon: DocumentTextIcon,
    color: 'green'
  },
  APPLICATION_FORM: {
    label: '申請書様式',
    icon: DocumentDuplicateIcon,
    color: 'purple'
  },
  CHECKLIST: {
    label: 'チェックリスト',
    icon: CheckCircleIcon,
    color: 'yellow'
  },
  FAQ: {
    label: 'よくある質問',
    icon: QuestionMarkCircleIcon,
    color: 'orange'
  },
  PRESENTATION: {
    label: '説明会資料',
    icon: PresentationChartBarIcon,
    color: 'pink'
  },
  EXAMPLE: {
    label: '記入例',
    icon: DocumentDuplicateIcon,
    color: 'indigo'
  },
  OTHER: {
    label: 'その他',
    icon: DocumentTextIcon,
    color: 'gray'
  }
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function SubsidyProgramDetail({ subsidyProgramId }: { subsidyProgramId: string }) {
  const router = useRouter();
  const [data, setData] = useState<SubsidyProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    fetchProgramDetail();
  }, [subsidyProgramId]);

  const fetchProgramDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/subsidy-documents/subsidy-programs/${subsidyProgramId}/detail`);
      setData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || '補助金情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (document: SubsidyDocument) => {
    if (document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };

  const handleApply = () => {
    router.push(`/dashboard/applications/new?subsidyProgramId=${subsidyProgramId}`);
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

  if (!data) {
    return null;
  }

  const { program, documentsByType, summary } = data;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{program.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Badge variant="default">{program.category}</Badge>
              <span>{program.organizationName}</span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                最終更新: {program.lastUpdatedFormatted}
              </span>
            </div>
          </div>
          <Button onClick={handleApply} className="flex items-center gap-2">
            申請書を作成
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* 募集期間 */}
        <Card className="bg-blue-50 border-blue-200 p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">募集期間</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700">
                {program.applicationPeriod.startFormatted} 〜 {program.applicationPeriod.endFormatted}
              </p>
              {program.applicationPeriod.daysRemaining > 0 ? (
                <p className="text-lg font-bold text-blue-900">
                  残り {program.applicationPeriod.daysRemaining} 日
                </p>
              ) : (
                <Badge variant="error">募集終了</Badge>
              )}
            </div>
          </div>
        </Card>

        {/* 最大補助金額 */}
        <div className="mt-4">
          <p className="text-sm text-gray-600">最大補助金額</p>
          <p className="text-2xl font-bold text-gray-900">
            {program.maxAmount.toLocaleString()}円
          </p>
        </div>
      </div>

      {/* 資料セクション */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">関連資料</h2>
        
        {/* 資料タイプフィルター */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedType === null ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            すべて ({summary.totalDocuments})
          </Button>
          {Object.entries(documentTypeInfo).map(([type, info]) => {
            const count = documentsByType[type]?.length || 0;
            if (count === 0) return null;
            
            return (
              <Button
                key={type}
                variant={selectedType === type ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="flex items-center gap-1"
              >
                <info.icon className="h-4 w-4" />
                {info.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* 資料一覧 */}
        <div className="space-y-4">
          {Object.entries(documentsByType)
            .filter(([type]) => !selectedType || type === selectedType)
            .map(([type, documents]) => (
              <div key={type} className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  {React.createElement(documentTypeInfo[type as keyof typeof documentTypeInfo].icon, {
                    className: 'h-5 w-5'
                  })}
                  {documentTypeInfo[type as keyof typeof documentTypeInfo].label}
                </h3>
                
                {documents.map((doc) => (
                  <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{doc.title}</h4>
                          <Badge variant="default" size="sm">
                            v{doc.version}
                          </Badge>
                          {doc.isLatest && (
                            <Badge variant="success" size="sm">最新</Badge>
                          )}
                        </div>
                        
                        {doc.description && (
                          <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            公開日: {doc.publishedDateFormatted}
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            最終確認: {doc.lastCheckedFormatted}
                          </span>
                          {doc.fileSize && (
                            <span>{formatFileSize(doc.fileSize)}</span>
                          )}
                        </div>
                      </div>
                      
                      {doc.fileUrl && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          className="flex items-center gap-1"
                        >
                          <DownloadIcon className="h-4 w-4" />
                          ダウンロード
                        </Button>
                      )}
                    </div>
                    
                    {doc.content && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                        <pre className="whitespace-pre-wrap">{doc.content}</pre>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ))}
        </div>

        {/* 資料がない場合 */}
        {summary.totalDocuments === 0 && (
          <div className="text-center py-8">
            <ExclamationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">関連資料はまだ登録されていません</p>
          </div>
        )}
      </div>

      {/* 注意事項 */}
      <Alert type="info">
        <div className="flex items-start gap-2">
          <InformationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">資料の取り扱いについて</p>
            <p className="text-sm">
              掲載されている資料は参考情報です。最新の正式な募集要項については、
              必ず各補助金の公式サイトをご確認ください。
            </p>
            {program.sourceUrl && (
              <a
                href={program.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
              >
                公式サイトを確認する →
              </a>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
}