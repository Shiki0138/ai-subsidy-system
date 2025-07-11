/**
 * PDFテンプレート入力テストスクリプト
 * 生成したテンプレートPDFにデータを入力してテスト
 */

import officialPdfFillService from '../services/officialPdfFillService'
import path from 'path'
import fs from 'fs/promises'

const testData: { [key: string]: any } = {
  '持続化補助金': {
    companyInfo: {
      name: 'Test Corporation',
      representative: 'Taro Yamada',
      address: 'Tokyo Chiyoda 1-1-1',
      phone: '03-1234-5678',
      employees: 10
    },
    businessPlan: {
      summary: 'New product development and sales expansion',
      marketExpansion: 'Online sales enhancement and new customer development'
    },
    budgetPlan: {
      subsidyAmount: 1000000
    }
  },
  'ものづくり補助金': {
    companyInfo: {
      name: 'Test Manufacturing Co.',
      representative: 'Ichiro Suzuki',
      address: 'Osaka Chuo 2-2-2',
      capital: 10000000,
      employees: 50
    },
    technicalPlan: {
      challenges: 'Production efficiency improvement and quality control enhancement',
      innovation: 'AI image recognition defect detection system',
      processImprovement: '24-hour operation with automated production line'
    },
    investmentPlan: {
      details: 'Robot arm installation and control system construction'
    },
    budget: {
      totalCost: 30000000
    }
  },
  'IT導入補助金': {
    companyInfo: {
      name: 'Test Service Co.',
      representative: 'Hanako Sato',
      industry: 'Service Industry',
      employees: 20
    },
    itTool: {
      toolName: 'Cloud Sales Management System',
      vendor: 'IT Vendor Corporation'
    },
    itPlan: {
      purpose: 'Sales management efficiency',
      currentIssues: 'Order processing delays due to manual work',
      expectedEffects: '50% reduction in processing time'
    },
    productivityPlan: {
      kpi: 'Double monthly processing capacity'
    }
  },
  '事業再構築補助金': {
    companyInfo: {
      name: 'Test Restaurant Co.',
      representative: 'Jiro Tanaka',
      address: 'Aichi Nagoya 3-3-3'
    },
    restructuringPlan: {
      salesDeclineRate: 30,
      newField: 'Takeout and Delivery Business',
      businessTransformation: 'From eat-in to takeout focused',
      businessModelChange: 'Business Restructuring'
    },
    budget: {
      investmentAmount: 50000000,
      subsidyAmount: 25000000
    }
  },
  '業務改善助成金': {
    companyInfo: {
      name: 'Test Retail Store',
      representative: 'Saburo Takahashi',
      address: 'Fukuoka 4-4-4',
      employees: 15
    },
    wageInfo: {
      currentMinWage: 900,
      raisedWage: 950,
      raiseAmount: 50
    },
    equipmentPlan: {
      description: 'POS Register System Installation'
    },
    productivityPlan: {
      measures: 'Register operation efficiency and inventory management automation'
    },
    budget: {
      equipmentCost: 2000000
    }
  }
}

async function testPdfFilling() {
  console.log('PDFテンプレート入力テスト開始...\n')

  const outputDir = path.join(process.cwd(), 'output', 'test-pdfs')
  await fs.mkdir(outputDir, { recursive: true })

  const templates = officialPdfFillService.getAvailableTemplates()
  
  for (const subsidyType of templates) {
    try {
      console.log(`テスト中: ${subsidyType}`)
      
      const outputPath = path.join(
        outputDir,
        `test_${subsidyType.replace(/[^\w]/g, '_')}_${Date.now()}.pdf`
      )

      await officialPdfFillService.fillOfficialPDF(
        subsidyType,
        testData[subsidyType] || {},
        outputPath
      )

      console.log(`✅ 成功: ${outputPath}`)
      
    } catch (error) {
      console.error(`❌ エラー (${subsidyType}):`, error instanceof Error ? error.message : error)
    }
  }

  console.log('\nPDFテンプレート入力テスト完了！')
}

// スクリプトを実行
if (require.main === module) {
  testPdfFilling().catch(console.error)
}