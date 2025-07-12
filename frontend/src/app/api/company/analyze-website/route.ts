/**
 * 企業ホームページ分析API
 * Webスクレイピングと AI分析による企業情報抽出
 */

import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/services/ai/geminiService'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URLが指定されていません' },
        { status: 400 }
      )
    }

    // URLの形式チェック
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: '無効なURLです' },
        { status: 400 }
      )
    }

    // ホームページをスクレイピング
    const websiteContent = await scrapeWebsite(url)
    
    if (!websiteContent) {
      return NextResponse.json(
        { error: 'ホームページの情報を取得できませんでした' },
        { status: 400 }
      )
    }

    // AIを使用して企業情報を分析・抽出
    const geminiService = new GeminiService()
    const analysis = await geminiService.analyzeCompanyProfile(websiteContent, url)

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('Error analyzing website:', error)
    return NextResponse.json(
      { error: 'ホームページ分析中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * ホームページをスクレイピング
 */
async function scrapeWebsite(url: string): Promise<string | null> {
  try {
    // セキュリティ: 信頼できるドメインのみ許可
    const allowedDomains = ['.co.jp', '.com', '.jp', '.org', '.net']
    const urlObj = new URL(url)
    const isAllowed = allowedDomains.some(domain => urlObj.hostname.endsWith(domain))
    
    if (!isAllowed) {
      throw new Error('許可されていないドメインです')
    }

    // シンプルなフェッチ（本番では Puppeteer や Playwright を使用推奨）
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Subsidy-System/1.0)',
      },
      timeout: 10000, // 10秒タイムアウト
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    
    // HTMLから主要なテキストコンテンツを抽出
    const textContent = extractTextFromHTML(html)
    
    // 2000文字に制限（AI分析のため）
    return textContent.substring(0, 2000)

  } catch (error) {
    console.error('Error scraping website:', error)
    return null
  }
}

/**
 * HTMLからテキストコンテンツを抽出
 */
function extractTextFromHTML(html: string): string {
  // 基本的なHTMLタグを除去してテキストを抽出
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // スクリプト除去
    .replace(/<style[^>]*>.*?<\/style>/gis, '') // スタイル除去
    .replace(/<[^>]*>/g, ' ') // HTMLタグ除去
    .replace(/\s+/g, ' ') // 余分な空白を削除
    .trim()
}