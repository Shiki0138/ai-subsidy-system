import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/authenticate';
import { devAuthenticate } from '../middleware/devAuth';
import { businessImprovementService } from '../services/businessImprovementService';
import { logger } from '../config/logger';
import officialPdfFillService from '../services/officialPdfFillService';
import path from 'path';
import fs from 'fs/promises';

const isDevelopment = process.env.NODE_ENV !== 'production';
const authMiddleware = isDevelopment ? devAuthenticate : authenticate;

const router = express.Router();

// AI支援：設備投資計画生成
router.post('/generate-equipment-plan',
  authMiddleware,
  [
    body('equipmentName').isString().notEmpty().withMessage('Equipment name is required'),
    body('purpose').isString().notEmpty().withMessage('Purpose is required'),
    body('businessType').isString().notEmpty().withMessage('Business type is required'),
    body('employeeCount').isInt({ min: 1 }).withMessage('Employee count must be positive')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await businessImprovementService.generateEquipmentPlan(req.body);
      
      logger.info('Equipment plan generated', {
        userId: req.user?.userId,
        equipmentName: req.body.equipmentName
      });

      res.json(result);
    } catch (error) {
      logger.error('Equipment plan generation failed', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Equipment plan generation failed'
      });
    }
  }
);

// AI支援：賃金引上げ計画生成
router.post('/generate-wage-increase-plan',
  authMiddleware,
  [
    body('selectedCourse').isString().notEmpty().withMessage('Course selection is required'),
    body('currentWage').isInt({ min: 1 }).withMessage('Current wage must be positive'),
    body('targetEmployees').isInt({ min: 1 }).withMessage('Target employees must be positive'),
    body('businessType').isString().notEmpty().withMessage('Business type is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await businessImprovementService.generateWageIncreasePlan(req.body);
      
      logger.info('Wage increase plan generated', {
        userId: req.user?.userId,
        selectedCourse: req.body.selectedCourse
      });

      res.json(result);
    } catch (error) {
      logger.error('Wage increase plan generation failed', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Wage increase plan generation failed'
      });
    }
  }
);

// AI支援：事業概要生成
router.post('/generate-business-overview',
  authMiddleware,
  [
    body('simpleDescription').isString().notEmpty().withMessage('Business description is required'),
    body('businessType').isString().notEmpty().withMessage('Business type is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await businessImprovementService.generateBusinessOverview(req.body);
      
      logger.info('Business overview generated', {
        userId: req.user?.userId,
        businessType: req.body.businessType
      });

      res.json(result);
    } catch (error) {
      logger.error('Business overview generation failed', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Business overview generation failed'
      });
    }
  }
);

// 申請書類一括生成
router.post('/generate-all-documents',
  authMiddleware,
  [
    body('companyInfo.companyName').isString().notEmpty().withMessage('Company name is required'),
    body('companyInfo.representativeName').isString().notEmpty().withMessage('Representative name is required'),
    body('companyInfo.currentMinWage').isInt({ min: 1, max: 999 }).withMessage('Current minimum wage must be under 1000 yen'),
    body('equipmentPlans').isArray({ min: 1 }).withMessage('At least one equipment plan is required'),
    body('wageIncreasePlan.selectedCourse').isString().notEmpty().withMessage('Course selection is required'),
    body('wageIncreasePlan.increaseAmount').isInt({ min: 30 }).withMessage('Wage increase amount must be at least 30 yen')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user?.userId;
      const applicationData = req.body;

      // 書類生成（モック実装）
      const documents = [
        {
          title: '業務改善助成金支給申請書',
          description: '厚生労働省指定様式による申請書',
          fileUrl: `/api/business-improvement/document/application-form/${userId}`,
          content: generateApplicationForm(applicationData)
        },
        {
          title: '生産性向上に資する設備投資等計画書',
          description: '設備投資内容と生産性向上の具体的計画',
          fileUrl: `/api/business-improvement/document/equipment-plan/${userId}`,
          content: generateEquipmentPlanDocument(applicationData)
        },
        {
          title: '賃金引上げ計画書',
          description: '賃金引上げの具体的計画と実施時期',
          fileUrl: `/api/business-improvement/document/wage-plan/${userId}`,
          content: generateWagePlanDocument(applicationData)
        },
        {
          title: '生産性向上効果説明書',
          description: '設備導入による具体的な生産性向上効果',
          fileUrl: `/api/business-improvement/document/productivity-analysis/${userId}`,
          content: generateProductivityAnalysis(applicationData)
        }
      ];

      logger.info('Business improvement documents generated', {
        userId,
        companyName: applicationData.companyInfo.companyName,
        documentsCount: documents.length
      });

      res.json({
        success: true,
        message: 'All application documents generated successfully',
        data: {
          documents: documents.map(doc => ({
            title: doc.title,
            description: doc.description,
            fileUrl: doc.fileUrl
          }))
        }
      });

    } catch (error) {
      logger.error('Document generation failed', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Document generation failed'
      });
    }
  }
);

// 募集要項解析結果取得
router.get('/guidelines-analysis',
  authMiddleware,
  async (req, res) => {
    try {
      const year = req.query.year as string || '2024';
      const analysis = await businessImprovementService.analyzeGuidelines(year);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      logger.error('Guidelines analysis failed', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Guidelines analysis failed'
      });
    }
  }
);

/**
 * 申請書フォーム生成
 */
function generateApplicationForm(data: any): string {
  return `業務改善助成金支給申請書

【申請者情報】
事業者名: ${data.companyInfo.companyName}
代表者名: ${data.companyInfo.representativeName}
所在地: ${data.companyInfo.address}
電話番号: ${data.companyInfo.phone}
従業員数: ${data.companyInfo.employeeCount}名

【申請コース】
${data.wageIncreasePlan.selectedCourse}

【現在の事業場内最低賃金】
時給 ${data.companyInfo.currentMinWage}円

【引上げ後の賃金】
時給 ${data.companyInfo.currentMinWage + data.wageIncreasePlan.increaseAmount}円
（${data.wageIncreasePlan.increaseAmount}円引上げ）

【対象従業員数】
${data.wageIncreasePlan.targetEmployees}名

【設備投資計画】
${data.equipmentPlans.map((plan: any, index: number) => 
  `${index + 1}. ${plan.equipmentName} - ${plan.cost.toLocaleString()}円`
).join('\n')}

設備投資総額: ${data.equipmentPlans.reduce((sum: number, plan: any) => sum + plan.cost, 0).toLocaleString()}円`;
}

/**
 * 設備投資計画書生成
 */
function generateEquipmentPlanDocument(data: any): string {
  return `生産性向上に資する設備投資等計画書

【事業概要】
${data.businessOverview}

【設備投資計画詳細】
${data.equipmentPlans.map((plan: any, index: number) => `
設備${index + 1}: ${plan.equipmentName}
導入目的: ${plan.purpose}
期待される効果: ${plan.expectedEffect}
設備費用: ${plan.cost.toLocaleString()}円
供給業者: ${plan.supplier}
仕様: ${plan.specifications}
`).join('\n')}

【生産性向上目標】
${data.productivityGoals}

【投資効果の測定方法】
• 月次での生産性指標測定
• 品質改善効果の定量評価
• 従業員満足度調査
• 売上・利益への寄与度分析`;
}

/**
 * 賃金引上げ計画書生成
 */
function generateWagePlanDocument(data: any): string {
  return `賃金引上げ計画書

【賃金引上げの概要】
現在の事業場内最低賃金: 時給${data.companyInfo.currentMinWage}円
引上げ後の賃金: 時給${data.companyInfo.currentMinWage + data.wageIncreasePlan.increaseAmount}円
引上げ額: ${data.wageIncreasePlan.increaseAmount}円
対象従業員数: ${data.wageIncreasePlan.targetEmployees}名
実施予定日: ${data.wageIncreasePlan.implementationDate}

【賃金引上げの根拠】
${data.wageIncreasePlan.justification}

【実施方法】
1. 就業規則の改正
2. 労働者代表との協議
3. 労働基準監督署への届出
4. 賃金台帳の整備

【継続性の確保】
設備投資による生産性向上効果を原資として、1年間の賃金引上げを確実に実施し、その後も持続可能な賃金水準の維持を図ります。`;
}

/**
 * 生産性向上効果説明書生成
 */
function generateProductivityAnalysis(data: any): string {
  const totalCost = data.equipmentPlans.reduce((sum: number, plan: any) => sum + plan.cost, 0);
  const annualEffect = Math.floor(totalCost * 0.3); // 投資額の30%を年間効果として想定

  return `生産性向上効果説明書

【設備投資による効果分析】

1. 定量的効果
• 作業時間短縮: 30%削減（年間${Math.floor(2000 * 0.3)}時間）
• 品質向上: 不良率20%削減
• 人件費効率化: 年間${Math.floor(annualEffect * 0.4).toLocaleString()}円削減
• 売上増加: 年間${annualEffect.toLocaleString()}円増加見込み

2. 定性的効果
• 従業員の作業負荷軽減
• 職場環境の改善
• 顧客満足度向上
• 競争力強化

【投資回収計画】
設備投資額: ${totalCost.toLocaleString()}円
年間効果額: ${annualEffect.toLocaleString()}円
投資回収期間: 約${Math.ceil(totalCost / annualEffect)}年

【継続的改善計画】
1. 効果測定の実施（月次）
2. 改善活動の推進
3. 従業員スキルアップ研修
4. さらなる生産性向上の検討

この生産性向上効果により創出される付加価値を従業員の賃金引上げに還元し、持続的な事業成長を実現します。`;
}

/**
 * PDF出力エンドポイント
 */
router.post('/generate-pdf',
  authMiddleware,
  [
    body('companyInfo.companyName').isString().notEmpty(),
    body('companyInfo.representativeName').isString().notEmpty(),
    body('companyInfo.address').isString().notEmpty(),
    body('companyInfo.employeeCount').isInt({ min: 1 }),
    body('companyInfo.currentMinWage').isInt({ min: 0 }),
    body('wageIncreasePlan.increaseAmount').isInt({ min: 30 }),
    body('equipmentPlans').isArray({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation errors',
          details: errors.array()
        });
      }

      const { companyInfo, wageIncreasePlan, equipmentPlans } = req.body;
      const userId = req.user?.userId;

      logger.info('業務改善助成金PDF生成開始', {
        userId,
        companyName: companyInfo.companyName
      });

      // 申請データを整形
      const applicationData = {
        companyInfo: {
          name: companyInfo.companyName,
          representative: companyInfo.representativeName,
          address: companyInfo.address,
          employees: companyInfo.employeeCount
        },
        wageInfo: {
          currentMinWage: companyInfo.currentMinWage,
          raisedWage: companyInfo.currentMinWage + wageIncreasePlan.increaseAmount,
          raiseAmount: wageIncreasePlan.increaseAmount
        },
        equipmentPlan: {
          description: equipmentPlans[0]?.equipmentName || ''
        },
        productivityPlan: {
          measures: equipmentPlans[0]?.expectedEffect || ''
        },
        budget: {
          equipmentCost: equipmentPlans.reduce((sum: number, plan: any) => sum + plan.cost, 0)
        }
      };

      // PDF生成ディレクトリ
      const outputDir = path.join(process.cwd(), 'output', 'pdfs', userId);
      await fs.mkdir(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, `gyomu_kaizen_${Date.now()}.pdf`);

      // 公式PDFテンプレートに入力
      await officialPdfFillService.fillOfficialPDF(
        '業務改善助成金',
        applicationData,
        outputPath
      );

      // ダウンロードURLを生成
      const downloadUrl = `/api/business-improvement/download/${path.basename(outputPath)}`;

      logger.info('業務改善助成金PDF生成完了', {
        userId,
        outputPath
      });

      res.json({
        success: true,
        data: {
          pdfPath: outputPath,
          downloadUrl,
          fileName: `業務改善助成金申請書_${companyInfo.companyName}.pdf`
        }
      });

    } catch (error) {
      logger.error('PDF生成エラー', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'PDF生成に失敗しました'
      });
    }
  }
);

/**
 * PDFダウンロードエンドポイント
 */
router.get('/download/:filename',
  authMiddleware,
  async (req, res) => {
    try {
      const { filename } = req.params;
      const userId = req.user?.userId;
      const filePath = path.join(process.cwd(), 'output', 'pdfs', userId, filename);

      // ファイル存在確認
      await fs.access(filePath);

      res.download(filePath, `業務改善助成金申請書.pdf`);

    } catch (error) {
      logger.error('PDFダウンロードエラー', {
        error: error.message
      });

      res.status(404).json({
        success: false,
        error: 'ファイルが見つかりません'
      });
    }
  }
);

export default router;