import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// HTMLプレビュー表示関数
export const openHTMLPreview = (applicationData: ApplicationData): void => {
  showHTMLPreview(applicationData).catch(error => {
    console.error('HTMLプレビュー表示エラー:', error)
    // フォールバックとしてHTMLファイルダウンロード
    downloadHTMLFile(applicationData)
  })
}

export interface ApplicationData {
  id: string
  title: string
  subsidyProgramName: string
  subsidyProgramCategory: string
  projectDescription: string
  purpose: string
  targetMarket: string
  expectedEffects: string
  budget: number
  timeline: string
  challenges: string
  innovation: string
  companyName: string
  representativeName: string
  createdAt: string
  status: string
}

// Mac Silicon対応のPDF生成設定
const PDF_CONFIG = {
  format: 'a4' as const,
  orientation: 'portrait' as const,
  unit: 'mm' as const,
  compress: true,
  precision: 16,
  // Mac Silicon最適化
  useCORS: true,
  allowTaint: true,
  scale: 2, // 高解像度対応
  logging: false,
  letterRendering: true,
  foreignObjectRendering: true,
}

export const generateApplicationPDF = async (
  applicationData: ApplicationData,
  elementId?: string
): Promise<void> => {
  try {
    const element = elementId 
      ? document.getElementById(elementId)
      : document.querySelector('.pdf-content')

    if (!element) {
      console.error('PDF生成用の要素が見つかりません。テンプレートを作成します。')
      // テンプレートを作成してPDF生成
      const tempElement = createPDFTemplate(applicationData)
      document.body.appendChild(tempElement)
      
      try {
        await generateApplicationPDFFromElement(tempElement, applicationData)
      } finally {
        document.body.removeChild(tempElement)
      }
      return
    }

    await generateApplicationPDFFromElement(element as HTMLElement, applicationData)
  } catch (error) {
    console.error('PDF生成エラー:', error)
    throw new Error('PDF生成に失敗しました。ブラウザの設定を確認してください。')
  }
}

// 要素からPDFを生成する共通関数
const generateApplicationPDFFromElement = async (
  element: HTMLElement,
  applicationData: ApplicationData
): Promise<void> => {
  // Mac Silicon対応のcanvas設定
  const canvas = await html2canvas(element, {
    ...PDF_CONFIG,
    height: element.scrollHeight,
    width: element.scrollWidth,
  })

  const imgData = canvas.toDataURL('image/png', 1.0)
  
  // A4サイズの設定（mm）
  const pdf = new jsPDF({
    orientation: PDF_CONFIG.orientation,
    unit: PDF_CONFIG.unit,
    format: PDF_CONFIG.format,
    compress: PDF_CONFIG.compress,
  })

  const imgWidth = 210 // A4幅
  const pageHeight = 295 // A4高さ
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  let heightLeft = imgHeight

  let position = 0

  // ページ分割処理
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST')
  heightLeft -= pageHeight

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST')
    heightLeft -= pageHeight
  }

  // ファイル名生成
  const fileName = `申請書_${applicationData.title}_${formatDateForFilename(applicationData.createdAt)}.pdf`
  
  pdf.save(fileName)
}

// テンプレートベースのPDF生成（高品質）
export const generateStyledApplicationPDF = async (
  applicationData: ApplicationData
): Promise<void> => {
  try {
    // 一時的なPDF用要素を作成
    const tempElement = createPDFTemplate(applicationData)
    document.body.appendChild(tempElement)

    try {
      // PDF生成を試行
      await generateApplicationPDF(applicationData, tempElement.id)
    } catch (pdfError) {
      console.warn('PDF生成に失敗しました。HTMLプレビューにフォールバックします:', pdfError)
      // HTMLプレビューとして表示
      await showHTMLPreview(applicationData)
      throw new Error('PDF生成に失敗しました。HTMLプレビューを表示しています。')
    } finally {
      // 一時要素を削除
      document.body.removeChild(tempElement)
    }
  } catch (error) {
    console.error('スタイル付きPDF生成エラー:', error)
    throw error
  }
}

// PDF用テンプレート作成
const createPDFTemplate = (data: ApplicationData): HTMLElement => {
  const template = document.createElement('div')
  template.id = 'pdf-template'
  template.style.cssText = `
    position: absolute;
    left: -9999px;
    top: -9999px;
    width: 210mm;
    padding: 20mm;
    background: white;
    font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif;
    font-size: 12px;
    line-height: 1.6;
    color: #333;
  `

  template.innerHTML = `
    <div class="pdf-content">
      <!-- ヘッダー -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px;">
        <h1 style="font-size: 24px; margin: 0; color: #1F2937;">${data.subsidyProgramName}</h1>
        <h2 style="font-size: 18px; margin: 10px 0 0 0; color: #6B7280;">申請書</h2>
      </div>

      <!-- 基本情報 -->
      <div style="margin-bottom: 25px;">
        <h3 style="background: #F3F4F6; padding: 10px; margin: 0 0 15px 0; border-left: 4px solid #3B82F6;">基本情報</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; width: 30%; font-weight: bold;">事業名</td>
            <td style="padding: 8px; border: 1px solid #E5E7EB;">${data.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold;">申請者</td>
            <td style="padding: 8px; border: 1px solid #E5E7EB;">${data.companyName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold;">代表者</td>
            <td style="padding: 8px; border: 1px solid #E5E7EB;">${data.representativeName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold;">申請日</td>
            <td style="padding: 8px; border: 1px solid #E5E7EB;">${formatDateJP(data.createdAt)}</td>
          </tr>
        </table>
      </div>

      <!-- 事業概要 -->
      <div style="margin-bottom: 25px;">
        <h3 style="background: #F3F4F6; padding: 10px; margin: 0 0 15px 0; border-left: 4px solid #3B82F6;">事業概要</h3>
        <div style="padding: 15px; border: 1px solid #E5E7EB; background: white;">
          ${data.projectDescription.replace(/\n/g, '<br>')}
        </div>
      </div>

      <!-- 事業の目的・背景 -->
      <div style="margin-bottom: 25px;">
        <h3 style="background: #F3F4F6; padding: 10px; margin: 0 0 15px 0; border-left: 4px solid #3B82F6;">事業の目的・背景</h3>
        <div style="padding: 15px; border: 1px solid #E5E7EB; background: white;">
          ${data.purpose.replace(/\n/g, '<br>')}
        </div>
      </div>

      <!-- 市場分析・効果 -->
      <div style="margin-bottom: 25px;">
        <h3 style="background: #F3F4F6; padding: 10px; margin: 0 0 15px 0; border-left: 4px solid #3B82F6;">市場分析・期待される効果</h3>
        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0 0 10px 0; color: #374151;">ターゲット市場</h4>
          <div style="padding: 15px; border: 1px solid #E5E7EB; background: white;">
            ${data.targetMarket.replace(/\n/g, '<br>')}
          </div>
        </div>
        <div>
          <h4 style="margin: 0 0 10px 0; color: #374151;">期待される効果</h4>
          <div style="padding: 15px; border: 1px solid #E5E7EB; background: white;">
            ${data.expectedEffects.replace(/\n/g, '<br>')}
          </div>
        </div>
      </div>

      <!-- 実施計画 -->
      <div style="margin-bottom: 25px;">
        <h3 style="background: #F3F4F6; padding: 10px; margin: 0 0 15px 0; border-left: 4px solid #3B82F6;">実施計画</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; width: 30%; font-weight: bold;">事業予算</td>
            <td style="padding: 8px; border: 1px solid #E5E7EB;">${formatCurrency(data.budget)}</td>
          </tr>
        </table>
        <div>
          <h4 style="margin: 0 0 10px 0; color: #374151;">実施スケジュール</h4>
          <div style="padding: 15px; border: 1px solid #E5E7EB; background: white; white-space: pre-line;">
            ${data.timeline}
          </div>
        </div>
      </div>

      <!-- 課題・新規性 -->
      <div style="margin-bottom: 25px;">
        <h3 style="background: #F3F4F6; padding: 10px; margin: 0 0 15px 0; border-left: 4px solid #3B82F6;">課題・新規性</h3>
        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0 0 10px 0; color: #374151;">現在の課題</h4>
          <div style="padding: 15px; border: 1px solid #E5E7EB; background: white;">
            ${data.challenges.replace(/\n/g, '<br>')}
          </div>
        </div>
        <div>
          <h4 style="margin: 0 0 10px 0; color: #374151;">新規性・独自性</h4>
          <div style="padding: 15px; border: 1px solid #E5E7EB; background: white;">
            ${data.innovation.replace(/\n/g, '<br>')}
          </div>
        </div>
      </div>

      <!-- フッター -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 10px;">
        <p style="margin: 0;">AI補助金申請システムにて生成</p>
        <p style="margin: 5px 0 0 0;">生成日時: ${formatDateTime(new Date().toISOString())}</p>
      </div>
    </div>
  `

  return template
}

// ユーティリティ関数
const formatDateForFilename = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toISOString().split('T')[0].replace(/-/g, '')
}

const formatDateJP = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount)
}

// HTMLプレビュー機能（PDF生成失敗時のフォールバック）
export const showHTMLPreview = async (applicationData: ApplicationData): Promise<void> => {
  const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
  
  if (!previewWindow) {
    throw new Error('ポップアップがブロックされました。ポップアップを許可してください。')
  }

  const htmlContent = createHTMLPreview(applicationData)
  previewWindow.document.write(htmlContent)
  previewWindow.document.close()
}

// HTMLプレビュー用テンプレート作成
const createHTMLPreview = (data: ApplicationData): string => {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>申請書プレビュー - ${data.title}</title>
    <style>
        body {
            font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #3B82F6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1F2937;
            font-size: 28px;
            margin: 0;
            font-weight: bold;
        }
        .header .subtitle {
            color: #6B7280;
            font-size: 14px;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 25px;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            overflow: hidden;
        }
        .section-header {
            background: #F3F4F6;
            padding: 15px 20px;
            border-bottom: 1px solid #E5E7EB;
            font-weight: bold;
            color: #1F2937;
            font-size: 16px;
            border-left: 4px solid #3B82F6;
        }
        .section-content {
            padding: 20px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .info-table td {
            padding: 12px;
            border: 1px solid #E5E7EB;
        }
        .info-table .label {
            background: #F9FAFB;
            font-weight: bold;
            width: 30%;
            color: #374151;
        }
        .content-text {
            white-space: pre-wrap;
            line-height: 1.8;
            padding: 15px;
            background: #FEFEFE;
            border-left: 4px solid #3B82F6;
            margin: 10px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
            color: #6B7280;
            font-size: 12px;
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3B82F6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .print-button:hover {
            background: #2563EB;
        }
        @media print {
            .print-button { display: none; }
            body { margin: 0; padding: 15mm; }
            .section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">印刷・PDF保存</button>
    
    <div class="header">
        <h1>${data.subsidyProgramName}</h1>
        <h2 style="font-size: 18px; margin: 10px 0 0 0; color: #6B7280;">申請書</h2>
        <div class="subtitle">AI補助金申請システム</div>
    </div>

    <!-- 基本情報 -->
    <div class="section">
        <div class="section-header">基本情報</div>
        <div class="section-content">
            <table class="info-table">
                <tr>
                    <td class="label">事業名</td>
                    <td>${data.title}</td>
                </tr>
                <tr>
                    <td class="label">申請者</td>
                    <td>${data.companyName}</td>
                </tr>
                <tr>
                    <td class="label">代表者</td>
                    <td>${data.representativeName}</td>
                </tr>
                <tr>
                    <td class="label">申請日</td>
                    <td>${formatDateJP(data.createdAt)}</td>
                </tr>
                <tr>
                    <td class="label">補助金種別</td>
                    <td>${data.subsidyProgramCategory}</td>
                </tr>
            </table>
        </div>
    </div>

    <!-- 事業概要 -->
    <div class="section">
        <div class="section-header">事業概要</div>
        <div class="section-content">
            <div class="content-text">${data.projectDescription.replace(/\n/g, '<br>')}</div>
        </div>
    </div>

    <!-- 事業の目的・背景 -->
    <div class="section">
        <div class="section-header">事業の目的・背景</div>
        <div class="section-content">
            <div class="content-text">${data.purpose.replace(/\n/g, '<br>')}</div>
        </div>
    </div>

    <!-- 市場分析・効果 -->
    <div class="section">
        <div class="section-header">市場分析・期待される効果</div>
        <div class="section-content">
            <h4 style="margin: 0 0 10px 0; color: #374151;">ターゲット市場</h4>
            <div class="content-text">${data.targetMarket.replace(/\n/g, '<br>')}</div>
            
            <h4 style="margin: 20px 0 10px 0; color: #374151;">期待される効果</h4>
            <div class="content-text">${data.expectedEffects.replace(/\n/g, '<br>')}</div>
        </div>
    </div>

    <!-- 実施計画 -->
    <div class="section">
        <div class="section-header">実施計画</div>
        <div class="section-content">
            <table class="info-table">
                <tr>
                    <td class="label">事業予算</td>
                    <td>${formatCurrency(data.budget)}</td>
                </tr>
            </table>
            
            <h4 style="margin: 20px 0 10px 0; color: #374151;">実施スケジュール</h4>
            <div class="content-text">${data.timeline.replace(/\n/g, '<br>')}</div>
        </div>
    </div>

    <!-- 課題・新規性 -->
    <div class="section">
        <div class="section-header">課題・新規性</div>
        <div class="section-content">
            <h4 style="margin: 0 0 10px 0; color: #374151;">現在の課題</h4>
            <div class="content-text">${data.challenges.replace(/\n/g, '<br>')}</div>
            
            <h4 style="margin: 20px 0 10px 0; color: #374151;">新規性・独自性</h4>
            <div class="content-text">${data.innovation.replace(/\n/g, '<br>')}</div>
        </div>
    </div>

    <div class="footer">
        <p>AI補助金申請システムにて生成</p>
        <p>生成日時: ${formatDateTime(new Date().toISOString())}</p>
        <p style="margin-top: 10px; font-size: 11px; color: #9CA3AF;">※このプレビューから印刷またはPDF保存できます（Ctrl+P または Cmd+P）</p>
    </div>
</body>
</html>
  `
}

// ダウンロード用HTML生成
export const downloadHTMLFile = async (applicationData: ApplicationData): Promise<void> => {
  const htmlContent = createHTMLPreview(applicationData)
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `申請書_${applicationData.title}_${formatDateForFilename(applicationData.createdAt)}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}