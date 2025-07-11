/**
 * 法人番号API クライアント
 * 国税庁が提供する無料の法人番号検索API
 * https://www.houjin-bangou.nta.go.jp/webapi/
 */

export interface CorporateInfo {
  corporateNumber: string
  name: string
  nameKana?: string
  postalCode?: string
  address: string
  addressKana?: string
  prefectureCode?: string
  cityCode?: string
  status: number
  updateDate: string
  changeDate?: string
  closedDate?: string
  closedReason?: string
}

export class CorporateNumberApiClient {
  private readonly baseUrl = 'https://api.houjin-bangou.nta.go.jp/4'
  
  /**
   * 法人番号から企業情報を取得
   */
  async getByNumber(corporateNumber: string): Promise<CorporateInfo | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/num?id=${corporateNumber}&type=12`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      )
      
      if (!response.ok) {
        console.error('法人番号API エラー:', response.statusText)
        return null
      }
      
      const data = await response.json()
      
      if (!data || data.length === 0) {
        return null
      }
      
      const corp = data[0]
      
      return {
        corporateNumber: corp['法人番号'],
        name: corp['商号又は名称'],
        nameKana: corp['商号又は名称カナ'],
        postalCode: corp['郵便番号'],
        address: this.formatAddress(corp),
        addressKana: this.formatAddressKana(corp),
        prefectureCode: corp['都道府県コード'],
        cityCode: corp['市区町村コード'],
        status: corp['処理区分'],
        updateDate: corp['更新年月日'],
        changeDate: corp['変更年月日'],
        closedDate: corp['閉鎖年月日'],
        closedReason: corp['閉鎖理由']
      }
    } catch (error) {
      console.error('法人番号検索エラー:', error)
      return null
    }
  }
  
  /**
   * 企業名から法人番号を検索
   */
  async searchByName(name: string, prefecture?: string): Promise<CorporateInfo[]> {
    try {
      let url = `${this.baseUrl}/name?name=${encodeURIComponent(name)}&type=12&mode=2`
      
      if (prefecture) {
        url += `&prefecture=${encodeURIComponent(prefecture)}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.error('法人番号API エラー:', response.statusText)
        return []
      }
      
      const data = await response.json()
      
      if (!data || !Array.isArray(data)) {
        return []
      }
      
      return data.map(corp => ({
        corporateNumber: corp['法人番号'],
        name: corp['商号又は名称'],
        nameKana: corp['商号又は名称カナ'],
        postalCode: corp['郵便番号'],
        address: this.formatAddress(corp),
        addressKana: this.formatAddressKana(corp),
        prefectureCode: corp['都道府県コード'],
        cityCode: corp['市区町村コード'],
        status: corp['処理区分'],
        updateDate: corp['更新年月日'],
        changeDate: corp['変更年月日'],
        closedDate: corp['閉鎖年月日'],
        closedReason: corp['閉鎖理由']
      }))
    } catch (error) {
      console.error('法人名検索エラー:', error)
      return []
    }
  }
  
  /**
   * 住所フォーマット
   */
  private formatAddress(corp: any): string {
    const parts = []
    
    if (corp['都道府県']) parts.push(corp['都道府県'])
    if (corp['市区町村']) parts.push(corp['市区町村'])
    if (corp['丁目番地等']) parts.push(corp['丁目番地等'])
    
    // 国外住所の場合
    if (corp['国外住所']) {
      parts.push(corp['国外住所'])
    }
    
    return parts.join('')
  }
  
  /**
   * 住所カナフォーマット
   */
  private formatAddressKana(corp: any): string {
    const parts = []
    
    if (corp['都道府県カナ']) parts.push(corp['都道府県カナ'])
    if (corp['市区町村カナ']) parts.push(corp['市区町村カナ'])
    if (corp['丁目番地等カナ']) parts.push(corp['丁目番地等カナ'])
    
    return parts.join('')
  }
  
  /**
   * 法人番号の形式チェック
   */
  static isValidCorporateNumber(number: string): boolean {
    // 13桁の数字であることをチェック
    if (!/^\d{13}$/.test(number)) {
      return false
    }
    
    // チェックデジット検証
    const digits = number.split('').map(Number)
    const checkDigit = digits[0]
    
    let sum = 0
    for (let i = 1; i < 13; i++) {
      const p = i % 2 === 0 ? 1 : 2
      sum += digits[i] * p
    }
    
    const calculated = 9 - (sum % 9)
    
    return checkDigit === calculated
  }
}