/**
 * 法人番号API プロキシエンドポイント
 * CORSを回避するためのサーバーサイドプロキシ
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApiResponseBuilder } from '@/types/api'
import { logger } from '@/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const { corporateNumber } = await request.json()
    
    // 入力検証
    if (!corporateNumber || !/^\d{13}$/.test(corporateNumber)) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'VALIDATION_ERROR',
          '有効な13桁の法人番号を入力してください'
        ),
        { status: 400 }
      )
    }
    
    logger.info('法人番号APIプロキシ リクエスト', { corporateNumber })
    
    // テスト用のモックデータ
    // TODO: 本番環境では国税庁APIを使用
    const mockData: Record<string, any> = {
      '1234567890123': {
        corporateNumber: '1234567890123',
        name: '株式会社サンプル',
        nameKana: 'カブシキガイシャサンプル',
        postalCode: '100-0001',
        address: '東京都千代田区千代田１−１−１',
      },
      '9876543210987': {
        corporateNumber: '9876543210987',
        name: '有限会社テスト',
        nameKana: 'ユウゲンガイシャテスト',
        postalCode: '150-0001',
        address: '東京都渋谷区神宮前１−５−８',
      },
    }
    
    // モックデータから取得
    const corporateInfo = mockData[corporateNumber]
    
    if (!corporateInfo) {
      // モックにない場合はデフォルトを返す
      const defaultInfo = {
        corporateNumber: corporateNumber,
        name: 'テスト企業株式会社',
        nameKana: 'テストキギョウカブシキガイシャ',
        postalCode: '100-0001',
        address: '東京都千代田区千代田１−１',
      }
      
      logger.info('モックデータ返却（デフォルト）', defaultInfo)
      return NextResponse.json(ApiResponseBuilder.success(defaultInfo))
    }
    
    logger.info('モックデータ返却', corporateInfo)
    return NextResponse.json(ApiResponseBuilder.success(corporateInfo))
    
  } catch (error) {
    logger.error('法人番号APIプロキシエラー', error)
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        '企業情報の取得中にエラーが発生しました'
      ),
      { status: 500 }
    )
  }
}

function formatAddress(corp: any): string {
  const parts = []
  if (corp.prefectureName) parts.push(corp.prefectureName)
  if (corp.cityName) parts.push(corp.cityName)
  if (corp.streetNumber) parts.push(corp.streetNumber)
  if (corp.addressOutside) parts.push(corp.addressOutside)
  return parts.join('')
}

function formatAddressKana(corp: any): string {
  const parts = []
  if (corp.prefectureNameKana) parts.push(corp.prefectureNameKana)
  if (corp.cityNameKana) parts.push(corp.cityNameKana)
  if (corp.streetNumberKana) parts.push(corp.streetNumberKana)
  return parts.join('')
}