/**
 * 実データ取得サービス
 * 各種外部APIを統合して、補助金申請に必要な実データを取得
 */

import { CorporateNumberApiClient, CorporateInfo } from './corporateNumberApi'
import { EStatApiClient, IndustryStatistics } from './estatApi'

export interface CompanyRealData {
  // 基本情報（法人番号APIから）
  basic: CorporateInfo | null
  
  // 業界統計（e-Stat APIから）
  industryStats: IndustryStatistics | null
  
  // 地域の最低賃金
  regionalMinimumWage: number | null
  
  // 財務情報（将来的にEDINET APIから取得予定）
  financial?: {
    revenue?: number
    employees?: number
    capitalStock?: number
  }
  
  // 知的財産情報（将来的にJ-PlatPat APIから取得予定）
  intellectualProperty?: {
    patentsCount?: number
    trademarksCount?: number
  }
}

export interface SubsidyEligibilityData {
  companySize: 'small' | 'medium' | 'large'
  industryCategory: string
  eligibleSubsidies: string[]
  estimatedAmounts: { [key: string]: number }
}

export class RealDataService {
  private corporateApi: CorporateNumberApiClient
  private estatApi: EStatApiClient
  
  constructor(estatAppId?: string) {
    this.corporateApi = new CorporateNumberApiClient()
    this.estatApi = new EStatApiClient(estatAppId)
  }
  
  /**
   * 法人番号から企業の実データを総合的に取得
   */
  async getCompanyRealData(
    corporateNumber: string
  ): Promise<CompanyRealData> {
    // 法人番号の形式チェック
    if (!CorporateNumberApiClient.isValidCorporateNumber(corporateNumber)) {
      throw new Error('無効な法人番号です')
    }
    
    // 基本情報を取得
    const basicInfo = await this.corporateApi.getByNumber(corporateNumber)
    
    if (!basicInfo) {
      throw new Error('法人番号に該当する企業が見つかりません')
    }
    
    // 並行して各種データを取得
    const [industryStats, minimumWage] = await Promise.all([
      this.getIndustryStatistics(basicInfo),
      this.getRegionalMinimumWage(basicInfo.prefectureCode)
    ])
    
    return {
      basic: basicInfo,
      industryStats: industryStats,
      regionalMinimumWage: minimumWage,
      financial: {
        // TODO: EDINET APIから取得
        revenue: undefined,
        employees: undefined,
        capitalStock: undefined
      },
      intellectualProperty: {
        // TODO: J-PlatPat APIから取得
        patentsCount: undefined,
        trademarksCount: undefined
      }
    }
  }
  
  /**
   * 企業名から候補を検索
   */
  async searchCompany(
    name: string,
    prefecture?: string
  ): Promise<CorporateInfo[]> {
    return await this.corporateApi.searchByName(name, prefecture)
  }
  
  /**
   * 補助金の適格性をチェック
   */
  async checkSubsidyEligibility(
    companyData: CompanyRealData
  ): Promise<SubsidyEligibilityData> {
    const eligibleSubsidies: string[] = []
    const estimatedAmounts: { [key: string]: number } = {}
    
    // 従業員数から企業規模を判定
    const companySize = this.determineCompanySize(
      companyData.industryStats?.numberOfEmployees || 0
    )
    
    // 業種カテゴリを取得
    const industryCategory = this.getIndustryCategory(companyData.basic?.address || '')
    
    // 持続化補助金の適格性チェック
    if (companySize === 'small') {
      eligibleSubsidies.push('sustainability')
      estimatedAmounts['sustainability'] = 500000 // 50万円
    }
    
    // ものづくり補助金の適格性チェック
    if (industryCategory === '製造業' && companySize !== 'large') {
      eligibleSubsidies.push('monozukuri')
      estimatedAmounts['monozukuri'] = 10000000 // 1000万円
    }
    
    // 業務改善助成金の適格性チェック
    if (companyData.regionalMinimumWage) {
      eligibleSubsidies.push('business-improvement')
      estimatedAmounts['business-improvement'] = 3000000 // 300万円
    }
    
    // IT導入補助金の適格性チェック
    if (companySize !== 'large') {
      eligibleSubsidies.push('it-subsidy')
      estimatedAmounts['it-subsidy'] = 4500000 // 450万円
    }
    
    // 事業再構築補助金の適格性チェック
    if (companySize !== 'large') {
      eligibleSubsidies.push('reconstruction')
      estimatedAmounts['reconstruction'] = 60000000 // 6000万円
    }
    
    return {
      companySize,
      industryCategory,
      eligibleSubsidies,
      estimatedAmounts
    }
  }
  
  /**
   * 申請書作成に必要なデータを整形
   */
  formatForApplication(companyData: CompanyRealData): any {
    return {
      // 企業基本情報
      companyName: companyData.basic?.name || '',
      corporateNumber: companyData.basic?.corporateNumber || '',
      postalCode: companyData.basic?.postalCode || '',
      address: companyData.basic?.address || '',
      
      // 業界情報
      industryType: companyData.industryStats?.industryName || '',
      industryAverageEmployees: companyData.industryStats?.numberOfEmployees || 0,
      industryAverageSales: companyData.industryStats?.salesAmount || 0,
      
      // 地域情報
      prefecture: this.getPrefectureName(companyData.basic?.prefectureCode || ''),
      regionalMinimumWage: companyData.regionalMinimumWage || 0,
      
      // 企業規模
      companySize: this.determineCompanySize(
        companyData.industryStats?.numberOfEmployees || 0
      ),
      
      // タイムスタンプ
      dataFetchedAt: new Date().toISOString()
    }
  }
  
  /**
   * 業種別統計を取得
   */
  private async getIndustryStatistics(
    basicInfo: CorporateInfo
  ): Promise<IndustryStatistics | null> {
    // 住所から業種を推定（実際は業種コードをDBに保持すべき）
    const industryCode = this.estimateIndustryCode(basicInfo.name)
    
    return await this.estatApi.getIndustryStatistics(
      industryCode,
      basicInfo.prefectureCode
    )
  }
  
  /**
   * 地域の最低賃金を取得
   */
  private async getRegionalMinimumWage(
    prefectureCode?: string
  ): Promise<number | null> {
    if (!prefectureCode) return null
    
    return await this.estatApi.getMinimumWage(prefectureCode)
  }
  
  /**
   * 従業員数から企業規模を判定
   */
  private determineCompanySize(employees: number): 'small' | 'medium' | 'large' {
    if (employees <= 20) return 'small'
    if (employees <= 300) return 'medium'
    return 'large'
  }
  
  /**
   * 企業名から業種コードを推定（簡易版）
   */
  private estimateIndustryCode(companyName: string): string {
    if (companyName.includes('製造') || companyName.includes('工業')) return 'E'
    if (companyName.includes('建設') || companyName.includes('工務')) return 'D'
    if (companyName.includes('運輸') || companyName.includes('物流')) return 'H'
    if (companyName.includes('商事') || companyName.includes('商会')) return 'I'
    if (companyName.includes('サービス')) return 'R'
    
    return 'R' // デフォルトはサービス業
  }
  
  /**
   * 住所から業種カテゴリを取得
   */
  private getIndustryCategory(address: string): string {
    // 実際は業種コードから判定すべき
    return 'サービス業'
  }
  
  /**
   * 都道府県コードから都道府県名を取得
   */
  private getPrefectureName(code: string): string {
    const prefectureMap: { [key: string]: string } = {
      '01': '北海道', '02': '青森県', '03': '岩手県', '04': '宮城県',
      '05': '秋田県', '06': '山形県', '07': '福島県', '08': '茨城県',
      '09': '栃木県', '10': '群馬県', '11': '埼玉県', '12': '千葉県',
      '13': '東京都', '14': '神奈川県', '15': '新潟県', '16': '富山県',
      '17': '石川県', '18': '福井県', '19': '山梨県', '20': '長野県',
      '21': '岐阜県', '22': '静岡県', '23': '愛知県', '24': '三重県',
      '25': '滋賀県', '26': '京都府', '27': '大阪府', '28': '兵庫県',
      '29': '奈良県', '30': '和歌山県', '31': '鳥取県', '32': '島根県',
      '33': '岡山県', '34': '広島県', '35': '山口県', '36': '徳島県',
      '37': '香川県', '38': '愛媛県', '39': '高知県', '40': '福岡県',
      '41': '佐賀県', '42': '長崎県', '43': '熊本県', '44': '大分県',
      '45': '宮崎県', '46': '鹿児島県', '47': '沖縄県'
    }
    
    return prefectureMap[code] || '不明'
  }
}