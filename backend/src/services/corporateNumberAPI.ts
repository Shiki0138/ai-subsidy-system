/**
 * Corporate Number API Service
 * 国税庁法人番号公表サイトAPIとの連携サービス
 */

import axios, { AxiosResponse } from 'axios';
import winston from 'winston';

interface CorporateNumberSearchResult {
  corporateNumber: string;
  name: string;
  nameImageId?: string;
  furigana?: string;
  kind: string;
  prefectureName: string;
  cityName: string;
  streetNumber?: string;
  addressImageId?: string;
  prefectureCode: string;
  cityCode: string;
  postCode?: string;
  addressOutside?: string;
  addressOutsideImageId?: string;
  closeDate?: string;
  closeCause?: string;
  successorCorporateNumber?: string;
  changeDate?: string;
  assignmentDate: string;
  latest: string;
  enName?: string;
  enPrefectureName?: string;
  enCityName?: string;
  enAddressOutside?: string;
}

interface CorporateNumberResponse {
  count: number;
  divideNumber: number;
  divideSize: number;
  corporations: CorporateNumberSearchResult[];
}

interface ChangeHistory {
  date: string;
  type: 'name' | 'address' | 'close' | 'successor';
  before?: string;
  after?: string;
  details?: string;
}

interface RelatedCompany {
  corporateNumber: string;
  name: string;
  relation: 'parent' | 'subsidiary' | 'affiliate' | 'successor' | 'predecessor';
  details?: string;
}

interface EnhancedCompanyInfo {
  corporateNumber: string;
  companyName: string;
  furigana?: string;
  englishName?: string;
  kind: string; // 法人種別
  address: {
    postCode?: string;
    prefectureName: string;
    cityName: string;
    streetNumber?: string;
    fullAddress: string;
  };
  status: {
    isActive: boolean;
    closeDate?: string;
    closeCause?: string;
    assignmentDate: string;
    changeDate?: string;
  };
  additionalInfo?: {
    website?: string;
    phone?: string;
    email?: string;
    businessType?: string;
    foundedYear?: number;
    employeeCount?: number;
    capitalAmount?: number;
    description?: string;
  };
  changeHistory?: ChangeHistory[];
  relatedCompanies?: RelatedCompany[];
  trustScore?: {
    score: number; // 0-100
    factors: {
      corporateAge: number;
      hasSuccessor: boolean;
      addressChanges: number;
      nameChanges: number;
    };
  };
}

export class CorporateNumberAPI {
  private readonly baseUrl = 'https://info.gbiz.go.jp/hojin/v1';
  private readonly applicationId: string;
  private logger: winston.Logger;

  constructor(logger: winston.Logger, applicationId?: string) {
    this.logger = logger;
    this.applicationId = applicationId || process.env.CORPORATE_NUMBER_APP_ID || '';
    
    if (!this.applicationId) {
      this.logger.warn('Corporate Number API application ID not configured');
    }
  }

  /**
   * 法人番号で企業情報を検索
   */
  async searchByCorporateNumber(corporateNumber: string): Promise<EnhancedCompanyInfo | null> {
    try {
      // 法人番号の正規化（ハイフンを除去）
      const normalizedNumber = corporateNumber.replace(/[-\s]/g, '');
      
      if (normalizedNumber.length !== 13) {
        throw new Error('法人番号は13桁である必要があります');
      }

      const response = await this.makeApiRequest('/num', {
        number: normalizedNumber,
        type: '12', // 法人番号指定を受けている法人等
        mode: '2'   // 最新のみ
      });

      if (response.data.count === 0) {
        return null;
      }

      const corporation = response.data.corporations[0];
      return this.transformToCorporateInfo(corporation);

    } catch (error: any) {
      this.logger.error('Corporate number search failed', {
        corporateNumber,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 企業名で法人番号を検索
   */
  async searchByCompanyName(companyName: string, prefectureCode?: string): Promise<CorporateNumberSearchResult[]> {
    try {
      const params: any = {
        name: companyName,
        mode: '2', // 最新のみ
        type: '12'
      };

      if (prefectureCode) {
        params.prefecture = prefectureCode;
      }

      const response = await this.makeApiRequest('/name', params);
      return response.data.corporations || [];

    } catch (error: any) {
      this.logger.error('Company name search failed', {
        companyName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 住所で企業を検索
   */
  async searchByAddress(prefecture: string, city?: string): Promise<CorporateNumberSearchResult[]> {
    try {
      const params: any = {
        prefecture,
        mode: '2',
        type: '12'
      };

      if (city) {
        params.city = city;
      }

      const response = await this.makeApiRequest('/name', params);
      return response.data.corporations || [];

    } catch (error: any) {
      this.logger.error('Address search failed', {
        prefecture,
        city,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 曖昧検索で企業を検索
   */
  async fuzzySearchCompany(query: string, maxResults = 10): Promise<CorporateNumberSearchResult[]> {
    try {
      // 複数の検索方法を試行
      const searchPromises = [
        this.searchByCompanyName(query),
        this.searchByCompanyName(query.replace(/株式会社|有限会社|合同会社|合資会社|合名会社/, '').trim()),
        this.searchByCompanyName(query + '株式会社'),
        this.searchByCompanyName('株式会社' + query)
      ];

      const results = await Promise.allSettled(searchPromises);
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<CorporateNumberSearchResult[]> => 
          result.status === 'fulfilled'
        )
        .flatMap(result => result.value);

      // 重複を除去して返す
      const uniqueResults = this.removeDuplicates(successfulResults);
      return uniqueResults.slice(0, maxResults);

    } catch (error: any) {
      this.logger.error('Fuzzy search failed', {
        query,
        error: error.message
      });
      return [];
    }
  }

  /**
   * 法人番号の妥当性をチェック
   */
  validateCorporateNumber(corporateNumber: string): { isValid: boolean; error?: string } {
    const normalized = corporateNumber.replace(/[-\s]/g, '');
    
    if (normalized.length !== 13) {
      return { isValid: false, error: '法人番号は13桁である必要があります' };
    }

    if (!/^\d{13}$/.test(normalized)) {
      return { isValid: false, error: '法人番号は数字のみで構成される必要があります' };
    }

    // チェックデジット検証
    if (!this.validateCheckDigit(normalized)) {
      return { isValid: false, error: '法人番号のチェックデジットが無効です' };
    }

    return { isValid: true };
  }

  /**
   * 法人番号にチェックデジットを付与
   */
  addCheckDigit(twelveDigitNumber: string): string {
    if (twelveDigitNumber.length !== 12) {
      throw new Error('12桁の番号を入力してください');
    }

    const digits = twelveDigitNumber.split('').map(Number);
    let sum = 0;

    // P1からP12までの各桁にQ1からQ12を乗じた値の合計
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * weights[i];
    }

    const checkDigit = (9 - (sum % 9)) % 9;
    return checkDigit + twelveDigitNumber;
  }

  /**
   * APIリクエストを実行
   */
  private async makeApiRequest(endpoint: string, params: any): Promise<AxiosResponse<CorporateNumberResponse>> {
    if (!this.applicationId) {
      throw new Error('Corporate Number API application ID is not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const requestParams = {
      ...params,
      id: this.applicationId,
      responseType: 'json'
    };

    this.logger.info('Making Corporate Number API request', {
      endpoint,
      params: { ...requestParams, id: '[REDACTED]' }
    });

    const response = await axios.get<CorporateNumberResponse>(url, {
      params: requestParams,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AI-SubsidySystem/1.0'
      }
    });

    this.logger.info('Corporate Number API response received', {
      count: response.data.count,
      status: response.status
    });

    return response;
  }

  /**
   * API レスポンスを拡張企業情報に変換
   */
  private transformToCorporateInfo(corporation: CorporateNumberSearchResult): EnhancedCompanyInfo {
    const fullAddress = [
      corporation.prefectureName,
      corporation.cityName,
      corporation.streetNumber
    ].filter(Boolean).join('');

    return {
      corporateNumber: corporation.corporateNumber,
      companyName: corporation.name,
      furigana: corporation.furigana,
      englishName: corporation.enName,
      kind: this.translateKind(corporation.kind),
      address: {
        postCode: corporation.postCode,
        prefectureName: corporation.prefectureName,
        cityName: corporation.cityName,
        streetNumber: corporation.streetNumber,
        fullAddress
      },
      status: {
        isActive: !corporation.closeDate,
        closeDate: corporation.closeDate,
        closeCause: corporation.closeCause,
        assignmentDate: corporation.assignmentDate,
        changeDate: corporation.changeDate
      },
      changeHistory: this.buildChangeHistory(corporation),
      trustScore: this.calculateTrustScore(corporation)
    };
  }

  /**
   * 変更履歴の構築
   */
  private buildChangeHistory(corporation: CorporateNumberSearchResult): ChangeHistory[] {
    const history: ChangeHistory[] = [];

    // 変更日がある場合
    if (corporation.changeDate) {
      history.push({
        date: corporation.changeDate,
        type: 'address', // 通常は住所変更
        details: '本店所在地の変更'
      });
    }

    // 閉鎖情報がある場合
    if (corporation.closeDate) {
      history.push({
        date: corporation.closeDate,
        type: 'close',
        details: corporation.closeCause || '閉鎖'
      });
    }

    // 承継法人番号がある場合
    if (corporation.successorCorporateNumber) {
      history.push({
        date: corporation.closeDate || corporation.changeDate || '',
        type: 'successor',
        after: corporation.successorCorporateNumber,
        details: '事業承継'
      });
    }

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * 信頼性スコアの計算
   */
  private calculateTrustScore(corporation: CorporateNumberSearchResult): any {
    const assignmentDate = new Date(corporation.assignmentDate);
    const now = new Date();
    const corporateAge = Math.floor((now.getTime() - assignmentDate.getTime()) / (365 * 24 * 60 * 60 * 1000));
    
    const hasSuccessor = !!corporation.successorCorporateNumber;
    const addressChanges = corporation.changeDate ? 1 : 0;
    const nameChanges = 0; // APIからは取得できないため0

    // スコア計算ロジック
    let score = 50; // 基準点
    
    // 設立年数によるスコア（最大30点）
    score += Math.min(corporateAge * 2, 30);
    
    // 閉鎖されていない場合（20点）
    if (!corporation.closeDate) {
      score += 20;
    }
    
    // 承継法人がある場合は信頼性は変わらない
    if (hasSuccessor) {
      score += 0;
    }
    
    // 住所変更が少ない（変更がない場合10点）
    if (addressChanges === 0) {
      score += 10;
    }

    return {
      score: Math.min(Math.max(score, 0), 100),
      factors: {
        corporateAge,
        hasSuccessor,
        addressChanges,
        nameChanges
      }
    };
  }

  /**
   * 法人種別を翻訳
   */
  private translateKind(kind: string): string {
    const kindMap: Record<string, string> = {
      '101': '国の機関',
      '201': '地方公共団体',
      '301': '株式会社',
      '302': '有限会社',
      '303': '合名会社',
      '304': '合資会社',
      '305': '合同会社',
      '399': 'その他の設立登記法人',
      '401': '外国会社等',
      '501': '公益社団法人',
      '502': '公益財団法人',
      '503': '一般社団法人',
      '504': '一般財団法人',
      '505': '特例民法法人',
      '601': '医療法人',
      '701': '学校法人',
      '801': '宗教法人',
      '901': '社会福祉法人',
      '999': 'その他'
    };

    return kindMap[kind] || kind;
  }

  /**
   * チェックデジット検証
   */
  private validateCheckDigit(corporateNumber: string): boolean {
    const checkDigit = parseInt(corporateNumber[0]);
    const twelveDigitPart = corporateNumber.slice(1);
    
    const expectedCheckDigit = parseInt(this.addCheckDigit(twelveDigitPart)[0]);
    return checkDigit === expectedCheckDigit;
  }

  /**
   * 重複する検索結果を除去
   */
  private removeDuplicates(results: CorporateNumberSearchResult[]): CorporateNumberSearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.corporateNumber)) {
        return false;
      }
      seen.add(result.corporateNumber);
      return true;
    });
  }

  /**
   * 関連企業を検索（同一住所、類似名称など）
   */
  async searchRelatedCompanies(baseCompany: EnhancedCompanyInfo): Promise<RelatedCompany[]> {
    const relatedCompanies: RelatedCompany[] = [];
    
    try {
      // 1. 同一住所の企業を検索
      const sameAddressCompanies = await this.searchByAddress(
        baseCompany.address.prefectureName,
        baseCompany.address.cityName,
        baseCompany.address.streetNumber || ''
      );
      
      for (const company of sameAddressCompanies) {
        if (company.corporateNumber !== baseCompany.corporateNumber) {
          relatedCompanies.push({
            corporateNumber: company.corporateNumber,
            name: company.companyName,
            relation: 'affiliate',
            details: '同一住所に所在'
          });
        }
      }
      
      // 2. 承継法人の検索
      if (baseCompany.status.closeDate && baseCompany.changeHistory) {
        const successorHistory = baseCompany.changeHistory.find(h => h.type === 'successor');
        if (successorHistory?.after) {
          const successor = await this.searchByCorporateNumber(successorHistory.after);
          if (successor) {
            relatedCompanies.push({
              corporateNumber: successor.corporateNumber,
              name: successor.companyName,
              relation: 'successor',
              details: '事業承継先'
            });
          }
        }
      }
      
      // 3. 類似名称の企業を検索（グループ企業の可能性）
      const nameKeywords = this.extractNameKeywords(baseCompany.companyName);
      if (nameKeywords.length > 0) {
        for (const keyword of nameKeywords) {
          const similarNameCompanies = await this.searchByName(keyword);
          
          for (const company of similarNameCompanies.slice(0, 5)) {
            if (company.corporateNumber !== baseCompany.corporateNumber &&
                !relatedCompanies.find(r => r.corporateNumber === company.corporateNumber)) {
              
              const relation = this.analyzeRelation(baseCompany, company);
              if (relation) {
                relatedCompanies.push({
                  corporateNumber: company.corporateNumber,
                  name: company.companyName,
                  relation: relation.type,
                  details: relation.details
                });
              }
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error searching related companies:', error);
    }
    
    return relatedCompanies;
  }

  /**
   * 名称からキーワードを抽出
   */
  private extractNameKeywords(companyName: string): string[] {
    // 法人種別を除去
    const cleanName = companyName
      .replace(/株式会社|有限会社|合同会社|合資会社|合名会社|一般社団法人|一般財団法人|医療法人|学校法人|社会福祉法人|宗教法人/g, '')
      .trim();
    
    // グループ企業のパターンを検出
    const patterns = [
      /(.+?)ホールディングス?/,
      /(.+?)グループ/,
      /(.+?)コーポレーション/,
      /(.+?)カンパニー/
    ];
    
    const keywords: string[] = [];
    
    for (const pattern of patterns) {
      const match = cleanName.match(pattern);
      if (match && match[1]) {
        keywords.push(match[1].trim());
      }
    }
    
    // パターンにマッチしない場合は、最初の2-4文字を使用
    if (keywords.length === 0 && cleanName.length >= 2) {
      keywords.push(cleanName.substring(0, Math.min(4, cleanName.length)));
    }
    
    return keywords;
  }

  /**
   * 企業間の関係を分析
   */
  private analyzeRelation(company1: EnhancedCompanyInfo, company2: EnhancedCompanyInfo): 
    { type: 'parent' | 'subsidiary' | 'affiliate'; details: string } | null {
    
    const name1 = company1.companyName;
    const name2 = company2.companyName;
    
    // 親会社・子会社パターン
    if (name1.includes('ホールディング') && name2.includes(this.extractNameKeywords(name1)[0])) {
      return { type: 'subsidiary', details: 'ホールディングス傘下の可能性' };
    }
    if (name2.includes('ホールディング') && name1.includes(this.extractNameKeywords(name2)[0])) {
      return { type: 'parent', details: 'ホールディングス企業' };
    }
    
    // 同一グループパターン
    const keywords1 = this.extractNameKeywords(name1);
    const keywords2 = this.extractNameKeywords(name2);
    
    if (keywords1.some(k => keywords2.includes(k))) {
      return { type: 'affiliate', details: 'グループ企業の可能性' };
    }
    
    return null;
  }

  /**
   * 本店・支店情報の取得（複数拠点を持つ企業の検出）
   */
  async searchBranchOffices(corporateNumber: string): Promise<{
    headquarters: EnhancedCompanyInfo;
    branches: Array<{ address: string; type: string }>;
  } | null> {
    try {
      const headquarters = await this.searchByCorporateNumber(corporateNumber);
      if (!headquarters) return null;
      
      // 同一法人番号で異なる住所の記録があるかチェック
      // （法人番号APIの制限により、支店情報は直接取得できないため、
      // 商号変更履歴などから推測）
      const branches: Array<{ address: string; type: string }> = [];
      
      if (headquarters.changeHistory) {
        headquarters.changeHistory
          .filter(h => h.type === 'address' && h.before)
          .forEach(h => {
            branches.push({
              address: h.before || '',
              type: '旧本店所在地'
            });
          });
      }
      
      return {
        headquarters,
        branches
      };
    } catch (error) {
      this.logger.error('Error searching branch offices:', error);
      return null;
    }
  }

  /**
   * 都道府県コードを取得
   */
  getPrefectureCode(prefectureName: string): string | null {
    const prefectureCodes: Record<string, string> = {
      '北海道': '01', '青森県': '02', '岩手県': '03', '宮城県': '04', '秋田県': '05',
      '山形県': '06', '福島県': '07', '茨城県': '08', '栃木県': '09', '群馬県': '10',
      '埼玉県': '11', '千葉県': '12', '東京都': '13', '神奈川県': '14', '新潟県': '15',
      '富山県': '16', '石川県': '17', '福井県': '18', '山梨県': '19', '長野県': '20',
      '岐阜県': '21', '静岡県': '22', '愛知県': '23', '三重県': '24', '滋賀県': '25',
      '京都府': '26', '大阪府': '27', '兵庫県': '28', '奈良県': '29', '和歌山県': '30',
      '鳥取県': '31', '島根県': '32', '岡山県': '33', '広島県': '34', '山口県': '35',
      '徳島県': '36', '香川県': '37', '愛媛県': '38', '高知県': '39', '福岡県': '40',
      '佐賀県': '41', '長崎県': '42', '熊本県': '43', '大分県': '44', '宮崎県': '45',
      '鹿児島県': '46', '沖縄県': '47'
    };

    return prefectureCodes[prefectureName] || null;
  }

  /**
   * 企業の基本情報から追加情報を推定
   */
  async enhanceCompanyInfo(basicInfo: EnhancedCompanyInfo): Promise<EnhancedCompanyInfo> {
    try {
      // 業種の推定（企業名から）
      const businessType = this.estimateBusinessType(basicInfo.companyName);
      
      // 設立年の推定（法人番号から）
      const estimatedFoundedYear = this.estimateFoundedYear(basicInfo.corporateNumber);

      const enhanced = {
        ...basicInfo,
        additionalInfo: {
          businessType,
          foundedYear: estimatedFoundedYear,
          // 他の情報は後でウェブスクレイピングで補完
        }
      };

      return enhanced;

    } catch (error: any) {
      this.logger.error('Failed to enhance company info', {
        corporateNumber: basicInfo.corporateNumber,
        error: error.message
      });
      return basicInfo;
    }
  }

  /**
   * 企業名から業種を推定
   */
  private estimateBusinessType(companyName: string): string | undefined {
    const businessKeywords: Record<string, string> = {
      'システム|IT|ソフト|プログラム|デジタル': 'IT・ソフトウェア',
      '建設|工事|土木|建築|施工': '建設業',
      '製造|工業|機械|部品|素材': '製造業',
      '商事|商社|貿易|輸入|輸出': '商社・貿易',
      '不動産|住宅|マンション|ビル': '不動産業',
      '金融|銀行|保険|証券|投資': '金融業',
      '小売|販売|ショップ|店舗': '小売業',
      '運輸|物流|配送|輸送': '運輸業',
      '医療|病院|クリニック|薬局': '医療・福祉',
      '教育|学習|塾|スクール': '教育・学習支援',
      'コンサル|経営|戦略|アドバイザー': 'コンサルティング',
      '飲食|レストラン|カフェ|料理': '飲食業',
      '広告|宣伝|マーケティング|PR': '広告・宣伝'
    };

    for (const [keywords, businessType] of Object.entries(businessKeywords)) {
      const regex = new RegExp(keywords);
      if (regex.test(companyName)) {
        return businessType;
      }
    }

    return undefined;
  }

  /**
   * 法人番号から設立年を推定
   */
  private estimateFoundedYear(corporateNumber: string): number | undefined {
    // 法人番号は2015年10月から付与開始
    // 法人番号の付与順序から大まかな設立時期を推定可能だが、
    // 正確ではないため、ここでは実装を省略
    return undefined;
  }
}

export default CorporateNumberAPI;