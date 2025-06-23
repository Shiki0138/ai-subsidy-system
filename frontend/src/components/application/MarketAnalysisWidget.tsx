'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/services/api/base';
import {
  ChartBarIcon,
  TrendingUpIcon,
  BuildingOfficeIcon,
  MapIcon,
  LightBulbIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface MarketAnalysisProps {
  companyInfo: {
    industryCode?: string;
    prefectureCode?: string;
    businessKeywords?: string[];
    sales?: number;
    employees?: number;
  };
  onDataReceived?: (data: any) => void;
}

interface AnalysisResult {
  rawData: {
    industryAnalysis: any;
    regionalData: any;
    marketAnalysis: any[];
    competitivePosition: string;
  };
  competitiveAnalysis?: any;
  applicationText: string;
  insights: string[];
}

export default function MarketAnalysisWidget({ companyInfo, onDataReceived }: MarketAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchMarketAnalysis = async () => {
    if (!companyInfo.industryCode || !companyInfo.prefectureCode) {
      setError('業種と所在地を入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/market-analysis/analyze', {
        industryCode: companyInfo.industryCode,
        prefectureCode: companyInfo.prefectureCode,
        businessKeywords: companyInfo.businessKeywords || [],
        companySize: {
          sales: companyInfo.sales,
          employees: companyInfo.employees
        }
      });

      setAnalysisData(response.data.data);
      
      if (onDataReceived) {
        onDataReceived(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '市場分析データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(1)}兆円`;
    } else if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}億円`;
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}万円`;
    }
    return `${value.toLocaleString()}円`;
  };

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-blue-600" />
          市場分析（e-Stat政府統計データ）
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          政府統計データを活用して、業界動向と市場機会を分析します
        </p>
      </div>

      {!analysisData && (
        <div className="text-center py-8">
          <Button onClick={fetchMarketAnalysis} disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                分析中...
              </>
            ) : (
              <>
                <ChartBarIcon className="h-4 w-4 mr-2" />
                市場分析を実行
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
          {/* 業界分析 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <BuildingOfficeIcon className="h-4 w-4" />
                業界分析
              </h4>
              <Badge variant="default">
                {analysisData.rawData.industryAnalysis.industryName}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-gray-600">平均売上高</p>
                <p className="font-semibold">
                  {formatCurrency(analysisData.rawData.industryAnalysis.averageSales)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">平均従業員数</p>
                <p className="font-semibold">
                  {analysisData.rawData.industryAnalysis.averageEmployees}人
                </p>
              </div>
              <div>
                <p className="text-gray-600">成長率</p>
                <p className="font-semibold text-green-600">
                  {formatPercentage(analysisData.rawData.industryAnalysis.growthRate)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">データ年度</p>
                <p className="font-semibold">
                  {analysisData.rawData.industryAnalysis.year}年
                </p>
              </div>
            </div>
          </div>

          {/* 地域経済指標 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <MapIcon className="h-4 w-4" />
                地域経済指標
              </h4>
              <Badge variant="default">
                {analysisData.rawData.regionalData.prefectureName}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-gray-600">GDP</p>
                <p className="font-semibold">
                  {formatCurrency(analysisData.rawData.regionalData.gdp)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">失業率</p>
                <p className="font-semibold">
                  {analysisData.rawData.regionalData.unemploymentRate}%
                </p>
              </div>
              <div>
                <p className="text-gray-600">人口増減率</p>
                <p className={`font-semibold ${analysisData.rawData.regionalData.populationGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(analysisData.rawData.regionalData.populationGrowthRate)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">平均所得</p>
                <p className="font-semibold">
                  {formatCurrency(analysisData.rawData.regionalData.averageIncome)}
                </p>
              </div>
            </div>
          </div>

          {/* 競争力分析 */}
          {analysisData.competitiveAnalysis && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                <TrendingUpIcon className="h-4 w-4" />
                競争力分析
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">業界内ポジション</span>
                  <Badge variant="primary">
                    {analysisData.competitiveAnalysis.position}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">売上規模（業界平均比）</span>
                  <span className="font-semibold">{analysisData.competitiveAnalysis.salesRatio}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">生産性指数</span>
                  <span className="font-semibold">{analysisData.competitiveAnalysis.productivityIndex}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mt-3 p-2 bg-white rounded">
                {analysisData.competitiveAnalysis.recommendation}
              </p>
            </div>
          )}

          {/* インサイト */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
              <LightBulbIcon className="h-4 w-4" />
              分析インサイト
            </h4>
            
            <ul className="space-y-2">
              {analysisData.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span className="text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 申請書用テキスト */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4" />
                申請書用テキスト
              </h4>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? '非表示' : '表示'}
              </Button>
            </div>
            
            {showDetails && (
              <div className="mt-3 p-3 bg-white rounded">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {analysisData.applicationText}
                </pre>
                
                <Button
                  variant="default"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    navigator.clipboard.writeText(analysisData.applicationText);
                    alert('テキストをコピーしました');
                  }}
                >
                  テキストをコピー
                </Button>
              </div>
            )}
          </div>

          {/* 再分析ボタン */}
          <div className="text-center pt-2">
            <Button
              variant="default"
              onClick={fetchMarketAnalysis}
              disabled={loading}
            >
              再分析
            </Button>
          </div>
        </div>
      )}

      {/* データソース表示 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        データソース: e-Stat（政府統計の総合窓口）
      </div>
    </Card>
  );
}