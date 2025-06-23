import express, { Request, Response } from 'express';
import { conditionalAuth } from '../middleware/devAuthBypass';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError } from '../middleware/errorHandler';
import { EDINETService } from '../services/external/edinetService';
import { logger, redis } from '../index';

const router = express.Router();
const edinetService = new EDINETService(logger, redis);

/**
 * 企業の財務分析サマリー取得
 */
router.get('/company/:companyName/analysis', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { companyName } = req.params;
  const { edinetCode } = req.query;
  
  if (!companyName) {
    throw new ValidationError('企業名を指定してください');
  }
  
  const analysis = await edinetService.getFinancialAnalysis(
    companyName, 
    edinetCode as string | undefined
  );
  
  res.json({
    success: true,
    data: analysis
  });
}));

/**
 * EDINET登録企業の検索
 */
router.get('/search', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { companyName } = req.query;
  
  if (!companyName || typeof companyName !== 'string') {
    throw new ValidationError('企業名を指定してください');
  }
  
  const results = await edinetService.searchCompany(companyName);
  
  res.json({
    success: true,
    data: results
  });
}));

/**
 * 最新の財務書類一覧取得
 */
router.get('/documents/:edinetCode', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { edinetCode } = req.params;
  const { limit = 10 } = req.query;
  
  const documents = await edinetService.getLatestDocuments(
    edinetCode,
    parseInt(limit as string)
  );
  
  res.json({
    success: true,
    data: documents
  });
}));

/**
 * 申請書用の財務健全性テキスト生成
 */
router.post('/generate-financial-text', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { companyName, subsidyType, edinetCode } = req.body;
  
  if (!companyName) {
    throw new ValidationError('企業名を指定してください');
  }
  
  // 財務分析を取得
  const analysis = await edinetService.getFinancialAnalysis(companyName, edinetCode);
  
  // 申請書用テキストを生成
  const financialText = await edinetService.generateFinancialStrengthText(analysis, subsidyType);
  
  res.json({
    success: true,
    data: {
      companyName,
      financialText,
      supportingData: {
        latestFiscalYear: analysis.latestFinancialData.fiscalYear,
        revenue: analysis.latestFinancialData.revenue,
        netProfit: analysis.latestFinancialData.netProfit,
        equityRatio: analysis.latestFinancialData.equityRatio,
        financialHealthScore: analysis.financialHealth.score,
        rating: analysis.financialHealth.rating
      }
    }
  });
}));

/**
 * 業界比較分析
 */
router.post('/industry-comparison', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { targetCompany, competitors } = req.body;
  
  if (!targetCompany) {
    throw new ValidationError('対象企業名を指定してください');
  }
  
  if (!Array.isArray(competitors) || competitors.length === 0) {
    throw new ValidationError('比較対象企業を指定してください');
  }
  
  // 各企業の財務分析を取得
  const analyses = await Promise.all([
    edinetService.getFinancialAnalysis(targetCompany),
    ...competitors.map((company: string) => edinetService.getFinancialAnalysis(company))
  ]);
  
  const targetAnalysis = analyses[0];
  const competitorAnalyses = analyses.slice(1);
  
  // 比較分析
  const comparison = compareFinancialPerformance(targetAnalysis, competitorAnalyses);
  
  res.json({
    success: true,
    data: {
      target: targetAnalysis,
      competitors: competitorAnalyses,
      comparison
    }
  });
}));

/**
 * 財務トレンド分析
 */
router.get('/company/:companyName/trends', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { companyName } = req.params;
  const { years = 5 } = req.query;
  
  const analysis = await edinetService.getFinancialAnalysis(companyName);
  
  // 過去データからトレンドを分析
  const trends = analyzeFinancialTrends(analysis.historicalData.slice(0, parseInt(years as string)));
  
  res.json({
    success: true,
    data: {
      companyName,
      trends,
      historicalData: analysis.historicalData
    }
  });
}));

// ヘルパー関数

/**
 * 財務パフォーマンスの比較
 */
function compareFinancialPerformance(target: any, competitors: any[]): any {
  const metrics = ['revenue', 'netProfit', 'roe', 'equityRatio'];
  const comparison: any = {
    rankings: {},
    analysis: [],
    competitivePosition: 'average'
  };
  
  metrics.forEach(metric => {
    const values = [target, ...competitors]
      .map((analysis, index) => ({
        company: index === 0 ? 'target' : `competitor${index}`,
        value: analysis.latestFinancialData[metric] || 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    const targetRank = values.findIndex(v => v.company === 'target') + 1;
    comparison.rankings[metric] = {
      rank: targetRank,
      total: values.length,
      percentile: ((values.length - targetRank + 1) / values.length) * 100
    };
  });
  
  // 競争力の総合評価
  const avgPercentile = Object.values(comparison.rankings)
    .reduce((sum: number, ranking: any) => sum + ranking.percentile, 0) / metrics.length;
  
  if (avgPercentile >= 75) {
    comparison.competitivePosition = 'strong';
    comparison.analysis.push('財務指標において業界上位の競争力を有しています');
  } else if (avgPercentile >= 50) {
    comparison.competitivePosition = 'average';
    comparison.analysis.push('財務指標は業界平均的な水準です');
  } else {
    comparison.competitivePosition = 'weak';
    comparison.analysis.push('財務面での競争力強化が課題です');
  }
  
  return comparison;
}

/**
 * 財務トレンドの分析
 */
function analyzeFinancialTrends(historicalData: any[]): any {
  if (historicalData.length < 2) {
    return {
      revenueGrowth: { trend: 'unknown', cagr: null },
      profitability: { trend: 'unknown', avgMargin: null },
      stability: { trend: 'unknown', volatility: null }
    };
  }
  
  // 売上成長率（CAGR）の計算
  const firstYear = historicalData[historicalData.length - 1];
  const lastYear = historicalData[0];
  const years = historicalData.length - 1;
  
  let cagr = null;
  if (firstYear.revenue && lastYear.revenue) {
    cagr = (Math.pow(lastYear.revenue / firstYear.revenue, 1 / years) - 1) * 100;
  }
  
  // 利益率の推移
  const profitMargins = historicalData
    .filter(d => d.revenue && d.netProfit)
    .map(d => (d.netProfit / d.revenue) * 100);
  
  const avgMargin = profitMargins.length > 0
    ? profitMargins.reduce((sum, margin) => sum + margin, 0) / profitMargins.length
    : null;
  
  // トレンド判定
  const revenueGrowth = {
    trend: cagr !== null ? (cagr > 5 ? 'growing' : cagr > 0 ? 'stable' : 'declining') : 'unknown',
    cagr: cagr ? parseFloat(cagr.toFixed(2)) : null
  };
  
  const profitability = {
    trend: avgMargin !== null ? (avgMargin > 10 ? 'high' : avgMargin > 5 ? 'moderate' : 'low') : 'unknown',
    avgMargin: avgMargin ? parseFloat(avgMargin.toFixed(2)) : null
  };
  
  return {
    revenueGrowth,
    profitability,
    yearsAnalyzed: years
  };
}

export default router;