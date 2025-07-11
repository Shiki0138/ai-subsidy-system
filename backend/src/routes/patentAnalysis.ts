import express, { Request, Response } from 'express';
import { conditionalAuth } from '../middleware/devAuthBypass';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError } from '../middleware/errorHandler';
import { JplatpatService } from '../services/external/jplatpatService';
import { logger, redis } from '../index';

const router = express.Router();
const jplatpatService = new JplatpatService(logger, redis);

/**
 * 企業の知的財産サマリー取得
 */
router.get('/company/:companyName/summary', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { companyName } = req.params;
  
  if (!companyName) {
    throw new ValidationError('企業名を指定してください');
  }
  
  const summary = await jplatpatService.getIntellectualPropertySummary(companyName);
  
  res.json({
    success: true,
    data: summary
  });
}));

/**
 * 特許検索
 */
router.post('/patents/search', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { keyword, applicant, classification, dateFrom, dateTo, maxResults = 20 } = req.body;
  
  const results = await jplatpatService.searchPatents({
    keyword,
    applicant,
    classification,
    applicationDateFrom: dateFrom,
    applicationDateTo: dateTo,
    maxResults
  });
  
  res.json({
    success: true,
    data: {
      total: results.length,
      patents: results
    }
  });
}));

/**
 * 商標検索
 */
router.post('/trademarks/search', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { applicant, maxResults = 20 } = req.body;
  
  if (!applicant) {
    throw new ValidationError('出願人名を指定してください');
  }
  
  const results = await jplatpatService.searchTrademarks({
    applicant,
    maxResults
  });
  
  res.json({
    success: true,
    data: {
      total: results.length,
      trademarks: results
    }
  });
}));

/**
 * 意匠検索
 */
router.post('/designs/search', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { applicant, maxResults = 20 } = req.body;
  
  if (!applicant) {
    throw new ValidationError('出願人名を指定してください');
  }
  
  const results = await jplatpatService.searchDesigns({
    applicant,
    maxResults
  });
  
  res.json({
    success: true,
    data: {
      total: results.length,
      designs: results
    }
  });
}));

/**
 * 競合他社との比較分析
 */
router.post('/competitive-analysis', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { targetCompany, competitors } = req.body;
  
  if (!targetCompany) {
    throw new ValidationError('対象企業名を指定してください');
  }
  
  if (!Array.isArray(competitors) || competitors.length === 0) {
    throw new ValidationError('比較対象の競合他社を指定してください');
  }
  
  const analysis = await jplatpatService.compareWithCompetitors(targetCompany, competitors);
  
  res.json({
    success: true,
    data: analysis
  });
}));

/**
 * 申請書用の技術優位性テキスト生成
 */
router.post('/generate-technical-advantage', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { companyName, subsidyType } = req.body;
  
  if (!companyName) {
    throw new ValidationError('企業名を指定してください');
  }
  
  const summary = await jplatpatService.getIntellectualPropertySummary(companyName);
  
  // 技術優位性の文章生成
  const technicalAdvantage = generateTechnicalAdvantageText(summary, subsidyType);
  
  res.json({
    success: true,
    data: {
      companyName,
      technicalAdvantage,
      supportingData: {
        patentCount: summary.patents.total,
        recentPatents: summary.patents.recentApplications.slice(0, 3),
        innovationScore: summary.innovationScore.score,
        mainTechnologyAreas: summary.technologyAreas.slice(0, 3)
      }
    }
  });
}));

/**
 * 技術優位性テキストの生成
 */
function generateTechnicalAdvantageText(summary: any, subsidyType?: string): string {
  const parts: string[] = [];
  
  // 知的財産の概要
  if (summary.patents.total > 0 || summary.trademarks.total > 0) {
    parts.push('【技術力・知的財産】');
    
    if (summary.patents.total > 0) {
      parts.push(
        `当社は${summary.patents.total}件の特許を保有（出願中含む）し、` +
        `うち${summary.patents.granted}件が既に特許権を取得しています。`
      );
    }
    
    if (summary.innovationScore.score >= 70) {
      parts.push(
        `イノベーションスコア${summary.innovationScore.score}点と高い評価を獲得しており、` +
        `継続的な研究開発活動により技術革新を推進しています。`
      );
    }
  }
  
  // 主要技術分野
  if (summary.technologyAreas.length > 0) {
    parts.push('\n【主要技術分野】');
    const topAreas = summary.technologyAreas.slice(0, 3);
    const areaText = topAreas.map((area: any) => 
      `${area.area}（${area.percentage}%）`
    ).join('、');
    parts.push(`主に${areaText}の分野で技術開発を行っています。`);
  }
  
  // 最近の特許活動
  if (summary.patents.recentApplications.length > 0) {
    parts.push('\n【最近の技術開発】');
    const recentPatents = summary.patents.recentApplications.slice(0, 2);
    recentPatents.forEach((patent: any) => {
      parts.push(`・${patent.title}（${patent.applicationDate}出願）`);
    });
  }
  
  // 補助金タイプに応じた追加文言
  if (subsidyType) {
    parts.push('\n【補助事業との関連性】');
    if (subsidyType.includes('ものづくり')) {
      parts.push(
        '当社の特許技術を活用することで、革新的な製品開発と生産性向上を実現し、' +
        'ものづくり補助金の目的に合致した事業展開が可能です。'
      );
    } else if (subsidyType.includes('IT')) {
      if (summary.technologyAreas.some((area: any) => area.area.includes('物理学') || area.area.includes('電気'))) {
        parts.push(
          'IT関連の技術開発実績を持ち、デジタル化推進に必要な技術基盤を保有しています。'
        );
      }
    }
  }
  
  return parts.join('\n');
}

export default router;