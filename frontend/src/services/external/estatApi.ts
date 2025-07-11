/**
 * e-Stat API クライアント
 * 政府統計の総合窓口（e-Stat）が提供する統計データAPI
 * https://www.e-stat.go.jp/api/
 */

export interface StatisticsData {
  id: string
  title: string
  value: number
  unit: string
  time: string
  area?: string
  category?: string
}

export interface IndustryStatistics {
  industryCode: string
  industryName: string
  numberOfCompanies: number
  numberOfEmployees: number
  salesAmount: number
  averageWage?: number
}

export class EStatApiClient {
  private readonly baseUrl = 'https://api.e-stat.go.jp/rest/3.0/app/json'
  private readonly appId: string
  
  constructor(appId?: string) {
    // 環境変数から取得、なければデモ用ID
    this.appId = appId || process.env.NEXT_PUBLIC_ESTAT_APP_ID || 'DEMO_ID'
  }
  
  /**
   * 業種別の統計データを取得
   */
  async getIndustryStatistics(
    industryCode: string,
    prefecture?: string
  ): Promise<IndustryStatistics | null> {
    try {
      // 経済センサス-活動調査のデータID
      const statsDataId = '0003207358' // 2021年経済センサス
      
      const params = new URLSearchParams({
        appId: this.appId,
        statsDataId: statsDataId,
        cdCat01: industryCode, // 産業分類コード
        cdArea: prefecture || '00000', // 都道府県コード（全国は00000）
        limit: '100'
      })
      
      const response = await fetch(
        `${this.baseUrl}/getStatsData?${params}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      )
      
      if (!response.ok) {
        console.error('e-Stat API エラー:', response.statusText)
        return null
      }
      
      const data = await response.json()
      
      if (data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE) {
        const values = data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE
        
        // データから必要な値を抽出
        const result: IndustryStatistics = {
          industryCode: industryCode,
          industryName: this.getIndustryName(industryCode),
          numberOfCompanies: 0,
          numberOfEmployees: 0,
          salesAmount: 0
        }
        
        values.forEach((item: any) => {
          const value = parseFloat(item['$']) || 0
          
          // 項目コードで判別
          switch (item['@cat01']) {
            case '01': // 事業所数
              result.numberOfCompanies = value
              break
            case '02': // 従業者数
              result.numberOfEmployees = value
              break
            case '03': // 売上高（百万円）
              result.salesAmount = value * 1000000
              break
          }
        })
        
        return result
      }
      
      return null
    } catch (error) {
      console.error('業種別統計取得エラー:', error)
      return null
    }
  }
  
  /**
   * 地域別の経済指標を取得
   */
  async getRegionalEconomicIndicators(
    prefectureCode: string
  ): Promise<StatisticsData[]> {
    try {
      // 県民経済計算のデータID
      const statsDataId = '0003207357'
      
      const params = new URLSearchParams({
        appId: this.appId,
        statsDataId: statsDataId,
        cdArea: prefectureCode,
        limit: '100'
      })
      
      const response = await fetch(
        `${this.baseUrl}/getStatsData?${params}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      )
      
      if (!response.ok) {
        return []
      }
      
      const data = await response.json()
      const results: StatisticsData[] = []
      
      if (data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE) {
        const values = data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE
        
        values.forEach((item: any) => {
          results.push({
            id: item['@cat01'],
            title: this.getIndicatorName(item['@cat01']),
            value: parseFloat(item['$']) || 0,
            unit: item['@unit'] || '円',
            time: item['@time'] || '',
            area: prefectureCode
          })
        })
      }
      
      return results
    } catch (error) {
      console.error('地域経済指標取得エラー:', error)
      return []
    }
  }
  
  /**
   * 最低賃金データを取得
   */
  async getMinimumWage(prefectureCode: string): Promise<number | null> {
    try {
      // 最低賃金統計のデータID
      const statsDataId = '0003207359'
      
      const params = new URLSearchParams({
        appId: this.appId,
        statsDataId: statsDataId,
        cdArea: prefectureCode,
        limit: '1'
      })
      
      const response = await fetch(
        `${this.baseUrl}/getStatsData?${params}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      )
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      
      if (data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE?.[0]) {
        return parseFloat(data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE[0]['$']) || null
      }
      
      return null
    } catch (error) {
      console.error('最低賃金取得エラー:', error)
      return null
    }
  }
  
  /**
   * 統計データの検索
   */
  async searchStatistics(keyword: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        appId: this.appId,
        searchWord: keyword,
        limit: '20'
      })
      
      const response = await fetch(
        `${this.baseUrl}/getStatsList?${params}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      )
      
      if (!response.ok) {
        return []
      }
      
      const data = await response.json()
      
      if (data.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF) {
        return Array.isArray(data.GET_STATS_LIST.DATALIST_INF.TABLE_INF)
          ? data.GET_STATS_LIST.DATALIST_INF.TABLE_INF
          : [data.GET_STATS_LIST.DATALIST_INF.TABLE_INF]
      }
      
      return []
    } catch (error) {
      console.error('統計検索エラー:', error)
      return []
    }
  }
  
  /**
   * 業種コードから業種名を取得
   */
  private getIndustryName(code: string): string {
    const industryMap: { [key: string]: string } = {
      'A': '農業，林業',
      'B': '漁業',
      'C': '鉱業，採石業，砂利採取業',
      'D': '建設業',
      'E': '製造業',
      'F': '電気・ガス・熱供給・水道業',
      'G': '情報通信業',
      'H': '運輸業，郵便業',
      'I': '卸売業，小売業',
      'J': '金融業，保険業',
      'K': '不動産業，物品賃貸業',
      'L': '学術研究，専門・技術サービス業',
      'M': '宿泊業，飲食サービス業',
      'N': '生活関連サービス業，娯楽業',
      'O': '教育，学習支援業',
      'P': '医療，福祉',
      'Q': '複合サービス事業',
      'R': 'サービス業（他に分類されないもの）'
    }
    
    return industryMap[code] || '不明'
  }
  
  /**
   * 指標コードから指標名を取得
   */
  private getIndicatorName(code: string): string {
    const indicatorMap: { [key: string]: string } = {
      '01': '県内総生産',
      '02': '一人当たり県民所得',
      '03': '民間最終消費支出',
      '04': '民間企業設備投資',
      '05': '雇用者報酬'
    }
    
    return indicatorMap[code] || '経済指標'
  }
}