/**
 * 法人番号API サービス
 * 国税庁の法人番号公表サイトAPIを利用して企業情報を取得
 */

import { logger } from '@/utils/logger'
import { showError } from '@/utils/error-handler'

export interface CorporateInfo {
  corporateNumber: string
  name: string
  nameKana?: string
  postalCode?: string
  address?: string
  addressKana?: string
  prefectureCode?: string
  cityCode?: string
  status?: string
  closeDate?: string
  closeCause?: string
  successorCorporateNumber?: string
  changeCause?: string
  assignmentDate?: string
  updateDate?: string
}

class CorporateNumberService {
  private readonly API_BASE_URL = 'https://api.houjin-bangou.nta.go.jp'
  private readonly API_VERSION = '4'
  
  /**
   * 法人番号から企業情報を取得
   */
  async getCorporateInfo(corporateNumber: string): Promise<CorporateInfo | null> {
    // 法人番号の正規化（ハイフンやスペースを除去）
    const normalizedNumber = corporateNumber.replace(/[-\s]/g, '')
    
    // 法人番号の検証（13桁の数字）
    if (!/^\d{13}$/.test(normalizedNumber)) {
      throw new Error('法人番号は13桁の数字である必要があります')
    }
    
    logger.info('法人番号API呼び出し開始', { corporateNumber: normalizedNumber })
    
    // 直接APIを呼ぶとCORSエラーになるため、常にプロキシ経由で呼び出す
    return this.getCorporateInfoViaProxy(corporateNumber)
  }
  
  /**
   * サーバーサイドプロキシ経由で企業情報を取得
   */
  private async getCorporateInfoViaProxy(corporateNumber: string): Promise<CorporateInfo | null> {
    try {
      const normalizedNumber = corporateNumber.replace(/[-\s]/g, '')
      
      const response = await fetch('/api/corporate-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ corporateNumber: normalizedNumber }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'APIエラー' }))
        throw new Error(errorData.message || 'APIエラー')
      }
      
      const result = await response.json()
      logger.info('プロキシAPI レスポンス', result)
      
      // APIレスポンスの構造に応じて調整
      if (result.success && result.data) {
        return result.data
      }
      
      return null
      
    } catch (error) {
      logger.error('プロキシAPI エラー', error)
      return null
    }
  }
  
  /**
   * 住所のフォーマット
   */
  private formatAddress(corp: any): string {
    const parts = []
    if (corp.prefectureName) parts.push(corp.prefectureName)
    if (corp.cityName) parts.push(corp.cityName)
    if (corp.streetNumber) parts.push(corp.streetNumber)
    if (corp.addressOutside) parts.push(corp.addressOutside)
    return parts.join('')
  }
  
  /**
   * 住所カナのフォーマット
   */
  private formatAddressKana(corp: any): string {
    const parts = []
    if (corp.prefectureNameKana) parts.push(corp.prefectureNameKana)
    if (corp.cityNameKana) parts.push(corp.cityNameKana)
    if (corp.streetNumberKana) parts.push(corp.streetNumberKana)
    return parts.join('')
  }
  
  /**
   * 法人番号のチェックデジット検証
   */
  validateCorporateNumber(corporateNumber: string): boolean {
    const normalized = corporateNumber.replace(/[-\s]/g, '')
    
    if (!/^\d{13}$/.test(normalized)) {
      return false
    }
    
    // チェックデジット計算
    let sum = 0
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(normalized.charAt(i))
      sum += digit * ((i % 2) + 1)
    }
    
    const checkDigit = (9 - (sum % 9)) % 9
    return checkDigit === parseInt(normalized.charAt(12))
  }
}

// シングルトンインスタンス
export const corporateNumberService = new CorporateNumberService()