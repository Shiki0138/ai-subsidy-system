/**
 * PDF生成サービス
 * 申請書をPDF形式で出力
 */

import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs/promises'
import logger from '../config/logger'

interface ApplicationDocument {
  title: string
  sections: {
    summary?: string
    background?: string
    implementation?: string
    expectedEffects?: string
    organizationStructure?: string
    schedule?: string
    budget?: any
    attachments?: string[]
  }
  metadata: {
    generatedAt: Date
    subsidyProgram: any
    companyName: string
    applicationId: string
  }
}

export class PDFGenerationService {
  private browser: puppeteer.Browser | null = null

  /**
   * ブラウザの初期化
   */
  private async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
    return this.browser
  }

  /**
   * 申請書PDFの生成
   */
  async generateApplicationPDF(
    document: ApplicationDocument,
    outputPath: string
  ): Promise<string> {
    try {
      logger.info('PDF生成開始', { 
        applicationId: document.metadata.applicationId,
        title: document.title 
      })

      const browser = await this.initBrowser()
      const page = await browser.newPage()

      // HTMLコンテンツの生成
      const htmlContent = this.generateHTMLContent(document)

      // HTMLを設定
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

      // PDF生成オプション
      const pdfOptions: puppeteer.PDFOptions = {
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: this.generateHeaderTemplate(document),
        footerTemplate: this.generateFooterTemplate()
      }

      // PDFを生成
      const pdfBuffer = await page.pdf(pdfOptions)

      // ファイルを保存
      await fs.writeFile(outputPath, pdfBuffer)

      await page.close()

      logger.info('PDF生成完了', { 
        applicationId: document.metadata.applicationId,
        outputPath 
      })

      return outputPath
    } catch (error) {
      logger.error('PDF生成エラー', { error })
      throw new Error('PDF生成に失敗しました')
    }
  }

  /**
   * HTMLコンテンツの生成
   */
  private generateHTMLContent(document: ApplicationDocument): string {
    const sections = document.sections
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm;
    }
    
    body {
      font-family: 'Noto Sans JP', 'メイリオ', sans-serif;
      line-height: 1.8;
      color: #333;
      font-size: 10.5pt;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    
    h1 {
      font-size: 18pt;
      margin: 0 0 10px 0;
      font-weight: bold;
    }
    
    .subtitle {
      font-size: 14pt;
      color: #666;
      margin: 0;
    }
    
    .metadata {
      text-align: right;
      margin-bottom: 20px;
      font-size: 9pt;
      color: #666;
    }
    
    h2 {
      font-size: 14pt;
      margin: 30px 0 15px 0;
      padding: 8px;
      background-color: #f0f0f0;
      border-left: 4px solid #0066cc;
    }
    
    h3 {
      font-size: 12pt;
      margin: 20px 0 10px 0;
      color: #0066cc;
    }
    
    .section {
      margin-bottom: 25px;
      text-align: justify;
    }
    
    .section p {
      margin: 10px 0;
      text-indent: 1em;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 9.5pt;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    
    .amount {
      text-align: right;
    }
    
    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    
    .attachments {
      margin-top: 30px;
      padding: 15px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
    }
    
    .attachments ul {
      margin: 10px 0;
      padding-left: 25px;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    .highlight {
      background-color: #ffffcc;
      padding: 2px 4px;
    }
    
    .important {
      color: #cc0000;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${document.metadata.subsidyProgram.name}</h1>
    <p class="subtitle">事業計画書</p>
  </div>
  
  <div class="metadata">
    <p>申請者: ${document.metadata.companyName}</p>
    <p>作成日: ${formatDate(document.metadata.generatedAt)}</p>
  </div>
  
  <h1 style="text-align: center; margin: 40px 0;">${document.title}</h1>
  
  ${sections.summary ? `
  <div class="section">
    <h2>1. 事業概要</h2>
    <p>${this.formatText(sections.summary)}</p>
  </div>
  ` : ''}
  
  ${sections.background ? `
  <div class="section">
    <h2>2. 事業実施の背景・目的</h2>
    <p>${this.formatText(sections.background)}</p>
  </div>
  ` : ''}
  
  ${sections.implementation ? `
  <div class="section">
    <h2>3. 事業内容</h2>
    <p>${this.formatText(sections.implementation)}</p>
  </div>
  ` : ''}
  
  ${sections.expectedEffects ? `
  <div class="section">
    <h2>4. 期待される効果</h2>
    <p>${this.formatText(sections.expectedEffects)}</p>
  </div>
  ` : ''}
  
  ${sections.organizationStructure ? `
  <div class="section">
    <h2>5. 実施体制</h2>
    <p>${this.formatText(sections.organizationStructure)}</p>
  </div>
  ` : ''}
  
  ${sections.schedule ? `
  <div class="section">
    <h2>6. 実施スケジュール</h2>
    <p>${this.formatText(sections.schedule)}</p>
  </div>
  ` : ''}
  
  ${sections.budget ? `
  <div class="section">
    <h2>7. 収支計画</h2>
    ${this.generateBudgetTable(sections.budget)}
  </div>
  ` : ''}
  
  ${sections.attachments ? `
  <div class="attachments">
    <h3>添付書類一覧</h3>
    <ul>
      ${sections.attachments.map(doc => `<li>${doc}</li>`).join('')}
    </ul>
  </div>
  ` : ''}
</body>
</html>
    `
  }

  /**
   * 予算テーブルの生成
   */
  private generateBudgetTable(budget: any): string {
    if (typeof budget === 'string') {
      return `<p>${this.formatText(budget)}</p>`
    }

    return `
    <table>
      <thead>
        <tr>
          <th style="width: 30%;">費目</th>
          <th style="width: 50%;">内容</th>
          <th style="width: 20%;" class="amount">金額（円）</th>
        </tr>
      </thead>
      <tbody>
        ${budget.items?.map((item: any) => `
          <tr>
            <td>${item.category}</td>
            <td>${item.description}</td>
            <td class="amount">${item.amount.toLocaleString()}</td>
          </tr>
        `).join('') || ''}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="2">合計</td>
          <td class="amount">${budget.total?.toLocaleString() || '0'}</td>
        </tr>
      </tfoot>
    </table>
    <div style="margin-top: 15px; font-size: 9.5pt;">
      <p>補助率: ${Math.round(budget.subsidyRate * 100)}%</p>
      <p>補助金額: <span class="important">¥${budget.subsidyAmount?.toLocaleString() || '0'}</span></p>
      <p>自己負担額: ¥${budget.selfFunding?.toLocaleString() || '0'}</p>
    </div>
    `
  }

  /**
   * ヘッダーテンプレート
   */
  private generateHeaderTemplate(document: ApplicationDocument): string {
    return `
    <div style="font-size: 9pt; color: #666; width: 100%; padding: 0 15mm;">
      <span>${document.metadata.subsidyProgram.name} - ${document.metadata.companyName}</span>
    </div>
    `
  }

  /**
   * フッターテンプレート
   */
  private generateFooterTemplate(): string {
    return `
    <div style="font-size: 9pt; color: #666; width: 100%; padding: 0 15mm; text-align: center;">
      <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>
    `
  }

  /**
   * テキストのフォーマット
   */
  private formatText(text: string): string {
    return text
      .replace(/\n/g, '<br>')
      .replace(/([0-9]+\.)/g, '<br><strong>$1</strong>')
      .replace(/・/g, '<br>・')
  }

  /**
   * クリーンアップ
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

export default new PDFGenerationService()