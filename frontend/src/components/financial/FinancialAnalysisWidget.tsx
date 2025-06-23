'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/services/api/base';
import {
  CurrencyYenIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ScaleIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface FinancialAnalysisProps {
  companyName?: string;
  onAnalysisComplete?: (data: any) => void;
}

interface FinancialAnalysis {
  company: string;
  latestFinancialData: {
    companyName: string;
    fiscalYear: string;
    revenue?: number;
    operatingProfit?: number;
    netProfit?: number;
    totalAssets?: number;
    netAssets?: number;
    roe?: number;
    equityRatio?: number;
    currentRatio?: number;
  };
  performanceAnalysis: {
    revenueGrowthRate?: number;
    profitGrowthRate?: number;
    profitMargin?: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  financialHealth: {
    score: number;
    rating: 'excellent' | 'good' | 'fair' | 'poor';
    strengths: string[];
    concerns: string[];
  };
}

export default function FinancialAnalysisWidget({ companyName, onAnalysisComplete }: FinancialAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<FinancialAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'health' | 'report'>('overview');
  const [financialText, setFinancialText] = useState<string>('');

  const fetchAnalysis = async () => {
    if (!companyName) {
      setError('企業名を入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/financial-analysis/company/${encodeURIComponent(companyName)}/analysis`);
      setAnalysisData(response.data.data);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(response.data.data);
      }

      // 申請書用テキストも生成
      const textResponse = await api.post('/financial-analysis/generate-financial-text', {
        companyName
      });
      setFinancialText(textResponse.data.data.financialText);

    } catch (err: any) {
      setError(err.response?.data?.message || '財務情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount?: number): string => {
    if (!amount) return '-';
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}億円`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)}百万円`;
    }
    return `${amount.toLocaleString()}円`;
  };

  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRatingBadge = (rating: string): 'success' | 'primary' | 'warning' | 'error' => {
    switch (rating) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'primary';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />;
      case 'declining':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ChartBarIcon className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CurrencyYenIcon className="h-5 w-5 text-green-600" />
          財務分析（EDINET）
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          有価証券報告書から財務健全性を分析します
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
                <DocumentChartBarIcon className="h-4 w-4 mr-2" />
                財務分析を実行
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
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              概要
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'performance'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              業績推移
            </button>
            <button
              onClick={() => setActiveTab('health')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'health'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              財務健全性
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'report'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              申請書用テキスト
            </button>
          </div>

          {/* 概要タブ */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  {analysisData.latestFinancialData.fiscalYear}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">売上高</span>
                      <span className="font-semibold">
                        {formatAmount(analysisData.latestFinancialData.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">営業利益</span>
                      <span className="font-semibold">
                        {formatAmount(analysisData.latestFinancialData.operatingProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">当期純利益</span>
                      <span className="font-semibold">
                        {formatAmount(analysisData.latestFinancialData.netProfit)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">総資産</span>
                      <span className="font-semibold">
                        {formatAmount(analysisData.latestFinancialData.totalAssets)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">純資産</span>
                      <span className="font-semibold">
                        {formatAmount(analysisData.latestFinancialData.netAssets)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">自己資本比率</span>
                      <span className="font-semibold">
                        {analysisData.latestFinancialData.equityRatio?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 主要指標 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">ROE</span>
                    <ScaleIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {analysisData.latestFinancialData.roe?.toFixed(1) || '-'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">自己資本利益率</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">流動比率</span>
                    <BanknotesIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {analysisData.latestFinancialData.currentRatio?.toFixed(0) || '-'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">短期支払能力</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">利益率</span>
                    <ChartBarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {analysisData.performanceAnalysis.profitMargin?.toFixed(1) || '-'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">売上高純利益率</p>
                </div>
              </div>
            </div>
          )}

          {/* 業績推移タブ */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">業績トレンド</h4>
                  {getTrendIcon(analysisData.performanceAnalysis.trend)}
                </div>
                
                <div className="space-y-3">
                  {analysisData.performanceAnalysis.revenueGrowthRate !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">売上高成長率</span>
                      <div className="flex items-center gap-2">
                        {analysisData.performanceAnalysis.revenueGrowthRate > 0 ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`font-semibold ${
                          analysisData.performanceAnalysis.revenueGrowthRate > 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {analysisData.performanceAnalysis.revenueGrowthRate > 0 ? '+' : ''}
                          {analysisData.performanceAnalysis.revenueGrowthRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {analysisData.performanceAnalysis.profitGrowthRate !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">利益成長率</span>
                      <div className="flex items-center gap-2">
                        {analysisData.performanceAnalysis.profitGrowthRate > 0 ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`font-semibold ${
                          analysisData.performanceAnalysis.profitGrowthRate > 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {analysisData.performanceAnalysis.profitGrowthRate > 0 ? '+' : ''}
                          {analysisData.performanceAnalysis.profitGrowthRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <Badge variant={
                    analysisData.performanceAnalysis.trend === 'improving' ? 'success' :
                    analysisData.performanceAnalysis.trend === 'stable' ? 'primary' : 'error'
                  }>
                    {analysisData.performanceAnalysis.trend === 'improving' ? '改善傾向' :
                     analysisData.performanceAnalysis.trend === 'stable' ? '安定的' : '要注意'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* 財務健全性タブ */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-6 bg-gradient-to-r from-green-50 to-blue-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">財務健全性評価</h4>
                  <div className="text-center">
                    <p className={`text-4xl font-bold ${getRatingColor(analysisData.financialHealth.rating)}`}>
                      {analysisData.financialHealth.score}
                    </p>
                    <p className="text-sm text-gray-600">/ 100</p>
                  </div>
                </div>
                
                <Badge 
                  variant={getRatingBadge(analysisData.financialHealth.rating)}
                  size="lg"
                  className="mb-4"
                >
                  {analysisData.financialHealth.rating === 'excellent' ? '非常に良好' :
                   analysisData.financialHealth.rating === 'good' ? '良好' :
                   analysisData.financialHealth.rating === 'fair' ? '標準的' : '要改善'}
                </Badge>
              </div>

              {/* 強み */}
              {analysisData.financialHealth.strengths.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    財務面の強み
                  </h5>
                  <ul className="space-y-2">
                    {analysisData.financialHealth.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span className="text-sm text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 懸念事項 */}
              {analysisData.financialHealth.concerns.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                    留意事項
                  </h5>
                  <ul className="space-y-2">
                    {analysisData.financialHealth.concerns.map((concern, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">•</span>
                        <span className="text-sm text-gray-700">{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 申請書用テキストタブ */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <DocumentChartBarIcon className="h-4 w-4" />
                  申請書用・財務健全性説明文
                </h4>
                {financialText ? (
                  <>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {financialText}
                    </pre>
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        navigator.clipboard.writeText(financialText);
                        alert('テキストをコピーしました');
                      }}
                    >
                      コピー
                    </Button>
                  </>
                ) : (
                  <Alert type="info">
                    財務健全性テキストを生成中です...
                  </Alert>
                )}
              </div>

              <Alert type="success">
                <p className="text-sm">
                  このテキストは補助金申請書の「財務状況」欄に
                  そのまま使用できるよう最適化されています。
                  必要に応じて編集してご利用ください。
                </p>
              </Alert>
            </div>
          )}
        </div>
      )}

      {/* データソース表示 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        データソース: EDINET（金融庁電子開示システム）
      </div>
    </Card>
  );
}