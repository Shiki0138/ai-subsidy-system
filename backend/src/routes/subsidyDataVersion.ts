import { Router } from 'express';
import { subsidyDataVersionService } from '../services/subsidyDataVersionService';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * 特定の補助金プログラムのデータ新鮮度チェック
 */
router.get('/programs/:id/freshness', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const versionInfo = await subsidyDataVersionService.checkDataFreshness(id);
  
  res.json({
    success: true,
    data: versionInfo
  });
}));

/**
 * 全補助金プログラムのデータ新鮮度レポート
 */
router.get('/freshness/report', asyncHandler(async (req, res) => {
  const report = await subsidyDataVersionService.generateFreshnessReport();
  
  res.json({
    success: true,
    data: report
  });
}));

/**
 * データソースの手動更新
 */
router.post('/programs/:id/update-source', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sourceUrl, extractedData } = req.body;
  
  if (!sourceUrl) {
    return res.status(400).json({
      success: false,
      message: 'データソースURLが必要です'
    });
  }
  
  const versionInfo = await subsidyDataVersionService.updateDataSource(
    id,
    sourceUrl,
    extractedData
  );
  
  res.json({
    success: true,
    data: versionInfo,
    message: 'データソースが更新されました'
  });
}));

/**
 * データ信頼性ステータス一覧
 */
router.get('/reliability/status', asyncHandler(async (req, res) => {
  const allVersions = await subsidyDataVersionService.checkAllDataFreshness();
  
  const statusSummary = {
    highReliability: allVersions.filter(v => v.sourceInfo.reliability === 'high').length,
    mediumReliability: allVersions.filter(v => v.sourceInfo.reliability === 'medium').length,
    lowReliability: allVersions.filter(v => v.sourceInfo.reliability === 'low').length,
    totalPrograms: allVersions.length,
    lastUpdated: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: {
      summary: statusSummary,
      programs: allVersions.map(v => ({
        id: v.subsidyProgramId,
        reliability: v.sourceInfo.reliability,
        lastUpdated: v.lastVerified,
        warningLevel: v.warningLevel,
        warningMessage: v.warningMessage
      }))
    }
  });
}));

export default router;