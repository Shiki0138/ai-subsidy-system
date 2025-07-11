/**
 * 申請書生成・分析API
 */

import express from 'express';
import { Request, Response } from 'express';
import { conditionalAuth } from '../middleware/devAuthBypass';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import subsidyAnalysisEngine from '../services/subsidyAnalysisEngine';
import aiTextGenerationService from '../services/aiTextGenerationService';
import pdfGenerationService from '../services/pdfGenerationService';
import logger from '../config/logger';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/applications/analyze
 * 補助金との適合性分析
 */
router.post('/analyze', conditionalAuth(authenticate), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subsidyProgramId, companyProfile, projectPlan } = req.body;

    logger.info('申請書分析開始', {
      userId: req.user.id,
      subsidyProgramId,
      projectTitle: projectPlan.title
    });

    // 分析実行
    const analysisResult = await subsidyAnalysisEngine.analyzeMatch(
      subsidyProgramId,
      companyProfile,
      projectPlan
    );

    // 分析結果を保存（オプション）
    await prisma.applicationAnalysis.create({
      data: {
        userId: req.user.id,
        subsidyProgramId,
        companyData: companyProfile,
        projectData: projectPlan,
        analysisResult,
        matchScore: analysisResult.matchScore,
        createdAt: new Date()
      }
    });

    logger.info('申請書分析完了', {
      userId: req.user.id,
      matchScore: analysisResult.matchScore,
      isEligible: analysisResult.eligibility.isEligible
    });

    res.json({
      success: true,
      ...analysisResult
    });

  } catch (error) {
    logger.error('申請書分析エラー', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: '分析中にエラーが発生しました'
    });
  }
});

/**
 * POST /api/applications/generate
 * 申請書本文生成
 */
router.post('/generate', conditionalAuth(authenticate), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const applicationData = req.body;

    logger.info('申請書生成開始', {
      userId: req.user.id,
      projectTitle: applicationData.projectTitle
    });

    // 各セクションの生成
    const sections = await generateApplicationSections(applicationData);

    // 完全な申請書の構築
    const document = {
      title: applicationData.optimizedTitle || applicationData.projectTitle,
      sections,
      metadata: {
        generatedAt: new Date(),
        version: '1.0',
        subsidyProgram: applicationData.subsidyProgram,
        matchScore: applicationData.analysisResult?.matchScore
      }
    };

    logger.info('申請書生成完了', {
      userId: req.user.id,
      documentSections: Object.keys(sections)
    });

    res.json({
      success: true,
      document
    });

  } catch (error) {
    logger.error('申請書生成エラー', {
      userId: req.user?.id,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: '申請書生成中にエラーが発生しました'
    });
  }
});

/**
 * POST /api/applications/optimize-section
 * 特定セクションの最適化
 */
router.post('/optimize-section', conditionalAuth(authenticate), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sectionType, content, subsidyProgramId, keywords } = req.body;

    logger.info('セクション最適化開始', {
      userId: req.user.id,
      sectionType
    });

    // セクション別の最適化プロンプト
    const prompts = {
      purpose: '事業目的を補助金の趣旨に完全に合致させ、具体的な成果を明確にしてください。',
      background: '現状の課題と解決の必要性を説得力を持って説明してください。',
      implementation: '実施内容を具体的かつ実現可能な形で記述してください。',
      effect: '定量的な効果と地域への波及効果を明確にしてください。'
    };

    const result = await aiTextGenerationService.generateText({
      prompt: `${prompts[sectionType] || ''}\n\n現在の内容:\n${content}\n\n重要キーワード: ${keywords?.join(', ') || ''}`,
      fieldType: 'general',
      tone: 'professional',
      length: 'medium',
      maxLength: 800
    });

    res.json({
      success: true,
      optimizedContent: result.generatedText,
      suggestions: result.suggestions
    });

  } catch (error) {
    logger.error('セクション最適化エラー', {
      userId: req.user?.id,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: '最適化中にエラーが発生しました'
    });
  }
});

/**
 * GET /api/applications/templates/:subsidyProgramId
 * 補助金別テンプレート取得
 */
router.get('/templates/:subsidyProgramId', conditionalAuth(authenticate), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subsidyProgramId } = req.params;

    // テンプレートを取得（実際にはDBから）
    const template = await getApplicationTemplate(subsidyProgramId);

    res.json({
      success: true,
      template
    });

  } catch (error) {
    logger.error('テンプレート取得エラー', {
      userId: req.user?.id,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'テンプレート取得中にエラーが発生しました'
    });
  }
});

/**
 * POST /api/applications/score
 * 申請書スコアリング
 */
router.post('/score', conditionalAuth(authenticate), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { applicationId, content } = req.body;

    logger.info('申請書スコアリング開始', {
      userId: req.user.id,
      applicationId
    });

    // スコアリング実行
    const scoringResult = await scoreApplication(content);

    // 結果を保存
    await prisma.applicationScore.create({
      data: {
        applicationId,
        totalScore: scoringResult.totalScore,
        scoreBreakdown: scoringResult.breakdown,
        suggestions: scoringResult.suggestions,
        createdAt: new Date()
      }
    });

    res.json({
      success: true,
      scoring: scoringResult
    });

  } catch (error) {
    logger.error('スコアリングエラー', {
      userId: req.user?.id,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'スコアリング中にエラーが発生しました'
    });
  }
});

// ヘルパー関数

/**
 * 申請書の各セクションを生成
 */
async function generateApplicationSections(data: any) {
  const sections: any = {};

  // 1. 事業概要
  sections.summary = data.optimizedPurpose || data.projectSummary || 
    await generateSection('summary', data);

  // 2. 事業実施の背景・目的
  sections.background = data.optimizedBackground || data.projectBackground ||
    await generateSection('background', data);

  // 3. 事業内容
  sections.implementation = data.implementation ||
    await generateSection('implementation', data);

  // 4. 期待される効果
  sections.expectedEffects = formatExpectedEffects(data.expectedResults) ||
    await generateSection('effects', data);

  // 5. 実施体制
  sections.organizationStructure = await generateSection('organization', data);

  // 6. スケジュール
  sections.schedule = await generateSection('schedule', data);

  // 7. 収支計画
  sections.budget = formatBudgetPlan(data.budgetItems, data.subsidyProgram);

  // 8. 添付書類一覧
  sections.attachments = generateAttachmentsList(data.subsidyProgram);

  return sections;
}

/**
 * セクション別の内容生成
 */
async function generateSection(sectionType: string, data: any): Promise<string> {
  const prompts = {
    summary: `企業「${data.companyName}」の「${data.projectTitle}」事業について、補助金申請用の事業概要を200-300字で作成してください。`,
    background: `${data.industry}業界における${data.challenges}という課題に対して、なぜこの事業が必要なのか背景と目的を400字程度で説明してください。`,
    implementation: `${data.projectTitle}の具体的な実施内容、方法、プロセスを500字程度で詳細に記述してください。`,
    effects: `この事業による定量的効果（売上向上、コスト削減等）と定性的効果（ブランド向上等）を記述してください。`,
    organization: `${data.employeeCount}名規模の企業での実施体制と役割分担を記述してください。`,
    schedule: `事業開始から完了までの詳細なスケジュールを記述してください。`
  };

  const result = await aiTextGenerationService.generateText({
    prompt: prompts[sectionType] || '',
    fieldType: 'general',
    tone: 'professional',
    length: 'medium',
    maxLength: 600
  });

  return result.generatedText || '';
}

/**
 * 期待効果のフォーマット
 */
function formatExpectedEffects(effects: string[] | string): string {
  if (Array.isArray(effects)) {
    return effects.map((effect, index) => `${index + 1}. ${effect}`).join('\n');
  }
  return effects || '';
}

/**
 * 予算計画のフォーマット
 */
function formatBudgetPlan(budgetItems: any[], subsidyProgram: any) {
  if (!budgetItems || budgetItems.length === 0) return '';

  const total = budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const subsidyAmount = Math.min(total * subsidyProgram.subsidyRate, subsidyProgram.maxAmount);

  return {
    items: budgetItems,
    total,
    subsidyRate: subsidyProgram.subsidyRate,
    subsidyAmount,
    selfFunding: total - subsidyAmount
  };
}

/**
 * 添付書類リストの生成
 */
function generateAttachmentsList(subsidyProgram: any): string[] {
  // 補助金プログラムに応じた必要書類リスト
  const commonDocuments = [
    '会社案内・パンフレット',
    '決算書（直近2期分）',
    '見積書（該当する経費分）',
    '事業計画書',
    '誓約書'
  ];

  // プログラム別の追加書類
  const programSpecificDocs = {
    'jizokukahojokin': ['商工会議所の推薦書'],
    'itdounyu': ['IT導入支援事業者の提案書'],
    'monozukuri': ['技術開発計画書', '設備投資計画書']
  };

  return [
    ...commonDocuments,
    ...(programSpecificDocs[subsidyProgram.id] || [])
  ];
}

/**
 * テンプレート取得
 */
async function getApplicationTemplate(subsidyProgramId: string) {
  // 実際にはDBから取得
  return {
    sections: [
      { id: 'summary', title: '事業概要', required: true, maxLength: 300 },
      { id: 'background', title: '事業実施の背景・目的', required: true, maxLength: 500 },
      { id: 'implementation', title: '事業内容', required: true, maxLength: 800 },
      { id: 'effects', title: '期待される効果', required: true, maxLength: 400 },
      { id: 'organization', title: '実施体制', required: true, maxLength: 300 },
      { id: 'schedule', title: 'スケジュール', required: true, maxLength: 300 },
      { id: 'budget', title: '収支計画', required: true, format: 'table' }
    ],
    tips: {
      summary: '事業の全体像が一目で分かるよう、具体的かつ簡潔に記述してください。',
      background: '現状の課題と、なぜこの事業が必要なのかを論理的に説明してください。',
      implementation: '実施内容は具体的に、実現可能性が伝わるよう記述してください。',
      effects: '可能な限り数値目標を含め、測定可能な効果を記載してください。'
    }
  };
}

/**
 * 申請書スコアリング
 */
async function scoreApplication(content: any): Promise<any> {
  const criteria = [
    { name: '事業の必要性', weight: 0.25, maxScore: 100 },
    { name: '実現可能性', weight: 0.25, maxScore: 100 },
    { name: '効果・成果', weight: 0.25, maxScore: 100 },
    { name: '継続性', weight: 0.25, maxScore: 100 }
  ];

  const breakdown: any = {};
  let totalScore = 0;

  // 各基準でスコアリング（実際にはAI分析を使用）
  for (const criterion of criteria) {
    const score = Math.random() * 80 + 20; // 仮のスコア
    breakdown[criterion.name] = {
      score: Math.round(score),
      maxScore: criterion.maxScore,
      weight: criterion.weight,
      feedback: generateFeedback(criterion.name, score)
    };
    totalScore += score * criterion.weight;
  }

  return {
    totalScore: Math.round(totalScore),
    breakdown,
    suggestions: generateSuggestions(breakdown),
    estimatedSuccessRate: calculateSuccessRate(totalScore)
  };
}

function generateFeedback(criterionName: string, score: number): string {
  if (score >= 80) return '非常に優れています';
  if (score >= 60) return '良好ですが、改善の余地があります';
  return '大幅な改善が必要です';
}

function generateSuggestions(breakdown: any): string[] {
  const suggestions: string[] = [];
  
  Object.entries(breakdown).forEach(([criterion, data]: [string, any]) => {
    if (data.score < 70) {
      suggestions.push(`${criterion}の評価を上げるため、より具体的な記述を追加してください`);
    }
  });

  return suggestions;
}

function calculateSuccessRate(score: number): number {
  // スコアに基づく採択率の推定
  if (score >= 85) return 90;
  if (score >= 75) return 70;
  if (score >= 65) return 50;
  if (score >= 55) return 30;
  return 10;
}

/**
 * POST /api/applications/:applicationId/pdf
 * 申請書PDF生成
 */
router.post('/:applicationId/pdf', conditionalAuth(authenticate), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { applicationId } = req.params;

    logger.info('PDF生成開始', {
      userId: req.user.id,
      applicationId
    });

    // 申請書データの取得
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        subsidyProgram: true
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: '申請書が見つかりません'
      });
    }

    // ドキュメントデータの構築
    const document = {
      title: application.editedContent?.title || application.generatedContent?.title || application.title,
      sections: application.editedContent?.sections || application.generatedContent?.sections || {},
      metadata: {
        generatedAt: new Date(),
        subsidyProgram: application.subsidyProgram,
        companyName: application.companyInfo?.companyName || 'Unknown Company',
        applicationId: application.id
      }
    };

    // PDF保存ディレクトリの作成
    const pdfDir = path.join(process.cwd(), 'generated-pdfs');
    await fs.mkdir(pdfDir, { recursive: true });

    // PDFファイル名
    const fileName = `application_${applicationId}_${Date.now()}.pdf`;
    const filePath = path.join(pdfDir, fileName);

    // PDF生成
    await pdfGenerationService.generateApplicationPDF(document, filePath);

    // URLの生成（実際の実装では、S3等にアップロードしてURLを返す）
    const pdfUrl = `/api/applications/pdfs/${fileName}`;

    // 申請書レコードの更新
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        pdfUrl,
        pdfGeneratedAt: new Date()
      }
    });

    logger.info('PDF生成完了', {
      userId: req.user.id,
      applicationId,
      pdfUrl
    });

    res.json({
      success: true,
      url: pdfUrl,
      fileName
    });

  } catch (error) {
    logger.error('PDF生成エラー', {
      userId: req.user?.id,
      applicationId: req.params.applicationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'PDF生成中にエラーが発生しました'
    });
  }
});

/**
 * GET /api/applications/pdfs/:fileName
 * 生成されたPDFの取得
 */
router.get('/pdfs/:fileName', async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    
    // セキュリティチェック（ファイル名の検証）
    if (!/^application_[a-zA-Z0-9]+_\d+\.pdf$/.test(fileName)) {
      return res.status(400).json({
        success: false,
        error: '無効なファイル名です'
      });
    }

    const filePath = path.join(process.cwd(), 'generated-pdfs', fileName);
    
    // ファイルの存在確認
    await fs.access(filePath);
    
    // PDFを返す
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    
    const fileStream = await fs.readFile(filePath);
    res.send(fileStream);

  } catch (error) {
    logger.error('PDF取得エラー', {
      fileName: req.params.fileName,
      error: error.message
    });

    res.status(404).json({
      success: false,
      error: 'PDFファイルが見つかりません'
    });
  }
});

export default router;