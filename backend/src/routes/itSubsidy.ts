import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/authenticate';
import { devAuthenticate } from '../middleware/devAuth';
import { logger } from '../config/logger';
import { ClaudeAPI } from '@anthropic-ai/sdk';
import officialPdfFillService from '../services/officialPdfFillService';
import path from 'path';
import fs from 'fs/promises';

// 開発環境かどうかを判定
const isDevelopment = process.env.NODE_ENV !== 'production';
const authMiddleware = isDevelopment ? devAuthenticate : authenticate;

const router = express.Router();

// Claude AI初期化
const claude = new ClaudeAPI({
  apiKey: process.env.ANTHROPIC_API_KEY || 'test-key'
});

// IT導入補助金バリデーション
const itSubsidyValidation = [
  // 企業基本情報
  body('companyInfo.name').isString().notEmpty().withMessage('企業名は必須です'),
  body('companyInfo.representative').isString().notEmpty().withMessage('代表者名は必須です'),
  body('companyInfo.industry').isString().notEmpty().withMessage('業種は必須です'),
  body('companyInfo.employees').isInt({ min: 1 }).withMessage('従業員数は1以上で入力してください'),
  body('companyInfo.address').isString().notEmpty().withMessage('所在地は必須です'),
  body('companyInfo.phone').isString().notEmpty().withMessage('電話番号は必須です'),
  body('companyInfo.email').isEmail().withMessage('有効なメールアドレスを入力してください'),

  // IT導入計画
  body('itPlan.purpose').isString().notEmpty().withMessage('導入目的は必須です'),
  body('itPlan.currentIssues').isString().notEmpty().withMessage('現在の課題は必須です'),
  body('itPlan.targetSolution').isString().notEmpty().withMessage('目指す解決策は必須です'),
  body('itPlan.expectedEffects').isString().notEmpty().withMessage('期待効果は必須です'),

  // ITツール情報
  body('itTool.toolName').isString().notEmpty().withMessage('ITツール名は必須です'),
  body('itTool.vendor').isString().notEmpty().withMessage('ベンダー名は必須です'),
  body('itTool.category').isString().notEmpty().withMessage('ツールカテゴリは必須です'),
  body('itTool.price').isInt({ min: 1 }).withMessage('導入価格は1円以上で入力してください'),

  // 生産性向上計画
  body('productivityPlan.currentProcess').isString().notEmpty().withMessage('現在の業務プロセスは必須です'),
  body('productivityPlan.improvedProcess').isString().notEmpty().withMessage('改善後のプロセスは必須です'),
  body('productivityPlan.kpi').isString().notEmpty().withMessage('KPIは必須です'),
  body('productivityPlan.measurementMethod').isString().notEmpty().withMessage('測定方法は必須です')
];

/**
 * AIテキスト生成API
 */
router.post('/generate-text',
  authMiddleware,
  [
    body('field').isString().notEmpty().withMessage('フィールド名は必須です'),
    body('shortInput').isString().notEmpty().withMessage('短文入力は必須です'),
    body('formData').isObject().withMessage('フォームデータは必須です')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
      }

      const { field, shortInput, formData } = req.body;
      const userId = req.user?.userId;

      logger.info('IT導入補助金 AIテキスト生成開始', {
        userId,
        field,
        shortInputLength: shortInput.length
      });

      // AI生成実行
      const generatedText = await generateAIText(field, shortInput, formData);

      logger.info('IT導入補助金 AIテキスト生成完了', {
        userId,
        field,
        generatedTextLength: generatedText.length
      });

      res.json({
        success: true,
        data: {
          field,
          shortInput,
          generatedText
        }
      });

    } catch (error) {
      logger.error('AIテキスト生成エラー', {
        userId: req.user?.userId,
        field: req.body.field,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'AIテキスト生成中にエラーが発生しました'
      });
    }
  }
);

/**
 * 申請書生成API
 */
router.post('/generate-application',
  authMiddleware,
  itSubsidyValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
      }

      const { companyInfo, itPlan, itTool, productivityPlan, aiAssistance } = req.body;
      const userId = req.user?.userId;

      logger.info('IT導入補助金申請書生成開始', {
        userId,
        companyName: companyInfo.name,
        toolName: itTool.toolName
      });

      // 申請書生成
      const applicationResult = await generateITSubsidyApplication({
        companyInfo,
        itPlan,
        itTool,
        productivityPlan,
        aiAssistance
      }, userId);

      logger.info('IT導入補助金申請書生成完了', {
        userId,
        companyName: companyInfo.name,
        documentsCount: applicationResult.documents.length
      });

      res.json({
        success: true,
        data: applicationResult
      });

    } catch (error) {
      logger.error('IT導入補助金申請書生成エラー', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: '申請書生成中にエラーが発生しました'
      });
    }
  }
);

/**
 * 申請要件チェックAPI
 */
router.post('/check-eligibility',
  authMiddleware,
  [
    body('companyInfo.employees').isInt({ min: 1 }).withMessage('従業員数は必須です'),
    body('companyInfo.industry').isString().notEmpty().withMessage('業種は必須です'),
    body('itTool.price').isInt({ min: 1 }).withMessage('ITツール価格は必須です')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
      }

      const { companyInfo, itTool } = req.body;
      const eligibilityResult = checkITSubsidyEligibility(companyInfo, itTool);

      res.json({
        success: true,
        data: eligibilityResult
      });

    } catch (error) {
      logger.error('申請要件チェックエラー', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: '申請要件チェック中にエラーが発生しました'
      });
    }
  }
);

/**
 * IT導入補助金スケジュール情報取得
 */
router.get('/schedule',
  authMiddleware,
  async (req, res) => {
    try {
      const scheduleInfo = {
        currentTerm: '2024年度',
        finalDeadline: '2024年12月2日（17:00まで）',
        implementationPeriod: '2024年4月1日〜2025年3月31日',
        resultAnnouncement: '申請後約2ヶ月',
        importantDates: [
          {
            date: '2024年11月1日',
            event: 'GビズID取得推奨期限',
            importance: 'high'
          },
          {
            date: '2024年11月15日',
            event: 'IT導入支援事業者との契約推奨期限',
            importance: 'high'
          },
          {
            date: '2024年12月2日',
            event: '最終申請締切（17:00）',
            importance: 'critical'
          }
        ],
        requirements: [
          'GビズIDプライムまたはメンバーの取得（約2週間必要）',
          'IT導入支援事業者との契約',
          '補助対象ITツールの選定',
          'SECURITY ACTIONの実施（セキュリティ対策）'
        ]
      };

      res.json({
        success: true,
        data: scheduleInfo
      });

    } catch (error) {
      logger.error('スケジュール情報取得エラー', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'スケジュール情報取得中にエラーが発生しました'
      });
    }
  }
);

/**
 * AIテキスト生成関数
 */
async function generateAIText(field: string, shortInput: string, formData: any): Promise<string> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('test')) {
    // 開発環境ではモックテキストを返す
    return generateMockText(field, shortInput, formData);
  }

  try {
    // IT導入補助金の募集要項と成功事例を踏まえたプロンプト
    const prompt = createAIPrompt(field, shortInput, formData);

    const response = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    return responseText.trim();

  } catch (error) {
    logger.error('Claude AI生成エラー', { error: error.message });
    return generateMockText(field, shortInput, formData);
  }
}

/**
 * AI生成プロンプト作成
 */
function createAIPrompt(field: string, shortInput: string, formData: any): string {
  const baseContext = `
あなたはIT導入補助金の申請書作成を支援するAIアシスタントです。
以下の情報を踏まえて、申請書に適した詳細な文章を作成してください：

【IT導入補助金の要件】
- 目的：中小企業・小規模事業者のITツール導入による業務効率化・売上向上
- 対象：生産性向上に寄与するITツール
- 重視される点：具体的な効果測定、ROIの明確化、実現可能性

【企業情報】
企業名: ${formData.companyInfo?.name || ''}
業種: ${formData.companyInfo?.industry || ''}
従業員数: ${formData.companyInfo?.employees || ''}人

【ITツール情報】
ツール名: ${formData.itTool?.toolName || ''}
カテゴリ: ${formData.itTool?.category || ''}
価格: ${formData.itTool?.price?.toLocaleString() || ''}円

【短文入力】
${shortInput}
`;

  const fieldSpecificPrompts: { [key: string]: string } = {
    'itPlan.purpose': baseContext + `
上記の短文入力を元に、IT導入の目的を詳細に説明してください。
以下の要素を含めてください：
- 現在のビジネス環境・市場動向
- IT導入の必要性
- 期待される効果
- 企業の競争力向上への寄与
300-500文字程度で作成してください。`,

    'itPlan.currentIssues': baseContext + `
上記の短文入力を元に、現在の課題を詳細に説明してください。
以下の要素を含めてください：
- 具体的な業務上の問題点
- 現状の業務フローの課題
- 生産性・効率性への影響
- 定量的なデータがあれば含める
300-500文字程度で作成してください。`,

    'itPlan.targetSolution': baseContext + `
上記の短文入力を元に、目指す解決策を詳細に説明してください。
以下の要素を含めてください：
- ITツール導入による具体的な改善策
- 業務プロセスの変化
- 期待される機能・効果
- 実装計画の概要
400-600文字程度で作成してください。`,

    'itPlan.expectedEffects': baseContext + `
上記の短文入力を元に、期待される効果を詳細に説明してください。
以下の要素を含めてください：
- 定量的効果（時間短縮、コスト削減、売上向上等）
- 定性的効果（品質向上、従業員満足度等）
- ROI（投資対効果）の見込み
- 中長期的な影響
400-600文字程度で作成してください。`,

    'productivityPlan.currentProcess': baseContext + `
上記の短文入力を元に、現在の業務プロセスを詳細に説明してください。
以下の要素を含めてください：
- 業務フローの各ステップ
- 各工程の所要時間
- 関与する人員・部署
- 現状の課題・ボトルネック
400-600文字程度で作成してください。`,

    'productivityPlan.improvedProcess': baseContext + `
上記の短文入力を元に、改善後の業務プロセスを詳細に説明してください。
以下の要素を含めてください：
- ITツール導入後の新しい業務フロー
- 自動化・効率化される部分
- 人的リソースの再配置
- 期待される改善効果
400-600文字程度で作成してください。`,

    'productivityPlan.kpi': baseContext + `
上記の短文入力を元に、KPI・成果指標を詳細に設定してください。
以下の要素を含めてください：
- 定量的な目標数値
- 測定可能な指標
- 目標達成期限
- ベースラインとの比較
200-400文字程度で作成してください。`,

    'productivityPlan.measurementMethod': baseContext + `
上記の短文入力を元に、効果測定方法を詳細に説明してください。
以下の要素を含めてください：
- 測定ツール・システム
- 測定頻度・タイミング
- データ収集方法
- 分析・評価手法
200-400文字程度で作成してください。`
  };

  return fieldSpecificPrompts[field] || baseContext + `
上記の短文入力を元に、${field}について詳細な文章を作成してください。
IT導入補助金の申請書に適した内容で、具体的で説得力のある文章にしてください。`;
}

/**
 * モックテキスト生成
 */
function generateMockText(field: string, shortInput: string, formData: any): string {
  const mockTexts: { [key: string]: (input: string, data: any) => string } = {
    'itPlan.purpose': (input, data) => `
当社では、${input}を目的として、ITツールの導入を計画しております。
${data.companyInfo?.industry || '当社'}業界においては、デジタル化による業務効率化と生産性向上が企業の競争力維持に不可欠となっています。
特に、従来の手作業による業務プロセスでは、市場の変化に迅速に対応することが困難な状況となっており、
ITツールの活用による業務の標準化・自動化が急務となっています。

本事業により、作業時間の短縮、ヒューマンエラーの削減、データ活用による意思決定の迅速化を実現し、
持続的な成長を図ってまいります。
    `.trim(),

    'itPlan.currentIssues': (input, data) => `
現在当社では、${input}という課題を抱えております。

具体的には以下のような問題が発生しています：
・手作業による業務処理のため、処理時間が長く生産性が低い
・データの散在により、必要な情報の検索・集計に時間を要する
・紙ベースの管理により、情報共有が困難で業務の属人化が進行
・リアルタイムでの進捗管理ができず、問題の早期発見が困難

これらの課題により、従業員の残業時間増加、コスト増大、顧客対応の遅延等が生じており、
企業の競争力低下につながる懸念があります。
    `.trim(),

    'itPlan.targetSolution': (input, data) => `
${input}を実現するため、${data.itTool?.toolName || 'ITツール'}の導入による以下の解決策を検討しております。

【導入予定のITソリューション】
・${data.itTool?.toolName || 'ITツール'}による業務プロセスの自動化
・クラウドベースのデータ管理システムの構築
・リアルタイム進捗管理機能の導入
・モバイル対応によるテレワーク環境の整備

【期待される改善効果】
・業務処理時間の30%短縮
・データ入力・検索時間の50%削減
・情報共有の効率化による意思決定スピードの向上
・ペーパーレス化によるコスト削減とセキュリティ向上

これにより、従業員がより創造的で付加価値の高い業務に集中できる環境を構築し、
企業全体の生産性向上を実現いたします。
    `.trim(),

    'itPlan.expectedEffects': (input, data) => `
本ITツール導入により、${input}の効果を期待しております。

【定量的効果】
・業務処理時間：月間${Math.max(100, (data.companyInfo?.employees || 10) * 8)}時間削減
・人件費削減効果：年間約${Math.floor((data.companyInfo?.employees || 10) * 500000 * 0.3).toLocaleString()}円
・売上向上効果：年間約${Math.floor((data.companyInfo?.revenue || 50000000) * 0.15).toLocaleString()}円

【定性的効果】
・従業員満足度の向上（残業時間削減、業務負荷軽減）
・顧客サービス品質の向上（迅速な対応、正確な情報提供）
・コンプライアンス強化（データ管理の適正化、セキュリティ向上）
・事業継続性の確保（災害時のリモートワーク対応）

【投資対効果】
導入費用${(data.itTool?.price || 1000000).toLocaleString()}円に対し、
年間効果額約${Math.floor((data.itTool?.price || 1000000) * 0.8).toLocaleString()}円を見込んでおり、
約${Math.ceil((data.itTool?.price || 1000000) / Math.max(1000000, (data.itTool?.price || 1000000) * 0.8))}年での投資回収を予定しています。
    `.trim()
  };

  return mockTexts[field] ? mockTexts[field](shortInput, formData) : 
    `${shortInput}について、AI支援により詳細な内容を生成いたします。`;
}

/**
 * 申請書生成関数
 */
async function generateITSubsidyApplication(applicationData: any, userId: string) {
  // 開発環境用のモック実装
  const documents = [
    {
      id: `it_form1_${Date.now()}`,
      title: '交付申請書（様式第1号）',
      description: 'IT導入補助金交付申請書',
      type: 'APPLICATION_FORM',
      content: `
IT導入補助金 交付申請書

申請日: ${new Date().toLocaleDateString('ja-JP')}

【申請者情報】
企業名: ${applicationData.companyInfo.name}
代表者名: ${applicationData.companyInfo.representative}
業種: ${applicationData.companyInfo.industry}
従業員数: ${applicationData.companyInfo.employees}人
所在地: ${applicationData.companyInfo.address}
電話番号: ${applicationData.companyInfo.phone}
メールアドレス: ${applicationData.companyInfo.email}

【ITツール情報】
ツール名: ${applicationData.itTool.toolName}
ベンダー名: ${applicationData.itTool.vendor}
カテゴリ: ${applicationData.itTool.category}
導入価格: ${applicationData.itTool.price.toLocaleString()}円（税抜）

【申請内容】
${applicationData.itPlan.purpose}

上記のとおり申請いたします。
      `,
      downloadUrl: '#',
      generatedAt: new Date()
    },
    {
      id: `it_business_plan_${Date.now()}`,
      title: '事業計画書',
      description: 'IT導入による事業計画書',
      type: 'BUSINESS_PLAN',
      content: `
IT導入事業計画書

【1. 導入目的】
${applicationData.itPlan.purpose}

【2. 現在の課題】
${applicationData.itPlan.currentIssues}

【3. 解決策】
${applicationData.itPlan.targetSolution}

【4. 期待効果】
${applicationData.itPlan.expectedEffects}

【5. 生産性向上計画】
■現在の業務プロセス
${applicationData.productivityPlan.currentProcess}

■改善後の業務プロセス
${applicationData.productivityPlan.improvedProcess}

■KPI・成果指標
${applicationData.productivityPlan.kpi}

■効果測定方法
${applicationData.productivityPlan.measurementMethod}
      `,
      downloadUrl: '#',
      generatedAt: new Date()
    },
    {
      id: `it_tool_info_${Date.now()}`,
      title: 'ITツール詳細情報',
      description: '導入予定ITツールの詳細情報',
      type: 'TOOL_INFO',
      content: `
ITツール詳細情報

【基本情報】
ツール名: ${applicationData.itTool.toolName}
ベンダー名: ${applicationData.itTool.vendor}
カテゴリ: ${applicationData.itTool.category}
導入価格: ${applicationData.itTool.price.toLocaleString()}円（税抜）
実装期間: ${applicationData.itTool.implementationPeriod || 3}ヶ月

【機能概要】
${applicationData.itPlan.targetSolution}

【導入効果】
${applicationData.itPlan.expectedEffects}
      `,
      downloadUrl: '#',
      generatedAt: new Date()
    }
  ];

  return {
    applicationId: `it-${Date.now()}`,
    subsidyType: 'IT導入補助金',
    applicant: applicationData.companyInfo.name,
    documents,
    generatedAt: new Date().toISOString(),
    summary: {
      totalDocuments: documents.length,
      toolName: applicationData.itTool.toolName,
      investmentAmount: applicationData.itTool.price
    }
  };
}

/**
 * 申請要件チェック関数
 */
function checkITSubsidyEligibility(companyInfo: any, itTool: any) {
  const results = [];
  let eligible = true;

  // 中小企業要件チェック
  const isSmallMediumEnterprise = companyInfo.employees <= 300; // 簡易チェック
  results.push({
    requirement: '中小企業・小規模事業者要件',
    description: '中小企業基本法に基づく中小企業であること',
    status: isSmallMediumEnterprise ? 'pass' : 'fail',
    details: `従業員数: ${companyInfo.employees}人`
  });

  if (!isSmallMediumEnterprise) {
    eligible = false;
  }

  // ITツール価格要件チェック
  const priceInRange = itTool.price >= 50000 && itTool.price <= 4500000;
  results.push({
    requirement: 'ITツール価格要件',
    description: '補助対象となる価格帯（5万円〜450万円）',
    status: priceInRange ? 'pass' : 'fail',
    details: `導入価格: ${itTool.price.toLocaleString()}円`
  });

  if (!priceInRange) {
    eligible = false;
  }

  // 生産性向上要件
  results.push({
    requirement: '生産性向上要件',
    description: '労働生産性の向上に資するITツールであること',
    status: 'pass',
    details: '事業計画書により確認'
  });

  return {
    eligible,
    overallStatus: eligible ? 'eligible' : 'not_eligible',
    requirements: results,
    recommendations: [
      'IT導入支援事業者との事前相談を推奨します',
      'GビズIDの取得には約2週間かかるため、早めに手続きしてください',
      'SECURITY ACTIONの実施が必要です'
    ]
  };
}

/**
 * PDF出力エンドポイント
 */
router.post('/generate-pdf',
  authMiddleware,
  itSubsidyValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
      }

      const { companyInfo, itPlan, itTool, productivityPlan } = req.body;
      const userId = req.user?.userId;

      logger.info('IT導入補助金PDF生成開始', {
        userId,
        companyName: companyInfo.name
      });

      // PDF生成ディレクトリ
      const outputDir = path.join(process.cwd(), 'output', 'pdfs', userId);
      await fs.mkdir(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, `it_subsidy_${Date.now()}.pdf`);

      // 公式PDFテンプレートに入力
      await officialPdfFillService.fillOfficialPDF(
        'IT導入補助金',
        { companyInfo, itPlan, itTool, productivityPlan },
        outputPath
      );

      // ダウンロードURLを生成
      const downloadUrl = `/api/it-subsidy/download/${path.basename(outputPath)}`;

      logger.info('IT導入補助金PDF生成完了', {
        userId,
        outputPath
      });

      res.json({
        success: true,
        data: {
          pdfPath: outputPath,
          downloadUrl,
          fileName: `IT導入補助金申請書_${companyInfo.name}.pdf`
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

      res.download(filePath, `IT導入補助金申請書.pdf`);

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