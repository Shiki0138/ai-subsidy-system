import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../config/logger';
import officialPdfFillService from '../services/officialPdfFillService';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const prisma = new PrismaClient();

// 簡単入力スキーマ
const SimpleInputSchema = z.object({
  equipment_type: z.string().min(1, '導入する設備・技術を入力してください'),
  problem_to_solve: z.string().min(1, '解決する課題を入力してください'),
  productivity_improvement: z.number().min(0, '生産性向上率は0以上で入力してください'),
  investment_amount: z.number().min(1000000, '投資額は100万円以上である必要があります'),
  implementation_period: z.number().min(1).max(24, '実施期間は1〜24ヶ月で設定してください'),
  industry: z.string().min(1, '業種を選択してください'),
  company_size: z.number().min(1, '従業員数を入力してください')
});

// クイック申請エンドポイント
router.post('/quick-apply', authenticateToken, async (req, res) => {
  try {
    // 入力検証
    const validatedData = SimpleInputSchema.parse(req.body);
    const userId = req.user!.id;

    logger.info('ものづくり補助金クイック申請開始', { userId, industry: validatedData.industry });

    // AI エンジンに申請書生成を依頼
    const aiResponse = await axios.post(
      `${process.env.AI_ENGINE_URL}/monozukuri/generate`,
      {
        simple_input: validatedData,
        user_id: userId
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AI_ENGINE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60秒タイムアウト
      }
    );

    const generatedApplication = aiResponse.data;

    // データベースに申請書を保存
    const application = await prisma.application.create({
      data: {
        userId,
        subsidyProgramId: 'monozukuri-hojokin', // 事前に定義されたID
        status: 'DRAFT',
        applicationData: generatedApplication.application_data,
        metadata: {
          simple_input: validatedData,
          quality_score: generatedApplication.quality_score,
          adoption_probability: generatedApplication.adoption_probability,
          generated_at: generatedApplication.generated_at
        }
      }
    });

    // 成功レスポンス
    res.json({
      success: true,
      applicationId: application.id,
      qualityScore: generatedApplication.quality_score,
      adoptionProbability: generatedApplication.adoption_probability,
      message: `採択確率${generatedApplication.adoption_probability}%の申請書を生成しました`,
      sections: generatedApplication.application_data
    });

  } catch (error) {
    logger.error('ものづくり補助金申請生成エラー', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: '申請書の生成中にエラーが発生しました'
    });
  }
});

// 簡易評価エンドポイント（申請前のチェック）
router.post('/quick-assessment', authenticateToken, async (req, res) => {
  try {
    const validatedData = SimpleInputSchema.parse(req.body);

    // AI エンジンに簡易評価を依頼
    const assessmentResponse = await axios.post(
      `${process.env.AI_ENGINE_URL}/monozukuri/assess`,
      {
        simple_input: validatedData
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AI_ENGINE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      assessment: assessmentResponse.data
    });

  } catch (error) {
    logger.error('簡易評価エラー', error);
    res.status(500).json({
      success: false,
      message: '評価中にエラーが発生しました'
    });
  }
});

// 業種別成功パターン取得
router.get('/success-patterns/:industry', authenticateToken, async (req, res) => {
  try {
    const { industry } = req.params;

    // 業種別の成功事例を取得
    const successPatterns = await prisma.application.findMany({
      where: {
        subsidyProgramId: 'monozukuri-hojokin',
        status: 'APPROVED',
        metadata: {
          path: ['simple_input', 'industry'],
          equals: industry
        }
      },
      select: {
        metadata: true,
        applicationData: true
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // パターンを分析して返す
    const patterns = successPatterns.map(app => ({
      equipment_type: app.metadata?.simple_input?.equipment_type,
      productivity_improvement: app.metadata?.simple_input?.productivity_improvement,
      adoption_probability: app.metadata?.adoption_probability,
      key_success_factors: extractKeySuccessFactors(app.applicationData)
    }));

    res.json({
      success: true,
      industry,
      patterns,
      recommendations: generateRecommendations(patterns)
    });

  } catch (error) {
    logger.error('成功パターン取得エラー', error);
    res.status(500).json({
      success: false,
      message: 'データの取得中にエラーが発生しました'
    });
  }
});

// 申請書プレビュー更新
router.put('/applications/:id/preview', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 既存の申請書を取得
    const application = await prisma.application.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: '申請書が見つかりません'
      });
    }

    // AIで更新内容を最適化
    const optimizedResponse = await axios.post(
      `${process.env.AI_ENGINE_URL}/monozukuri/optimize`,
      {
        current_data: application.applicationData,
        updates
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AI_ENGINE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 更新を保存
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        applicationData: optimizedResponse.data.optimized_data,
        metadata: {
          ...application.metadata,
          last_optimized: new Date().toISOString(),
          quality_score: optimizedResponse.data.quality_score
        }
      }
    });

    res.json({
      success: true,
      application: updatedApplication,
      qualityScore: optimizedResponse.data.quality_score
    });

  } catch (error) {
    logger.error('申請書更新エラー', error);
    res.status(500).json({
      success: false,
      message: '更新中にエラーが発生しました'
    });
  }
});

// ヘルパー関数
function extractKeySuccessFactors(applicationData: any): string[] {
  const factors = [];
  
  // 技術的革新性のキーワードを抽出
  if (applicationData?.技術的課題と解決方法) {
    const techKeywords = ['革新的', 'AI', 'IoT', 'DX', '自動化'];
    techKeywords.forEach(keyword => {
      if (applicationData.技術的課題と解決方法.includes(keyword)) {
        factors.push(keyword);
      }
    });
  }

  return factors;
}

function generateRecommendations(patterns: any[]): string[] {
  const recommendations = [];
  
  // 平均生産性向上率を計算
  const avgImprovement = patterns.reduce((sum, p) => sum + (p.productivity_improvement || 0), 0) / patterns.length;
  
  if (avgImprovement > 20) {
    recommendations.push(`この業種では平均${avgImprovement.toFixed(1)}%の生産性向上を実現しています`);
  }

  // 共通する設備タイプを特定
  const equipmentTypes = patterns.map(p => p.equipment_type).filter(Boolean);
  const commonEquipment = findMostCommon(equipmentTypes);
  if (commonEquipment) {
    recommendations.push(`「${commonEquipment}」の導入が成功事例で多く見られます`);
  }

  return recommendations;
}

function findMostCommon(arr: string[]): string | null {
  if (arr.length === 0) return null;
  
  const frequency: Record<string, number> = {};
  arr.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;
}

/**
 * PDF出力エンドポイント
 */
router.post('/generate-pdf', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.body;
    const userId = req.user!.id;

    logger.info('ものづくり補助金PDF生成開始', { userId, applicationId });

    // 申請データを取得
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: '申請データが見つかりません'
      });
    }

    // 申請データを整形
    const applicationData = {
      companyInfo: {
        name: application.applicationData.company_info?.name || '',
        representative: application.applicationData.company_info?.representative || '',
        address: application.applicationData.company_info?.address || '',
        capital: application.applicationData.company_info?.capital || 0,
        employees: application.applicationData.company_info?.employees || 0
      },
      technicalPlan: {
        challenges: application.applicationData.technical_challenges || '',
        innovation: application.applicationData.innovative_service || '',
        processImprovement: application.applicationData.process_improvement || ''
      },
      investmentPlan: {
        details: application.applicationData.investment_plan || ''
      },
      budget: {
        totalCost: application.metadata?.simple_input?.investment_amount || 0
      }
    };

    // PDF生成ディレクトリ
    const outputDir = path.join(process.cwd(), 'output', 'pdfs', userId);
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `monozukuri_${Date.now()}.pdf`);

    // 公式PDFテンプレートに入力
    await officialPdfFillService.fillOfficialPDF(
      'ものづくり補助金',
      applicationData,
      outputPath
    );

    // ダウンロードURLを生成
    const downloadUrl = `/api/monozukuri/download/${path.basename(outputPath)}`;

    logger.info('ものづくり補助金PDF生成完了', { userId, outputPath });

    res.json({
      success: true,
      data: {
        pdfPath: outputPath,
        downloadUrl,
        fileName: `ものづくり補助金申請書_${applicationData.companyInfo.name}.pdf`
      }
    });

  } catch (error) {
    logger.error('PDF生成エラー', {
      userId: req.user?.id,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'PDF生成に失敗しました'
    });
  }
});

/**
 * PDFダウンロードエンドポイント
 */
router.get('/download/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user!.id;
    const filePath = path.join(process.cwd(), 'output', 'pdfs', userId, filename);

    // ファイル存在確認
    await fs.access(filePath);

    res.download(filePath, `ものづくり補助金申請書.pdf`);

  } catch (error) {
    logger.error('PDFダウンロードエラー', {
      error: error.message
    });

    res.status(404).json({
      success: false,
      message: 'ファイルが見つかりません'
    });
  }
});

export default router;