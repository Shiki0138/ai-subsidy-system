'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { Progress } from '../ui/Progress';
import { Modal } from '../ui/Modal';

interface ApiInfo {
  name: string;
  description: string;
  isFree: boolean;
  requiresAuth: boolean;
  dataTypes: string[];
  setupInstructions: string;
}

interface ApiStatus {
  api: string;
  status: 'connected' | 'failed' | 'auth_required';
  isFree: boolean;
  message: string;
}

interface SyncResult {
  totalApis: number;
  successfulApis: number;
  failedApis: string[];
  summary: string;
}

const ExternalApiManager: React.FC = () => {
  const [apis, setApis] = useState<ApiInfo[]>([]);
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [selectedApi, setSelectedApi] = useState<ApiInfo | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApiInfo();
    checkConnectionStatus();
  }, []);

  const loadApiInfo = async () => {
    try {
      const response = await fetch('/api/external-api/available-apis');
      const result = await response.json();
      if (result.success) {
        setApis(result.data.apis);
      }
    } catch (error) {
      console.error('Failed to load API info:', error);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/external-api/connection-status');
      const result = await response.json();
      if (result.success) {
        setApiStatuses(result.data.details);
      }
    } catch (error) {
      console.error('Failed to check connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncAllApis = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/external-api/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success) {
        setSyncResult(result.data);
        // 接続状態を再チェック
        await checkConnectionStatus();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const syncSingleApi = async (apiEndpoint: string) => {
    try {
      setSyncing(true);
      const response = await fetch(`/api/external-api/sync/${apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiEndpoint === 'resas' ? apiKey : undefined }),
      });
      const result = await response.json();
      
      if (result.success) {
        Alert({
          variant: 'success',
          children: `${result.message}`
        });
        await checkConnectionStatus();
      } else {
        Alert({
          variant: 'error',
          children: result.message
        });
      }
    } catch (error) {
      console.error('Single API sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="green">接続済み</Badge>;
      case 'auth_required':
        return <Badge variant="yellow">認証必要</Badge>;
      case 'failed':
        return <Badge variant="red">接続失敗</Badge>;
      default:
        return <Badge variant="gray">不明</Badge>;
    }
  };

  const getApiEndpoint = (apiName: string): string => {
    const endpoints: { [key: string]: string } = {
      'e-Gov API (電子政府API)': 'egov',
      'gBizINFO (法人情報API)': 'gbizinfo',
      'J-Net21 中小企業支援情報': 'jnet21',
      'RESAS API (地域経済分析)': 'resas',
      'ミラサポplus API': 'mirasapo'
    };
    return endpoints[apiName] || '';
  };

  const connectedCount = apiStatuses.filter(s => s.status === 'connected').length;
  const totalCount = apiStatuses.length;
  const connectionRate = totalCount > 0 ? Math.round((connectedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">外部API連携管理</h2>
          <p className="text-gray-600 mt-1">
            無料で利用可能な政府・公的機関のAPIと連携して、最新の補助金情報を自動収集します
          </p>
        </div>
        <Button
          onClick={syncAllApis}
          disabled={syncing}
          size="lg"
        >
          {syncing ? '🔄 同期中...' : '🔄 全API一括同期'}
        </Button>
      </div>

      {/* 接続状況サマリー */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">API接続状況</h3>
          <span className="text-2xl font-bold text-blue-600">
            {connectedCount}/{totalCount} 接続
          </span>
        </div>
        <Progress value={connectionRate} className="mb-4" />
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {apiStatuses.filter(s => s.status === 'connected').length}
            </div>
            <div className="text-sm text-gray-600">接続済み</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {apiStatuses.filter(s => s.status === 'auth_required').length}
            </div>
            <div className="text-sm text-gray-600">認証待ち</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {apiStatuses.filter(s => s.status === 'failed').length}
            </div>
            <div className="text-sm text-gray-600">接続失敗</div>
          </div>
        </div>
      </Card>

      {/* 最新同期結果 */}
      {syncResult && (
        <Alert variant={syncResult.failedApis.length > 0 ? 'warning' : 'success'}>
          <strong>同期結果:</strong> {syncResult.summary}
          {syncResult.failedApis.length > 0 && (
            <div className="mt-2">
              <strong>失敗したAPI:</strong> {syncResult.failedApis.join(', ')}
            </div>
          )}
        </Alert>
      )}

      {/* API一覧 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {apis.map((api) => {
          const status = apiStatuses.find(s => s.api === api.name);
          return (
            <Card key={api.name} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold">{api.name}</h4>
                  <p className="text-gray-600 text-sm mt-1">{api.description}</p>
                </div>
                {status && getStatusBadge(status.status)}
              </div>

              <div className="space-y-3">
                {/* 料金情報 */}
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 w-20">料金:</span>
                  <Badge variant={api.isFree ? 'green' : 'red'}>
                    {api.isFree ? '✅ 無料' : '有料'}
                  </Badge>
                </div>

                {/* 認証情報 */}
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 w-20">認証:</span>
                  <span className="text-sm">
                    {api.requiresAuth ? '🔑 必要' : '🔓 不要'}
                  </span>
                </div>

                {/* データタイプ */}
                <div>
                  <span className="text-sm text-gray-600">取得可能データ:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {api.dataTypes.map((type, index) => (
                      <Badge key={index} variant="gray" size="sm">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* ステータスメッセージ */}
                {status && status.message && (
                  <div className="text-sm text-gray-600 italic">
                    {status.message}
                  </div>
                )}

                {/* アクションボタン */}
                <div className="flex space-x-2 mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => syncSingleApi(getApiEndpoint(api.name))}
                    disabled={syncing || (api.requiresAuth && status?.status === 'auth_required')}
                  >
                    データ取得
                  </Button>
                  {api.requiresAuth && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApi(api)}
                    >
                      設定
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedApi(api)}
                  >
                    詳細
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 重要な注意事項 */}
      <Alert variant="info">
        <strong>💡 無料API利用について</strong>
        <ul className="mt-2 space-y-1 text-sm">
          <li>• すべてのAPIは<strong>無料</strong>で利用可能です</li>
          <li>• e-Gov、gBizINFOは認証不要で即座に利用開始できます</li>
          <li>• RESAS APIは無料登録後、APIキーを取得してください</li>
          <li>• データは自動的に最新の補助金情報に更新されます</li>
          <li>• API利用に関する料金は一切発生しません</li>
        </ul>
      </Alert>

      {/* API詳細モーダル */}
      <Modal
        isOpen={!!selectedApi}
        onClose={() => {
          setSelectedApi(null);
          setApiKey('');
        }}
        title={selectedApi?.name || ''}
      >
        {selectedApi && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">説明</h4>
              <p className="text-gray-600">{selectedApi.description}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">セットアップ手順</h4>
              <p className="text-gray-600">{selectedApi.setupInstructions}</p>
            </div>

            {selectedApi.requiresAuth && (
              <div>
                <h4 className="font-semibold mb-2">API認証設定</h4>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="APIキーを入力"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <Button
                  onClick={() => {
                    // API設定保存
                    console.log('Save API key for', selectedApi.name);
                    setSelectedApi(null);
                    setApiKey('');
                  }}
                  className="mt-2"
                  disabled={!apiKey}
                >
                  設定を保存
                </Button>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">取得可能なデータ</h4>
              <div className="space-y-1">
                {selectedApi.dataTypes.map((type, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 ヒント:</strong> このAPIは完全無料で利用できます。
                データは自動的に補助金データベースに統合され、
                申請書作成時に最新情報として活用されます。
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExternalApiManager;