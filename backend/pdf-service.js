/**
 * PDF生成サービス
 * 申請書のPDF出力機能
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Mac Silicon対応の設定
const getBrowserOptions = () => {
  const baseOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  };

  // Mac Silicon環境での特別設定
  if (process.platform === 'darwin' && process.arch === 'arm64') {
    baseOptions.args.push('--single-process');
    // Chromeの実行可能パスを指定（必要に応じて）
    const chromePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser'
    ];
    
    for (const chromePath of chromePaths) {
      try {
        require('fs').accessSync(chromePath);
        baseOptions.executablePath = chromePath;
        break;
      } catch (error) {
        // パスが存在しない場合は次を試す
      }
    }
  }

  return baseOptions;
};

/**
 * 申請書HTMLテンプレート生成
 */
function generateApplicationHTML(applicationData, userData) {
  const template = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>補助金申請書 - ${applicationData.projectTitle}</title>
    <style>
        body {
            font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            font-size: 28px;
            margin: 0;
            font-weight: bold;
        }
        .header .subtitle {
            color: #64748b;
            font-size: 14px;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        .section-header {
            background: #f8fafc;
            padding: 15px 20px;
            border-bottom: 1px solid #e2e8f0;
            font-weight: bold;
            color: #1e40af;
            font-size: 16px;
        }
        .section-content {
            padding: 20px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-item {
            display: flex;
            flex-direction: column;
        }
        .info-label {
            font-weight: bold;
            color: #374151;
            margin-bottom: 5px;
            font-size: 14px;
        }
        .info-value {
            color: #1f2937;
            padding: 8px 12px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
        }
        .content-block {
            margin-bottom: 20px;
        }
        .content-text {
            white-space: pre-wrap;
            line-height: 1.8;
            padding: 15px;
            background: #fefefe;
            border-left: 4px solid #2563eb;
            margin: 10px 0;
        }
        .amount {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            text-align: center;
            padding: 15px;
            background: #fef2f2;
            border: 2px solid #fca5a5;
            border-radius: 8px;
            margin: 15px 0;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-draft { background: #fef3c7; color: #92400e; }
        .status-submitted { background: #dbeafe; color: #1e40af; }
        .status-approved { background: #d1fae5; color: #065f46; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        .signature-section {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        .signature-box {
            border: 1px solid #d1d5db;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
        }
        .signature-title {
            font-weight: bold;
            margin-bottom: 15px;
            color: #374151;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            height: 40px;
            margin: 20px 0;
        }
        @media print {
            body { margin: 0; padding: 20px; }
            .section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>補助金申請書</h1>
        <div class="subtitle">AI補助金申請システム</div>
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
                    <div class="info-label">申請状況</div>
                    <div class="info-value">
                        <span class="status-badge status-${(applicationData.status || 'draft').toLowerCase()}">
                            ${getStatusText(applicationData.status)}
                        </span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">申請日</div>
                    <div class="info-value">${formatDate(applicationData.createdAt)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">最終更新</div>
                    <div class="info-value">${formatDate(applicationData.updatedAt)}</div>
                </div>
            </div>
            
            <div class="amount">
                申請金額: ${formatCurrency(applicationData.requestedAmount || 0)}
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
                    <div class="info-label">メールアドレス</div>
                    <div class="info-value">${userData.email || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">電話番号</div>
                    <div class="info-value">${userData.phone || 'N/A'}</div>
                </div>
            </div>
            ${userData.address ? `
            <div class="info-item" style="grid-column: 1/-1;">
                <div class="info-label">住所</div>
                <div class="info-value">${userData.address}</div>
            </div>
            ` : ''}
        </div>
    </div>

    <!-- 事業計画 -->
    <div class="section">
        <div class="section-header">事業計画</div>
        <div class="section-content">
            ${renderBusinessPlan(applicationData.businessPlan)}
        </div>
    </div>

    <!-- 署名欄 -->
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-title">申請者署名</div>
            <div class="signature-line"></div>
            <div>${userData.representativeName || ''}</div>
        </div>
        <div class="signature-box">
            <div class="signature-title">申請日</div>
            <div class="signature-line"></div>
            <div>${formatDate(new Date())}</div>
        </div>
    </div>

    <div class="footer">
        <p>本申請書はAI補助金申請システムにより生成されました</p>
        <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
    </div>
</body>
</html>
  `;

  return template;
}

/**
 * ビジネスプランのレンダリング
 */
function renderBusinessPlan(businessPlan) {
  if (!businessPlan) {
    return '<div class="content-text">事業計画が入力されていません。</div>';
  }

  if (typeof businessPlan === 'string') {
    return `<div class="content-text">${businessPlan}</div>`;
  }

  // JSONオブジェクトの場合
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
      <div class="content-block">
        <div class="info-label">${section.title}</div>
        <div class="content-text">${businessPlan[section.key]}</div>
      </div>
    `).join('');
}

/**
 * ステータステキスト変換
 */
function getStatusText(status) {
  const statusMap = {
    'DRAFT': '下書き',
    'SUBMITTED': '提出済み',
    'APPROVED': '承認',
    'REJECTED': '却下'
  };
  return statusMap[status] || '不明';
}

/**
 * 日付フォーマット
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 金額フォーマット
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount);
}

/**
 * PDF生成メイン関数
 */
async function generateApplicationPDF(applicationData, userData, options = {}) {
  let browser;
  
  try {
    console.log('🔄 PDF生成開始...');
    
    // HTML生成
    const html = generateApplicationHTML(applicationData, userData);
    
    // 新しいBrowser設定を使用
    const launchOptions = getBrowserOptions();
    launchOptions.timeout = 60000; // 60秒タイムアウト

    console.log('🚀 Puppeteer起動設定:', JSON.stringify(launchOptions, null, 2));
    browser = await puppeteer.launch(launchOptions);
    
    const page = await browser.newPage();
    
    // HTMLを設定
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });
    
    // PDF生成オプション
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      ...options
    };
    
    // PDF生成
    const pdfBuffer = await page.pdf(pdfOptions);
    
    console.log(`✅ PDF生成完了 (${Math.round(pdfBuffer.length / 1024)}KB)`);
    
    return {
      success: true,
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      filename: `application_${applicationData.id}_${Date.now()}.pdf`
    };
    
  } catch (error) {
    console.error('PDF生成エラー:', error);
    
    // フォールバック: HTML生成のみ
    const html = generateApplicationHTML(applicationData, userData);
    
    return {
      success: false,
      error: error.message,
      fallbackToHTML: true,
      html: html,
      message: 'PDF生成に失敗しました。HTMLプレビューをご利用ください。'
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * PDF保存（ファイルシステム）
 */
async function savePDF(pdfBuffer, filename) {
  try {
    const outputDir = path.join(__dirname, 'generated-pdfs');
    
    // ディレクトリ作成
    try {
      await fs.access(outputDir);
    } catch {
      await fs.mkdir(outputDir, { recursive: true });
    }
    
    const filepath = path.join(outputDir, filename);
    await fs.writeFile(filepath, pdfBuffer);
    
    return {
      success: true,
      filepath,
      filename
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateApplicationPDF,
  savePDF,
  generateApplicationHTML
};