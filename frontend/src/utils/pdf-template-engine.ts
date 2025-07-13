// PDF申請書テンプレートエンジン
// 各補助金の公式フォーマットに準拠したPDF生成

import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

// 日本語フォントの設定
const loadJapaneseFont = async (doc: jsPDF) => {
  try {
    // NotoSansJPフォントを動的に読み込む
    const response = await fetch('/fonts/NotoSansJP-Regular.ttf')
    const fontData = await response.arrayBuffer()
    const fontBase64 = btoa(String.fromCharCode(...new Uint8Array(fontData)))
    
    doc.addFileToVFS('NotoSansJP-Regular.ttf', fontBase64)
    doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal')
    doc.setFont('NotoSansJP')
  } catch (error) {
    console.warn('日本語フォントの読み込みに失敗しました。デフォルトフォントを使用します。')
  }
}

// 申請書データ型
export interface ApplicationFormData {
  templateId: string
  sections: {
    [sectionId: string]: {
      [fieldId: string]: any
    }
  }
}

// PDF座標・スタイル設定
interface PDFStyle {
  fontSize: number
  lineHeight: number
  marginLeft: number
  marginTop: number
  pageWidth: number
  pageHeight: number
}

const DEFAULT_STYLE: PDFStyle = {
  fontSize: 10,
  lineHeight: 6,
  marginLeft: 20,
  marginTop: 20,
  pageWidth: 210, // A4
  pageHeight: 297 // A4
}

// 小規模事業者持続化補助金のPDFレイアウト
const JIZOKUKA_LAYOUT = {
  title: { x: 105, y: 20, fontSize: 16, align: 'center' as const },
  sections: {
    'basic-info': {
      startY: 40,
      fields: {
        'company_name': { x: 20, y: 50, label: '事業者名', boxWidth: 170 },
        'representative_name': { x: 20, y: 60, label: '代表者氏名', boxWidth: 80 },
        'address': { x: 20, y: 70, label: '所在地', boxWidth: 170 },
        'established_date': { x: 20, y: 80, label: '設立年月日', boxWidth: 50 },
        'capital': { x: 110, y: 80, label: '資本金', boxWidth: 40 },
        'employees': { x: 160, y: 80, label: '従業員数', boxWidth: 30 },
        'business_type': { x: 20, y: 90, label: '業種', boxWidth: 60 },
        'business_description': { x: 20, y: 100, label: '事業内容', boxWidth: 170, boxHeight: 30 }
      }
    },
    'project-plan': {
      startY: 140,
      fields: {
        'project_title': { x: 20, y: 150, label: '補助事業名', boxWidth: 170 },
        'project_purpose': { x: 20, y: 160, label: '事業の目的・必要性', boxWidth: 170, boxHeight: 40 },
        'project_content': { x: 20, y: 210, label: '事業内容', boxWidth: 170, boxHeight: 50 },
        'expected_effects': { x: 20, y: 270, label: '期待される効果', boxWidth: 170, boxHeight: 30 }
      }
    }
  }
}

// 申請書PDFを生成
export async function generateApplicationPDF(
  formData: ApplicationFormData,
  templateId: string
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // 日本語フォントを読み込む
  await loadJapaneseFont(doc)

  // テンプレートに応じたレイアウトを選択
  const layout = getLayoutForTemplate(templateId)
  
  // タイトルを描画
  doc.setFontSize(layout.title.fontSize)
  doc.text(getTemplateTitle(templateId), layout.title.x, layout.title.y, { align: layout.title.align })

  // 各セクションを描画
  let currentPage = 1
  let currentY = layout.title.y + 20

  for (const [sectionId, sectionLayout] of Object.entries(layout.sections)) {
    const sectionData = formData.sections[sectionId] || {}
    
    // ページが足りない場合は新しいページを追加
    if (currentY > 270) {
      doc.addPage()
      currentPage++
      currentY = 20
    }

    // セクションタイトルを描画
    doc.setFontSize(12)
    doc.setFont('NotoSansJP', 'normal', 'bold')
    doc.text(getSectionTitle(sectionId), 20, currentY)
    currentY += 10

    // フィールドを描画
    doc.setFont('NotoSansJP', 'normal', 'normal')
    doc.setFontSize(10)

    for (const [fieldId, fieldLayout] of Object.entries(sectionLayout.fields)) {
      const value = sectionData[fieldId] || ''
      
      // ラベルを描画
      doc.setFontSize(9)
      doc.text(fieldLayout.label + ':', fieldLayout.x, fieldLayout.y - 2)
      
      // 枠を描画
      doc.rect(fieldLayout.x, fieldLayout.y, fieldLayout.boxWidth, fieldLayout.boxHeight || 8)
      
      // 値を描画（長いテキストは折り返し）
      doc.setFontSize(10)
      if (fieldLayout.boxHeight && fieldLayout.boxHeight > 10) {
        // テキストエリアの場合
        const lines = doc.splitTextToSize(String(value), fieldLayout.boxWidth - 4)
        let textY = fieldLayout.y + 5
        for (const line of lines) {
          if (textY < fieldLayout.y + fieldLayout.boxHeight - 2) {
            doc.text(line, fieldLayout.x + 2, textY)
            textY += 5
          }
        }
      } else {
        // 通常のテキストフィールド
        const text = doc.splitTextToSize(String(value), fieldLayout.boxWidth - 4)[0] || ''
        doc.text(text, fieldLayout.x + 2, fieldLayout.y + 5)
      }
      
      currentY = Math.max(currentY, fieldLayout.y + (fieldLayout.boxHeight || 8) + 5)
    }

    currentY += 10
  }

  // フッターを追加
  doc.setFontSize(8)
  doc.text(`ページ ${currentPage}`, 105, 290, { align: 'center' })

  return doc.output('blob')
}

// HTMLからPDFを生成（フォールバック用）
export async function generatePDFFromHTML(element: HTMLElement): Promise<Blob> {
  // 要素を一時的に表示
  const originalDisplay = element.style.display
  element.style.display = 'block'
  element.style.position = 'absolute'
  element.style.left = '-9999px'
  element.style.width = '210mm'
  document.body.appendChild(element)

  try {
    // html2canvasでキャプチャ
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    // jsPDFでPDF化
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      doc.addPage()
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    return doc.output('blob')
  } finally {
    // 要素を元に戻す
    document.body.removeChild(element)
    element.style.display = originalDisplay
    element.style.position = ''
    element.style.left = ''
    element.style.width = ''
  }
}

// 申請書HTML要素を作成
export function createApplicationFormHTML(
  formData: ApplicationFormData,
  templateId: string
): HTMLElement {
  const container = document.createElement('div')
  container.className = 'application-form-print'
  container.style.cssText = `
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    background: white;
    font-family: 'Noto Sans JP', sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #000;
  `

  // タイトル
  const title = document.createElement('h1')
  title.style.cssText = 'text-align: center; font-size: 16pt; margin-bottom: 20mm;'
  title.textContent = getTemplateTitle(templateId)
  container.appendChild(title)

  // 各セクションを作成
  const template = getTemplate(templateId)
  
  template.sections.forEach((section) => {
    const sectionEl = document.createElement('div')
    sectionEl.style.cssText = 'margin-bottom: 15mm;'
    
    // セクションタイトル
    const sectionTitle = document.createElement('h2')
    sectionTitle.style.cssText = 'font-size: 12pt; border-bottom: 2px solid #000; padding-bottom: 2mm; margin-bottom: 5mm;'
    sectionTitle.textContent = section.title
    sectionEl.appendChild(sectionTitle)
    
    // フィールド
    const sectionData = formData.sections[section.id] || {}
    
    section.fields.forEach((field) => {
      const fieldEl = document.createElement('div')
      fieldEl.style.cssText = 'margin-bottom: 5mm;'
      
      // ラベル
      const label = document.createElement('div')
      label.style.cssText = 'font-weight: bold; margin-bottom: 1mm;'
      label.textContent = field.label
      fieldEl.appendChild(label)
      
      // 値
      const value = document.createElement('div')
      value.style.cssText = 'border: 1px solid #000; padding: 2mm; min-height: 8mm;'
      
      if (field.type === 'textarea' && field.rows && field.rows > 4) {
        value.style.minHeight = `${field.rows * 5}mm`
      }
      
      value.textContent = sectionData[field.id] || ''
      fieldEl.appendChild(value)
      
      sectionEl.appendChild(fieldEl)
    })
    
    container.appendChild(sectionEl)
  })

  return container
}

// ヘルパー関数
function getLayoutForTemplate(templateId: string): any {
  switch (templateId) {
    case 'jizokuka':
    case 'jizokuka-2024':
      return JIZOKUKA_LAYOUT
    default:
      return JIZOKUKA_LAYOUT // デフォルト
  }
}

function getTemplateTitle(templateId: string): string {
  const titles: Record<string, string> = {
    'jizokuka': '小規模事業者持続化補助金 申請書',
    'jizokuka-2024': '小規模事業者持続化補助金 申請書',
    'it-subsidy': 'IT導入補助金 申請書',
    'it-subsidy-2024': 'IT導入補助金 申請書',
    'monozukuri': 'ものづくり補助金 申請書',
    'monozukuri-2024': 'ものづくり補助金 申請書'
  }
  return titles[templateId] || '補助金申請書'
}

function getSectionTitle(sectionId: string): string {
  const titles: Record<string, string> = {
    'basic-info': '1. 申請者の概要',
    'project-plan': '2. 補助事業計画',
    'budget-plan': '3. 経費明細',
    'schedule': '4. 事業スケジュール',
    'applicant-info': '1. 申請者情報',
    'it-tool-info': '2. 導入ITツール情報',
    'productivity-plan': '3. 労働生産性向上計画',
    'company-overview': '1. 企業概要',
    'innovation-plan': '2. 革新的な開発計画',
    'equipment-investment': '3. 設備投資計画'
  }
  return titles[sectionId] || sectionId
}

function getTemplate(templateId: string): any {
  // テンプレート設定をインポート
  const { SUBSIDY_TEMPLATES } = require('@/config/subsidy-templates')
  return SUBSIDY_TEMPLATES[templateId.replace('-2024', '')] || SUBSIDY_TEMPLATES['jizokuka']
}