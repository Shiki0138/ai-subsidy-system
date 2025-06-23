import axios from 'axios';
import { Redis } from 'ioredis';

/**
 * e-Stat（政府統計）API連携サービス
 * 
 * 主な機能:
 * - 統計データの検索
 * - 統計表の取得
 * - 業界平均データの分析
 * - 地域経済指標の取得
 */

interface EstatConfig {
  apiKey: string;
  baseUrl: string;
}

interface StatisticsSearchParams {
  searchWord?: string;          // 検索キーワード
  statsCode?: string;          // 統計表ID
  surveyYears?: string;        // 調査年（YYYY形式）
  openYears?: string;          // 公開年
  statsField?: string;         // 統計分野（02:人口・世帯、03:労働・賃金等）
  statsNameList?: 'Y' | 'N';   // 統計調査名一覧
  limit?: number;              // 取得件数上限
  startPosition?: number;      // 取得開始位置
}

interface StatisticsData {
  id: string;
  title: string;
  surveyDate: string;
  organization: string;
  statistics: any[];
}

interface IndustryAverage {
  industryCode: string;
  industryName: string;
  averageSales: number;
  averageProfit: number;
  averageEmployees: number;
  growthRate: number;
  year: string;
}

interface RegionalEconomicIndex {
  prefectureCode: string;
  prefectureName: string;
  gdp: number;
  populationGrowthRate: number;
  unemploymentRate: number;
  averageIncome: number;
  year: string;
}

export class EstatService {
  private config: EstatConfig;
  private redis: Redis;
  private cacheExpiry = 86400; // 24時間

  constructor(apiKey: string, redis: Redis) {
    this.config = {
      apiKey,
      baseUrl: 'https://api.e-stat.go.jp/rest/3.0/app/'
    };
    this.redis = redis;
  }

  /**
   * 統計データを検索
   */
  async searchStatistics(params: StatisticsSearchParams): Promise<any> {
    const cacheKey = `estat:search:${JSON.stringify(params)}`;
    
    // キャッシュチェック
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await axios.get(`${this.config.baseUrl}json/getStatsList`, {
        params: {
          appId: this.config.apiKey,
          ...params
        }
      });

      const result = response.data;
      
      // キャッシュに保存
      await this.redis.setex(cacheKey, this.cacheExpiry, JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('e-Stat API検索エラー:', error);
      throw new Error('統計データの検索に失敗しました');
    }
  }

  /**
   * 統計表データを取得
   */
  async getStatsData(statsDataId: string): Promise<any> {
    const cacheKey = `estat:data:${statsDataId}`;
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await axios.get(`${this.config.baseUrl}json/getStatsData`, {
        params: {
          appId: this.config.apiKey,
          statsDataId: statsDataId,
          metaGetFlg: 'Y',
          cntGetFlg: 'N'
        }
      });

      const result = response.data;
      
      // より長期間キャッシュ（統計データは頻繁に変わらない）
      await this.redis.setex(cacheKey, this.cacheExpiry * 7, JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('e-Stat APIデータ取得エラー:', error);
      throw new Error('統計データの取得に失敗しました');
    }
  }

  /**
   * 業界平均データを取得
   */
  async getIndustryAverages(industryCode: string, year?: string): Promise<IndustryAverage> {
    // 経済センサスや工業統計調査から業界データを取得
    const searchParams: StatisticsSearchParams = {
      searchWord: '工業統計 売上高 従業者数',
      surveyYears: year || new Date().getFullYear().toString(),
      statsField: '06' // 企業・家計・経済
    };

    const searchResult = await this.searchStatistics(searchParams);
    
    // 実際のデータ解析ロジック（簡略化）
    // TODO: 実際の統計表構造に合わせて解析ロジックを実装
    
    return {
      industryCode,
      industryName: this.getIndustryName(industryCode),
      averageSales: 500000000, // 5億円（仮の値）
      averageProfit: 25000000, // 2500万円（仮の値）
      averageEmployees: 50,
      growthRate: 3.5, // 3.5%成長
      year: year || new Date().getFullYear().toString()
    };
  }

  /**
   * 地域経済指標を取得
   */
  async getRegionalEconomicIndex(prefectureCode: string): Promise<RegionalEconomicIndex> {
    const searchParams: StatisticsSearchParams = {
      searchWord: '県民経済計算 GDP 失業率',
      statsField: '03', // 労働・賃金
      limit: 10
    };

    const searchResult = await this.searchStatistics(searchParams);
    
    // 実際のデータ解析ロジック（簡略化）
    // TODO: 実際の統計表構造に合わせて解析ロジックを実装
    
    return {
      prefectureCode,
      prefectureName: this.getPrefectureName(prefectureCode),
      gdp: 5000000000000, // 5兆円（仮の値）
      populationGrowthRate: -0.5,
      unemploymentRate: 2.8,
      averageIncome: 4500000, // 450万円
      year: new Date().getFullYear().toString()
    };
  }

  /**
   * 市場規模データを取得
   */
  async getMarketSize(keyword: string): Promise<{size: number, growthRate: number, year: string}> {
    const searchParams: StatisticsSearchParams = {
      searchWord: `${keyword} 市場規模 売上高`,
      statsField: '06',
      limit: 5
    };

    const searchResult = await this.searchStatistics(searchParams);
    
    // 市場規模の推計ロジック
    // TODO: 実際のデータから市場規模を計算
    
    return {
      size: 100000000000, // 1000億円市場（仮の値）
      growthRate: 5.2, // 年率5.2%成長
      year: new Date().getFullYear().toString()
    };
  }

  /**
   * 申請書用の統計データサマリーを生成
   */
  async generateStatisticsSummary(companyInfo: {
    industryCode: string;
    prefectureCode: string;
    businessKeywords: string[];
  }): Promise<{
    industryAnalysis: IndustryAverage;
    regionalData: RegionalEconomicIndex;
    marketAnalysis: Array<{keyword: string; marketSize: any}>;
    competitivePosition: string;
  }> {
    // 並列でデータ取得
    const [industryData, regionalData, marketDataPromises] = await Promise.all([
      this.getIndustryAverages(companyInfo.industryCode),
      this.getRegionalEconomicIndex(companyInfo.prefectureCode),
      Promise.all(
        companyInfo.businessKeywords.map(keyword => 
          this.getMarketSize(keyword).then(data => ({ keyword, marketSize: data }))
        )
      )
    ]);

    // 競争力分析
    const competitivePosition = this.analyzeCompetitivePosition(industryData);

    return {
      industryAnalysis: industryData,
      regionalData: regionalData,
      marketAnalysis: await Promise.all(marketDataPromises),
      competitivePosition
    };
  }

  /**
   * 統計データを申請書用のテキストに変換
   */
  formatForApplication(data: any): string {
    const { industryAnalysis, regionalData, marketAnalysis } = data;
    
    return `
【市場環境分析】
当社が属する${industryAnalysis.industryName}の市場規模は、平均売上高${(industryAnalysis.averageSales / 100000000).toFixed(1)}億円、
年間成長率${industryAnalysis.growthRate}%で推移しています。

【地域経済への貢献】
${regionalData.prefectureName}のGDPは${(regionalData.gdp / 1000000000000).toFixed(1)}兆円、
失業率${regionalData.unemploymentRate}%であり、当社の事業拡大は地域雇用の創出に貢献します。

【市場機会】
${marketAnalysis.map(m => `${m.keyword}市場は${(m.marketSize.size / 100000000).toFixed(0)}億円規模で、年率${m.marketSize.growthRate}%の成長`).join('、')}が見込まれています。
    `.trim();
  }

  // ヘルパーメソッド
  private getIndustryName(code: string): string {
    // 業種コードから業種名を返す（簡略化）
    const industries: Record<string, string> = {
      '01': '農業',
      '05': '鉱業',
      '09': '食料品製造業',
      '14': '繊維工業',
      // ... 実際にはより詳細なマッピング
    };
    return industries[code] || '製造業';
  }

  private getPrefectureName(code: string): string {
    // 都道府県コードから名前を返す（簡略化）
    const prefectures: Record<string, string> = {
      '01': '北海道',
      '13': '東京都',
      '27': '大阪府',
      // ... 全都道府県
    };
    return prefectures[code] || '東京都';
  }

  private analyzeCompetitivePosition(industryData: IndustryAverage): string {
    // 競争力を分析（簡略化）
    if (industryData.growthRate > 5) {
      return '高成長市場でのポジション確立が重要';
    } else if (industryData.growthRate > 0) {
      return '安定成長市場での差別化戦略が必要';
    } else {
      return '成熟市場での新規事業展開が求められる';
    }
  }
}

export default EstatService;