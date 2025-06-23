'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { Alert } from '../ui/Alert';

interface DataSourceInfo {
  id: string;
  name: string;
  type: 'government_api' | 'scraping' | 'manual' | 'pdf_extraction';
  url?: string;
  lastUpdated: string;
  version: string;
  reliability: 'high' | 'medium' | 'low';
  updateFrequency: string;
}

interface SubsidyDataVersion {
  subsidyProgramId: string;
  dataVersion: string;
  sourceInfo: DataSourceInfo;
  lastVerified: string;
  nextUpdateExpected?: string;
  changes: string[];
  warningLevel: 'none' | 'minor' | 'major' | 'critical';
  warningMessage?: string;
}

interface DataFreshnessIndicatorProps {
  subsidyProgramId: string;
  showDetails?: boolean;
  className?: string;
}

const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  subsidyProgramId,
  showDetails = false,
  className = ''
}) => {
  const [versionInfo, setVersionInfo] = useState<SubsidyDataVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVersionInfo();
  }, [subsidyProgramId]);

  const fetchVersionInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/subsidy-data-version/programs/${subsidyProgramId}/freshness`);
      const result = await response.json();
      
      if (result.success) {
        setVersionInfo(result.data);
      } else {
        setError('データ取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const getReliabilityBadge = (reliability: string) => {
    const reliabilityConfig = {
      high: { color: 'green', text: '高信頼性', description: '政府公式データ' },
      medium: { color: 'yellow', text: '中信頼性', description: '公的機関データ' },
      low: { color: 'red', text: '低信頼性', description: '手動入力データ' }
    };
    
    const config = reliabilityConfig[reliability as keyof typeof reliabilityConfig];
    
    return (
      <Tooltip content={config.description}>
        <Badge variant={config.color as any}>
          {config.text}
        </Badge>
      </Tooltip>
    );
  };

  const getSourceTypeBadge = (type: string) => {
    const typeConfig = {
      government_api: { color: 'blue', text: '政府API', icon: '🏛️' },
      scraping: { color: 'orange', text: 'Web取得', icon: '🌐' },
      manual: { color: 'gray', text: '手動入力', icon: '✍️' },
      pdf_extraction: { color: 'purple', text: 'PDF抽出', icon: '📄' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig];
    
    return (
      <Badge variant={config.color as any}>
        {config.icon} {config.text}
      </Badge>
    );
  };

  const getWarningAlert = (warningLevel: string, message?: string) => {
    if (warningLevel === 'none') return null;
    
    const alertConfig = {
      minor: { variant: 'warning', title: '注意' },
      major: { variant: 'warning', title: '重要な注意' },
      critical: { variant: 'error', title: '緊急' }
    };
    
    const config = alertConfig[warningLevel as keyof typeof alertConfig];
    
    return (
      <Alert variant={config.variant as any} className="mt-2">
        <strong>{config.title}:</strong> {message}
      </Alert>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1日前';
    if (diffDays < 30) return `${diffDays}日前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`;
    return `${Math.floor(diffDays / 365)}年前`;
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-500">データ確認中...</span>
      </div>
    );
  }

  if (error || !versionInfo) {
    return (
      <div className={`text-sm text-red-600 ${className}`}>
        ❌ {error || 'データ情報を取得できませんでした'}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 基本情報 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">
          📊 データ更新状況:
        </span>
        <span className="text-sm text-gray-900">
          {formatDate(versionInfo.lastVerified)}
        </span>
        <span className="text-xs text-gray-500">
          ({getDaysAgo(versionInfo.lastVerified)})
        </span>
      </div>

      {/* バージョン情報 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          バージョン: {versionInfo.dataVersion}
        </span>
        {getReliabilityBadge(versionInfo.sourceInfo.reliability)}
        {getSourceTypeBadge(versionInfo.sourceInfo.type)}
      </div>

      {/* 警告表示 */}
      {getWarningAlert(versionInfo.warningLevel, versionInfo.warningMessage)}

      {/* 詳細情報 */}
      {showDetails && (
        <div className="border-t pt-3 space-y-2">
          <div className="text-sm">
            <span className="font-medium text-gray-700">データソース:</span>{' '}
            <span className="text-gray-900">{versionInfo.sourceInfo.name}</span>
          </div>
          
          {versionInfo.sourceInfo.url && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">参照URL:</span>{' '}
              <a 
                href={versionInfo.sourceInfo.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all"
              >
                {versionInfo.sourceInfo.url}
              </a>
            </div>
          )}
          
          <div className="text-sm">
            <span className="font-medium text-gray-700">更新頻度:</span>{' '}
            <span className="text-gray-900">
              {versionInfo.sourceInfo.updateFrequency === 'quarterly' && '四半期ごと'}
              {versionInfo.sourceInfo.updateFrequency === 'annually' && '年1回'}
              {versionInfo.sourceInfo.updateFrequency === 'monthly' && '月1回'}
              {versionInfo.sourceInfo.updateFrequency === 'weekly' && '週1回'}
              {versionInfo.sourceInfo.updateFrequency === 'daily' && '毎日'}
              {versionInfo.sourceInfo.updateFrequency === 'irregular' && '不定期'}
            </span>
          </div>

          {versionInfo.nextUpdateExpected && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">次回更新予定:</span>{' '}
              <span className="text-gray-900">
                {formatDate(versionInfo.nextUpdateExpected)}
              </span>
            </div>
          )}

          {versionInfo.changes.length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">最近の変更:</span>
              <ul className="mt-1 pl-4 space-y-1">
                {versionInfo.changes.map((change, index) => (
                  <li key={index} className="text-gray-600 text-xs">
                    • {change}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 最新情報確認ボタン */}
      <div className="flex justify-end">
        <button
          onClick={fetchVersionInfo}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          🔄 最新情報を確認
        </button>
      </div>
    </div>
  );
};

export default DataFreshnessIndicator;