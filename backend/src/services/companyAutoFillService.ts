/**
 * Company Auto-Fill Service
 * 企業情報自動入力サービス（法人番号API + ウェブスクレイピング統合）
 */

import CompanyInfoExtractor from './companyInfoExtractor';
import CorporateNumberAPI, { EnhancedCompanyInfo } from './corporateNumberAPI';
import winston from 'winston';
import { PrismaClient } from '@prisma/client';

interface AutoFillRequest {
  method: 'corporateNumber' | 'website' | 'companyName' | 'mixed';
  data: {
    corporateNumber?: string;
    website?: string;
    companyName?: string;
    prefecture?: string;
  };
  userId?: string;
}

interface AutoFillResult {
  success: boolean;
  data: {
    companyName?: string;
    representativeName?: string;
    businessType?: string;
    foundedYear?: number;
    employeeCount?: number;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    capitalAmount?: number;
    description?: string;
    services?: string[];
    industry?: string;
    certifications?: string[];
    awards?: string[];
    corporateNumber?: string;
    prefecture?: string;
    city?: string;
    postCode?: string;
  };
  confidence: number;
  sources: {
    corporateNumberAPI?: boolean;
    websiteScraping?: boolean;
    aiAnalysis?: boolean;
  };
  processingTime: number;
  suggestions?: string[];
  errors?: string[];
  extractedAt: string;
}

export class CompanyAutoFillService {
  private companyExtractor: CompanyInfoExtractor;
  private corporateAPI: CorporateNumberAPI;
  private logger: winston.Logger;
  private prisma: PrismaClient;

  constructor(logger: winston.Logger, prisma: PrismaClient) {
    this.logger = logger;
    this.prisma = prisma;
    this.companyExtractor = new CompanyInfoExtractor(logger);
    this.corporateAPI = new CorporateNumberAPI(logger);
  }

  /**
   * 企業情報を自動抽出
   */
  async autoFillCompanyInfo(request: AutoFillRequest): Promise<AutoFillResult> {
    const startTime = Date.now();
    const result: AutoFillResult = {
      success: false,
      data: {},
      confidence: 0,
      sources: {},
      processingTime: 0,
      errors: [],
      extractedAt: new Date().toISOString()
    };

    try {
      this.logger.info('Starting company auto-fill', {
        method: request.method,
        userId: request.userId,
        hasData: Object.keys(request.data).length > 0
      });

      switch (request.method) {
        case 'corporateNumber':
          return await this.fillFromCorporateNumber(request, result);
        
        case 'website':
          return await this.fillFromWebsite(request, result);
        
        case 'companyName':
          return await this.fillFromCompanyName(request, result);
        
        case 'mixed':
          return await this.fillFromMultipleSources(request, result);
        
        default:
          throw new Error(`Unsupported auto-fill method: ${request.method}`);
      }

    } catch (error: any) {
      result.errors?.push(error.message);
      this.logger.error('Company auto-fill failed', {
        method: request.method,
        error: error.message,
        userId: request.userId
      });
      return result;
    } finally {
      result.processingTime = Date.now() - startTime;
    }
  }

  /**
   * 法人番号から企業情報を抽出
   */
  private async fillFromCorporateNumber(request: AutoFillRequest, result: AutoFillResult): Promise<AutoFillResult> {
    const { corporateNumber } = request.data;
    
    if (!corporateNumber) {
      throw new Error('法人番号が指定されていません');
    }

    // 法人番号の妥当性チェック
    const validation = this.corporateAPI.validateCorporateNumber(corporateNumber);
    if (!validation.isValid) {
      throw new Error(validation.error || '無効な法人番号です');
    }

    try {
      // 法人番号APIから基本情報を取得
      const corporateInfo = await this.corporateAPI.searchByCorporateNumber(corporateNumber);
      
      if (!corporateInfo) {
        throw new Error('指定された法人番号の企業が見つかりません');
      }

      result.sources.corporateNumberAPI = true;
      result.data = this.mapCorporateInfoToResult(corporateInfo);
      result.confidence += 80; // 公式データなので高い信頼度

      // 企業のウェブサイトが推定できる場合、追加情報を取得
      if (corporateInfo.additionalInfo?.website || result.data.website) {
        try {
          const websiteUrl = corporateInfo.additionalInfo?.website || result.data.website!;
          const websiteInfo = await this.companyExtractor.extractFromWebsite(websiteUrl);
          
          if (websiteInfo.success) {
            result.sources.websiteScraping = true;
            result.sources.aiAnalysis = true;
            result.data = this.mergeCompanyData(result.data, websiteInfo.data);
            result.confidence = Math.min(100, result.confidence + (websiteInfo.confidence * 0.2));
          }
        } catch (websiteError: any) {
          this.logger.warn('Failed to extract website info for corporate number', {
            corporateNumber,
            websiteError: websiteError.message
          });
        }
      }

      // 企業名で追加のウェブサイト検索を試行
      if (!result.sources.websiteScraping) {
        try {
          const nameBasedInfo = await this.companyExtractor.extractFromCompanyName(corporateInfo.companyName);
          
          if (nameBasedInfo.success) {
            result.sources.websiteScraping = true;
            result.sources.aiAnalysis = true;
            result.data = this.mergeCompanyData(result.data, nameBasedInfo.data);
            result.confidence = Math.min(100, result.confidence + (nameBasedInfo.confidence * 0.1));
          }
        } catch (nameError: any) {
          this.logger.warn('Failed to extract website info by company name', {
            companyName: corporateInfo.companyName,
            nameError: nameError.message
          });
        }
      }

      result.success = true;
      
      // ユーザーへの提案を生成
      result.suggestions = this.generateSuggestions(result.data);

      return result;

    } catch (error: any) {
      throw new Error(`法人番号検索エラー: ${error.message}`);
    }
  }

  /**
   * ウェブサイトから企業情報を抽出
   */
  private async fillFromWebsite(request: AutoFillRequest, result: AutoFillResult): Promise<AutoFillResult> {
    const { website } = request.data;
    
    if (!website) {
      throw new Error('ウェブサイトURLが指定されていません');
    }

    try {
      const websiteInfo = await this.companyExtractor.extractFromWebsite(website);
      
      if (!websiteInfo.success) {
        throw new Error('ウェブサイトから企業情報を抽出できませんでした');
      }

      result.sources.websiteScraping = true;
      result.sources.aiAnalysis = true;
      result.data = websiteInfo.data;
      result.confidence = websiteInfo.confidence;

      // 企業名が取得できた場合、法人番号APIで追加情報を検索
      if (result.data.companyName) {
        try {
          const corporateResults = await this.corporateAPI.searchByCompanyName(result.data.companyName);
          
          if (corporateResults.length > 0) {
            const bestMatch = corporateResults[0];
            const corporateInfo = await this.corporateAPI.searchByCorporateNumber(bestMatch.corporateNumber);
            
            if (corporateInfo) {
              result.sources.corporateNumberAPI = true;
              const officialData = this.mapCorporateInfoToResult(corporateInfo);
              result.data = this.mergeCompanyData(officialData, result.data); // 公式データを優先
              result.confidence = Math.min(100, result.confidence + 20);
            }
          }
        } catch (corporateError: any) {
          this.logger.warn('Failed to get corporate info for website-extracted company', {
            companyName: result.data.companyName,
            corporateError: corporateError.message
          });
        }
      }

      result.success = true;
      result.suggestions = this.generateSuggestions(result.data);

      return result;

    } catch (error: any) {
      throw new Error(`ウェブサイト解析エラー: ${error.message}`);
    }
  }

  /**
   * 企業名から企業情報を抽出
   */
  private async fillFromCompanyName(request: AutoFillRequest, result: AutoFillResult): Promise<AutoFillResult> {
    const { companyName, prefecture } = request.data;
    
    if (!companyName) {
      throw new Error('企業名が指定されていません');
    }

    try {
      // 法人番号APIで検索
      const prefectureCode = prefecture ? this.corporateAPI.getPrefectureCode(prefecture) : undefined;
      const corporateResults = await this.corporateAPI.searchByCompanyName(companyName, prefectureCode);

      let corporateInfo: EnhancedCompanyInfo | null = null;
      
      if (corporateResults.length > 0) {
        // 最も一致度の高い結果を選択
        const bestMatch = this.selectBestCorporateMatch(corporateResults, companyName);
        corporateInfo = await this.corporateAPI.searchByCorporateNumber(bestMatch.corporateNumber);
        
        if (corporateInfo) {
          result.sources.corporateNumberAPI = true;
          result.data = this.mapCorporateInfoToResult(corporateInfo);
          result.confidence += 70;
        }
      }

      // ウェブサイト検索も並行実行
      try {
        const websiteInfo = await this.companyExtractor.extractFromCompanyName(companyName);
        
        if (websiteInfo.success) {
          result.sources.websiteScraping = true;
          result.sources.aiAnalysis = true;
          
          if (corporateInfo) {
            // 公式データとウェブサイトデータをマージ
            result.data = this.mergeCompanyData(result.data, websiteInfo.data);
            result.confidence = Math.min(100, result.confidence + (websiteInfo.confidence * 0.3));
          } else {
            // ウェブサイトデータのみ
            result.data = websiteInfo.data;
            result.confidence = websiteInfo.confidence;
          }
        }
      } catch (websiteError: any) {
        this.logger.warn('Failed to extract website info by company name', {
          companyName,
          websiteError: websiteError.message
        });
      }

      if (Object.keys(result.data).length === 0) {
        throw new Error('指定された企業名で情報を見つけることができませんでした');
      }

      result.success = true;
      result.suggestions = this.generateSuggestions(result.data);

      return result;

    } catch (error: any) {
      throw new Error(`企業名検索エラー: ${error.message}`);
    }
  }

  /**
   * 複数のソースから企業情報を抽出
   */
  private async fillFromMultipleSources(request: AutoFillRequest, result: AutoFillResult): Promise<AutoFillResult> {
    const { corporateNumber, website, companyName } = request.data;
    const sources: Promise<AutoFillResult>[] = [];

    // 利用可能なすべてのソースから並行して情報を取得
    if (corporateNumber) {
      sources.push(this.fillFromCorporateNumber({ method: 'corporateNumber', data: { corporateNumber } }, { ...result }));
    }

    if (website) {
      sources.push(this.fillFromWebsite({ method: 'website', data: { website } }, { ...result }));
    }

    if (companyName) {
      sources.push(this.fillFromCompanyName({ method: 'companyName', data: { companyName } }, { ...result }));
    }

    if (sources.length === 0) {
      throw new Error('少なくとも1つの情報源（法人番号、ウェブサイト、企業名）を指定してください');
    }

    try {
      const results = await Promise.allSettled(sources);
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<AutoFillResult> => 
          result.status === 'fulfilled' && result.value.success
        )
        .map(result => result.value);

      if (successfulResults.length === 0) {
        throw new Error('すべての情報源からの抽出に失敗しました');
      }

      // 結果をマージ
      const mergedResult = this.mergeAutoFillResults(successfulResults);
      mergedResult.suggestions = this.generateSuggestions(mergedResult.data);

      return mergedResult;

    } catch (error: any) {
      throw new Error(`複数ソース検索エラー: ${error.message}`);
    }
  }

  /**
   * 企業情報データをマージ
   */
  private mergeCompanyData(primary: any, secondary: any): any {
    const merged = { ...secondary };

    // プライマリデータで上書き（より信頼性の高いデータを優先）
    Object.keys(primary).forEach(key => {
      if (primary[key] !== null && primary[key] !== undefined && primary[key] !== '') {
        merged[key] = primary[key];
      }
    });

    // 配列データは結合
    if (primary.services && secondary.services) {
      merged.services = [...new Set([...primary.services, ...secondary.services])];
    }
    if (primary.certifications && secondary.certifications) {
      merged.certifications = [...new Set([...primary.certifications, ...secondary.certifications])];
    }
    if (primary.awards && secondary.awards) {
      merged.awards = [...new Set([...primary.awards, ...secondary.awards])];
    }

    return merged;
  }

  /**
   * AutoFillResult配列をマージ
   */
  private mergeAutoFillResults(results: AutoFillResult[]): AutoFillResult {
    const merged: AutoFillResult = {
      success: true,
      data: {},
      confidence: 0,
      sources: {},
      processingTime: 0,
      extractedAt: new Date().toISOString()
    };

    // 最も信頼度の高い結果から順にマージ
    const sortedResults = results.sort((a, b) => b.confidence - a.confidence);
    
    for (const result of sortedResults) {
      merged.data = this.mergeCompanyData(merged.data, result.data);
      merged.confidence = Math.max(merged.confidence, result.confidence);
      merged.processingTime += result.processingTime;
      
      // ソース情報をマージ
      Object.assign(merged.sources, result.sources);
    }

    // 信頼度の調整（複数ソースからの情報は信頼度を向上）
    if (sortedResults.length > 1) {
      merged.confidence = Math.min(100, merged.confidence + 10);
    }

    return merged;
  }

  /**
   * CorporateAPIの結果をAutoFillResultにマップ
   */
  private mapCorporateInfoToResult(corporateInfo: EnhancedCompanyInfo): any {
    return {
      companyName: corporateInfo.companyName,
      address: corporateInfo.address.fullAddress,
      prefecture: corporateInfo.address.prefectureName,
      city: corporateInfo.address.cityName,
      postCode: corporateInfo.address.postCode,
      corporateNumber: corporateInfo.corporateNumber,
      businessType: corporateInfo.additionalInfo?.businessType,
      foundedYear: corporateInfo.additionalInfo?.foundedYear,
      website: corporateInfo.additionalInfo?.website,
      phone: corporateInfo.additionalInfo?.phone,
      email: corporateInfo.additionalInfo?.email,
      employeeCount: corporateInfo.additionalInfo?.employeeCount,
      capitalAmount: corporateInfo.additionalInfo?.capitalAmount,
      description: corporateInfo.additionalInfo?.description
    };
  }

  /**
   * 最適な法人検索結果を選択
   */
  private selectBestCorporateMatch(results: any[], targetName: string): any {
    // 完全一致を最優先
    const exactMatch = results.find(r => r.name === targetName);
    if (exactMatch) return exactMatch;

    // 部分一致で最も類似度の高いものを選択
    return results.reduce((best, current) => {
      const bestScore = this.calculateNameSimilarity(best.name, targetName);
      const currentScore = this.calculateNameSimilarity(current.name, targetName);
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * 企業名の類似度を計算
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (name: string) => name.replace(/株式会社|有限会社|合同会社|合資会社|合名会社/g, '').trim();
    
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    if (n1 === n2) return 1.0;
    if (n1.includes(n2) || n2.includes(n1)) return 0.8;
    
    // レーベンシュタイン距離による類似度計算
    const maxLen = Math.max(n1.length, n2.length);
    if (maxLen === 0) return 1.0;
    
    const distance = this.levenshteinDistance(n1, n2);
    return (maxLen - distance) / maxLen;
  }

  /**
   * レーベンシュタイン距離を計算
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * ユーザー向けの提案を生成
   */
  private generateSuggestions(data: any): string[] {
    const suggestions: string[] = [];

    if (!data.representativeName) {
      suggestions.push('代表者名の入力をお勧めします');
    }

    if (!data.phone) {
      suggestions.push('電話番号の追加をお勧めします');
    }

    if (!data.email) {
      suggestions.push('メールアドレスの追加をお勧めします');
    }

    if (!data.description || data.description.length < 50) {
      suggestions.push('事業内容の詳細な記述をお勧めします');
    }

    if (!data.foundedYear) {
      suggestions.push('設立年の入力をお勧めします');
    }

    if (!data.employeeCount) {
      suggestions.push('従業員数の入力をお勧めします');
    }

    return suggestions;
  }

  /**
   * 抽出結果をデータベースにキャッシュ
   */
  async cacheExtractionResult(userId: string, result: AutoFillResult): Promise<void> {
    try {
      // 企業情報のキャッシュロジックを実装
      // 将来的な機能として、よく検索される企業の情報をキャッシュ
      this.logger.info('Caching company extraction result', {
        userId,
        companyName: result.data.companyName,
        confidence: result.confidence
      });
    } catch (error: any) {
      this.logger.error('Failed to cache extraction result', {
        userId,
        error: error.message
      });
    }
  }

  /**
   * リソースのクリーンアップ
   */
  async cleanup(): Promise<void> {
    await this.companyExtractor.cleanup();
    this.logger.info('Company auto-fill service cleanup completed');
  }
}

export default CompanyAutoFillService;