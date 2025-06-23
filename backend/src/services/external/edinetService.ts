/**
 * EDINET API Service
 * 金融庁EDINETから有価証券報告書等の財務情報を取得
 * 
 * API仕様: https://disclosure.edinet-fsa.go.jp/
 */

import axios from 'axios';
import winston from 'winston';
import { Redis } from 'ioredis';
import * as cheerio from 'cheerio';

interface EDINETDocument {
  seqNumber: number;
  docID: string;
  edinetCode: string;
  secCode?: string;
  JCN?: string; // 法人番号
  filerName: string;
  fundCode?: string;
  ordinanceCode: string;
  formCode: string;
  docTypeCode: string;
  periodStart?: string;
  periodEnd?: string;
  submitDateTime: string;
  docDescription?: string;
  issuerEdinetCode?: string;
  subjectEdinetCode?: string;
  subsidiaryEdinetCode?: string;
  currentReportReason?: string;
  parentDocID?: string;
  opeDateTime?: string;
  withdrawalStatus: string;
  docInfoEditStatus: string;
  disclosureStatus: string;
  xbrlFlag: string;
  pdfFlag: string;
  attachDocFlag: string;
  englishDocFlag: string;
}

interface FinancialData {
  // 基本情報
  companyName: string;
  fiscalYear: string;
  periodStart: string;
  periodEnd: string;
  
  // 損益計算書項目
  revenue?: number; // 売上高
  operatingProfit?: number; // 営業利益
  ordinaryProfit?: number; // 経常利益
  netProfit?: number; // 当期純利益
  
  // 貸借対照表項目
  totalAssets?: number; // 総資産
  netAssets?: number; // 純資産
  capitalStock?: number; // 資本金
  retainedEarnings?: number; // 利益剰余金
  
  // キャッシュフロー
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  cashAndEquivalents?: number;
  
  // 財務指標
  roe?: number; // 自己資本利益率
  roa?: number; // 総資産利益率
  equityRatio?: number; // 自己資本比率
  currentRatio?: number; // 流動比率
  debtEquityRatio?: number; // 負債資本倍率
  
  // その他
  employeeCount?: number;
  averageSalary?: number;
}

interface FinancialAnalysis {
  company: string;
  latestFinancialData: FinancialData;
  historicalData: FinancialData[];
  performanceAnalysis: {
    revenueGrowthRate?: number;
    profitGrowthRate?: number;
    profitMargin?: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  financialHealth: {
    score: number; // 0-100
    rating: 'excellent' | 'good' | 'fair' | 'poor';
    strengths: string[];
    concerns: string[];
  };
  industryComparison?: {
    revenueRank?: number;
    profitabilityRank?: number;
    totalCompanies?: number;
  };
}

export class EDINETService {
  private readonly baseUrl = 'https://disclosure.edinet-fsa.go.jp/api/v2';
  private logger: winston.Logger;
  private redis: Redis | null;
  private cachePrefix = 'edinet:';
  private cacheTTL = 86400; // 24時間
  
  constructor(logger: winston.Logger, redis?: Redis) {
    this.logger = logger;
    this.redis = redis || null;
  }

  /**
   * 企業の財務分析サマリーを取得
   */
  async getFinancialAnalysis(companyName: string, edinetCode?: string): Promise<FinancialAnalysis> {
    const cacheKey = `${this.cachePrefix}analysis:${companyName}:${edinetCode || 'latest'}`;
    
    // キャッシュチェック
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      // EDINETコードが指定されていない場合は企業名で検索
      let targetEdinetCode = edinetCode;
      if (!targetEdinetCode) {
        const searchResults = await this.searchCompany(companyName);
        if (searchResults.length > 0) {
          targetEdinetCode = searchResults[0].edinetCode;
        }
      }
      
      if (!targetEdinetCode) {
        return this.getEmptyAnalysis(companyName);
      }
      
      // 最新の有価証券報告書を取得
      const latestDocuments = await this.getLatestDocuments(targetEdinetCode);
      const financialReports = latestDocuments.filter(doc => 
        doc.formCode === '030000' || // 有価証券報告書
        doc.formCode === '043000'    // 四半期報告書
      );
      
      if (financialReports.length === 0) {
        return this.getEmptyAnalysis(companyName);
      }
      
      // 財務データを抽出
      const financialDataList: FinancialData[] = [];
      for (const report of financialReports.slice(0, 5)) { // 最新5期分
        const financialData = await this.extractFinancialData(report.docID);
        if (financialData) {
          financialDataList.push(financialData);
        }
      }
      
      if (financialDataList.length === 0) {
        return this.getEmptyAnalysis(companyName);
      }
      
      // 分析を実行
      const analysis = this.analyzeFinancialData(companyName, financialDataList);
      
      // キャッシュ保存
      if (this.redis) {
        await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(analysis));
      }
      
      return analysis;
      
    } catch (error: any) {
      this.logger.error('Failed to get financial analysis', {
        company: companyName,
        error: error.message
      });
      return this.getEmptyAnalysis(companyName);
    }
  }

  /**
   * 企業名でEDINET登録企業を検索
   */
  async searchCompany(companyName: string): Promise<Array<{
    edinetCode: string;
    companyName: string;
    secCode?: string;
  }>> {
    try {
      // 実際の実装では、EDINET APIの検索機能を使用
      // ここではモックデータを返す
      return this.getMockSearchResults(companyName);
    } catch (error: any) {
      this.logger.error('Company search failed', {
        companyName,
        error: error.message
      });
      return [];
    }
  }

  /**
   * 指定したEDINETコードの最新書類一覧を取得
   */
  async getLatestDocuments(edinetCode: string, limit: number = 10): Promise<EDINETDocument[]> {
    const cacheKey = `${this.cachePrefix}documents:${edinetCode}`;
    
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      // 日付範囲を設定（過去3年分）
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 3);
      
      const params = {
        date: this.formatDate(endDate),
        type: 2 // メタデータのみ
      };
      
      // 実際の実装では、複数日にわたって検索する必要がある
      // ここではモックデータを返す
      const documents = this.getMockDocuments(edinetCode);
      
      if (this.redis) {
        await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(documents));
      }
      
      return documents.slice(0, limit);
      
    } catch (error: any) {
      this.logger.error('Failed to get documents', {
        edinetCode,
        error: error.message
      });
      return [];
    }
  }

  /**
   * 書類IDから財務データを抽出
   */
  async extractFinancialData(docID: string): Promise<FinancialData | null> {
    try {
      // 実際の実装では、XBRLデータをダウンロードして解析
      // ここではモックデータを返す
      return this.getMockFinancialData(docID);
    } catch (error: any) {
      this.logger.error('Failed to extract financial data', {
        docID,
        error: error.message
      });
      return null;
    }
  }

  /**
   * 財務データの分析
   */
  private analyzeFinancialData(companyName: string, financialDataList: FinancialData[]): FinancialAnalysis {
    const latestData = financialDataList[0];
    const previousData = financialDataList[1];
    
    // パフォーマンス分析
    let revenueGrowthRate: number | undefined;
    let profitGrowthRate: number | undefined;
    let profitMargin: number | undefined;
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    
    if (latestData.revenue && previousData?.revenue) {
      revenueGrowthRate = ((latestData.revenue - previousData.revenue) / previousData.revenue) * 100;
    }
    
    if (latestData.netProfit && previousData?.netProfit) {
      profitGrowthRate = ((latestData.netProfit - previousData.netProfit) / previousData.netProfit) * 100;
    }
    
    if (latestData.netProfit && latestData.revenue) {
      profitMargin = (latestData.netProfit / latestData.revenue) * 100;
    }
    
    // トレンド判定
    if (revenueGrowthRate && profitGrowthRate) {
      if (revenueGrowthRate > 5 && profitGrowthRate > 5) {
        trend = 'improving';
      } else if (revenueGrowthRate < -5 || profitGrowthRate < -5) {
        trend = 'declining';
      }
    }
    
    // 財務健全性評価
    const healthScore = this.calculateFinancialHealthScore(latestData);
    const { rating, strengths, concerns } = this.evaluateFinancialHealth(latestData, healthScore);
    
    return {
      company: companyName,
      latestFinancialData: latestData,
      historicalData: financialDataList,
      performanceAnalysis: {
        revenueGrowthRate,
        profitGrowthRate,
        profitMargin,
        trend
      },
      financialHealth: {
        score: healthScore,
        rating,
        strengths,
        concerns
      }
    };
  }

  /**
   * 財務健全性スコアの計算
   */
  private calculateFinancialHealthScore(data: FinancialData): number {
    let score = 50; // 基準点
    
    // 収益性評価（最大20点）
    if (data.roe) {
      if (data.roe > 15) score += 20;
      else if (data.roe > 10) score += 15;
      else if (data.roe > 5) score += 10;
      else if (data.roe > 0) score += 5;
    }
    
    // 安全性評価（最大20点）
    if (data.equityRatio) {
      if (data.equityRatio > 50) score += 20;
      else if (data.equityRatio > 40) score += 15;
      else if (data.equityRatio > 30) score += 10;
      else if (data.equityRatio > 20) score += 5;
    }
    
    // 流動性評価（最大10点）
    if (data.currentRatio) {
      if (data.currentRatio > 200) score += 10;
      else if (data.currentRatio > 150) score += 7;
      else if (data.currentRatio > 100) score += 5;
    }
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * 財務健全性の評価
   */
  private evaluateFinancialHealth(data: FinancialData, score: number): {
    rating: 'excellent' | 'good' | 'fair' | 'poor';
    strengths: string[];
    concerns: string[];
  } {
    let rating: 'excellent' | 'good' | 'fair' | 'poor';
    const strengths: string[] = [];
    const concerns: string[] = [];
    
    // レーティング判定
    if (score >= 80) rating = 'excellent';
    else if (score >= 60) rating = 'good';
    else if (score >= 40) rating = 'fair';
    else rating = 'poor';
    
    // 強みの特定
    if (data.roe && data.roe > 10) {
      strengths.push(`高いROE（${data.roe.toFixed(1)}%）による優れた収益性`);
    }
    if (data.equityRatio && data.equityRatio > 40) {
      strengths.push(`健全な自己資本比率（${data.equityRatio.toFixed(1)}%）`);
    }
    if (data.operatingCashFlow && data.operatingCashFlow > 0) {
      strengths.push('安定した営業キャッシュフロー');
    }
    if (data.revenue && data.netProfit && (data.netProfit / data.revenue) > 0.05) {
      strengths.push('高い利益率を維持');
    }
    
    // 懸念事項の特定
    if (data.equityRatio && data.equityRatio < 30) {
      concerns.push('自己資本比率が低く、財務レバレッジが高い');
    }
    if (data.currentRatio && data.currentRatio < 100) {
      concerns.push('流動比率が低く、短期的な支払能力に懸念');
    }
    if (data.debtEquityRatio && data.debtEquityRatio > 2) {
      concerns.push('負債依存度が高い');
    }
    if (data.operatingCashFlow && data.operatingCashFlow < 0) {
      concerns.push('営業キャッシュフローがマイナス');
    }
    
    return { rating, strengths, concerns };
  }

  /**
   * 申請書用の財務健全性テキスト生成
   */
  async generateFinancialStrengthText(analysis: FinancialAnalysis, subsidyType?: string): Promise<string> {
    const parts: string[] = [];
    const latest = analysis.latestFinancialData;
    
    parts.push('【財務状況】');
    
    // 基本的な財務情報
    if (latest.revenue) {
      parts.push(
        `${latest.fiscalYear}度の売上高は${this.formatAmount(latest.revenue)}であり、` +
        (analysis.performanceAnalysis.revenueGrowthRate && analysis.performanceAnalysis.revenueGrowthRate > 0
          ? `前年比${analysis.performanceAnalysis.revenueGrowthRate.toFixed(1)}%の成長を達成しています。`
          : '安定した事業基盤を維持しています。')
      );
    }
    
    // 収益性
    if (latest.netProfit && analysis.performanceAnalysis.profitMargin) {
      parts.push(
        `営業利益率${analysis.performanceAnalysis.profitMargin.toFixed(1)}%を確保し、` +
        '健全な収益構造を構築しています。'
      );
    }
    
    // 財務健全性
    parts.push('\n【財務健全性】');
    if (analysis.financialHealth.rating === 'excellent' || analysis.financialHealth.rating === 'good') {
      parts.push(
        `財務健全性評価は「${this.translateRating(analysis.financialHealth.rating)}」であり、` +
        '補助事業の実施に十分な財務基盤を有しています。'
      );
    }
    
    // 強みを強調
    if (analysis.financialHealth.strengths.length > 0) {
      parts.push('\n【財務面の強み】');
      analysis.financialHealth.strengths.slice(0, 3).forEach(strength => {
        parts.push(`・${strength}`);
      });
    }
    
    // 補助金タイプ別の追加文言
    if (subsidyType) {
      parts.push('\n【補助事業の実現可能性】');
      if (latest.cashAndEquivalents && latest.cashAndEquivalents > 0) {
        parts.push(
          `現預金${this.formatAmount(latest.cashAndEquivalents)}を保有し、` +
          '補助事業の自己負担分の支払い能力を十分に有しています。'
        );
      }
    }
    
    return parts.join('\n');
  }

  /**
   * 日付フォーマット
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 金額フォーマット
   */
  private formatAmount(amount: number): string {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}億円`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)}百万円`;
    } else {
      return `${amount.toLocaleString()}円`;
    }
  }

  /**
   * レーティングの日本語化
   */
  private translateRating(rating: string): string {
    const translations: Record<string, string> = {
      'excellent': '非常に良好',
      'good': '良好',
      'fair': '標準的',
      'poor': '要改善'
    };
    return translations[rating] || rating;
  }

  /**
   * 空の分析結果を生成
   */
  private getEmptyAnalysis(companyName: string): FinancialAnalysis {
    return {
      company: companyName,
      latestFinancialData: {
        companyName,
        fiscalYear: '',
        periodStart: '',
        periodEnd: ''
      },
      historicalData: [],
      performanceAnalysis: {
        trend: 'stable'
      },
      financialHealth: {
        score: 0,
        rating: 'fair',
        strengths: [],
        concerns: ['財務データが取得できませんでした']
      }
    };
  }

  /**
   * モック検索結果の生成（開発・テスト用）
   */
  private getMockSearchResults(companyName: string): Array<{
    edinetCode: string;
    companyName: string;
    secCode?: string;
  }> {
    // 実際のEDINETコードの例
    const mockCompanies = [
      { edinetCode: 'E00001', companyName: 'トヨタ自動車株式会社', secCode: '7203' },
      { edinetCode: 'E00002', companyName: 'ソニーグループ株式会社', secCode: '6758' },
      { edinetCode: 'E00003', companyName: '任天堂株式会社', secCode: '7974' },
      { edinetCode: 'E00004', companyName: '株式会社ファーストリテイリング', secCode: '9983' },
      { edinetCode: 'E00005', companyName: 'ソフトバンクグループ株式会社', secCode: '9984' }
    ];
    
    // 部分一致検索
    return mockCompanies.filter(company => 
      company.companyName.includes(companyName)
    ).slice(0, 3);
  }

  /**
   * モック書類データの生成
   */
  private getMockDocuments(edinetCode: string): EDINETDocument[] {
    const documents: EDINETDocument[] = [];
    const now = new Date();
    
    for (let i = 0; i < 5; i++) {
      const year = now.getFullYear() - i;
      documents.push({
        seqNumber: i + 1,
        docID: `S100${String(10000 + i).padStart(5, '0')}`,
        edinetCode: edinetCode,
        filerName: 'テスト株式会社',
        ordinanceCode: '010',
        formCode: '030000', // 有価証券報告書
        docTypeCode: '120',
        periodStart: `${year - 1}-04-01`,
        periodEnd: `${year}-03-31`,
        submitDateTime: `${year}-06-30 10:00`,
        withdrawalStatus: '0',
        docInfoEditStatus: '0',
        disclosureStatus: '0',
        xbrlFlag: '1',
        pdfFlag: '1',
        attachDocFlag: '1',
        englishDocFlag: '0'
      });
    }
    
    return documents;
  }

  /**
   * モック財務データの生成
   */
  private getMockFinancialData(docID: string): FinancialData {
    const baseYear = 2024 - parseInt(docID.slice(-1));
    const random = (min: number, max: number) => Math.random() * (max - min) + min;
    
    const revenue = random(50000, 200000) * 1000000; // 500億〜2000億
    const operatingProfit = revenue * random(0.05, 0.15);
    const netProfit = operatingProfit * random(0.6, 0.9);
    const totalAssets = revenue * random(1.2, 2.5);
    const netAssets = totalAssets * random(0.3, 0.7);
    
    return {
      companyName: 'テスト株式会社',
      fiscalYear: `${baseYear}年3月期`,
      periodStart: `${baseYear - 1}-04-01`,
      periodEnd: `${baseYear}-03-31`,
      revenue: Math.round(revenue),
      operatingProfit: Math.round(operatingProfit),
      ordinaryProfit: Math.round(operatingProfit * 0.95),
      netProfit: Math.round(netProfit),
      totalAssets: Math.round(totalAssets),
      netAssets: Math.round(netAssets),
      capitalStock: 10000000000, // 100億円
      retainedEarnings: Math.round(netAssets * 0.6),
      operatingCashFlow: Math.round(operatingProfit * random(0.8, 1.2)),
      investingCashFlow: -Math.round(revenue * random(0.05, 0.15)),
      financingCashFlow: -Math.round(revenue * random(0.02, 0.08)),
      cashAndEquivalents: Math.round(totalAssets * random(0.1, 0.3)),
      roe: (netProfit / netAssets) * 100,
      roa: (netProfit / totalAssets) * 100,
      equityRatio: (netAssets / totalAssets) * 100,
      currentRatio: random(120, 250),
      debtEquityRatio: (totalAssets - netAssets) / netAssets,
      employeeCount: Math.round(random(1000, 10000)),
      averageSalary: Math.round(random(5000000, 8000000))
    };
  }
}

export default EDINETService;