/**
 * モックPDFテンプレート生成スクリプト
 * 各補助金の申請書テンプレートPDFを生成
 */

import { PDFDocument, PDFForm, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

interface TemplateField {
  name: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

interface TemplateConfig {
  name: string
  filename: string
  fields: TemplateField[]
}

const templates: TemplateConfig[] = [
  {
    name: 'Small Business Sustainability Subsidy Application',
    filename: 'jizokuka_template.pdf',
    fields: [
      { name: '事業者名', label: 'Company Name', x: 100, y: 700, width: 400, height: 20 },
      { name: '代表者氏名', label: 'Representative Name', x: 100, y: 660, width: 400, height: 20 },
      { name: '所在地', label: 'Address', x: 100, y: 620, width: 400, height: 20 },
      { name: '電話番号', label: 'Phone Number', x: 100, y: 580, width: 200, height: 20 },
      { name: '従業員数', label: 'Number of Employees', x: 100, y: 540, width: 100, height: 20 },
      { name: '事業概要', label: 'Business Overview', x: 100, y: 480, width: 400, height: 40 },
      { name: '販路開拓計画', label: 'Market Expansion Plan', x: 100, y: 400, width: 400, height: 60 },
      { name: '補助金申請額', label: 'Subsidy Amount', x: 100, y: 340, width: 200, height: 20 }
    ]
  },
  {
    name: 'Manufacturing Subsidy Application',
    filename: 'monozukuri_template.pdf',
    fields: [
      { name: '申請者名', label: 'Applicant Name', x: 100, y: 700, width: 400, height: 20 },
      { name: '代表者名', label: 'Representative Name', x: 100, y: 660, width: 400, height: 20 },
      { name: '本社所在地', label: 'Head Office Address', x: 100, y: 620, width: 400, height: 20 },
      { name: '資本金', label: 'Capital', x: 100, y: 580, width: 200, height: 20 },
      { name: '従業員数', label: 'Number of Employees', x: 100, y: 540, width: 100, height: 20 },
      { name: '技術課題', label: 'Technical Challenges', x: 100, y: 480, width: 400, height: 40 },
      { name: '革新的サービス', label: 'Innovative Service', x: 100, y: 400, width: 400, height: 40 },
      { name: '生産プロセス改善', label: 'Process Improvement', x: 100, y: 320, width: 400, height: 40 },
      { name: '設備投資計画', label: 'Equipment Investment Plan', x: 100, y: 240, width: 400, height: 40 },
      { name: '補助事業費', label: 'Project Cost', x: 100, y: 180, width: 200, height: 20 }
    ]
  },
  {
    name: 'IT Implementation Subsidy Application',
    filename: 'it_template.pdf',
    fields: [
      { name: '事業者名', label: 'Company Name', x: 100, y: 700, width: 400, height: 20 },
      { name: '代表者氏名', label: 'Representative Name', x: 100, y: 660, width: 400, height: 20 },
      { name: '業種', label: 'Industry', x: 100, y: 620, width: 300, height: 20 },
      { name: '従業員数', label: 'Number of Employees', x: 100, y: 580, width: 100, height: 20 },
      { name: 'ITツール名', label: 'IT Tool Name', x: 100, y: 540, width: 400, height: 20 },
      { name: 'ベンダー名', label: 'Vendor Name', x: 100, y: 500, width: 400, height: 20 },
      { name: '導入目的', label: 'Implementation Purpose', x: 100, y: 440, width: 400, height: 40 },
      { name: '現在の課題', label: 'Current Issues', x: 100, y: 360, width: 400, height: 40 },
      { name: '期待効果', label: 'Expected Effects', x: 100, y: 280, width: 400, height: 40 },
      { name: '導入費用', label: 'Implementation Cost', x: 100, y: 220, width: 200, height: 20 },
      { name: 'KPI', label: 'KPI', x: 100, y: 160, width: 400, height: 40 }
    ]
  },
  {
    name: 'Business Restructuring Subsidy Application',
    filename: 'saikochiku_template.pdf',
    fields: [
      { name: '申請者名称', label: 'Applicant Name', x: 100, y: 700, width: 400, height: 20 },
      { name: '代表者', label: 'Representative', x: 100, y: 660, width: 400, height: 20 },
      { name: '本店所在地', label: 'Head Office Location', x: 100, y: 620, width: 400, height: 20 },
      { name: '売上高減少率', label: 'Sales Decline Rate', x: 100, y: 580, width: 150, height: 20 },
      { name: '新分野展開', label: 'New Field Development', x: 100, y: 520, width: 400, height: 40 },
      { name: '事業転換内容', label: 'Business Transformation', x: 100, y: 440, width: 400, height: 40 },
      { name: '業態転換計画', label: 'Business Model Change', x: 100, y: 360, width: 400, height: 40 },
      { name: '投資額', label: 'Investment Amount', x: 100, y: 300, width: 200, height: 20 },
      { name: '補助金申請額', label: 'Subsidy Request Amount', x: 100, y: 260, width: 200, height: 20 }
    ]
  },
  {
    name: 'Business Improvement Grant Application',
    filename: 'gyomu_kaizen_template.pdf',
    fields: [
      { name: '事業場名', label: 'Workplace Name', x: 100, y: 700, width: 400, height: 20 },
      { name: '事業主氏名', label: 'Business Owner Name', x: 100, y: 660, width: 400, height: 20 },
      { name: '所在地', label: 'Address', x: 100, y: 620, width: 400, height: 20 },
      { name: '労働者数', label: 'Number of Workers', x: 100, y: 580, width: 100, height: 20 },
      { name: '現在の最低賃金', label: 'Current Minimum Wage', x: 100, y: 540, width: 150, height: 20 },
      { name: '引上げ後賃金', label: 'Raised Wage', x: 100, y: 500, width: 150, height: 20 },
      { name: '引上げ額', label: 'Wage Increase Amount', x: 100, y: 460, width: 150, height: 20 },
      { name: '設備投資内容', label: 'Equipment Investment Details', x: 100, y: 400, width: 400, height: 40 },
      { name: '生産性向上策', label: 'Productivity Improvement Measures', x: 100, y: 320, width: 400, height: 40 },
      { name: '設備投資額', label: 'Equipment Investment Amount', x: 100, y: 260, width: 200, height: 20 }
    ]
  }
]

async function generateTemplate(config: TemplateConfig) {
  console.log(`生成中: ${config.name}`)

  // 新しいPDFドキュメントを作成
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // Letter size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const { width, height } = page.getSize()

  // タイトルを追加
  page.drawText(config.name, {
    x: 50,
    y: height - 50,
    size: 20,
    font,
    color: rgb(0, 0, 0),
  })

  // フォームを取得
  const form = pdfDoc.getForm()

  // 各フィールドを追加
  for (const field of config.fields) {
    // ラベルを描画
    page.drawText(`${field.label}:`, {
      x: field.x,
      y: field.y + field.height + 5,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    })

    // テキストフィールドを追加
    const textField = form.createTextField(field.name)
    textField.setText('') // 初期値は空
    textField.addToPage(page, {
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      borderColor: rgb(0, 0, 0),
      backgroundColor: rgb(1, 1, 1),
    })
  }

  // PDFを保存
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

async function main() {
  try {
    // 出力ディレクトリを作成
    const outputDir = path.join(process.cwd(), 'assets', 'templates')
    await fs.mkdir(outputDir, { recursive: true })

    // 各テンプレートを生成
    for (const template of templates) {
      const pdfBytes = await generateTemplate(template)
      const outputPath = path.join(outputDir, template.filename)
      await fs.writeFile(outputPath, pdfBytes)
      console.log(`✅ 保存完了: ${outputPath}`)
    }

    console.log('\n全てのPDFテンプレートの生成が完了しました！')
    
  } catch (error) {
    console.error('エラーが発生しました:', error)
    process.exit(1)
  }
}

// スクリプトを実行
if (require.main === module) {
  main()
}