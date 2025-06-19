/**
 * PDF生成API
 * 申請書のPDF生成・ダウンロード機能
 */

import { Router, Request, Response } from 'express';
import puppeteer from 'puppeteer';
import { z } from 'zod';
import { prisma, logger } from '../index';
import { 
  asyncHandler, 
  ValidationError, 
  NotFoundError 
} from '../middleware/errorHandler';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// すべてのルートに認証を適用
router.use(authenticate);

/**
 * PDF生成
 * POST /api/applications/:id/pdf
 */
router.post('/:id', asyncHandler(async (req: Request, res: Response) => {
  const applicationId = req.params.id;
  const userId = (req as any).user.userId;
  
  const pdfOptionsSchema = z.object({
    format: z.enum(['A4', 'A3']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    includeWatermark: z.boolean().default(false),
    template: z.enum(['standard', 'modern', 'classic']).default('standard'),
  });
  
  const options = pdfOptionsSchema.parse(req.body);
  
  // 申請書の存在確認と権限チェック
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId,
    },
    include: {
      subsidyProgram: {
        select: {
          name: true,
          category: true,
          maxAmount: true,
        },
      },
      user: {
        select: {
          companyName: true,
          representativeName: true,
          address: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  if (!application) {
    throw new NotFoundError('申請書が見つかりません');
  }

  // PDF生成可能な状態かチェック
  if (!application.generatedContent) {
    throw new ValidationError('申請書の内容が生成されていません');
  }

  try {
    const content = JSON.parse(application.generatedContent);
    
    // HTMLテンプレート生成
    const htmlContent = generateHTMLTemplate(application, content, options);
    
    // Puppeteerブラウザを起動
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    
    // HTMLコンテンツを設定
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });
    
    // PDF生成オプション
    const pdfOptions = {
      format: options.format as 'A4' | 'A3',
      orientation: options.orientation as 'portrait' | 'landscape',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      displayHeaderFooter: true,
      headerTemplate: generateHeaderTemplate(application),
      footerTemplate: generateFooterTemplate(),
    };
    
    // PDFバイナリ生成
    const pdfBuffer = await page.pdf(pdfOptions);
    
    await browser.close();
    
    // PDFファイル名を生成
    const fileName = `${application.subsidyProgram.name}_${application.title}_${new Date().toISOString().split('T')[0]}.pdf`;
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-_]/g, '_');
    
    // PDF生成ログを記録
    await prisma.aiUsageLog.create({
      data: {
        userId,
        applicationId,
        action: 'GENERATE_PDF',
        model: 'PUPPETEER',
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
      },
    });
    
    // PDF生成成功をレスポンス
    res.json({
      success: true,
      message: 'PDF生成が完了しました',
      data: {
        applicationId,
        fileName: sanitizedFileName,
        fileSize: pdfBuffer.length,
        generatedAt: new Date().toISOString(),
        downloadUrl: `/api/applications/${applicationId}/pdf/download`,
      },
    });
    
    // PDFバッファを一時的に保存（実際の実装では S3 などに保存）
    // ここでは簡易的にメモリに保存
    (global as any).pdfCache = (global as any).pdfCache || {};
    (global as any).pdfCache[applicationId] = {
      buffer: pdfBuffer,
      fileName: sanitizedFileName,
      createdAt: new Date(),
    };
    
    logger.info('PDF generated successfully', {
      userId,
      applicationId,
      fileName: sanitizedFileName,
      fileSize: pdfBuffer.length,
    });
    
  } catch (error) {
    logger.error('PDF generation failed', {
      userId,
      applicationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw new Error('PDF生成に失敗しました');
  }
}));

/**
 * PDF ダウンロード
 * GET /api/applications/:id/pdf/download
 */
router.get('/:id/download', asyncHandler(async (req: Request, res: Response) => {
  const applicationId = req.params.id;
  const userId = (req as any).user.userId;
  
  // 申請書の存在確認と権限チェック
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId,
    },
  });

  if (!application) {
    throw new NotFoundError('申請書が見つかりません');
  }
  
  // キャッシュからPDFを取得（実際の実装では S3 などから取得）
  const cachedPdf = (global as any).pdfCache?.[applicationId];
  
  if (!cachedPdf) {
    throw new NotFoundError('PDFファイルが見つかりません。先にPDF生成を実行してください。');
  }
  
  // 24時間以上古いキャッシュは削除
  if (new Date().getTime() - cachedPdf.createdAt.getTime() > 24 * 60 * 60 * 1000) {
    delete (global as any).pdfCache[applicationId];
    throw new NotFoundError('PDFファイルの有効期限が切れています。再度PDF生成を実行してください。');
  }
  
  // PDFをレスポンスとして送信
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(cachedPdf.fileName)}"`);
  res.setHeader('Content-Length', cachedPdf.buffer.length);
  
  res.send(cachedPdf.buffer);
  
  logger.info('PDF downloaded', {
    userId,
    applicationId,
    fileName: cachedPdf.fileName,
  });
}));

/**
 * HTMLテンプレート生成関数
 */
function generateHTMLTemplate(application: any, content: any, options: any): string {
  const baseStyles = `
    <style>
      body {
        font-family: 'Noto Sans JP', 'Hiragino Sans', 'Meiryo', sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 20px;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #333;
        padding-bottom: 20px;
      }
      .title {
        font-size: 20pt;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .subtitle {
        font-size: 14pt;
        color: #666;
      }
      .section {
        margin-bottom: 25px;
        page-break-inside: avoid;
      }
      .section-title {
        font-size: 14pt;
        font-weight: bold;
        color: #2563eb;
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 1px solid #e5e7eb;
      }
      .content {
        margin-left: 10px;
        text-align: justify;
      }
      .company-info {
        background: #f8fafc;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
      }
      .budget-table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
      }
      .budget-table th,
      .budget-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      .budget-table th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 72pt;
        color: rgba(200, 200, 200, 0.5);
        z-index: -1;
        pointer-events: none;
      }
      @page {
        margin: 20mm 15mm;
      }
    </style>
  `;

  const watermark = options.includeWatermark ? '<div class="watermark">DRAFT</div>' : '';

  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${application.subsidyProgram.name} - ${application.title}</title>
      ${baseStyles}
    </head>
    <body>
      ${watermark}
      
      <div class="header">
        <div class="title">${application.subsidyProgram.name}</div>
        <div class="subtitle">申請書</div>
      </div>

      <div class="company-info">
        <h3>申請者情報</h3>
        <p><strong>会社名:</strong> ${application.user.companyName}</p>
        <p><strong>代表者名:</strong> ${application.user.representativeName}</p>
        <p><strong>所在地:</strong> ${application.user.address || '記載なし'}</p>
        <p><strong>電話番号:</strong> ${application.user.phone || '記載なし'}</p>
        <p><strong>メールアドレス:</strong> ${application.user.email}</p>
      </div>

      <div class="section">
        <div class="section-title">1. 事業名</div>
        <div class="content">${application.title}</div>
      </div>

      <div class="section">
        <div class="section-title">2. 事業概要</div>
        <div class="content">${content.projectDescription || '記載なし'}</div>
      </div>

      <div class="section">
        <div class="section-title">3. 事業の目的・背景</div>
        <div class="content">${content.purpose || '記載なし'}</div>
      </div>

      <div class="section">
        <div class="section-title">4. ターゲット市場・顧客</div>
        <div class="content">${content.targetMarket || '記載なし'}</div>
      </div>

      <div class="section">
        <div class="section-title">5. 期待される効果</div>
        <div class="content">${content.expectedEffects || '記載なし'}</div>
      </div>

      <div class="section">
        <div class="section-title">6. 現在の課題</div>
        <div class="content">${content.challenges || '記載なし'}</div>
      </div>

      <div class="section">
        <div class="section-title">7. 新規性・独自性</div>
        <div class="content">${content.innovation || '記載なし'}</div>
      </div>

      <div class="section">
        <div class="section-title">8. 事業予算</div>
        <div class="content">
          <table class="budget-table">
            <tr>
              <th>項目</th>
              <th>金額</th>
            </tr>
            <tr>
              <td>総事業費</td>
              <td>¥${(content.budget || 0).toLocaleString('ja-JP')}</td>
            </tr>
            <tr>
              <td>補助金申請額</td>
              <td>¥${Math.min(content.budget || 0, application.subsidyProgram.maxAmount).toLocaleString('ja-JP')}</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="section">
        <div class="section-title">9. 実施スケジュール</div>
        <div class="content">${content.timeline || '記載なし'}</div>
      </div>

      ${content.generatedSections ? Object.entries(content.generatedSections).map(([key, value]) => `
        <div class="section">
          <div class="section-title">${key}</div>
          <div class="content">${value}</div>
        </div>
      `).join('') : ''}

    </body>
    </html>
  `;
}

/**
 * ヘッダーテンプレート生成
 */
function generateHeaderTemplate(application: any): string {
  return `
    <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 15px;">
      <span>${application.subsidyProgram.name} - ${application.title}</span>
    </div>
  `;
}

/**
 * フッターテンプレート生成
 */
function generateFooterTemplate(): string {
  return `
    <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 15px;">
      <span class="pageNumber"></span> / <span class="totalPages"></span> ページ
      <span style="float: right;">生成日時: ${new Date().toLocaleDateString('ja-JP')}</span>
    </div>
  `;
}

export default router;