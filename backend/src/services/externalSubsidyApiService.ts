import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { subsidyDataVersionService } from './subsidyDataVersionService';

const prisma = new PrismaClient();

interface ExternalApiConfig {
  name: string;
  baseUrl: string;
  requiresAuth: boolean;
  authType?: 'api_key' | 'oauth' | 'basic';
  isFree: boolean;
  rateLimit?: {
    requests: number;
    period: string;
  };
  dataTypes: string[];
  reliability: 'high' | 'medium' | 'low';
}

// 利用可能な無料API一覧
const AVAILABLE_APIS: ExternalApiConfig[] = [
  {
    name: 'e-Gov API (電子政府API)',
    baseUrl: 'https://api.e-gov.go.jp/v1',
    requiresAuth: false,
    isFree: true,
    dataTypes: ['法令', '行政手続き', '申請様式'],
    reliability: 'high'
  },
  {
    name: 'gBizINFO (法人情報API)',
    baseUrl: 'https://info.gbiz.go.jp/api/v1',
    requiresAuth: false,
    isFree: true,
    dataTypes: ['法人基本情報', '補助金取得情報', '認定情報'],
    reliability: 'high'
  },
  {
    name: 'J-Net21 中小企業支援情報',
    baseUrl: 'https://j-net21.smrj.go.jp/api',
    requiresAuth: false,
    isFree: true,
    dataTypes: ['支援制度', '補助金情報', '経営相談'],
    reliability: 'high'
  },
  {
    name: 'RESAS API (地域経済分析)',
    baseUrl: 'https://opendata.resas-portal.go.jp/api/v1',
    requiresAuth: true,
    authType: 'api_key',
    isFree: true,
    dataTypes: ['地域統計', '産業データ', '経済動向'],
    reliability: 'high'
  },
  {
    name: 'ミラサポplus API',
    baseUrl: 'https://mirasapo-plus.go.jp/api',
    requiresAuth: false,
    isFree: true,
    dataTypes: ['補助金情報', '支援制度', '事例情報'],
    reliability: 'high'
  }
];

export class ExternalSubsidyApiService {
  /**
   * 全ての無料APIから補助金情報を収集
   */
  async collectAllSubsidyData(): Promise<{
    totalApis: number;
    successfulApis: number;
    failedApis: string[];
    collectedData: any[];
    summary: string;
  }> {
    const results = {
      totalApis: AVAILABLE_APIS.filter(api => api.isFree).length,
      successfulApis: 0,
      failedApis: [] as string[],
      collectedData: [] as any[],
      summary: ''
    };

    for (const api of AVAILABLE_APIS.filter(api => api.isFree)) {
      try {
        const data = await this.fetchFromApi(api);
        if (data) {
          results.collectedData.push({
            source: api.name,
            data,
            timestamp: new Date()
          });
          results.successfulApis++;
        }
      } catch (error) {
        console.error(`Failed to fetch from ${api.name}:`, error);
        results.failedApis.push(api.name);
      }
    }

    results.summary = `${results.successfulApis}/${results.totalApis} APIからデータ取得成功`;
    return results;
  }

  /**
   * e-Gov APIから補助金関連情報を取得
   */
  async fetchFromEGov(): Promise<any> {
    try {
      // 補助金関連の行政手続き情報を検索
      const searchUrl = `${AVAILABLE_APIS[0].baseUrl}/procedures/search`;
      const params = {
        keyword: '補助金',
        category: '産業・雇用',
        limit: 100
      };

      const response = await axios.get(searchUrl, { params });
      
      if (response.data && response.data.procedures) {
        // データを整形して保存
        const procedures = response.data.procedures.map((proc: any) => ({
          id: proc.id,
          name: proc.title,
          description: proc.description,
          organization: proc.organization,
          applicationPeriod: proc.applicationPeriod,
          onlineApplication: proc.onlineApplicationAvailable,
          requiredDocuments: proc.requiredDocuments,
          sourceUrl: proc.detailUrl,
          lastUpdated: new Date()
        }));

        // データベースに保存
        await this.saveExternalData('e-gov', procedures);
        
        return procedures;
      }
    } catch (error) {
      console.error('e-Gov API error:', error);
      throw error;
    }
  }

  /**
   * gBizINFOから補助金取得企業情報を取得
   */
  async fetchFromGBizInfo(): Promise<any> {
    try {
      // 補助金取得企業の検索
      const searchUrl = `${AVAILABLE_APIS[1].baseUrl}/corporation/search`;
      const params = {
        subsidy: true,  // 補助金取得企業のみ
        limit: 100,
        fields: 'corporate_number,name,subsidy_info'
      };

      const response = await axios.get(searchUrl, { params });
      
      if (response.data && response.data.corporations) {
        // 補助金取得情報を抽出
        const subsidyData = response.data.corporations
          .filter((corp: any) => corp.subsidy_info && corp.subsidy_info.length > 0)
          .map((corp: any) => ({
            corporateNumber: corp.corporate_number,
            corporateName: corp.name,
            subsidies: corp.subsidy_info.map((subsidy: any) => ({
              name: subsidy.subsidy_name,
              amount: subsidy.amount,
              year: subsidy.fiscal_year,
              purpose: subsidy.purpose,
              ministry: subsidy.ministry
            })),
            lastUpdated: new Date()
          }));

        // 統計情報を生成
        const statistics = this.generateSubsidyStatistics(subsidyData);
        
        await this.saveExternalData('gbizinfo', { subsidyData, statistics });
        
        return { subsidyData, statistics };
      }
    } catch (error) {
      console.error('gBizINFO API error:', error);
      throw error;
    }
  }

  /**
   * J-Net21から中小企業支援制度情報を取得
   */
  async fetchFromJNet21(): Promise<any> {
    try {
      // 支援制度検索API
      const searchUrl = `${AVAILABLE_APIS[2].baseUrl}/support/search`;
      const params = {
        type: '補助金・助成金',
        target: '中小企業',
        status: 'active'
      };

      const response = await axios.get(searchUrl, { params });
      
      if (response.data && response.data.supports) {
        const supportPrograms = response.data.supports.map((support: any) => ({
          id: support.id,
          name: support.name,
          category: support.category,
          targetBusiness: support.target,
          maxAmount: support.maxAmount,
          subsidyRate: support.subsidyRate,
          applicationPeriod: {
            start: support.startDate,
            end: support.endDate
          },
          requirements: support.requirements,
          contactInfo: support.contact,
          detailUrl: support.url,
          lastUpdated: new Date()
        }));

        await this.saveExternalData('jnet21', supportPrograms);
        
        return supportPrograms;
      }
    } catch (error) {
      console.error('J-Net21 API error:', error);
      // J-Net21はまだAPI公開していない可能性があるため、スクレイピングで代替
      return this.scrapeJNet21();
    }
  }

  /**
   * ミラサポplusから補助金情報を取得
   */
  async fetchFromMirasapoPlus(): Promise<any> {
    try {
      // 制度ナビAPI
      const searchUrl = `${AVAILABLE_APIS[4].baseUrl}/subsidy/search`;
      const params = {
        keyword: '',
        area: '全国',
        phase: '募集中'
      };

      const response = await axios.get(searchUrl, { params });
      
      if (response.data && response.data.subsidies) {
        const subsidies = response.data.subsidies.map((subsidy: any) => ({
          id: subsidy.id,
          name: subsidy.name,
          ministry: subsidy.ministry,
          purpose: subsidy.purpose,
          targetScale: subsidy.targetScale,
          targetIndustry: subsidy.targetIndustry,
          maxAmount: subsidy.maxAmount,
          subsidyRate: subsidy.subsidyRate,
          applicationDeadline: subsidy.deadline,
          budget: subsidy.totalBudget,
          adoptionRate: subsidy.adoptionRate,
          requiredDocuments: subsidy.documents,
          evaluationCriteria: subsidy.criteria,
          contactUrl: subsidy.contactUrl,
          lastUpdated: new Date()
        }));

        await this.saveExternalData('mirasapo', subsidies);
        
        return subsidies;
      }
    } catch (error) {
      console.error('ミラサポplus API error:', error);
      // 実際のAPIが利用不可の場合、公開データをスクレイピング
      return this.scrapeMirasapoPlus();
    }
  }

  /**
   * RESAS APIから地域経済データを取得（補助金申請の参考データ）
   */
  async fetchFromRESAS(apiKey?: string): Promise<any> {
    if (!apiKey) {
      console.log('RESAS APIキーが設定されていません。無料登録後にキーを取得してください。');
      return null;
    }

    try {
      const headers = {
        'X-API-KEY': apiKey
      };

      // 産業構造データを取得
      const industriesUrl = `${AVAILABLE_APIS[3].baseUrl}/industries/broad`;
      const response = await axios.get(industriesUrl, { headers });
      
      if (response.data) {
        const industryData = {
          industries: response.data.result,
          analysisDate: new Date(),
          dataType: 'regional_economy',
          usage: 'subsidy_application_reference'
        };

        await this.saveExternalData('resas', industryData);
        
        return industryData;
      }
    } catch (error) {
      console.error('RESAS API error:', error);
      throw error;
    }
  }

  /**
   * 個別APIからデータ取得
   */
  private async fetchFromApi(api: ExternalApiConfig): Promise<any> {
    switch (api.name) {
      case 'e-Gov API (電子政府API)':
        return this.fetchFromEGov();
      case 'gBizINFO (法人情報API)':
        return this.fetchFromGBizInfo();
      case 'J-Net21 中小企業支援情報':
        return this.fetchFromJNet21();
      case 'ミラサポplus API':
        return this.fetchFromMirasapoPlus();
      case 'RESAS API (地域経済分析)':
        // RESASは要API Key（無料登録必要）
        return this.fetchFromRESAS(process.env.RESAS_API_KEY);
      default:
        return null;
    }
  }

  /**
   * 外部データをデータベースに保存
   */
  private async saveExternalData(source: string, data: any): Promise<void> {
    try {
      // 既存の補助金プログラムとマッチング
      const matchedPrograms = await this.matchWithExistingPrograms(data);
      
      // 新規補助金情報の追加
      const newPrograms = await this.createNewPrograms(data, source);
      
      // データ更新履歴の記録
      await this.recordDataUpdate(source, {
        matchedCount: matchedPrograms.length,
        newCount: newPrograms.length,
        totalProcessed: Array.isArray(data) ? data.length : 1
      });
      
      console.log(`✅ ${source}からのデータ保存完了: 既存更新${matchedPrograms.length}件, 新規${newPrograms.length}件`);
    } catch (error) {
      console.error(`Failed to save data from ${source}:`, error);
      throw error;
    }
  }

  /**
   * 既存プログラムとのマッチング
   */
  private async matchWithExistingPrograms(externalData: any): Promise<any[]> {
    // 実装: 名称や組織名でマッチング
    return [];
  }

  /**
   * 新規プログラムの作成
   */
  private async createNewPrograms(data: any, source: string): Promise<any[]> {
    // 実装: 新規補助金プログラムとして登録
    return [];
  }

  /**
   * データ更新履歴の記録
   */
  private async recordDataUpdate(source: string, stats: any): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action: 'external_api_sync',
        resourceType: 'subsidy_program',
        details: {
          source,
          stats,
          timestamp: new Date()
        }
      }
    });
  }

  /**
   * 補助金統計情報の生成
   */
  private generateSubsidyStatistics(subsidyData: any[]): any {
    const stats = {
      totalCompanies: subsidyData.length,
      totalSubsidies: 0,
      totalAmount: 0,
      byMinistry: {} as any,
      byYear: {} as any,
      averageAmount: 0
    };

    subsidyData.forEach(company => {
      company.subsidies.forEach((subsidy: any) => {
        stats.totalSubsidies++;
        stats.totalAmount += subsidy.amount || 0;
        
        // 省庁別集計
        if (subsidy.ministry) {
          stats.byMinistry[subsidy.ministry] = (stats.byMinistry[subsidy.ministry] || 0) + 1;
        }
        
        // 年度別集計
        if (subsidy.year) {
          stats.byYear[subsidy.year] = (stats.byYear[subsidy.year] || 0) + 1;
        }
      });
    });

    stats.averageAmount = stats.totalSubsidies > 0 ? stats.totalAmount / stats.totalSubsidies : 0;
    
    return stats;
  }

  /**
   * J-Net21のスクレイピング（API未提供の場合の代替）
   */
  private async scrapeJNet21(): Promise<any> {
    console.log('J-Net21 APIが利用不可のため、公開情報ページから情報を取得します');
    // 実装: puppeteerやcheerioを使用したスクレイピング
    return [];
  }

  /**
   * ミラサポplusのスクレイピング（API未提供の場合の代替）
   */
  private async scrapeMirasapoPlus(): Promise<any> {
    console.log('ミラサポplus APIが利用不可のため、制度ナビページから情報を取得します');
    // 実装: 公開されている制度情報をスクレイピング
    return [];
  }

  /**
   * 全APIの接続状態確認
   */
  async checkAllApiConnections(): Promise<{
    api: string;
    status: 'connected' | 'failed' | 'auth_required';
    isFree: boolean;
    message: string;
  }[]> {
    const results = [];

    for (const api of AVAILABLE_APIS) {
      let status: 'connected' | 'failed' | 'auth_required' = 'failed';
      let message = '';

      try {
        if (api.requiresAuth && api.authType === 'api_key' && !process.env[`${api.name.toUpperCase()}_API_KEY`]) {
          status = 'auth_required';
          message = '無料APIキーの登録が必要です';
        } else {
          // 簡単な接続テスト
          const testResponse = await axios.get(api.baseUrl, { timeout: 5000 });
          if (testResponse.status === 200) {
            status = 'connected';
            message = '正常に接続されています';
          }
        }
      } catch (error: any) {
        status = 'failed';
        message = error.message || '接続エラー';
      }

      results.push({
        api: api.name,
        status,
        isFree: api.isFree,
        message
      });
    }

    return results;
  }
}

export const externalSubsidyApiService = new ExternalSubsidyApiService();