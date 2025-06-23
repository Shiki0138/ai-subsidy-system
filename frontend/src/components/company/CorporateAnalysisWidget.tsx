'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/services/api/base';
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  LinkIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface CorporateAnalysisProps {
  corporateNumber?: string;
  onAnalysisComplete?: (data: any) => void;
}

interface AnalysisResult {
  companyInfo: any;
  relatedCompanies: Array<{
    corporateNumber: string;
    name: string;
    relation: string;
    details: string;
  }>;
  branchInfo?: any;
  applicationSummary: string;
}

export default function CorporateAnalysisWidget({ corporateNumber, onAnalysisComplete }: CorporateAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'trust' | 'related'>('overview');

  const fetchAnalysis = async () => {
    if (!corporateNumber) {
      setError('法人番号を入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/corporate-analysis/${corporateNumber}/analysis`);
      setAnalysisData(response.data.data);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '企業分析データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getTrustScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrustScoreBadge = (score: number): string => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'primary';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateCorporateAge = (assignmentDate: string): number => {
    const assignment = new Date(assignmentDate);
    const now = new Date();
    return Math.floor((now.getTime() - assignment.getTime()) / (365 * 24 * 60 * 60 * 1000));
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
          企業詳細分析（法人番号API）
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          法人番号から企業の信頼性・関連企業・変更履歴を分析します
        </p>
      </div>

      {!analysisData && (
        <div className="text-center py-8">
          <Button onClick={fetchAnalysis} disabled={loading || !corporateNumber}>
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                分析中...
              </>
            ) : (
              <>
                <ChartBarIcon className="h-4 w-4 mr-2" />
                企業分析を実行
              </>
            )}
          </Button>
          
          {error && (
            <Alert type="error" className="mt-4">
              {error}
            </Alert>
          )}
        </div>
      )}

      {analysisData && (
        <div className="space-y-4">
          {/* タブナビゲーション */}
          <div className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              概要
            </button>
            <button
              onClick={() => setActiveTab('trust')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'trust'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              信頼性スコア
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              変更履歴
            </button>
            <button
              onClick={() => setActiveTab('related')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'related'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              関連企業
            </button>
          </div>

          {/* 概要タブ */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">基本情報</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">企業名</p>
                    <p className="font-semibold">{analysisData.companyInfo.companyName}</p>
                    {analysisData.companyInfo.furigana && (
                      <p className="text-xs text-gray-500">{analysisData.companyInfo.furigana}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-600">法人種別</p>
                    <p className="font-semibold">{analysisData.companyInfo.kind}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">法人番号</p>
                    <p className="font-mono">{analysisData.companyInfo.corporateNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">設立年月日</p>
                    <p className="font-semibold">
                      {formatDate(analysisData.companyInfo.status.assignmentDate)}
                      <span className="text-sm text-gray-500 ml-1">
                        （{calculateCorporateAge(analysisData.companyInfo.status.assignmentDate)}年）
                      </span>
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-600">本店所在地</p>
                    <p className="font-semibold">{analysisData.companyInfo.address.fullAddress}</p>
                  </div>
                </div>
              </div>

              {/* 申請書用サマリー */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  申請書用サマリー
                </h4>
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {analysisData.applicationSummary}
                </pre>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    navigator.clipboard.writeText(analysisData.applicationSummary);
                    alert('テキストをコピーしました');
                  }}
                >
                  コピー
                </Button>
              </div>
            </div>
          )}

          {/* 信頼性スコアタブ */}
          {activeTab === 'trust' && analysisData.companyInfo.trustScore && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">企業信頼性スコア</h4>
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className={`h-5 w-5 ${getTrustScoreColor(analysisData.companyInfo.trustScore.score)}`} />
                    <span className={`text-2xl font-bold ${getTrustScoreColor(analysisData.companyInfo.trustScore.score)}`}>
                      {analysisData.companyInfo.trustScore.score}
                    </span>
                    <span className="text-sm text-gray-600">/ 100</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">設立年数</span>
                    <Badge variant="default">
                      {analysisData.companyInfo.trustScore.factors.corporateAge}年
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">住所変更回数</span>
                    <Badge variant={analysisData.companyInfo.trustScore.factors.addressChanges === 0 ? 'success' : 'warning'}>
                      {analysisData.companyInfo.trustScore.factors.addressChanges}回
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">事業承継</span>
                    <Badge variant={analysisData.companyInfo.trustScore.factors.hasSuccessor ? 'primary' : 'secondary'}>
                      {analysisData.companyInfo.trustScore.factors.hasSuccessor ? 'あり' : 'なし'}
                    </Badge>
                  </div>
                </div>

                <Alert type="info" className="mt-4">
                  <p className="text-sm">
                    信頼性スコアは設立年数、経営の安定性、変更履歴などから算出されます。
                    補助金審査において企業の信頼性を示す参考指標としてご活用ください。
                  </p>
                </Alert>
              </div>
            </div>
          )}

          {/* 変更履歴タブ */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {analysisData.companyInfo.changeHistory && analysisData.companyInfo.changeHistory.length > 0 ? (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    変更履歴
                  </h4>
                  <div className="space-y-3">
                    {analysisData.companyInfo.changeHistory.map((history: any, index: number) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {history.type === 'address' ? '住所変更' :
                             history.type === 'name' ? '商号変更' :
                             history.type === 'close' ? '閉鎖' :
                             history.type === 'successor' ? '事業承継' : history.type}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(history.date)}
                          </span>
                        </div>
                        {history.details && (
                          <p className="text-sm text-gray-600 mt-1">{history.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert type="success">
                  変更履歴はありません。安定した経営を続けています。
                </Alert>
              )}
            </div>
          )}

          {/* 関連企業タブ */}
          {activeTab === 'related' && (
            <div className="space-y-4">
              {analysisData.relatedCompanies && analysisData.relatedCompanies.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          企業名
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          関係
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          詳細
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analysisData.relatedCompanies.map((company, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {company.name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge variant={
                              company.relation === 'parent' ? 'primary' :
                              company.relation === 'subsidiary' ? 'secondary' :
                              company.relation === 'successor' ? 'warning' : 'outline'
                            }>
                              {company.relation === 'parent' ? '親会社' :
                               company.relation === 'subsidiary' ? '子会社' :
                               company.relation === 'affiliate' ? '関連会社' :
                               company.relation === 'successor' ? '承継先' :
                               company.relation === 'predecessor' ? '承継元' : company.relation}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {company.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Alert type="info">
                  関連企業は検出されませんでした。
                </Alert>
              )}
            </div>
          )}

          {/* 再分析ボタン */}
          <div className="text-center pt-4 border-t">
            <Button
              variant="default"
              size="sm"
              onClick={fetchAnalysis}
              disabled={loading}
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              再分析
            </Button>
          </div>
        </div>
      )}

      {/* データソース表示 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        データソース: 国税庁法人番号公表サイト
      </div>
    </Card>
  );
}