import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/authenticate';
import { devAuthenticate } from '../middleware/devAuth';
import { sustainabilitySubsidyService } from '../services/sustainabilitySubsidyService';
import { logger } from '../config/logger';
import officialPdfFillService from '../services/officialPdfFillService';
import path from 'path';
import fs from 'fs/promises';

// 開発環境かどうかを判定
const isDevelopment = process.env.NODE_ENV !== 'production';
const authMiddleware = isDevelopment ? devAuthenticate : authenticate;

const router = express.Router();

// バリデーション
const applicationValidation = [
  // 企業基本情報
  body('companyInfo.companyName').isString().notEmpty().withMessage('Company name is required'),
  body('companyInfo.representativeName').isString().notEmpty().withMessage('Representative name is required'),
  body('companyInfo.businessType').isString().notEmpty().withMessage('Business type is required'),
  body('companyInfo.foundedYear').isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Valid founded year is required'),
  body('companyInfo.employeeCount').isInt({ min: 1, max: 20 }).withMessage('Employee count must be 1-20 for small business'),
  body('companyInfo.address').isString().notEmpty().withMessage('Address is required'),
  body('companyInfo.phone').isString().notEmpty().withMessage('Phone is required'),
  body('companyInfo.email').isEmail().withMessage('Valid email is required'),

  // 事業計画
  body('businessPlan.projectName').isString().isLength({ min: 5, max: 30 }).withMessage('Project name must be 5-30 characters'),
  body('businessPlan.businessOverview').optional().isString(),

  // 予算計画
  body('budgetPlan.totalProjectCost').isInt({ min: 1 }).withMessage('Total project cost is required'),
  body('budgetPlan.subsidyAmount').isInt({ min: 1, max: 2000000 }).withMessage('Subsidy amount must be within limit'),
  body('budgetPlan.expenseDetails').isArray({ min: 1 }).withMessage('At least one expense item is required'),

  // 予算詳細のバリデーション
  body('budgetPlan.expenseDetails.*.category').isString().notEmpty().withMessage('Expense category is required'),
  body('budgetPlan.expenseDetails.*.item').isString().notEmpty().withMessage('Expense item is required'),
  body('budgetPlan.expenseDetails.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be positive'),
  body('budgetPlan.expenseDetails.*.unitPrice').isInt({ min: 1 }).withMessage('Unit price must be positive'),
  body('budgetPlan.expenseDetails.*.description').isString().notEmpty().withMessage('Description is required')
];

// 小規模企業持続化補助金テンプレート初期化
router.post('/initialize-templates',
  authMiddleware,
  async (req, res) => {
    try {
      // 管理者権限チェック
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

      await sustainabilitySubsidyService.initializeTemplates();

      logger.info('✅ 小規模企業持続化補助金テンプレート初期化完了', {
        userId: req.user?.userId
      });

      res.json({
        success: true,
        message: 'Sustainability subsidy templates initialized successfully'
      });

    } catch (error) {
      logger.error('❌ Template initialization failed', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Template initialization failed',
        message: error.message
      });
    }
  }
);

// 申請書類一括生成
router.post('/generate-all-documents',
  authMiddleware,
  applicationValidation,
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

      // 自己負担額を計算
      applicationData.budgetPlan.selfFunding = 
        applicationData.budgetPlan.totalProjectCost - applicationData.budgetPlan.subsidyAmount;

      // 補助率チェック（2/3以内）
      const subsidyRate = applicationData.budgetPlan.subsidyAmount / applicationData.budgetPlan.totalProjectCost;
      if (subsidyRate > 2/3) {
        return res.status(400).json({
          success: false,
          error: 'Subsidy rate cannot exceed 2/3 of total project cost'
        });
      }

      // 経費明細の合計チェック
      const totalExpenseAmount = applicationData.budgetPlan.expenseDetails.reduce((sum: number, expense: any) => {
        const amount = expense.quantity * expense.unitPrice;
        expense.totalPrice = amount;
        return sum + amount;
      }, 0);

      if (totalExpenseAmount !== applicationData.budgetPlan.totalProjectCost) {
        return res.status(400).json({
          success: false,
          error: 'Total expense amount does not match project cost',
          details: {
            expectedTotal: applicationData.budgetPlan.totalProjectCost,
            actualTotal: totalExpenseAmount
          }
        });
      }

      // 全書類生成
      const result = await sustainabilitySubsidyService.generateAllDocuments(applicationData, userId);

      logger.info('✅ 小規模企業持続化補助金申請書類生成完了', {
        userId,
        companyName: applicationData.companyInfo.companyName,
        projectName: applicationData.businessPlan.projectName,
        subsidyAmount: applicationData.budgetPlan.subsidyAmount,
        documentsCount: result.documents.length
      });

      res.json({
        success: true,
        message: 'All application documents generated successfully',
        data: result
      });

    } catch (error) {
      logger.error('❌ Document generation failed', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Document generation failed',
        message: error.message
      });
    }
  }
);

// 申請要件チェック
router.post('/check-eligibility',
  authMiddleware,
  [
    body('companyInfo.employeeCount').isInt({ min: 1, max: 20 }),
    body('companyInfo.businessType').isString().notEmpty(),
    body('companyInfo.foundedYear').isInt({ min: 1900 })
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

      const { companyInfo } = req.body;
      const eligibilityResult = await checkEligibility(companyInfo);

      res.json({
        success: true,
        data: eligibilityResult
      });

    } catch (error) {
      logger.error('❌ Eligibility check failed', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Eligibility check failed'
      });
    }
  }
);

// 経費カテゴリ一覧取得
router.get('/expense-categories',
  authenticate,
  async (req, res) => {
    try {
      const categories = [
        {
          id: 'machinery_equipment',
          name: '機械装置等費',
          description: '事業の遂行に必要な機械装置等の購入費用',
          maxAmount: 1000000,
          requirements: ['見積書3社以上', '設置場所の確認']
        },
        {
          id: 'advertising',
          name: '広報費',
          description: 'パンフレット・ポスター・チラシ等の作成費、看板作成費等',
          maxAmount: 500000,
          requirements: ['成果物の提出', '領収書']
        },
        {
          id: 'exhibition',
          name: '展示会等出展費',
          description: '展示会出展費用（出展小間料、備品等レンタル料）',
          maxAmount: 300000,
          requirements: ['出展証明書', '領収書']
        },
        {
          id: 'travel',
          name: '旅費',
          description: '事業の遂行に必要な情報収集等のための旅費',
          maxAmount: 200000,
          requirements: ['出張報告書', '領収書']
        },
        {
          id: 'development',
          name: '開発費',
          description: '新商品・サービス開発にかかる原材料・設計費等',
          maxAmount: 800000,
          requirements: ['開発計画書', '成果物']
        },
        {
          id: 'outsourcing',
          name: '委託費',
          description: '自社では実施困難な業務の外部委託費用',
          maxAmount: 600000,
          requirements: ['委託契約書', '完了報告書']
        },
        {
          id: 'expert',
          name: '専門家経費',
          description: '専門家への謝金・旅費（1日当たり上限額あり）',
          maxAmount: 300000,
          requirements: ['専門家証明書', '業務報告書']
        }
      ];

      res.json({
        success: true,
        data: {
          categories,
          notes: [
            '補助対象経費は税抜き価格で計算してください',
            '交付決定前の発注・契約は補助対象外です',
            '経費ごとに上限額が設定されています'
          ]
        }
      });

    } catch (error) {
      logger.error('❌ Failed to get expense categories', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get expense categories'
      });
    }
  }
);

// 申請スケジュール情報取得
router.get('/schedule-info',
  authenticate,
  async (req, res) => {
    try {
      const scheduleInfo = {
        currentRound: 16,
        applicationPeriod: {
          start: '2024-04-01',
          end: '2024-06-30',
          daysRemaining: Math.max(0, Math.ceil((new Date('2024-06-30').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        },
        evaluationPeriod: {
          start: '2024-07-01',
          end: '2024-08-31'
        },
        resultAnnouncement: '2024-09-30',
        projectPeriod: {
          start: '2024-10-01',
          end: '2025-09-30'
        },
        importantDates: [
          {
            date: '2024-05-31',
            event: 'GビズID取得締切（推奨）',
            importance: 'high'
          },
          {
            date: '2024-06-15',
            event: '商工会議所での相談締切',
            importance: 'medium'
          },
          {
            date: '2024-06-30',
            event: '申請締切（17:00まで）',
            importance: 'critical'
          }
        ],
        requirements: [
          'GビズIDプライムまたはメンバーの取得（3-4週間必要）',
          '商工会・商工会議所での事業支援計画書発行',
          '電子申請の推奨（郵送は減点対象）'
        ]
      };

      res.json({
        success: true,
        data: scheduleInfo
      });

    } catch (error) {
      logger.error('❌ Failed to get schedule info', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get schedule info'
      });
    }
  }
);

// 申請チェックリスト取得
router.get('/checklist',
  authenticate,
  async (req, res) => {
    try {
      const checklist = {
        beforeApplication: [
          {
            id: 'gbiz_id',
            title: 'GビズIDの取得',
            description: 'GビズIDプライムまたはメンバーを取得する（3-4週間必要）',
            required: true,
            status: 'pending'
          },
          {
            id: 'chamber_consultation',
            title: '商工会・商工会議所での相談',
            description: '事業支援計画書の発行を受ける',
            required: true,
            status: 'pending'
          },
          {
            id: 'financial_documents',
            title: '財務書類の準備',
            description: '確定申告書、決算書等の必要書類を準備する',
            required: true,
            status: 'pending'
          }
        ],
        applicationDocuments: [
          {
            id: 'form1',
            title: '様式1：申請書',
            description: '小規模事業者持続化補助金に係る申請書',
            required: true,
            autoGenerable: true,
            status: 'pending'
          },
          {
            id: 'form2',
            title: '様式2：経営計画書',
            description: '経営計画書兼補助事業計画書①',
            required: true,
            autoGenerable: true,
            aiAssisted: true,
            status: 'pending'
          },
          {
            id: 'form3',
            title: '様式3：補助事業計画書',
            description: '補助事業計画書②（経費明細）',
            required: true,
            autoGenerable: true,
            status: 'pending'
          },
          {
            id: 'form4',
            title: '様式4：事業支援計画書',
            description: '商工会・商工会議所発行の支援計画書',
            required: true,
            autoGenerable: false,
            externalIssue: true,
            status: 'pending'
          },
          {
            id: 'form5',
            title: '様式5：交付申請書',
            description: '補助金交付申請書',
            required: true,
            autoGenerable: true,
            status: 'pending'
          },
          {
            id: 'form6',
            title: '様式6：宣誓・同意書',
            description: '宣誓・同意書',
            required: true,
            autoGenerable: true,
            status: 'pending'
          }
        ],
        additionalDocuments: [
          {
            id: 'financial_statements',
            title: '財務関係書類',
            description: '確定申告書、決算書等（事業者種別により異なる）',
            required: true,
            autoGenerable: false,
            status: 'pending'
          },
          {
            id: 'registration_documents',
            title: '登記関係書類',
            description: '開業届、登記簿謄本等（事業者種別により異なる）',
            required: true,
            autoGenerable: false,
            status: 'pending'
          }
        ],
        specialCategory: [
          {
            id: 'wage_increase',
            title: '賃金引上げ枠（様式7）',
            description: '賃金引上げ枠の申請に係る誓約書',
            required: false,
            autoGenerable: true,
            condition: '賃金引上げ枠で申請する場合',
            status: 'pending'
          },
          {
            id: 'invoice_special',
            title: 'インボイス特例',
            description: '適格請求書発行事業者の登録通知書',
            required: false,
            autoGenerable: false,
            condition: 'インボイス特例を利用する場合',
            status: 'pending'
          }
        ]
      };

      res.json({
        success: true,
        data: checklist
      });

    } catch (error) {
      logger.error('❌ Failed to get checklist', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get checklist'
      });
    }
  }
);

/**
 * 申請要件チェック関数
 */
async function checkEligibility(companyInfo: any) {
  const results = [];
  let eligible = true;

  // 小規模事業者要件チェック
  const isSmallBusiness = companyInfo.employeeCount <= 20;
  results.push({
    requirement: '小規模事業者要件',
    description: '従業員数20名以下（商業・サービス業は5名以下）',
    status: isSmallBusiness ? 'pass' : 'fail',
    details: `従業員数: ${companyInfo.employeeCount}名`
  });

  if (!isSmallBusiness) {
    eligible = false;
  }

  // 事業年数チェック
  const businessYears = new Date().getFullYear() - companyInfo.foundedYear;
  const hasBusinessHistory = businessYears >= 1;
  results.push({
    requirement: '事業実績',
    description: '1年以上の事業実績があること',
    status: hasBusinessHistory ? 'pass' : 'warning',
    details: `事業年数: ${businessYears}年`
  });

  // 除外業種チェック
  const excludedBusinessTypes = ['風俗営業', 'パチンコ', 'ゲームセンター'];
  const isExcluded = excludedBusinessTypes.some(excluded => 
    companyInfo.businessType.includes(excluded)
  );
  results.push({
    requirement: '除外業種確認',
    description: '風俗営業等の除外業種でないこと',
    status: isExcluded ? 'fail' : 'pass',
    details: isExcluded ? '除外業種に該当します' : '除外業種には該当しません'
  });

  if (isExcluded) {
    eligible = false;
  }

  return {
    eligible,
    overallStatus: eligible ? 'eligible' : 'not_eligible',
    requirements: results,
    recommendations: [
      '商工会・商工会議所での事前相談を受けることをお勧めします',
      'GビズIDの取得には3-4週間かかるため、お早めに手続きしてください',
      '申請前に必要書類を全て準備してください'
    ]
  };
}

/**
 * PDF出力エンドポイント
 */
router.post('/generate-pdf',
  authMiddleware,
  applicationValidation,
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

      const { companyInfo, businessPlan, budgetPlan } = req.body;
      const userId = req.user?.userId;

      logger.info('持続化補助金PDF生成開始', {
        userId,
        companyName: companyInfo.companyName
      });

      // 申請データを整形
      const applicationData = {
        companyInfo: {
          name: companyInfo.companyName,
          representative: companyInfo.representativeName,
          address: companyInfo.address,
          phone: companyInfo.phone,
          employees: companyInfo.employeeCount
        },
        businessPlan: {
          summary: businessPlan.businessOverview || '',
          marketExpansion: businessPlan.marketExpansion || businessPlan.projectDescription || ''
        },
        budgetPlan: {
          subsidyAmount: budgetPlan.subsidyAmount
        }
      };

      // PDF生成ディレクトリ
      const outputDir = path.join(process.cwd(), 'output', 'pdfs', userId);
      await fs.mkdir(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, `jizokuka_${Date.now()}.pdf`);

      // 公式PDFテンプレートに入力
      await officialPdfFillService.fillOfficialPDF(
        '持続化補助金',
        applicationData,
        outputPath
      );

      // ダウンロードURLを生成
      const downloadUrl = `/api/sustainability-subsidy/download/${path.basename(outputPath)}`;

      logger.info('持続化補助金PDF生成完了', {
        userId,
        outputPath
      });

      res.json({
        success: true,
        data: {
          pdfPath: outputPath,
          downloadUrl,
          fileName: `持続化補助金申請書_${companyInfo.companyName}.pdf`
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

      res.download(filePath, `持続化補助金申請書.pdf`);

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