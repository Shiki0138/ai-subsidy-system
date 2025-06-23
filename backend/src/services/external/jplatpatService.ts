/**
 * J-PlatPat (Japan Platform for Patent Information) Service
 * 特許・商標・意匠情報取得サービス
 * 
 * 注意: J-PlatPatは直接的なAPIを提供していないため、
 * スクレイピングベースの実装となります
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import winston from 'winston';
import { Redis } from 'ioredis';

interface PatentSearchParams {
  keyword?: string;
  applicant?: string;
  classification?: string;
  applicationDateFrom?: string;
  applicationDateTo?: string;
  maxResults?: number;
}

interface PatentInfo {
  applicationNumber: string;
  publicationNumber?: string;
  title: string;
  applicant: string;
  applicationDate: string;
  publicationDate?: string;
  abstract?: string;
  classification?: string[];
  status?: 'pending' | 'granted' | 'rejected' | 'expired';
  inventors?: string[];
  claims?: string;
  drawings?: number;
}

interface TrademarkInfo {
  applicationNumber: string;
  registrationNumber?: string;
  name: string;
  applicant: string;
  applicationDate: string;
  registrationDate?: string;
  classes: string[];
  status?: 'pending' | 'registered' | 'expired' | 'cancelled';
  imageUrl?: string;
}

interface DesignInfo {
  applicationNumber: string;
  registrationNumber?: string;
  title: string;
  applicant: string;
  applicationDate: string;
  registrationDate?: string;
  classification?: string;
  status?: 'pending' | 'registered' | 'expired';
  imageUrls?: string[];
}

interface IntellectualPropertySummary {
  company: string;
  patents: {
    total: number;
    granted: number;
    pending: number;
    recentApplications: PatentInfo[];
  };
  trademarks: {
    total: number;
    registered: number;
    pending: number;
    recentApplications: TrademarkInfo[];
  };
  designs: {
    total: number;
    registered: number;
    pending: number;
    recentApplications: DesignInfo[];
  };
  technologyAreas: Array<{
    area: string;
    count: number;
    percentage: number;
  }>;
  innovationScore: {
    score: number; // 0-100
    factors: {
      patentCount: number;
      recentActivity: number;
      diversification: number;
      grantRate: number;
    };
  };
}

export class JplatpatService {
  private logger: winston.Logger;
  private redis: Redis | null;
  private cachePrefix = 'jplatpat:';
  private cacheTTL = 86400; // 24時間
  
  // J-PlatPatのURL（実際のスクレイピング実装では正確なURLが必要）
  private readonly baseUrl = 'https://www.j-platpat.inpit.go.jp';
  
  constructor(logger: winston.Logger, redis?: Redis) {
    this.logger = logger;
    this.redis = redis || null;
  }

  /**
   * 企業の知的財産サマリーを取得
   */
  async getIntellectualPropertySummary(companyName: string): Promise<IntellectualPropertySummary> {
    const cacheKey = `${this.cachePrefix}summary:${companyName}`;
    
    // キャッシュチェック
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      // 特許情報の検索
      const patents = await this.searchPatents({ 
        applicant: companyName,
        maxResults: 100 
      });
      
      // 商標情報の検索
      const trademarks = await this.searchTrademarks({
        applicant: companyName,
        maxResults: 50
      });
      
      // 意匠情報の検索
      const designs = await this.searchDesigns({
        applicant: companyName,
        maxResults: 50
      });
      
      // 技術分野の分析
      const technologyAreas = this.analyzeTechnologyAreas(patents);
      
      // イノベーションスコアの計算
      const innovationScore = this.calculateInnovationScore(patents, trademarks, designs);
      
      const summary: IntellectualPropertySummary = {
        company: companyName,
        patents: {
          total: patents.length,
          granted: patents.filter(p => p.status === 'granted').length,
          pending: patents.filter(p => p.status === 'pending').length,
          recentApplications: patents.slice(0, 5)
        },
        trademarks: {
          total: trademarks.length,
          registered: trademarks.filter(t => t.status === 'registered').length,
          pending: trademarks.filter(t => t.status === 'pending').length,
          recentApplications: trademarks.slice(0, 5)
        },
        designs: {
          total: designs.length,
          registered: designs.filter(d => d.status === 'registered').length,
          pending: designs.filter(d => d.status === 'pending').length,
          recentApplications: designs.slice(0, 5)
        },
        technologyAreas,
        innovationScore
      };
      
      // キャッシュ保存
      if (this.redis) {
        await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(summary));
      }
      
      return summary;
      
    } catch (error: any) {
      this.logger.error('Failed to get intellectual property summary', {
        company: companyName,
        error: error.message
      });
      
      // エラー時のデフォルト値
      return this.getEmptySummary(companyName);
    }
  }

  /**
   * 特許検索
   */
  async searchPatents(params: PatentSearchParams): Promise<PatentInfo[]> {
    const cacheKey = `${this.cachePrefix}patents:${JSON.stringify(params)}`;
    
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      // 実際の実装では、J-PlatPatのウェブインターフェースをスクレイピング
      // または、特許庁のバルクデータを利用
      
      // モックデータを返す（実装例）
      const mockPatents: PatentInfo[] = this.generateMockPatents(params);
      
      if (this.redis) {
        await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(mockPatents));
      }
      
      return mockPatents;
      
    } catch (error: any) {
      this.logger.error('Patent search failed', {
        params,
        error: error.message
      });
      return [];
    }
  }

  /**
   * 商標検索
   */
  async searchTrademarks(params: { applicant: string; maxResults?: number }): Promise<TrademarkInfo[]> {
    const cacheKey = `${this.cachePrefix}trademarks:${JSON.stringify(params)}`;
    
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      // モックデータを返す（実装例）
      const mockTrademarks: TrademarkInfo[] = this.generateMockTrademarks(params);
      
      if (this.redis) {
        await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(mockTrademarks));
      }
      
      return mockTrademarks;
      
    } catch (error: any) {
      this.logger.error('Trademark search failed', {
        params,
        error: error.message
      });
      return [];
    }
  }

  /**
   * 意匠検索
   */
  async searchDesigns(params: { applicant: string; maxResults?: number }): Promise<DesignInfo[]> {
    const cacheKey = `${this.cachePrefix}designs:${JSON.stringify(params)}`;
    
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      // モックデータを返す（実装例）
      const mockDesigns: DesignInfo[] = this.generateMockDesigns(params);
      
      if (this.redis) {
        await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(mockDesigns));
      }
      
      return mockDesigns;
      
    } catch (error: any) {
      this.logger.error('Design search failed', {
        params,
        error: error.message
      });
      return [];
    }
  }

  /**
   * 競合他社との知的財産比較
   */
  async compareWithCompetitors(
    targetCompany: string, 
    competitors: string[]
  ): Promise<{
    target: IntellectualPropertySummary;
    competitors: IntellectualPropertySummary[];
    analysis: {
      relativeStrength: 'strong' | 'average' | 'weak';
      advantages: string[];
      recommendations: string[];
    };
  }> {
    const target = await this.getIntellectualPropertySummary(targetCompany);
    const competitorSummaries = await Promise.all(
      competitors.map(c => this.getIntellectualPropertySummary(c))
    );
    
    const analysis = this.analyzeCompetitivePosition(target, competitorSummaries);
    
    return {
      target,
      competitors: competitorSummaries,
      analysis
    };
  }

  /**
   * 技術分野の分析
   */
  private analyzeTechnologyAreas(patents: PatentInfo[]): Array<{
    area: string;
    count: number;
    percentage: number;
  }> {
    const areaCount = new Map<string, number>();
    
    patents.forEach(patent => {
      if (patent.classification) {
        patent.classification.forEach(cls => {
          const area = this.classificationToArea(cls);
          areaCount.set(area, (areaCount.get(area) || 0) + 1);
        });
      }
    });
    
    const total = patents.length || 1;
    const areas = Array.from(areaCount.entries())
      .map(([area, count]) => ({
        area,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
    
    return areas;
  }

  /**
   * イノベーションスコアの計算
   */
  private calculateInnovationScore(
    patents: PatentInfo[],
    trademarks: TrademarkInfo[],
    designs: DesignInfo[]
  ): {
    score: number;
    factors: {
      patentCount: number;
      recentActivity: number;
      diversification: number;
      grantRate: number;
    };
  } {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    // 特許数による評価（最大30点）
    const patentCount = Math.min(patents.length / 10 * 30, 30);
    
    // 最近の活動（最大25点）
    const recentPatents = patents.filter(p => 
      new Date(p.applicationDate) > oneYearAgo
    ).length;
    const recentActivity = Math.min(recentPatents / 5 * 25, 25);
    
    // 多様性（特許・商標・意匠のバランス）（最大25点）
    const hasPatents = patents.length > 0 ? 1 : 0;
    const hasTrademarks = trademarks.length > 0 ? 1 : 0;
    const hasDesigns = designs.length > 0 ? 1 : 0;
    const diversification = (hasPatents + hasTrademarks + hasDesigns) / 3 * 25;
    
    // 特許成立率（最大20点）
    const grantedPatents = patents.filter(p => p.status === 'granted').length;
    const totalPatents = patents.length || 1;
    const grantRate = (grantedPatents / totalPatents) * 20;
    
    const score = Math.round(patentCount + recentActivity + diversification + grantRate);
    
    return {
      score: Math.min(score, 100),
      factors: {
        patentCount: Math.round(patentCount),
        recentActivity: Math.round(recentActivity),
        diversification: Math.round(diversification),
        grantRate: Math.round(grantRate)
      }
    };
  }

  /**
   * 競合分析
   */
  private analyzeCompetitivePosition(
    target: IntellectualPropertySummary,
    competitors: IntellectualPropertySummary[]
  ): {
    relativeStrength: 'strong' | 'average' | 'weak';
    advantages: string[];
    recommendations: string[];
  } {
    const avgCompetitorScore = competitors.reduce((sum, c) => 
      sum + c.innovationScore.score, 0
    ) / (competitors.length || 1);
    
    let relativeStrength: 'strong' | 'average' | 'weak';
    if (target.innovationScore.score > avgCompetitorScore * 1.2) {
      relativeStrength = 'strong';
    } else if (target.innovationScore.score > avgCompetitorScore * 0.8) {
      relativeStrength = 'average';
    } else {
      relativeStrength = 'weak';
    }
    
    const advantages: string[] = [];
    const recommendations: string[] = [];
    
    // 特許数の比較
    const avgPatents = competitors.reduce((sum, c) => 
      sum + c.patents.total, 0
    ) / (competitors.length || 1);
    
    if (target.patents.total > avgPatents) {
      advantages.push(`特許保有数が業界平均より${Math.round((target.patents.total / avgPatents - 1) * 100)}%多い`);
    } else {
      recommendations.push('特許出願を増やし、技術的優位性を確立することを推奨');
    }
    
    // 最近の活動
    if (target.innovationScore.factors.recentActivity > 15) {
      advantages.push('直近1年間の特許出願活動が活発');
    } else {
      recommendations.push('継続的な研究開発活動による特許出願を推奨');
    }
    
    // 多様性
    if (target.innovationScore.factors.diversification > 20) {
      advantages.push('特許・商標・意匠をバランスよく保有');
    } else {
      recommendations.push('知的財産ポートフォリオの多様化を推奨');
    }
    
    return {
      relativeStrength,
      advantages,
      recommendations
    };
  }

  /**
   * 特許分類から技術分野への変換
   */
  private classificationToArea(classification: string): string {
    // IPC（国際特許分類）の上位分類から技術分野を判定
    const firstChar = classification.charAt(0);
    
    const areaMap: Record<string, string> = {
      'A': '生活必需品',
      'B': '処理操作・運輸',
      'C': '化学・冶金',
      'D': '繊維・紙',
      'E': '固定構造物',
      'F': '機械工学',
      'G': '物理学',
      'H': '電気'
    };
    
    return areaMap[firstChar] || 'その他';
  }

  /**
   * 空のサマリーを生成
   */
  private getEmptySummary(companyName: string): IntellectualPropertySummary {
    return {
      company: companyName,
      patents: {
        total: 0,
        granted: 0,
        pending: 0,
        recentApplications: []
      },
      trademarks: {
        total: 0,
        registered: 0,
        pending: 0,
        recentApplications: []
      },
      designs: {
        total: 0,
        registered: 0,
        pending: 0,
        recentApplications: []
      },
      technologyAreas: [],
      innovationScore: {
        score: 0,
        factors: {
          patentCount: 0,
          recentActivity: 0,
          diversification: 0,
          grantRate: 0
        }
      }
    };
  }

  /**
   * モック特許データの生成（開発・テスト用）
   */
  private generateMockPatents(params: PatentSearchParams): PatentInfo[] {
    const { applicant = 'テスト企業', maxResults = 10 } = params;
    const patents: PatentInfo[] = [];
    
    for (let i = 0; i < Math.min(maxResults, 10); i++) {
      const year = 2024 - Math.floor(i / 2);
      const status = i < 5 ? 'granted' : 'pending';
      
      patents.push({
        applicationNumber: `特願${year}-${String(100000 + i).padStart(6, '0')}`,
        publicationNumber: status === 'granted' ? `特許第${7000000 + i}号` : undefined,
        title: `${this.getTechArea(i)}に関する${this.getInventionType(i)}`,
        applicant: applicant,
        applicationDate: `${year}-${String((i % 12) + 1).padStart(2, '0')}-15`,
        publicationDate: status === 'granted' ? `${year + 1}-${String((i % 12) + 1).padStart(2, '0')}-15` : undefined,
        abstract: `本発明は、${this.getTechArea(i)}分野における新規な${this.getInventionType(i)}に関するものである。`,
        classification: [`${this.getIPCClass(i)}01/00`],
        status: status,
        inventors: [`発明者${i + 1}`],
        drawings: 5 + i
      });
    }
    
    return patents;
  }

  /**
   * モック商標データの生成
   */
  private generateMockTrademarks(params: { applicant: string; maxResults?: number }): TrademarkInfo[] {
    const { applicant = 'テスト企業', maxResults = 5 } = params;
    const trademarks: TrademarkInfo[] = [];
    
    for (let i = 0; i < Math.min(maxResults, 5); i++) {
      const year = 2024 - i;
      const status = i < 3 ? 'registered' : 'pending';
      
      trademarks.push({
        applicationNumber: `商願${year}-${String(50000 + i).padStart(6, '0')}`,
        registrationNumber: status === 'registered' ? `登録第${6000000 + i}号` : undefined,
        name: `ブランド${String.fromCharCode(65 + i)}`,
        applicant: applicant,
        applicationDate: `${year}-03-01`,
        registrationDate: status === 'registered' ? `${year}-09-01` : undefined,
        classes: [`第${9 + i}類`],
        status: status
      });
    }
    
    return trademarks;
  }

  /**
   * モック意匠データの生成
   */
  private generateMockDesigns(params: { applicant: string; maxResults?: number }): DesignInfo[] {
    const { applicant = 'テスト企業', maxResults = 3 } = params;
    const designs: DesignInfo[] = [];
    
    for (let i = 0; i < Math.min(maxResults, 3); i++) {
      const year = 2024 - i;
      const status = i < 2 ? 'registered' : 'pending';
      
      designs.push({
        applicationNumber: `意願${year}-${String(10000 + i).padStart(6, '0')}`,
        registrationNumber: status === 'registered' ? `意匠登録第${1500000 + i}号` : undefined,
        title: `製品デザイン${i + 1}`,
        applicant: applicant,
        applicationDate: `${year}-06-01`,
        registrationDate: status === 'registered' ? `${year}-12-01` : undefined,
        classification: `${i + 1}-01`,
        status: status
      });
    }
    
    return designs;
  }

  private getTechArea(index: number): string {
    const areas = ['AI', 'IoT', '制御システム', 'データ処理', '通信技術'];
    return areas[index % areas.length];
  }

  private getInventionType(index: number): string {
    const types = ['装置', 'システム', '方法', 'プログラム', '機構'];
    return types[index % types.length];
  }

  private getIPCClass(index: number): string {
    const classes = ['G06F', 'H04L', 'G06N', 'H04W', 'G06Q'];
    return classes[index % classes.length];
  }
}

export default JplatpatService;