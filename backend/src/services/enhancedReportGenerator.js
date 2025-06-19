/**
 * Enhanced Report Generator
 * Professional-grade reporting with multiple formats and detailed analytics
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/report-generation.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Report configuration
const REPORT_CONFIG = {
  OUTPUT_DIR: process.env.REPORT_OUTPUT_DIR || './generated-reports',
  TEMPLATE_DIR: './report-templates',
  DEFAULT_FORMAT: 'pdf',
  SUPPORTED_FORMATS: ['pdf', 'html', 'docx'],
  MAX_CONCURRENT_GENERATION: 3,
  
  PDF_OPTIONS: {
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `
  },
  
  BROWSER_OPTIONS: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    timeout: 60000
  }
};

// Ensure output directory exists
async function ensureOutputDirectory() {
  try {
    await fs.mkdir(REPORT_CONFIG.OUTPUT_DIR, { recursive: true });
    await fs.mkdir(path.join(REPORT_CONFIG.OUTPUT_DIR, 'pdf'), { recursive: true });
    await fs.mkdir(path.join(REPORT_CONFIG.OUTPUT_DIR, 'html'), { recursive: true });
    await fs.mkdir(path.join(REPORT_CONFIG.OUTPUT_DIR, 'temp'), { recursive: true });
  } catch (error) {
    logger.error('Failed to create output directories', { error: error.message });
  }
}

ensureOutputDirectory();

/**
 * Report Templates
 */
class ReportTemplates {
  static getApplicationReportTemplate() {
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif;
            line-height: 1.7;
            color: #2d3748;
            background: #ffffff;
        }
        
        .report-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #3182ce;
            padding-bottom: 30px;
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #2b6cb0;
            margin-bottom: 8px;
        }
        
        .header .subtitle {
            font-size: 16px;
            color: #718096;
            font-weight: 300;
        }
        
        .header .meta-info {
            margin-top: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            font-size: 14px;
        }
        
        .meta-item {
            text-align: center;
            padding: 10px;
            background: #f7fafc;
            border-radius: 8px;
        }
        
        .meta-label {
            display: block;
            font-weight: 500;
            color: #4a5568;
            margin-bottom: 4px;
        }
        
        .meta-value {
            display: block;
            font-weight: 700;
            color: #2d3748;
        }
        
        .section {
            margin-bottom: 35px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            page-break-inside: avoid;
        }
        
        .section-header {
            background: linear-gradient(90deg, #4299e1 0%, #3182ce 100%);
            color: white;
            padding: 16px 24px;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
        }
        
        .section-header::before {
            content: '';
            width: 4px;
            height: 20px;
            background: rgba(255,255,255,0.8);
            margin-right: 12px;
            border-radius: 2px;
        }
        
        .section-content {
            padding: 24px;
            background: #ffffff;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .info-item {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #4299e1;
        }
        
        .info-label {
            font-size: 13px;
            font-weight: 600;
            color: #4a5568;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        
        .info-value {
            font-size: 16px;
            font-weight: 500;
            color: #2d3748;
            word-break: break-word;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-draft { 
            background: #fed7d7; 
            color: #c53030; 
            border: 1px solid #fc8181;
        }
        .status-submitted { 
            background: #bee3f8; 
            color: #2b6cb0; 
            border: 1px solid #63b3ed;
        }
        .status-approved { 
            background: #c6f6d5; 
            color: #38a169; 
            border: 1px solid #68d391;
        }
        .status-rejected { 
            background: #fed7d7; 
            color: #e53e3e; 
            border: 1px solid #fc8181;
        }
        
        .amount-highlight {
            text-align: center;
            padding: 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
            margin: 20px 0;
        }
        
        .amount-label {
            font-size: 14px;
            font-weight: 500;
            opacity: 0.9;
            margin-bottom: 8px;
        }
        
        .amount-value {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        
        .content-text {
            line-height: 1.8;
            padding: 20px;
            background: #f7fafc;
            border-radius: 8px;
            border-left: 4px solid #4299e1;
            margin: 16px 0;
            white-space: pre-wrap;
        }
        
        .analysis-section {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 24px;
            border-radius: 12px;
            margin: 20px 0;
        }
        
        .analysis-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .score-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 16px;
            margin: 20px 0;
        }
        
        .score-item {
            background: rgba(255,255,255,0.15);
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        
        .score-label {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 8px;
        }
        
        .score-value {
            font-size: 24px;
            font-weight: 700;
        }
        
        .suggestions-list {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 8px;
            margin-top: 16px;
        }
        
        .suggestions-list h4 {
            margin-bottom: 12px;
            font-size: 16px;
        }
        
        .suggestions-list ul {
            list-style: none;
            padding: 0;
        }
        
        .suggestions-list li {
            padding: 8px 0;
            padding-left: 20px;
            position: relative;
        }
        
        .suggestions-list li::before {
            content: '💡';
            position: absolute;
            left: 0;
        }
        
        .timeline {
            position: relative;
            padding-left: 30px;
        }
        
        .timeline::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #4299e1;
        }
        
        .timeline-item {
            position: relative;
            margin-bottom: 20px;
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -22px;
            top: 20px;
            width: 12px;
            height: 12px;
            background: #4299e1;
            border-radius: 50%;
            border: 3px solid white;
        }
        
        .timeline-date {
            font-size: 12px;
            color: #718096;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .timeline-content {
            font-size: 14px;
            color: #2d3748;
        }
        
        .signature-section {
            margin-top: 50px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            page-break-inside: avoid;
        }
        
        .signature-box {
            border: 2px solid #e2e8f0;
            padding: 30px;
            text-align: center;
            border-radius: 12px;
            background: #f8fafc;
        }
        
        .signature-title {
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 20px;
            font-size: 16px;
        }
        
        .signature-line {
            border-bottom: 2px solid #4a5568;
            height: 50px;
            margin: 25px 0;
            position: relative;
        }
        
        .signature-name {
            font-size: 14px;
            color: #718096;
            margin-top: 10px;
        }
        
        .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #718096;
            font-size: 12px;
            page-break-inside: avoid;
        }
        
        .footer-logo {
            font-weight: 700;
            color: #4299e1;
            margin-bottom: 8px;
        }
        
        @media print {
            body { margin: 0; }
            .section { break-inside: avoid; }
            .signature-section { break-inside: avoid; }
            .footer { break-inside: avoid; }
        }
        
        @page {
            margin: 2cm;
            @bottom-center {
                content: counter(page) " / " counter(pages);
                font-size: 10px;
                color: #666;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        {{content}}
    </div>
</body>
</html>`;
  }
  
  static getAnalysisReportTemplate() {
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap');
        
        body {
            font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: #f7fafc;
            margin: 0;
            padding: 20px;
        }
        
        .analysis-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .hero-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .hero-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 12px;
        }
        
        .hero-subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 30px;
        }
        
        .score-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .score-card {
            background: rgba(255,255,255,0.15);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        
        .score-number {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .score-label {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .content-section {
            padding: 40px;
        }
        
        .section-title {
            font-size: 24px;
            font-weight: 600;
            color: #2b6cb0;
            margin-bottom: 24px;
            border-bottom: 3px solid #4299e1;
            padding-bottom: 8px;
        }
        
        .chart-container {
            background: #f8fafc;
            padding: 24px;
            border-radius: 12px;
            margin: 20px 0;
            border: 1px solid #e2e8f0;
        }
        
        .progress-bar {
            background: #e2e8f0;
            height: 12px;
            border-radius: 6px;
            overflow: hidden;
            margin: 8px 0;
        }
        
        .progress-fill {
            height: 100%;
            border-radius: 6px;
            transition: width 0.3s ease;
        }
        
        .recommendations-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .recommendation-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #4299e1;
        }
        
        .recommendation-title {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 8px;
        }
        
        .recommendation-text {
            color: #4a5568;
            font-size: 14px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="analysis-container">
        {{content}}
    </div>
</body>
</html>`;
  }
}

/**
 * Report Generator Class
 */
class ReportGenerator {
  constructor() {
    this.browser = null;
    this.currentJobs = 0;
  }
  
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch(REPORT_CONFIG.BROWSER_OPTIONS);
      logger.info('Browser initialized for report generation');
    }
    return this.browser;
  }
  
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed');
    }
  }
  
  /**
   * Generate comprehensive application report
   */
  async generateApplicationReport(applicationData, userData, analysisData = null, options = {}) {
    const reportId = `app_report_${applicationData.id}_${Date.now()}`;
    const startTime = Date.now();
    
    try {
      logger.info('Starting application report generation', { reportId, applicationId: applicationData.id });
      
      // Generate content sections
      const content = this.buildApplicationContent(applicationData, userData, analysisData);
      
      // Apply template
      const template = ReportTemplates.getApplicationReportTemplate();
      const html = template
        .replace('{{title}}', `補助金申請書 - ${applicationData.projectTitle}`)
        .replace('{{content}}', content);
      
      // Generate PDF
      const result = await this.generatePDF(html, {
        filename: `${reportId}.pdf`,
        ...options
      });
      
      const duration = Date.now() - startTime;
      logger.info('Application report generated successfully', { 
        reportId, 
        duration,
        fileSize: result.size 
      });
      
      return {
        ...result,
        reportId,
        type: 'application',
        duration,
        metadata: {
          applicationId: applicationData.id,
          userId: userData.id,
          generatedAt: new Date().toISOString(),
          includesAnalysis: !!analysisData
        }
      };
      
    } catch (error) {
      logger.error('Application report generation failed', { 
        reportId, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * Generate AI analysis report
   */
  async generateAnalysisReport(analysisData, applicationData, options = {}) {
    const reportId = `analysis_report_${Date.now()}`;
    const startTime = Date.now();
    
    try {
      logger.info('Starting analysis report generation', { reportId });
      
      const content = this.buildAnalysisContent(analysisData, applicationData);
      
      const template = ReportTemplates.getAnalysisReportTemplate();
      const html = template
        .replace('{{title}}', `AI分析レポート - ${applicationData.projectTitle}`)
        .replace('{{content}}', content);
      
      const result = await this.generatePDF(html, {
        filename: `${reportId}.pdf`,
        ...options
      });
      
      const duration = Date.now() - startTime;
      logger.info('Analysis report generated successfully', { 
        reportId, 
        duration,
        fileSize: result.size 
      });
      
      return {
        ...result,
        reportId,
        type: 'analysis',
        duration,
        metadata: {
          applicationId: applicationData.id,
          analysisScore: analysisData.totalScore,
          generatedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      logger.error('Analysis report generation failed', { 
        reportId, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * Generate portfolio report (multiple applications)
   */
  async generatePortfolioReport(applications, userData, options = {}) {
    const reportId = `portfolio_report_${userData.id}_${Date.now()}`;
    const startTime = Date.now();
    
    try {
      logger.info('Starting portfolio report generation', { 
        reportId, 
        applicationCount: applications.length 
      });
      
      const content = this.buildPortfolioContent(applications, userData);
      
      const template = ReportTemplates.getApplicationReportTemplate();
      const html = template
        .replace('{{title}}', `申請ポートフォリオレポート - ${userData.companyName}`)
        .replace('{{content}}', content);
      
      const result = await this.generatePDF(html, {
        filename: `${reportId}.pdf`,
        ...options
      });
      
      const duration = Date.now() - startTime;
      logger.info('Portfolio report generated successfully', { 
        reportId, 
        duration,
        fileSize: result.size 
      });
      
      return {
        ...result,
        reportId,
        type: 'portfolio',
        duration,
        metadata: {
          userId: userData.id,
          applicationCount: applications.length,
          generatedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      logger.error('Portfolio report generation failed', { 
        reportId, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * Core PDF generation
   */
  async generatePDF(html, options = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfOptions = {
        ...REPORT_CONFIG.PDF_OPTIONS,
        ...options
      };
      
      const pdfBuffer = await page.pdf(pdfOptions);
      
      // Save to file if filename provided
      let filepath = null;
      if (options.filename) {
        filepath = path.join(REPORT_CONFIG.OUTPUT_DIR, 'pdf', options.filename);
        await fs.writeFile(filepath, pdfBuffer);
      }
      
      return {
        success: true,
        buffer: pdfBuffer,
        size: pdfBuffer.length,
        filepath,
        filename: options.filename
      };
      
    } finally {
      await page.close();
    }
  }
  
  /**
   * Build application content
   */
  buildApplicationContent(applicationData, userData, analysisData) {
    let content = `
      <div class="header">
        <h1>補助金申請書</h1>
        <div class="subtitle">AI補助金申請システム</div>
        <div class="meta-info">
          <div class="meta-item">
            <span class="meta-label">申請日</span>
            <span class="meta-value">${this.formatDate(applicationData.createdAt)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">最終更新</span>
            <span class="meta-value">${this.formatDate(applicationData.updatedAt)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">ステータス</span>
            <span class="meta-value">
              <span class="status-badge status-${(applicationData.status || 'draft').toLowerCase()}">
                ${this.getStatusText(applicationData.status)}
              </span>
            </span>
          </div>
        </div>
      </div>
      
      <!-- 基本情報 -->
      <div class="section">
        <div class="section-header">申請基本情報</div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">プロジェクト名</div>
              <div class="info-value">${applicationData.projectTitle || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">補助金プログラム</div>
              <div class="info-value">${applicationData.subsidyProgramName || 'N/A'}</div>
            </div>
          </div>
          <div class="amount-highlight">
            <div class="amount-label">申請金額</div>
            <div class="amount-value">${this.formatCurrency(applicationData.requestedAmount || 0)}</div>
          </div>
        </div>
      </div>
      
      <!-- 申請者情報 -->
      <div class="section">
        <div class="section-header">申請者情報</div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">会社名</div>
              <div class="info-value">${userData.companyName || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">代表者名</div>
              <div class="info-value">${userData.representativeName || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">業界</div>
              <div class="info-value">${userData.industry || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">従業員数</div>
              <div class="info-value">${userData.employeeCount || 'N/A'}名</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 事業計画 -->
      <div class="section">
        <div class="section-header">事業計画</div>
        <div class="section-content">
          ${this.renderBusinessPlan(applicationData.businessPlan)}
        </div>
      </div>
    `;
    
    // Add analysis section if available
    if (analysisData) {
      content += this.buildAnalysisSection(analysisData);
    }
    
    // Add signature section
    content += `
      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-title">申請者署名</div>
          <div class="signature-line"></div>
          <div class="signature-name">${userData.representativeName || ''}</div>
        </div>
        <div class="signature-box">
          <div class="signature-title">申請日</div>
          <div class="signature-line"></div>
          <div class="signature-name">${this.formatDate(new Date())}</div>
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-logo">AI補助金申請システム</div>
        <p>本申請書はAI技術により生成されました</p>
        <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
      </div>
    `;
    
    return content;
  }
  
  /**
   * Build analysis content
   */
  buildAnalysisContent(analysisData, applicationData) {
    return `
      <div class="hero-section">
        <div class="hero-title">AI分析レポート</div>
        <div class="hero-subtitle">${applicationData.projectTitle}</div>
        <div class="score-overview">
          <div class="score-card">
            <div class="score-number">${analysisData.totalScore || 0}</div>
            <div class="score-label">総合スコア</div>
          </div>
          <div class="score-card">
            <div class="score-number">${analysisData.adoptionProbability || 'N/A'}</div>
            <div class="score-label">採択可能性</div>
          </div>
          <div class="score-card">
            <div class="score-number">${analysisData.confidence || 'N/A'}</div>
            <div class="score-label">信頼度</div>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <div class="section-title">詳細評価</div>
        <div class="chart-container">
          ${this.buildScoreChart(analysisData.breakdown)}
        </div>
        
        <div class="section-title">改善提案</div>
        <div class="recommendations-grid">
          ${(analysisData.recommendations || []).map(rec => `
            <div class="recommendation-card">
              <div class="recommendation-title">${rec.section || '改善提案'}</div>
              <div class="recommendation-text">${rec.suggestion || rec}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="section-title">強み・特徴</div>
        <div class="content-text">
          ${(analysisData.strengths || []).map(strength => `• ${strength}`).join('\n')}
        </div>
      </div>
    `;
  }
  
  /**
   * Helper methods
   */
  buildScoreChart(breakdown) {
    if (!breakdown) return '<p>評価データがありません</p>';
    
    const categories = {
      feasibility: '実現可能性',
      viability: '事業妥当性',
      effectiveness: '効果性',
      budget: '予算妥当性',
      innovation: '革新性'
    };
    
    return Object.entries(breakdown)
      .map(([key, score]) => `
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 600;">${categories[key] || key}</span>
            <span style="font-weight: 700; color: #4299e1;">${score}/100</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${score}%; background: linear-gradient(90deg, #4299e1, #2b6cb0);"></div>
          </div>
        </div>
      `).join('');
  }
  
  renderBusinessPlan(businessPlan) {
    if (!businessPlan) {
      return '<div class="content-text">事業計画が入力されていません。</div>';
    }
    
    if (typeof businessPlan === 'string') {
      return `<div class="content-text">${businessPlan}</div>`;
    }
    
    const sections = [
      { key: 'companyOverview', title: '会社概要' },
      { key: 'projectDescription', title: 'プロジェクト概要' },
      { key: 'marketAnalysis', title: '市場分析' },
      { key: 'businessPlan', title: '事業計画' },
      { key: 'expectedOutcomes', title: '期待効果' },
      { key: 'budgetPlan', title: '予算計画' },
      { key: 'implementation', title: '実施スケジュール' }
    ];
    
    return sections
      .filter(section => businessPlan[section.key])
      .map(section => `
        <div style="margin-bottom: 24px;">
          <div class="info-label">${section.title}</div>
          <div class="content-text">${businessPlan[section.key]}</div>
        </div>
      `).join('');
  }
  
  buildAnalysisSection(analysisData) {
    return `
      <div class="section">
        <div class="section-header">AI分析結果</div>
        <div class="section-content">
          <div class="analysis-section">
            <div class="analysis-title">採択可能性分析</div>
            <div class="score-grid">
              <div class="score-item">
                <div class="score-label">総合スコア</div>
                <div class="score-value">${analysisData.totalScore || 0}</div>
              </div>
              <div class="score-item">
                <div class="score-label">採択可能性</div>
                <div class="score-value">${analysisData.adoptionProbability || 'N/A'}</div>
              </div>
              <div class="score-item">
                <div class="score-label">信頼度</div>
                <div class="score-value">${analysisData.confidence || 'N/A'}</div>
              </div>
            </div>
            <div class="suggestions-list">
              <h4>改善提案</h4>
              <ul>
                ${(analysisData.recommendations || []).map(rec => 
                  `<li>${rec.suggestion || rec}</li>`
                ).join('')}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  buildPortfolioContent(applications, userData) {
    const stats = this.calculatePortfolioStats(applications);
    
    return `
      <div class="header">
        <h1>申請ポートフォリオレポート</h1>
        <div class="subtitle">${userData.companyName}</div>
        <div class="meta-info">
          <div class="meta-item">
            <span class="meta-label">総申請数</span>
            <span class="meta-value">${applications.length}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">総申請金額</span>
            <span class="meta-value">${this.formatCurrency(stats.totalAmount)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">承認率</span>
            <span class="meta-value">${stats.approvalRate}%</span>
          </div>
        </div>
      </div>
      
      ${applications.map(app => this.buildApplicationSummary(app)).join('')}
      
      <div class="footer">
        <div class="footer-logo">AI補助金申請システム</div>
        <p>ポートフォリオレポート生成日時: ${new Date().toLocaleString('ja-JP')}</p>
      </div>
    `;
  }
  
  buildApplicationSummary(application) {
    return `
      <div class="section">
        <div class="section-header">${application.projectTitle}</div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">申請金額</div>
              <div class="info-value">${this.formatCurrency(application.requestedAmount || 0)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">ステータス</div>
              <div class="info-value">
                <span class="status-badge status-${(application.status || 'draft').toLowerCase()}">
                  ${this.getStatusText(application.status)}
                </span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">申請日</div>
              <div class="info-value">${this.formatDate(application.createdAt)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">最終更新</div>
              <div class="info-value">${this.formatDate(application.updatedAt)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  calculatePortfolioStats(applications) {
    const totalAmount = applications.reduce((sum, app) => sum + (app.requestedAmount || 0), 0);
    const approvedCount = applications.filter(app => app.status === 'APPROVED').length;
    const approvalRate = applications.length > 0 ? Math.round((approvedCount / applications.length) * 100) : 0;
    
    return {
      totalAmount,
      approvalRate,
      approvedCount,
      totalCount: applications.length
    };
  }
  
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
  
  formatCurrency(amount) {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  }
  
  getStatusText(status) {
    const statusMap = {
      'DRAFT': '下書き',
      'SUBMITTED': '提出済み',
      'APPROVED': '承認',
      'REJECTED': '却下'
    };
    return statusMap[status] || '不明';
  }
}

// Global instance
const reportGenerator = new ReportGenerator();

// Cleanup on process exit
process.on('SIGINT', async () => {
  await reportGenerator.closeBrowser();
  process.exit();
});

process.on('SIGTERM', async () => {
  await reportGenerator.closeBrowser();
  process.exit();
});

module.exports = {
  ReportGenerator,
  REPORT_CONFIG,
  reportGenerator
};