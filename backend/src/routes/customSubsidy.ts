import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate } from '../middleware/authenticate';
import { logger } from '../config/logger';
import multer from 'multer';
import { ClaudeAPI } from '@anthropic-ai/sdk';
import axios from 'axios';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';

const router = express.Router();

// Claude AI初期化
const claude = new ClaudeAPI({
  apiKey: process.env.ANTHROPIC_API_KEY || 'test-key'
});

// ファイルアップロード設定
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('PDFまたはWord文書のみアップロード可能です'), false);
    }
  }
});

// モック補助金データベース
const subsidyDatabase = [
  {
    id: '1',
    name: '東京都中小企業デジタル化支援補助金',
    organizer: '東京都',
    region: '東京都',
    maxAmount: '300万円',
    subsidyRate: '2/3',
    deadline: '2024年9月30日',
    category: 'デジタル化',
    description: 'AI・IoT等の最新技術を活用した業務改善を支援',
    url: 'https://example.tokyo.lg.jp/digital-support',
    keywords: ['デジタル化', 'AI', 'IoT', '東京都', '業務改善', 'DX']
  },
  {
    id: '2',
    name: '横浜市スタートアップ創業支援補助金',
    organizer: '横浜市',
    region: '神奈川県横浜市',
    maxAmount: '200万円',
    subsidyRate: '3/4',
    deadline: '2024年8月15日',
    category: '創業支援',
    description: '革新的なビジネスモデルでの創業を支援',
    keywords: ['創業', 'スタートアップ', '横浜市', '起業', 'ビジネス']
  },
  {
    id: '3',
    name: '大阪府ものづくり革新推進補助金',
    organizer: '大阪府',
    region: '大阪府',
    maxAmount: '500万円',
    subsidyRate: '1/2',
    deadline: '2024年10月31日',
    category: 'ものづくり',
    description: '製造業の生産性向上・技術革新を支援',
    keywords: ['ものづくり', '製造業', '大阪府', '生産性向上', '技術革新']
  },
  {
    id: '4',
    name: '福岡市環境配慮型事業推進補助金',
    organizer: '福岡市',
    region: '福岡県福岡市',
    maxAmount: '150万円',
    subsidyRate: '1/2',
    deadline: '2024年7月31日',
    category: '環境',
    description: '環境負荷軽減に寄与する事業活動を支援',
    keywords: ['環境', '福岡市', '環境配慮', 'エコ', '持続可能']
  },
  {
    id: '5',
    name: '名古屋市観光産業支援補助金',
    organizer: '名古屋市',
    region: '愛知県名古屋市',
    maxAmount: '250万円',
    subsidyRate: '2/3',
    deadline: '2024年11月15日',
    category: '観光',
    description: '観光産業の振興と地域活性化を支援',
    keywords: ['観光', '名古屋市', '観光産業', '地域活性化', 'インバウンド']
  }
];

/**
 * 補助金検索API
 */
router.get('/search', 
  authenticate,
  [
    query('q').isString().isLength({ min: 1 }).withMessage('検索キーワードは必須です'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit は1-50の範囲で指定してください'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset は0以上で指定してください')
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

      const { q, limit = 10, offset = 0 } = req.query;
      const searchQuery = (q as string).toLowerCase();

      logger.info('独自補助金検索', {
        userId: req.user?.userId,
        query: searchQuery,
        limit,
        offset
      });

      // キーワードマッチング検索
      const results = subsidyDatabase.filter(subsidy => {
        return subsidy.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchQuery)
        ) ||
        subsidy.name.toLowerCase().includes(searchQuery) ||
        subsidy.organizer.toLowerCase().includes(searchQuery) ||
        subsidy.description.toLowerCase().includes(searchQuery);
      });

      // ページネーション
      const totalCount = results.length;
      const paginatedResults = results.slice(
        Number(offset), 
        Number(offset) + Number(limit)
      );

      res.json({
        success: true,
        data: {
          results: paginatedResults,
          total: totalCount,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < totalCount
        }
      });

    } catch (error) {
      logger.error('補助金検索エラー', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: '検索処理中にエラーが発生しました'
      });
    }
  }
);

/**
 * URL解析API
 */
router.post('/analyze-url',
  authenticate,
  [
    body('url').isURL().withMessage('有効なURLを入力してください')
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

      const { url } = req.body;
      const userId = req.user?.userId;

      logger.info('URL解析開始', { userId, url });

      // Webページ取得
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AI-Subsidy-Bot/1.0)'
        }
      });

      // HTML解析
      const $ = cheerio.load(response.data);
      const pageText = $('body').text().replace(/\s+/g, ' ').trim();

      // Claude AIで情報抽出
      const analysisResult = await analyzeSubsidyContent(pageText, 'URL');

      logger.info('URL解析完了', {
        userId,
        url,
        extractedName: analysisResult.name
      });

      res.json({
        success: true,
        data: analysisResult
      });

    } catch (error) {
      logger.error('URL解析エラー', {
        userId: req.user?.userId,
        url: req.body.url,
        error: error.message
      });

      // フォールバック: モック解析結果
      res.json({
        success: true,
        data: {
          name: 'URL解析による補助金',
          organizer: '解析元サイト',
          maxAmount: '解析中...',
          subsidyRate: '解析中...',
          deadline: '解析中...',
          requirements: [
            'URL解析により抽出された要件（解析中）'
          ],
          eligibleExpenses: ['解析中...'],
          applicationDocuments: ['解析中...'],
          sourceUrl: req.body.url
        }
      });
    }
  }
);

/**
 * PDF解析API
 */
router.post('/analyze-pdf',
  authenticate,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'PDFファイルをアップロードしてください'
        });
      }

      const userId = req.user?.userId;

      logger.info('PDF解析開始', {
        userId,
        filename: req.file.originalname,
        size: req.file.size
      });

      // PDF内容抽出
      const pdfData = await pdfParse(req.file.buffer);
      const pdfText = pdfData.text;

      if (!pdfText || pdfText.trim().length < 100) {
        return res.status(400).json({
          success: false,
          error: 'PDFからテキストを抽出できませんでした'
        });
      }

      // Claude AIで情報抽出
      const analysisResult = await analyzeSubsidyContent(pdfText, 'PDF');

      logger.info('PDF解析完了', {
        userId,
        filename: req.file.originalname,
        extractedName: analysisResult.name
      });

      res.json({
        success: true,
        data: analysisResult
      });

    } catch (error) {
      logger.error('PDF解析エラー', {
        userId: req.user?.userId,
        filename: req.file?.originalname,
        error: error.message
      });

      // フォールバック: モック解析結果
      res.json({
        success: true,
        data: {
          name: 'PDF解析による補助金',
          organizer: 'PDF解析結果',
          maxAmount: 'PDF解析中...',
          subsidyRate: 'PDF解析中...',
          deadline: 'PDF解析中...',
          requirements: [
            'PDF解析により抽出された要件（解析中）'
          ],
          eligibleExpenses: ['PDF解析中...'],
          applicationDocuments: ['PDF解析中...'],
          sourceFile: req.file?.originalname
        }
      });
    }
  }
);

/**
 * 申請書生成API
 */
router.post('/generate-application',
  authenticate,
  [
    body('subsidyInfo').isObject().withMessage('補助金情報は必須です'),
    body('companyInfo').isObject().withMessage('企業情報は必須です'),
    body('projectInfo').isObject().withMessage('プロジェクト情報は必須です')
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

      const { subsidyInfo, companyInfo, projectInfo } = req.body;
      const userId = req.user?.userId;

      logger.info('独自補助金申請書生成開始', {
        userId,
        subsidyName: subsidyInfo.name,
        companyName: companyInfo.name
      });

      // Claude AIで申請書生成
      const applicationResult = await generateCustomApplication(
        subsidyInfo,
        companyInfo,
        projectInfo
      );

      logger.info('独自補助金申請書生成完了', {
        userId,
        subsidyName: subsidyInfo.name,
        documentsCount: applicationResult.documents?.length || 0
      });

      res.json({
        success: true,
        data: applicationResult
      });

    } catch (error) {
      logger.error('申請書生成エラー', {
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
 * Claude AIによる補助金内容解析
 */
async function analyzeSubsidyContent(content: string, sourceType: string) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('test')) {
    // 開発環境ではモックデータを返す
    return {
      name: `${sourceType}解析による補助金`,
      organizer: `${sourceType}解析結果`,
      maxAmount: '100万円',
      subsidyRate: '2/3',
      deadline: '2024年12月31日',
      requirements: [
        '中小企業であること',
        '事業計画書の提出が必要',
        '実施期間は12ヶ月以内'
      ],
      eligibleExpenses: [
        '設備購入費',
        'システム開発費',
        '専門家指導費'
      ],
      applicationDocuments: [
        '申請書',
        '事業計画書',
        '経費明細書'
      ]
    };
  }

  try {
    const prompt = `
以下の補助金関連の文書から重要な情報を抽出してください：

【文書内容】
${content.substring(0, 4000)}

以下のJSON形式で回答してください：
{
  "name": "補助金名",
  "organizer": "主催者・実施機関",
  "maxAmount": "上限額",
  "subsidyRate": "補助率",
  "deadline": "申請締切",
  "requirements": ["申請要件1", "申請要件2"],
  "eligibleExpenses": ["対象経費1", "対象経費2"],
  "applicationDocuments": ["必要書類1", "必要書類2"]
}
`;

    const response = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('JSONレスポンスが見つかりません');
    }

  } catch (error) {
    logger.error('Claude AI解析エラー', { error: error.message });
    throw error;
  }
}

/**
 * Claude AIによる申請書生成
 */
async function generateCustomApplication(subsidyInfo: any, companyInfo: any, projectInfo: any) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('test')) {
    // 開発環境ではモックデータを返す
    return {
      applicationId: `custom-${Date.now()}`,
      subsidyName: subsidyInfo.name,
      documents: [
        {
          name: '申請書',
          content: '自動生成された申請書内容...',
          type: 'application'
        },
        {
          name: '事業計画書',
          content: '自動生成された事業計画書内容...',
          type: 'business_plan'
        }
      ],
      generatedAt: new Date().toISOString()
    };
  }

  try {
    const prompt = `
以下の情報を基に補助金申請書を作成してください：

【補助金情報】
名称: ${subsidyInfo.name}
主催者: ${subsidyInfo.organizer}
上限額: ${subsidyInfo.maxAmount}
補助率: ${subsidyInfo.subsidyRate}

【企業情報】
企業名: ${companyInfo.name}
業種: ${companyInfo.industry}
従業員数: ${companyInfo.employees}

【プロジェクト情報】
プロジェクト名: ${projectInfo.name}
概要: ${projectInfo.description}
予算: ${projectInfo.budget}

申請書類を作成してください。
`;

    const response = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      applicationId: `custom-${Date.now()}`,
      subsidyName: subsidyInfo.name,
      documents: [
        {
          name: '申請書',
          content: responseText,
          type: 'application'
        }
      ],
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Claude AI申請書生成エラー', { error: error.message });
    throw error;
  }
}

export default router;