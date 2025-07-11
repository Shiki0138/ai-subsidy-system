/**
 * 補助金情報API
 */

import express from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { conditionalAuth } from '../middleware/devAuthBypass';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import logger from '../config/logger';
import path from 'path';
import fs from 'fs/promises';
import PDFDocument from 'pdfkit';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/subsidies
 * 補助金一覧取得
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const subsidies = await prisma.subsidyProgram.findMany({
      where: { isActive: true },
      include: {
        guidelines: {
          where: { status: 'ACTIVE' },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { applicationEnd: 'asc' }
    });

    res.json({
      success: true,
      subsidies: subsidies.map(s => ({
        ...s,
        guideline: s.guidelines[0] || null
      }))
    });
  } catch (error) {
    logger.error('補助金一覧取得エラー', { error });
    res.status(500).json({
      success: false,
      error: '補助金情報の取得に失敗しました'
    });
  }
});

/**
 * GET /api/subsidies/:id
 * 補助金詳細取得
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subsidy = await prisma.subsidyProgram.findUnique({
      where: { id },
      include: {
        guidelines: {
          where: { status: 'ACTIVE' },
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            requirements: true,
            evaluationItems: true
          }
        },
        documents: {
          where: { isLatest: true },
          orderBy: { type: 'asc' }
        }
      }
    });

    if (!subsidy) {
      return res.status(404).json({
        success: false,
        error: '補助金が見つかりません'
      });
    }

    res.json({
      ...subsidy,
      guideline: subsidy.guidelines[0] || null
    });
  } catch (error) {
    logger.error('補助金詳細取得エラー', { id: req.params.id, error });
    res.status(500).json({
      success: false,
      error: '補助金情報の取得に失敗しました'
    });
  }
});

/**
 * GET /api/subsidies/:id/documents
 * 補助金関連書類一覧取得
 */
router.get('/:id/documents', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const documents = await prisma.subsidyDocument.findMany({
      where: {
        subsidyProgramId: id,
        isLatest: true
      },
      orderBy: [
        { type: 'asc' },
        { publishedDate: 'desc' }
      ]
    });

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    logger.error('書類一覧取得エラー', { subsidyId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: '書類情報の取得に失敗しました'
    });
  }
});

/**
 * GET /api/subsidies/:id/templates/:type
 * 申請書テンプレートダウンロード
 */
router.get('/:id/templates/:type', async (req: Request, res: Response) => {
  try {
    const { id, type } = req.params;

    // テンプレート生成（実際にはDBから取得または事前生成済みファイルを返す）
    const template = await generateTemplate(id, type);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'テンプレートが見つかりません'
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_template.pdf"`);
    res.send(template);

  } catch (error) {
    logger.error('テンプレートダウンロードエラー', {
      subsidyId: req.params.id,
      type: req.params.type,
      error
    });
    res.status(500).json({
      success: false,
      error: 'テンプレートのダウンロードに失敗しました'
    });
  }
});

/**
 * POST /api/subsidies/:id/generate-form-data
 * 申請書自動入力用データ生成
 */
router.post('/:id/generate-form-data', conditionalAuth(authenticate), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const applicationData = req.body;

    logger.info('申請書自動入力データ生成開始', {
      userId: req.user.id,
      subsidyId: id
    });

    // 補助金情報の取得
    const subsidy = await prisma.subsidyProgram.findUnique({
      where: { id },
      include: {
        guidelines: {
          where: { status: 'ACTIVE' },
          take: 1
        }
      }
    });

    if (!subsidy) {
      return res.status(404).json({
        success: false,
        error: '補助金が見つかりません'
      });
    }

    // フォームデータの生成
    const formData = generateFormData(subsidy, applicationData);

    res.json({
      success: true,
      formData,
      fields: getFormFields(subsidy.id)
    });

  } catch (error) {
    logger.error('フォームデータ生成エラー', {
      userId: req.user?.id,
      subsidyId: req.params.id,
      error
    });
    res.status(500).json({
      success: false,
      error: 'フォームデータの生成に失敗しました'
    });
  }
});

// ヘルパー関数

/**
 * テンプレート生成
 */
async function generateTemplate(subsidyId: string, type: string): Promise<Buffer | null> {
  try {
    // PDFKitを使用してテンプレートを生成
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));

    // フォント設定（日本語対応）
    doc.font('Helvetica');

    // タイトル
    doc.fontSize(16).text(getTemplateTitle(subsidyId, type), { align: 'center' });
    doc.moveDown();

    // テンプレート内容
    const fields = getTemplateFields(subsidyId, type);
    
    fields.forEach((field) => {
      doc.fontSize(12).text(field.label + ':', { continued: false });
      doc.fontSize(10).text('_'.repeat(60), { continued: false });
      
      if (field.hint) {
        doc.fontSize(8).fillColor('gray').text(field.hint);
        doc.fillColor('black');
      }
      
      doc.moveDown();
    });

    // フッター
    doc.fontSize(8)
       .fillColor('gray')
       .text('このテンプレートはAI補助金申請システムで自動生成されました', 50, doc.page.height - 50);

    doc.end();

    // バッファを結合
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  } catch (error) {
    logger.error('テンプレート生成エラー', { error });
    return null;
  }
}

/**
 * フォームデータ生成
 */
function generateFormData(subsidy: any, applicationData: any): any {
  const formData: any = {
    // 基本情報
    companyName: applicationData.companyProfile?.companyName || '',
    representativeName: applicationData.companyProfile?.representativeName || '',
    address: applicationData.companyProfile?.address || '',
    phone: applicationData.companyProfile?.phone || '',
    email: applicationData.companyProfile?.email || '',
    
    // 事業情報
    businessType: applicationData.companyProfile?.industry || '',
    employeeCount: applicationData.companyProfile?.employeeCount || '',
    annualRevenue: applicationData.companyProfile?.annualRevenue || '',
    
    // 事業計画
    projectTitle: applicationData.projectPlan?.title || '',
    projectPurpose: applicationData.projectPlan?.purpose || '',
    projectBackground: applicationData.projectPlan?.background || '',
    implementation: applicationData.projectPlan?.implementation || '',
    expectedResults: applicationData.projectPlan?.expectedResults?.join('\n') || '',
    
    // 予算
    totalBudget: applicationData.budget?.total || 0,
    subsidyAmount: applicationData.budget?.subsidyAmount || 0,
    selfFunding: applicationData.budget?.selfFunding || 0
  };

  // 補助金固有のフィールドマッピング
  if (subsidy.id === 'jizokukahojokin') {
    formData.supportingOrganization = '○○商工会議所';
    formData.businessPlanNumber = generatePlanNumber();
  } else if (subsidy.id === 'itdounyu') {
    formData.itVendor = applicationData.itVendor || '';
    formData.toolCategory = applicationData.toolCategory || '';
  }

  return formData;
}

/**
 * テンプレートタイトル取得
 */
function getTemplateTitle(subsidyId: string, type: string): string {
  const titles: Record<string, Record<string, string>> = {
    'jizokukahojokin': {
      'business-plan': '経営計画書',
      'project-plan': '補助事業計画書',
      'quotation': '見積書様式'
    },
    'itdounyu': {
      'business-plan': '事業計画書',
      'project-plan': 'IT導入計画書',
      'quotation': '見積依頼書'
    },
    'monozukuri': {
      'business-plan': '事業計画書',
      'project-plan': '技術開発計画書',
      'quotation': '設備見積書'
    }
  };

  return titles[subsidyId]?.[type] || '申請書テンプレート';
}

/**
 * テンプレートフィールド取得
 */
function getTemplateFields(subsidyId: string, type: string): Array<{
  label: string;
  hint?: string;
}> {
  if (type === 'business-plan') {
    return [
      { label: '企業名' },
      { label: '代表者名' },
      { label: '所在地' },
      { label: '事業内容', hint: '主な事業内容を具体的に記載してください' },
      { label: '従業員数' },
      { label: '資本金' },
      { label: '売上高（直近期）' },
      { label: '経営理念・ビジョン', hint: '企業の目指す方向性を記載してください' },
      { label: '自社の強み', hint: '競合他社との差別化要因を記載してください' },
      { label: '経営課題', hint: '現在直面している課題を具体的に記載してください' },
      { label: '今後の経営方針', hint: '3〜5年後の目標を含めて記載してください' }
    ];
  } else if (type === 'project-plan') {
    return [
      { label: '事業名', hint: '補助金を活用して実施する事業の名称' },
      { label: '事業目的', hint: 'この事業を実施する理由と目的' },
      { label: '事業内容', hint: '具体的な実施内容と方法' },
      { label: '実施スケジュール', hint: '開始から完了までの詳細なスケジュール' },
      { label: '実施体制', hint: '責任者と担当者の役割分担' },
      { label: '必要な設備・サービス', hint: '導入予定の設備やサービスの詳細' },
      { label: '期待される効果', hint: '定量的・定性的な効果を記載' },
      { label: '効果測定方法', hint: '効果をどのように測定・評価するか' },
      { label: '事業の継続性', hint: '補助事業終了後の継続計画' }
    ];
  }

  return [
    { label: '項目1' },
    { label: '項目2' },
    { label: '項目3' }
  ];
}

/**
 * フォームフィールド情報取得
 */
function getFormFields(subsidyId: string): any {
  // 補助金別のフォームフィールド定義
  const fields: Record<string, any> = {
    'jizokukahojokin': {
      sections: [
        {
          title: '企業情報',
          fields: [
            { id: 'companyName', label: '企業名', type: 'text', required: true },
            { id: 'representativeName', label: '代表者名', type: 'text', required: true },
            { id: 'address', label: '所在地', type: 'text', required: true },
            { id: 'phone', label: '電話番号', type: 'tel', required: true },
            { id: 'businessType', label: '業種', type: 'select', required: true },
            { id: 'employeeCount', label: '従業員数', type: 'number', required: true }
          ]
        },
        {
          title: '事業計画',
          fields: [
            { id: 'projectTitle', label: '事業名', type: 'text', required: true },
            { id: 'projectPurpose', label: '事業目的', type: 'textarea', required: true },
            { id: 'projectBackground', label: '事業背景', type: 'textarea', required: true },
            { id: 'implementation', label: '実施内容', type: 'textarea', required: true },
            { id: 'expectedResults', label: '期待効果', type: 'textarea', required: true }
          ]
        }
      ]
    },
    'itdounyu': {
      sections: [
        {
          title: '企業情報',
          fields: [
            { id: 'companyName', label: '企業名', type: 'text', required: true },
            { id: 'representativeName', label: '代表者名', type: 'text', required: true },
            { id: 'itVendor', label: 'IT導入支援事業者', type: 'text', required: true }
          ]
        },
        {
          title: 'IT導入計画',
          fields: [
            { id: 'toolCategory', label: '導入ツールカテゴリ', type: 'select', required: true },
            { id: 'projectTitle', label: '導入計画名', type: 'text', required: true },
            { id: 'implementation', label: '導入内容', type: 'textarea', required: true }
          ]
        }
      ]
    }
  };

  return fields[subsidyId] || { sections: [] };
}

/**
 * 計画番号生成
 */
function generatePlanNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${year}-${random}`;
}

export default router;