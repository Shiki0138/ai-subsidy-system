'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import MarketAnalysisWidget from '@/components/application/MarketAnalysisWidget';
import CorporateAnalysisWidget from '@/components/company/CorporateAnalysisWidget';
import PatentAnalysisWidget from '@/components/intellectual-property/PatentAnalysisWidget';
import FinancialAnalysisWidget from '@/components/financial/FinancialAnalysisWidget';
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  BeakerIcon,
  CurrencyYenIcon,
  CloudIcon,
  GlobeAltIcon,
  MapIcon,
  ChartPieIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ExternalDataDashboardProps {
  companyName?: string;
  corporateNumber?: string;
  industryCode?: string;
}

interface APIStatus {
  id: string;
  name: string;
  icon: any;
  status: 'completed' | 'available' | 'coming_soon';
  description: string;
  color: string;
}

export default function ExternalDataDashboard({ 
  companyName, 
  corporateNumber,
  industryCode 
}: ExternalDataDashboardProps) {
  const [activeAPI, setActiveAPI] = useState<string>('market');
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({});

  const apis: APIStatus[] = [
    {
      id: 'market',
      name: 'e-Stat（政府統計）',
      icon: ChartBarIcon,
      status: 'completed',
      description: '業界分析・市場規模',
      color: 'blue'
    },
    {
      id: 'corporate',
      name: '法人番号API',
      icon: BuildingOfficeIcon,
      status: 'completed',
      description: '企業情報・信頼性',
      color: 'green'
    },
    {
      id: 'patent',
      name: 'J-PlatPat',
      icon: BeakerIcon,
      status: 'completed',
      description: '特許・知的財産',
      color: 'purple'
    },
    {
      id: 'financial',
      name: 'EDINET',
      icon: CurrencyYenIcon,
      status: 'completed',
      description: '財務情報',
      color: 'yellow'
    },
    {
      id: 'weather',
      name: '気象庁API',
      icon: CloudIcon,
      status: 'coming_soon',
      description: '災害リスク評価',
      color: 'gray'
    },
    {
      id: 'trends',
      name: 'Google Trends',
      icon: GlobeAltIcon,
      status: 'coming_soon',
      description: '市場トレンド',
      color: 'gray'
    },
    {
      id: 'map',
      name: 'OpenStreetMap',
      icon: MapIcon,
      status: 'coming_soon',
      description: '立地分析',
      color: 'gray'
    },
    {
      id: 'resas',
      name: 'RESAS',
      icon: ChartPieIcon,
      status: 'coming_soon',
      description: '地域経済分析',
      color: 'gray'
    }
  ];

  const handleAnalysisComplete = (apiId: string, data: any) => {
    setAnalysisResults(prev => ({
      ...prev,
      [apiId]: data
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">利用可能</Badge>;
      case 'available':
        return <Badge variant="primary" size="sm">実装済み</Badge>;
      case 'coming_soon':
        return <Badge variant="default" size="sm">準備中</Badge>;
      default:
        return null;
    }
  };

  const getIconColor = (color: string, status: string) => {
    if (status === 'coming_soon') return 'text-gray-400';
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      case 'purple': return 'text-purple-600';
      case 'yellow': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* API一覧 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          外部データ連携ダッシュボード
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {apis.map((api) => {
            const Icon = api.icon;
            const isActive = activeAPI === api.id;
            const isDisabled = api.status === 'coming_soon';
            
            return (
              <button
                key={api.id}
                onClick={() => !isDisabled && setActiveAPI(api.id)}
                disabled={isDisabled}
                className={`
                  relative p-4 rounded-lg border-2 transition-all
                  ${isActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : isDisabled
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className={`h-8 w-8 ${getIconColor(api.color, api.status)}`} />
                  <span className={`text-sm font-medium ${
                    isDisabled ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {api.name}
                  </span>
                  <span className={`text-xs ${
                    isDisabled ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {api.description}
                  </span>
                  {getStatusBadge(api.status)}
                </div>
                
                {analysisResults[api.id] && (
                  <div className="absolute top-2 right-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 統合スコア */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">データ充実度スコア</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
                  style={{ 
                    width: `${(Object.keys(analysisResults).length / 4) * 100}%` 
                  }}
                />
              </div>
            </div>
            <span className="text-lg font-semibold">
              {Object.keys(analysisResults).length}/4
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {Object.keys(analysisResults).length === 0 
              ? '外部データを取得して、申請書の質を向上させましょう'
              : Object.keys(analysisResults).length === 4
                ? '全ての利用可能なデータを取得しました！'
                : 'さらにデータを追加して、申請書を強化しましょう'
            }
          </p>
        </div>
      </Card>

      {/* 選択されたAPIのウィジェット */}
      {activeAPI === 'market' && (
        <MarketAnalysisWidget
          industryCode={industryCode}
          onAnalysisComplete={(data) => handleAnalysisComplete('market', data)}
        />
      )}
      
      {activeAPI === 'corporate' && (
        <CorporateAnalysisWidget
          corporateNumber={corporateNumber}
          onAnalysisComplete={(data) => handleAnalysisComplete('corporate', data)}
        />
      )}
      
      {activeAPI === 'patent' && (
        <PatentAnalysisWidget
          companyName={companyName}
          onAnalysisComplete={(data) => handleAnalysisComplete('patent', data)}
        />
      )}
      
      {activeAPI === 'financial' && (
        <FinancialAnalysisWidget
          companyName={companyName}
          onAnalysisComplete={(data) => handleAnalysisComplete('financial', data)}
        />
      )}

      {/* 準備中のAPI */}
      {['weather', 'trends', 'map', 'resas'].includes(activeAPI) && (
        <Card className="p-8 text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            このAPIは現在準備中です
          </h4>
          <p className="text-gray-600">
            順次実装予定です。しばらくお待ちください。
          </p>
        </Card>
      )}

      {/* 取得済みデータサマリー */}
      {Object.keys(analysisResults).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            取得済みデータサマリー
          </h3>
          <div className="space-y-3">
            {Object.entries(analysisResults).map(([apiId, data]) => {
              const api = apis.find(a => a.id === apiId);
              if (!api) return null;
              
              return (
                <div key={apiId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <api.icon className={`h-5 w-5 ${getIconColor(api.color, api.status)}`} />
                    <span className="font-medium">{api.name}</span>
                  </div>
                  <Badge variant="success" size="sm">
                    データ取得済み
                  </Badge>
                </div>
              );
            })}
          </div>
          
          <Button
            variant="primary"
            className="w-full mt-4"
            disabled={Object.keys(analysisResults).length === 0}
          >
            取得データを申請書に反映
          </Button>
        </Card>
      )}
    </div>
  );
}