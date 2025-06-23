import express, { Request, Response } from 'express';
import { conditionalAuth } from '../middleware/devAuthBypass';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { CorporateNumberAPI } from '../services/corporateNumberAPI';
import { logger } from '../index';

const router = express.Router();
const corporateAPI = new CorporateNumberAPI(logger);

/**
 * 法人番号による詳細企業分析
 */
router.get('/:corporateNumber/analysis', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { corporateNumber } = req.params;
  
  // 基本情報の取得
  const companyInfo = await corporateAPI.searchByCorporateNumber(corporateNumber);
  
  if (!companyInfo) {
    throw new NotFoundError('指定された法人番号の企業が見つかりません');
  }
  
  // 関連企業の検索
  const relatedCompanies = await corporateAPI.searchRelatedCompanies(companyInfo);
  
  // 本店・支店情報の取得
  const branchInfo = await corporateAPI.searchBranchOffices(corporateNumber);
  
  // 申請書用のサマリー生成
  const applicationSummary = generateApplicationSummary(companyInfo, relatedCompanies);
  
  res.json({
    success: true,
    data: {
      companyInfo,
      relatedCompanies,
      branchInfo,
      applicationSummary,
      analysisDate: new Date().toISOString()
    }
  });
}));

/**
 * 変更履歴の取得
 */
router.get('/:corporateNumber/history', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { corporateNumber } = req.params;
  
  const companyInfo = await corporateAPI.searchByCorporateNumber(corporateNumber);
  
  if (!companyInfo) {
    throw new NotFoundError('指定された法人番号の企業が見つかりません');
  }
  
  res.json({
    success: true,
    data: {
      corporateNumber,
      companyName: companyInfo.companyName,
      changeHistory: companyInfo.changeHistory || [],
      status: companyInfo.status
    }
  });
}));

/**
 * 信頼性スコアの取得
 */
router.get('/:corporateNumber/trust-score', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { corporateNumber } = req.params;
  
  const companyInfo = await corporateAPI.searchByCorporateNumber(corporateNumber);
  
  if (!companyInfo) {
    throw new NotFoundError('指定された法人番号の企業が見つかりません');
  }
  
  const trustScore = companyInfo.trustScore || {
    score: 0,
    factors: {
      corporateAge: 0,
      hasSuccessor: false,
      addressChanges: 0,
      nameChanges: 0
    }
  };
  
  // スコアの詳細説明を追加
  const scoreExplanation = generateScoreExplanation(trustScore);
  
  res.json({
    success: true,
    data: {
      corporateNumber,
      companyName: companyInfo.companyName,
      trustScore,
      scoreExplanation,
      recommendations: generateRecommendations(trustScore)
    }
  });
}));

/**
 * グループ企業マップの生成
 */
router.post('/group-map', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { corporateNumbers } = req.body;
  
  if (!Array.isArray(corporateNumbers) || corporateNumbers.length === 0) {
    throw new ValidationError('法人番号の配列を指定してください');
  }
  
  const groupMap: any = {
    companies: [],
    relations: []
  };
  
  // 各企業の情報を取得
  for (const corporateNumber of corporateNumbers) {
    const companyInfo = await corporateAPI.searchByCorporateNumber(corporateNumber);
    if (companyInfo) {
      groupMap.companies.push({
        corporateNumber: companyInfo.corporateNumber,
        name: companyInfo.companyName,
        kind: companyInfo.kind,
        isActive: companyInfo.status.isActive
      });
      
      // 関連企業を検索
      const relatedCompanies = await corporateAPI.searchRelatedCompanies(companyInfo);
      for (const related of relatedCompanies) {
        if (corporateNumbers.includes(related.corporateNumber)) {
          groupMap.relations.push({
            from: corporateNumber,
            to: related.corporateNumber,
            type: related.relation,
            details: related.details
          });
        }
      }
    }
  }
  
  res.json({
    success: true,
    data: groupMap
  });
}));

// ヘルパー関数

function generateApplicationSummary(companyInfo: any, relatedCompanies: any[]): string {
  const parts: string[] = [];
  
  // 企業概要
  parts.push(`【企業概要】`);
  parts.push(`当社（${companyInfo.companyName}）は、${companyInfo.status.assignmentDate}に設立された${companyInfo.kind}です。`);
  
  // 信頼性
  if (companyInfo.trustScore && companyInfo.trustScore.score > 70) {
    const age = companyInfo.trustScore.factors.corporateAge;
    parts.push(`設立から${age}年の実績を持ち、安定した経営基盤を確立しています。`);
  }
  
  // グループ企業
  if (relatedCompanies.length > 0) {
    const affiliates = relatedCompanies.filter(r => r.relation === 'affiliate');
    if (affiliates.length > 0) {
      parts.push(`\n【グループ体制】`);
      parts.push(`${affiliates.length}社の関連企業と連携し、グループ全体でのシナジー効果を創出しています。`);
    }
  }
  
  // 所在地
  parts.push(`\n【所在地】`);
  parts.push(`本社所在地: ${companyInfo.address.fullAddress}`);
  
  return parts.join('\n');
}

function generateScoreExplanation(trustScore: any): string[] {
  const explanations: string[] = [];
  
  if (trustScore.score >= 80) {
    explanations.push('非常に高い信頼性を有する企業です。');
  } else if (trustScore.score >= 60) {
    explanations.push('安定した信頼性を有する企業です。');
  } else if (trustScore.score >= 40) {
    explanations.push('標準的な信頼性レベルです。');
  } else {
    explanations.push('信頼性の向上が推奨されます。');
  }
  
  // 各要因の説明
  if (trustScore.factors.corporateAge >= 10) {
    explanations.push(`設立${trustScore.factors.corporateAge}年の長い歴史があります。`);
  } else if (trustScore.factors.corporateAge >= 5) {
    explanations.push(`設立${trustScore.factors.corporateAge}年の実績があります。`);
  } else {
    explanations.push(`設立${trustScore.factors.corporateAge}年の若い企業です。`);
  }
  
  if (trustScore.factors.addressChanges === 0) {
    explanations.push('設立以来、本店所在地の変更がなく安定しています。');
  } else {
    explanations.push(`過去に${trustScore.factors.addressChanges}回の本店移転があります。`);
  }
  
  return explanations;
}

function generateRecommendations(trustScore: any): string[] {
  const recommendations: string[] = [];
  
  if (trustScore.score < 60) {
    recommendations.push('補助金申請時は、事業の安定性を示す追加資料の提出を推奨します。');
  }
  
  if (trustScore.factors.corporateAge < 3) {
    recommendations.push('設立年数が浅いため、事業実績や将来性を具体的に示すことが重要です。');
  }
  
  if (trustScore.factors.addressChanges > 2) {
    recommendations.push('本店移転の理由を明確に説明することで、事業の継続性をアピールできます。');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('高い信頼性スコアを活かし、企業の安定性を積極的にアピールしましょう。');
  }
  
  return recommendations;
}

export default router;