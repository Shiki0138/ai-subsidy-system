/**
 * 補助金マッチングAPI
 * 企業情報とプロジェクト情報から最適な補助金を選定
 */

import express from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApplicationInput, SubsidyMatch } from '../types/application';
import { conditionalAuth } from '../middleware/devAuthBypass';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import logger from '../config/logger';
import OpenAI from 'openai';

const router = express.Router();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// スコアリングの重み設定
const SCORE_WEIGHTS = {
  eligibility: 0.4,      // 適格性（40%）
  objectiveMatch: 0.3,   // 目的適合度（30%）
  budgetFit: 0.2,        // 予算適合度（20%）
  industryPriority: 0.1  // 業種優先度（10%）
};

/**
 * POST /api/match-subsidy
 * 補助金マッチング＆スコアリング
 */
router.post('/', conditionalAuth(authenticate), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const input: ApplicationInput = req.body;
    
    logger.info('補助金マッチング開始', {
      userId: req.user?.id,
      company: input.company.name,
      objective: input.project.objective
    });

    // 1. 入力バリデーション
    const validationResult = validateInput(input);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        errors: validationResult.errors
      });
    }

    // 2. 候補補助金の取得（アクティブなもののみ）
    const subsidyPrograms = await prisma.subsidyProgram.findMany({
      where: { isActive: true },
      include: {
        guidelines: {
          where: { status: 'ACTIVE' },
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            evaluationItems: true,
            requirements: true
          }
        }
      }
    });

    // 3. 各補助金に対してスコアリング
    const matches: SubsidyMatch[] = await Promise.all(
      subsidyPrograms.map(async (program) => {
        const score = await calculateMatchScore(input, program);
        return {
          subsidyId: program.id,
          name: program.name,
          score: score.total,
          remarks: generateRemarks(score, program),
          scoreBreakdown: score.breakdown,
          recommendations: generateRecommendations(input, program, score),
          requiredDocuments: getRequiredDocuments(program)
        };
      })
    );

    // 4. スコアでソートして上位3件を返却
    const topMatches = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    logger.info('補助金マッチング完了', {
      userId: req.user?.id,
      topMatch: topMatches[0]?.name,
      topScore: topMatches[0]?.score
    });

    res.json({
      success: true,
      matches: topMatches,
      totalCandidates: subsidyPrograms.length
    });

  } catch (error) {
    logger.error('補助金マッチングエラー', {
      userId: req.user?.id,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: 'マッチング処理中にエラーが発生しました'
    });
  }
});

/**
 * 入力バリデーション
 */
function validateInput(input: ApplicationInput): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];

  // 企業情報の検証
  if (!input.company?.name) errors.push('企業名は必須です');
  if (!input.company?.industry) errors.push('業種は必須です');
  if (!input.company?.employees || input.company.employees < 1) errors.push('従業員数は1名以上必須です');
  if (!input.company?.location_pref) errors.push('都道府県は必須です');

  // プロジェクト情報の検証
  if (!input.project?.objective || input.project.objective.length < 20) {
    errors.push('事業目的は20文字以上で入力してください');
  }
  if (!input.project?.budget || input.project.budget < 100000) {
    errors.push('予算は10万円以上必須です');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * マッチングスコア計算
 */
async function calculateMatchScore(
  input: ApplicationInput,
  program: any
): Promise<{
  total: number;
  breakdown: {
    eligibility: number;
    objectiveMatch: number;
    budgetFit: number;
    industryPriority: number;
  };
}> {
  const guideline = program.guidelines[0];
  
  // 1. 適格性スコア（0-100）
  const eligibility = calculateEligibilityScore(input, program, guideline);
  
  // 2. 目的適合度（GPT-4で評価）
  const objectiveMatch = await calculateObjectiveMatchScore(
    input.project.objective,
    program,
    guideline
  );
  
  // 3. 予算適合度（0-100）
  const budgetFit = calculateBudgetFitScore(
    input.project.budget,
    guideline?.minAmount || 0,
    guideline?.maxAmount || program.maxAmount
  );
  
  // 4. 業種優先度（0-100）
  const industryPriority = calculateIndustryPriorityScore(
    input.company.industry,
    guideline
  );

  // 重み付けスコア計算
  const breakdown = {
    eligibility,
    objectiveMatch,
    budgetFit,
    industryPriority
  };

  const total = Math.round(
    SCORE_WEIGHTS.eligibility * eligibility +
    SCORE_WEIGHTS.objectiveMatch * objectiveMatch +
    SCORE_WEIGHTS.budgetFit * budgetFit +
    SCORE_WEIGHTS.industryPriority * industryPriority
  );

  return { total, breakdown };
}

/**
 * 適格性スコア計算
 */
function calculateEligibilityScore(
  input: ApplicationInput,
  program: any,
  guideline: any
): number {
  let score = 100;
  const reasons: string[] = [];

  // 従業員数チェック
  if (guideline?.targetBusinessSize) {
    const sizeMatch = checkBusinessSize(input.company.employees, guideline.targetBusinessSize);
    if (!sizeMatch) {
      score -= 50;
      reasons.push('事業規模が対象外');
    }
  }

  // 業種チェック
  if (guideline?.targetIndustries?.length > 0) {
    const industryMatch = guideline.targetIndustries.includes(input.company.industry);
    if (!industryMatch && !guideline.targetIndustries.includes('全業種')) {
      score -= 30;
      reasons.push('業種が限定対象外');
    }
  }

  // 地域チェック（地域限定補助金の場合）
  if (guideline?.targetRegions?.length > 0) {
    const regionMatch = guideline.targetRegions.includes(input.company.location_pref);
    if (!regionMatch) {
      score = 0; // 地域要件は必須
      reasons.push('対象地域外');
    }
  }

  return Math.max(0, score);
}

/**
 * 目的適合度スコア計算（AI評価）
 */
async function calculateObjectiveMatchScore(
  objective: string,
  program: any,
  guideline: any
): Promise<number> {
  try {
    const prompt = `
以下の事業目的が補助金の目的とどの程度合致しているか、0-100点で評価してください。

【補助金名】${program.name}
【補助金の目的】${program.purpose || guideline?.purpose || ''}
【評価基準】${guideline?.evaluationCriteria ? JSON.stringify(guideline.evaluationCriteria) : ''}

【申請者の事業目的】${objective}

評価基準：
- 補助金の目的との直接的な関連性（40点）
- 社会的インパクト・波及効果（30点）
- 実現可能性・具体性（30点）

回答は数値のみ（0-100の整数）でお願いします。
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: '補助金審査の専門家として客観的に評価してください。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    const scoreText = completion.choices[0]?.message?.content || '50';
    const score = parseInt(scoreText.trim());
    
    return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
  } catch (error) {
    logger.error('AI評価エラー', { error });
    return 50; // デフォルト値
  }
}

/**
 * 予算適合度スコア計算
 */
function calculateBudgetFitScore(
  budget: number,
  minAmount: number,
  maxAmount: number
): number {
  // 予算が範囲外の場合
  if (budget < minAmount) {
    // 最小額を下回る場合、不足率に応じて減点
    const shortfallRatio = (minAmount - budget) / minAmount;
    return Math.max(0, 100 - shortfallRatio * 100);
  }
  
  if (budget > maxAmount) {
    // 最大額を超過する場合、超過率に応じて減点
    const excessRatio = (budget - maxAmount) / maxAmount;
    return Math.max(0, 100 - excessRatio * 50);
  }
  
  // 範囲内の場合は満点
  return 100;
}

/**
 * 業種優先度スコア計算
 */
function calculateIndustryPriorityScore(
  industry: string,
  guideline: any
): number {
  // 優先業種リスト（実際にはDBから取得）
  const priorityIndustries = guideline?.priorityIndustries || [];
  
  if (priorityIndustries.includes(industry)) {
    return 100; // 優先業種
  }
  
  // 関連業種の場合は部分点
  const relatedIndustries = {
    'manufacturing': ['it', 'service'],
    'retail': ['service', 'hospitality'],
    'it': ['manufacturing', 'service'],
    // ... 他の関連定義
  };
  
  if (relatedIndustries[industry]?.some(related => priorityIndustries.includes(related))) {
    return 60;
  }
  
  return 20; // 基本点
}

/**
 * 事業規模チェック
 */
function checkBusinessSize(employees: number, targetSizes: string[]): boolean {
  const sizeMap = {
    '小規模': employees <= 20,
    '中規模': employees > 20 && employees <= 300,
    '中小企業': employees <= 300,
    '大企業': employees > 300
  };
  
  return targetSizes.some(size => sizeMap[size]);
}

/**
 * マッチング理由の生成
 */
function generateRemarks(score: any, program: any): string {
  const remarks: string[] = [];
  
  if (score.breakdown.eligibility === 100) {
    remarks.push('✓ 申請要件を完全に満たしています');
  } else if (score.breakdown.eligibility >= 50) {
    remarks.push('△ 一部申請要件の確認が必要です');
  }
  
  if (score.breakdown.objectiveMatch >= 80) {
    remarks.push('✓ 事業目的が補助金の趣旨と高度に合致');
  }
  
  if (score.breakdown.budgetFit === 100) {
    remarks.push('✓ 予算規模が適切です');
  }
  
  if (score.total >= 80) {
    remarks.push('★ 採択可能性が高い補助金です');
  }
  
  return remarks.join(' / ');
}

/**
 * 推奨アクションの生成
 */
function generateRecommendations(
  input: ApplicationInput,
  program: any,
  score: any
): string[] {
  const recommendations: string[] = [];
  
  // スコアに基づく推奨
  if (score.breakdown.objectiveMatch < 70) {
    recommendations.push('事業目的をより具体的に記載することで評価が向上する可能性があります');
  }
  
  if (score.breakdown.budgetFit < 100) {
    recommendations.push('予算計画を見直すことで補助率を最大化できます');
  }
  
  // 必要書類の準備
  const guideline = program.guidelines[0];
  if (guideline?.requiredDocuments?.mandatory?.length > 5) {
    recommendations.push('必要書類が多いため、早めの準備をお勧めします');
  }
  
  // 申請期限
  if (program.applicationEnd) {
    const daysLeft = Math.ceil(
      (new Date(program.applicationEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft < 30) {
      recommendations.push(`申請期限まで残り${daysLeft}日です。お急ぎください`);
    }
  }
  
  return recommendations;
}

/**
 * 必要書類リストの取得
 */
function getRequiredDocuments(program: any): string[] {
  const guideline = program.guidelines[0];
  const documents: string[] = [];
  
  // 必須書類
  if (guideline?.requiredDocuments?.mandatory) {
    documents.push(...guideline.requiredDocuments.mandatory);
  }
  
  // 共通書類（すべての補助金で必要）
  const commonDocs = [
    '会社案内・パンフレット',
    '決算書（直近2期分）',
    '事業計画書'
  ];
  
  // 重複を除いて返す
  return [...new Set([...documents, ...commonDocs])];
}

export default router;