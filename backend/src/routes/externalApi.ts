import { Router } from 'express';
import { externalSubsidyApiService } from '../services/externalSubsidyApiService';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * 利用可能な外部API一覧の取得
 */
router.get('/available-apis', asyncHandler(async (req, res) => {
  const apis = [
    {
      name: 'e-Gov API (電子政府API)',
      description: '政府の行政手続き・申請様式情報',
      isFree: true,
      requiresAuth: false,
      dataTypes: ['法令', '行政手続き', '申請様式'],
      setupInstructions: '認証不要。即座に利用可能。'
    },
    {
      name: 'gBizINFO (法人情報API)',
      description: '法人基本情報・補助金取得履歴',
      isFree: true,
      requiresAuth: false,
      dataTypes: ['法人基本情報', '補助金取得情報', '認定情報'],
      setupInstructions: '認証不要。即座に利用可能。'
    },
    {
      name: 'J-Net21 中小企業支援情報',
      description: '中小企業向け支援制度・補助金情報',
      isFree: true,
      requiresAuth: false,
      dataTypes: ['支援制度', '補助金情報', '経営相談'],
      setupInstructions: 'API提供開始待ち。現在はWebスクレイピングで対応。'
    },
    {
      name: 'RESAS API (地域経済分析)',
      description: '地域経済・産業データ（申請書の市場分析に活用）',
      isFree: true,
      requiresAuth: true,
      dataTypes: ['地域統計', '産業データ', '経済動向'],
      setupInstructions: '無料登録後、APIキーを取得。https://opendata.resas-portal.go.jp/'
    },
    {
      name: 'ミラサポplus API',
      description: '中小企業向け補助金・支援制度の総合情報',
      isFree: true,
      requiresAuth: false,
      dataTypes: ['補助金情報', '支援制度', '事例情報'],
      setupInstructions: 'API提供開始待ち。現在は公開データを活用。'
    }
  ];

  res.json({
    success: true,
    data: {
      totalApis: apis.length,
      freeApis: apis.filter(api => api.isFree).length,
      apis
    }
  });
}));

/**
 * 全API接続状態の確認
 */
router.get('/connection-status', asyncHandler(async (req, res) => {
  const statuses = await externalSubsidyApiService.checkAllApiConnections();
  
  const summary = {
    total: statuses.length,
    connected: statuses.filter(s => s.status === 'connected').length,
    authRequired: statuses.filter(s => s.status === 'auth_required').length,
    failed: statuses.filter(s => s.status === 'failed').length
  };

  res.json({
    success: true,
    data: {
      summary,
      details: statuses
    }
  });
}));

/**
 * 全ての無料APIからデータを一括収集
 */
router.post('/sync-all', asyncHandler(async (req, res) => {
  const result = await externalSubsidyApiService.collectAllSubsidyData();
  
  res.json({
    success: true,
    data: result,
    message: `${result.successfulApis}個の無料APIからデータを収集しました`
  });
}));

/**
 * e-Gov APIからのデータ取得
 */
router.post('/sync/egov', asyncHandler(async (req, res) => {
  const data = await externalSubsidyApiService.fetchFromEGov();
  
  res.json({
    success: true,
    data: {
      source: 'e-Gov API',
      recordCount: data?.length || 0,
      data
    },
    message: 'e-Gov APIからのデータ取得が完了しました'
  });
}));

/**
 * gBizINFO APIからのデータ取得
 */
router.post('/sync/gbizinfo', asyncHandler(async (req, res) => {
  const result = await externalSubsidyApiService.fetchFromGBizInfo();
  
  res.json({
    success: true,
    data: {
      source: 'gBizINFO API',
      statistics: result?.statistics,
      sampleData: result?.subsidyData?.slice(0, 5)
    },
    message: 'gBizINFO APIからのデータ取得が完了しました'
  });
}));

/**
 * J-Net21からのデータ取得
 */
router.post('/sync/jnet21', asyncHandler(async (req, res) => {
  const data = await externalSubsidyApiService.fetchFromJNet21();
  
  res.json({
    success: true,
    data: {
      source: 'J-Net21',
      recordCount: data?.length || 0,
      data
    },
    message: 'J-Net21からのデータ取得が完了しました'
  });
}));

/**
 * ミラサポplusからのデータ取得
 */
router.post('/sync/mirasapo', asyncHandler(async (req, res) => {
  const data = await externalSubsidyApiService.fetchFromMirasapoPlus();
  
  res.json({
    success: true,
    data: {
      source: 'ミラサポplus',
      recordCount: data?.length || 0,
      data
    },
    message: 'ミラサポplusからのデータ取得が完了しました'
  });
}));

/**
 * RESAS APIからのデータ取得
 */
router.post('/sync/resas', asyncHandler(async (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey && !process.env.RESAS_API_KEY) {
    return res.status(400).json({
      success: false,
      message: 'RESAS APIキーが必要です。無料登録後、キーを設定してください。',
      instructions: 'https://opendata.resas-portal.go.jp/ で無料登録できます'
    });
  }
  
  const data = await externalSubsidyApiService.fetchFromRESAS(apiKey || process.env.RESAS_API_KEY);
  
  res.json({
    success: true,
    data: {
      source: 'RESAS API',
      dataType: 'regional_economy',
      data
    },
    message: 'RESAS APIからのデータ取得が完了しました'
  });
}));

/**
 * API設定の保存
 */
router.post('/configure', asyncHandler(async (req, res) => {
  const { apiConfigs } = req.body;
  
  // 環境変数として保存（実際の実装では暗号化して保存）
  const savedConfigs: any[] = [];
  
  for (const config of apiConfigs) {
    if (config.apiKey) {
      process.env[`${config.name.toUpperCase().replace(/\s+/g, '_')}_API_KEY`] = config.apiKey;
      savedConfigs.push({
        name: config.name,
        configured: true
      });
    }
  }
  
  res.json({
    success: true,
    data: savedConfigs,
    message: 'API設定が保存されました'
  });
}));

export default router;