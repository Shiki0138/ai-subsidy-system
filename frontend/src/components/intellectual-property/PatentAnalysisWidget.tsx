'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/services/api/base';
import {
  BeakerIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  TrophyIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface PatentAnalysisProps {
  companyName?: string;
  onAnalysisComplete?: (data: any) => void;
}

interface IntellectualPropertySummary {
  company: string;
  patents: {
    total: number;
    granted: number;
    pending: number;
    recentApplications: Array<{
      applicationNumber: string;
      title: string;
      applicationDate: string;
      status: string;
    }>;
  };
  trademarks: {
    total: number;
    registered: number;
    pending: number;
  };
  designs: {
    total: number;
    registered: number;
    pending: number;
  };
  technologyAreas: Array<{
    area: string;
    count: number;
    percentage: number;
  }>;
  innovationScore: {
    score: number;
    factors: {
      patentCount: number;
      recentActivity: number;
      diversification: number;
      grantRate: number;
    };
  };
}

export default function PatentAnalysisWidget({ companyName, onAnalysisComplete }: PatentAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<IntellectualPropertySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'patents' | 'innovation' | 'competitive'>('overview');
  const [technicalAdvantageText, setTechnicalAdvantageText] = useState<string>('');

  const fetchAnalysis = async () => {
    if (!companyName) {
      setError('企業名を入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/patent-analysis/company/${encodeURIComponent(companyName)}/summary`);
      setAnalysisData(response.data.data);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(response.data.data);
      }

      // 技術優位性テキストも生成
      const textResponse = await api.post('/patent-analysis/generate-technical-advantage', {
        companyName
      });
      setTechnicalAdvantageText(textResponse.data.data.technicalAdvantage);

    } catch (err: any) {
      setError(err.response?.data?.message || '知的財産情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getInnovationScoreColor = (score: number): string => {
    if (score >= 80) return 'text-purple-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-green-600';
    return 'text-gray-600';
  };

  const getInnovationLevel = (score: number): string => {
    if (score >= 80) return '非常に高い';
    if (score >= 60) return '高い';
    if (score >= 40) return '標準的';
    return '改善の余地あり';
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BeakerIcon className="h-5 w-5 text-purple-600" />
          知的財産分析（J-PlatPat）
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          特許・商標・意匠情報から技術力と革新性を分析します
        </p>
      </div>

      {!analysisData && (
        <div className="text-center py-8">
          <Button onClick={fetchAnalysis} disabled={loading || !companyName}>
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                分析中...
              </>
            ) : (
              <>
                <LightBulbIcon className="h-4 w-4 mr-2" />
                知的財産分析を実行
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
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              概要
            </button>
            <button
              onClick={() => setActiveTab('patents')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'patents'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              特許詳細
            </button>
            <button
              onClick={() => setActiveTab('innovation')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'innovation'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              イノベーション
            </button>
            <button
              onClick={() => setActiveTab('competitive')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'competitive'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              申請書用テキスト
            </button>
          </div>

          {/* 概要タブ */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">特許</span>
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{analysisData.patents.total}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="success" size="sm">
                      登録済 {analysisData.patents.granted}
                    </Badge>
                    <Badge variant="warning" size="sm">
                      出願中 {analysisData.patents.pending}
                    </Badge>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">商標</span>
                    <TrophyIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{analysisData.trademarks.total}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="success" size="sm">
                      登録済 {analysisData.trademarks.registered}
                    </Badge>
                    <Badge variant="warning" size="sm">
                      出願中 {analysisData.trademarks.pending}
                    </Badge>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">意匠</span>
                    <SparklesIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{analysisData.designs.total}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="success" size="sm">
                      登録済 {analysisData.designs.registered}
                    </Badge>
                    <Badge variant="warning" size="sm">
                      出願中 {analysisData.designs.pending}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 技術分野 */}
              {analysisData.technologyAreas.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">主要技術分野</h4>
                  <div className="space-y-2">
                    {analysisData.technologyAreas.slice(0, 5).map((area, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{area.area}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${area.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {area.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 特許詳細タブ */}
          {activeTab === 'patents' && (
            <div className="space-y-4">
              {analysisData.patents.recentApplications.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          出願番号
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          発明の名称
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          出願日
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状態
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analysisData.patents.recentApplications.map((patent, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {patent.applicationNumber}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {patent.title}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {patent.applicationDate}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge variant={patent.status === 'granted' ? 'success' : 'warning'}>
                              {patent.status === 'granted' ? '特許取得' : '出願中'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Alert type="info">
                  特許情報が見つかりませんでした。
                </Alert>
              )}
            </div>
          )}

          {/* イノベーションタブ */}
          {activeTab === 'innovation' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-6 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">イノベーションスコア</h4>
                  <div className="text-center">
                    <p className={`text-4xl font-bold ${getInnovationScoreColor(analysisData.innovationScore.score)}`}>
                      {analysisData.innovationScore.score}
                    </p>
                    <p className="text-sm text-gray-600">/ 100</p>
                  </div>
                </div>
                
                <Badge 
                  variant={
                    analysisData.innovationScore.score >= 80 ? 'purple' :
                    analysisData.innovationScore.score >= 60 ? 'primary' :
                    analysisData.innovationScore.score >= 40 ? 'success' : 'secondary'
                  }
                  className="mb-4"
                >
                  革新性レベル: {getInnovationLevel(analysisData.innovationScore.score)}
                </Badge>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-white bg-opacity-60 rounded">
                    <span className="text-sm text-gray-700">特許保有数</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${analysisData.innovationScore.factors.patentCount}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {analysisData.innovationScore.factors.patentCount}点
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white bg-opacity-60 rounded">
                    <span className="text-sm text-gray-700">最近の活動</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${analysisData.innovationScore.factors.recentActivity * 4}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {analysisData.innovationScore.factors.recentActivity}点
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white bg-opacity-60 rounded">
                    <span className="text-sm text-gray-700">多様性</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${analysisData.innovationScore.factors.diversification * 4}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {analysisData.innovationScore.factors.diversification}点
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white bg-opacity-60 rounded">
                    <span className="text-sm text-gray-700">特許成立率</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full"
                          style={{ width: `${analysisData.innovationScore.factors.grantRate * 5}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {analysisData.innovationScore.factors.grantRate}点
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Alert type="info">
                <p className="text-sm">
                  イノベーションスコアは、特許数・最近の研究開発活動・知的財産の多様性・
                  特許成立率から総合的に算出されます。高いスコアは技術革新への
                  積極的な取り組みを示します。
                </p>
              </Alert>
            </div>
          )}

          {/* 申請書用テキストタブ */}
          {activeTab === 'competitive' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  申請書用・技術優位性説明文
                </h4>
                {technicalAdvantageText ? (
                  <>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {technicalAdvantageText}
                    </pre>
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        navigator.clipboard.writeText(technicalAdvantageText);
                        alert('テキストをコピーしました');
                      }}
                    >
                      コピー
                    </Button>
                  </>
                ) : (
                  <Alert type="info">
                    技術優位性テキストを生成中です...
                  </Alert>
                )}
              </div>

              <Alert type="success">
                <p className="text-sm">
                  このテキストは補助金申請書の「技術力・競争優位性」欄に
                  そのまま使用できるよう最適化されています。
                  必要に応じて編集してご利用ください。
                </p>
              </Alert>
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
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              再分析
            </Button>
          </div>
        </div>
      )}

      {/* データソース表示 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        データソース: J-PlatPat（特許情報プラットフォーム）
      </div>
    </Card>
  );
}