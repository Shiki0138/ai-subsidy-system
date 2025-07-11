import express, { Request, Response } from 'express';
import { conditionalAuth } from '../middleware/devAuthBypass';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError } from '../middleware/errorHandler';
import EstatService from '../services/external/estatService';
import { redis } from '../index';

const router = express.Router();

// e-Stat APIキーは環境変数から取得
const estatService = new EstatService(
  process.env.ESTAT_API_KEY || 'demo_key',
  redis
);

interface MarketAnalysisRequest {
  industryCode?: string;
  prefectureCode?: string;
  businessKeywords?: string[];
  companySize?: {
    sales?: number;
    employees?: number;
  };
}

/**
 * 市場分析データの取得
 */
router.post('/analyze', conditionalAuth, asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const { industryCode, prefectureCode, businessKeywords, companySize } = req.body as MarketAnalysisRequest;

  if (!industryCode || !prefectureCode) {
    throw new ValidationError('業種コードと都道府県コードは必須です');
  }

  try {
    // 統計データの取得と分析
    const analysisData = await estatService.generateStatisticsSummary({
      industryCode,
      prefectureCode,
      businessKeywords: businessKeywords || []
    });

    // 企業規模との比較分析
    let competitiveAnalysis = null;
    if (companySize) {
      competitiveAnalysis = analyzeCompetitiveness(
        companySize,
        analysisData.industryAnalysis
      );
    }

    // 申請書用テキストの生成
    const applicationText = estatService.formatForApplication(analysisData);

    res.json({
      success: true,
      data: {
        rawData: analysisData,
        competitiveAnalysis,
        applicationText,
        insights: generateInsights(analysisData, companySize)
      }
    });
  } catch (error: any) {
    // e-Stat APIが利用できない場合はモックデータを返す
    if (process.env.NODE_ENV === 'development') {
      res.json({
        success: true,
        data: getMockMarketAnalysis(industryCode, prefectureCode),
        message: 'デモデータを表示しています'
      });
    } else {
      throw error;
    }
  }
}));

/**
 * 業界平均データの取得
 */
router.get('/industry/:industryCode', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { industryCode } = req.params;
  const { year } = req.query;

  const industryData = await estatService.getIndustryAverages(
    industryCode,
    year as string
  );

  res.json({
    success: true,
    data: industryData
  });
}));

/**
 * 地域経済指標の取得
 */
router.get('/region/:prefectureCode', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { prefectureCode } = req.params;

  const regionalData = await estatService.getRegionalEconomicIndex(prefectureCode);

  res.json({
    success: true,
    data: regionalData
  });
}));

/**
 * 市場規模検索
 */
router.get('/market-size', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { keyword } = req.query;

  if (!keyword) {
    throw new ValidationError('検索キーワードを指定してください');
  }

  const marketData = await estatService.getMarketSize(keyword as string);

  res.json({
    success: true,
    data: marketData
  });
}));

/**
 * 統計データ検索（汎用）
 */
router.get('/search', conditionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const searchResult = await estatService.searchStatistics({
    searchWord: req.query.q as string,
    limit: 20
  });

  res.json({
    success: true,
    data: searchResult
  });
}));

// ヘルパー関数

function analyzeCompetitiveness(companySize: any, industryAverage: any) {
  const salesRatio = companySize.sales / industryAverage.averageSales;
  const employeeRatio = companySize.employees / industryAverage.averageEmployees;

  let position = '';
  if (salesRatio > 2) {
    position = '業界リーダー';
  } else if (salesRatio > 1) {
    position = '業界平均以上';
  } else if (salesRatio > 0.5) {
    position = '業界平均並み';
  } else {
    position = '成長企業';
  }

  return {
    position,
    salesRatio: (salesRatio * 100).toFixed(1),
    employeeRatio: (employeeRatio * 100).toFixed(1),
    productivityIndex: ((companySize.sales / companySize.employees) / 
                       (industryAverage.averageSales / industryAverage.averageEmployees) * 100).toFixed(1),
    recommendation: generateRecommendation(salesRatio, industryAverage.growthRate)
  };
}

function generateRecommendation(salesRatio: number, industryGrowthRate: number): string {
  if (industryGrowthRate > 5 && salesRatio < 1) {
    return '高成長市場での事業拡大が急務です。設備投資や人材確保により、市場成長を取り込む体制構築が必要です。';
  } else if (salesRatio > 1.5) {
    return '業界トップクラスの実績を活かし、新市場開拓や高付加価値化により、さらなる成長を目指すことが可能です。';
  } else {
    return '着実な成長戦略により、業界内でのポジション向上を図ることが重要です。';
  }
}

function generateInsights(analysisData: any, companySize: any): string[] {
  const insights = [];
  
  // 市場成長性
  if (analysisData.industryAnalysis.growthRate > 3) {
    insights.push(`業界は年率${analysisData.industryAnalysis.growthRate}%で成長しており、事業拡大の好機です。`);
  }
  
  // 地域経済
  if (analysisData.regionalData.unemploymentRate > 3) {
    insights.push(`地域の失業率が${analysisData.regionalData.unemploymentRate}%と高く、雇用創出による地域貢献が期待されます。`);
  }
  
  // 市場規模
  if (analysisData.marketAnalysis.length > 0) {
    const totalMarketSize = analysisData.marketAnalysis.reduce(
      (sum: number, m: any) => sum + m.marketSize.size, 0
    );
    insights.push(`関連市場の合計規模は${(totalMarketSize / 100000000).toFixed(0)}億円に達しています。`);
  }
  
  return insights;
}

function getMockMarketAnalysis(industryCode: string, prefectureCode: string) {
  return {
    rawData: {
      industryAnalysis: {
        industryCode,
        industryName: '製造業',
        averageSales: 500000000,
        averageProfit: 25000000,
        averageEmployees: 50,
        growthRate: 3.5,
        year: '2024'
      },
      regionalData: {
        prefectureCode,
        prefectureName: '東京都',
        gdp: 100000000000000,
        populationGrowthRate: 0.5,
        unemploymentRate: 2.5,
        averageIncome: 5000000,
        year: '2024'
      },
      marketAnalysis: [
        {
          keyword: 'DX',
          marketSize: {
            size: 300000000000,
            growthRate: 15.2,
            year: '2024'
          }
        }
      ],
      competitivePosition: '成長市場での差別化戦略が重要'
    },
    applicationText: `
【市場環境分析（デモデータ）】
製造業の市場は安定成長を続けており、デジタル化による生産性向上が業界全体のトレンドとなっています。

【地域経済への貢献】
東京都の経済規模を考慮すると、当社の事業拡大は地域経済の活性化に寄与します。

【市場機会】
DX関連市場は年率15%以上の高成長を続けており、大きなビジネスチャンスが存在します。
    `.trim(),
    insights: [
      'デモデータを使用した分析結果です',
      '実際のe-Stat APIキーを設定することで、リアルな統計データを取得できます',
      '政府統計データにより、申請書の説得力が大幅に向上します'
    ]
  };
}

export default router;