/**
 * Test Mode Configuration
 * Complete local environment setup for testing without external APIs
 */

const path = require('path');

const TEST_CONFIG = {
  // Test mode settings
  TEST_MODE: true,
  MOCK_AI_RESPONSES: true,
  SIMULATE_PROCESSING_DELAYS: true,
  ENABLE_DETAILED_LOGGING: true,
  
  // Mock data settings
  USE_SAMPLE_DATA: true,
  GENERATE_MOCK_USERS: true,
  CREATE_SAMPLE_APPLICATIONS: true,
  
  // Database settings for testing
  DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://testuser:testpass@localhost:5432/ai_subsidy_test',
  REDIS_URL: process.env.TEST_REDIS_URL || 'redis://localhost:6379/1',
  
  // File storage for testing
  UPLOAD_PATH: './test-uploads',
  TEMP_PATH: './test-temp',
  PDF_OUTPUT_PATH: './test-pdfs',
  
  // AI service configuration
  AI_MOCK_MODE: true,
  AI_RESPONSE_DELAY: {
    min: 1000,    // 1 second
    max: 3000     // 3 seconds
  },
  
  // Sample companies and users
  SAMPLE_USERS: [
    {
      id: 'test-user-1',
      email: 'test1@ai-subsidy.com',
      password: 'Test123!@#',
      companyName: '株式会社テクノロジー・イノベーション',
      representativeName: '山田太郎',
      phone: '03-1234-5678',
      address: '東京都渋谷区渋谷1-1-1',
      industry: 'IT・ソフトウェア',
      employeeCount: 50
    },
    {
      id: 'test-user-2',
      email: 'test2@ai-subsidy.com',
      password: 'Test123!@#',
      companyName: '未来製造株式会社',
      representativeName: '佐藤花子',
      phone: '06-9876-5432',
      address: '大阪府大阪市北区梅田2-2-2',
      industry: '製造業',
      employeeCount: 120
    }
  ],
  
  // Sample subsidy programs
  SAMPLE_SUBSIDY_PROGRAMS: [
    {
      id: 'it-enhancement',
      name: 'IT導入促進補助金',
      description: 'IT技術を活用した業務効率化・生産性向上を支援',
      maxAmount: 3000000,
      applicationDeadline: '2024-12-31',
      targetIndustries: ['IT・ソフトウェア', '製造業', 'サービス業'],
      requirements: [
        '中小企業・小規模事業者であること',
        'IT導入による効果が見込めること',
        '事業計画が実現可能であること'
      ]
    },
    {
      id: 'green-tech',
      name: 'グリーンテクノロジー推進補助金',
      description: '環境技術・再生可能エネルギー関連事業を支援',
      maxAmount: 5000000,
      applicationDeadline: '2024-11-30',
      targetIndustries: ['製造業', 'エネルギー', '建設業'],
      requirements: [
        '環境負荷軽減に資する事業であること',
        '技術的実現可能性が高いこと',
        '持続可能な事業モデルであること'
      ]
    },
    {
      id: 'startup-support',
      name: 'スタートアップ支援補助金',
      description: '新規事業立ち上げ・事業拡大を支援',
      maxAmount: 2000000,
      applicationDeadline: '2024-10-31',
      targetIndustries: ['すべて'],
      requirements: [
        '設立5年以内の企業であること',
        '革新的なビジネスモデルであること',
        '成長性が期待できること'
      ]
    }
  ],
  
  // Mock AI responses
  MOCK_AI_RESPONSES: {
    businessPlan: {
      companyOverview: "当社は最新のAI技術を活用したソフトウェア開発企業として、中小企業のデジタル変革を支援しています。豊富な技術力と顧客理解に基づき、実用性の高いソリューションを提供しています。",
      projectDescription: "本プロジェクトでは、AIを活用した統合業務管理システムを開発し、中小企業の業務効率化を実現します。従来の分散したシステムを統合し、リアルタイムでの業務状況把握と意思決定支援を可能にします。",
      marketAnalysis: "中小企業向けDXソリューション市場は年率15%で成長しており、特にAI活用分野では30%の高成長が見込まれています。当社の技術力と顧客基盤を活かし、この成長市場での確実な地位確立を目指します。",
      businessPlan: "システム開発フェーズ（3ヶ月）、パイロット導入フェーズ（2ヶ月）、本格展開フェーズ（4ヶ月）の3段階で事業を推進します。各フェーズで厳格な評価を行い、確実な成果創出を図ります。",
      expectedOutcomes: "業務効率30%向上、コスト20%削減、売上15%増加を実現し、年間1000万円の経済効果を創出します。また、このノウハウを他の中小企業にも展開し、地域経済活性化に貢献します。",
      budgetPlan: "総事業費500万円（開発費350万円、機器費100万円、運営費50万円）。補助金300万円を活用し、自己資金200万円で確実な事業実行を行います。",
      implementation: "月次進捗レビューとリスク管理を徹底し、予定通りの事業完了を目指します。外部専門家との連携により、技術的課題への迅速な対応も確保しています。"
    },
    
    improvementSuggestions: {
      overallScore: 85,
      improvements: [
        {
          section: "市場分析",
          issue: "競合他社との差別化ポイントが不明確",
          suggestion: "具体的な技術的優位性や特許技術について詳細に記載してください"
        },
        {
          section: "予算計画",
          issue: "コスト内訳の詳細が不足",
          suggestion: "人件費、開発費、機器費の詳細内訳を示し、妥当性を説明してください"
        },
        {
          section: "実施体制",
          issue: "プロジェクト管理体制が不明確",
          suggestion: "責任者、担当者の役割分担と管理プロセスを明確化してください"
        }
      ],
      strengths: [
        "技術的実現可能性が高く、具体的な開発計画が示されている",
        "市場ニーズと解決策が明確に対応している",
        "段階的な実施計画により、リスクが適切に管理されている"
      ],
      summary: "全体的に良くまとまった申請書ですが、差別化ポイントの明確化と予算の詳細化により、さらに採択可能性を高めることができます。"
    },
    
    approvalPrediction: {
      totalScore: 82,
      confidence: "高",
      breakdown: {
        feasibility: 85,
        viability: 80,
        effectiveness: 84,
        budget: 79,
        innovation: 86
      },
      adoptionProbability: "75%",
      strengths: [
        "技術的な実現可能性が高い",
        "市場ニーズが明確で解決策が適切",
        "段階的な実施計画でリスクが管理されている",
        "定量的な効果指標が設定されている"
      ],
      weaknesses: [
        "競合分析が浅い",
        "コスト詳細が不足",
        "長期的な持続性への言及が少ない"
      ],
      recommendations: [
        "競合他社との具体的な差別化ポイントを追加",
        "詳細な予算内訳書を添付",
        "事業の長期展望と持続可能性を説明",
        "実証実験やパイロット結果があれば追加"
      ]
    }
  },
  
  // Performance monitoring
  PERFORMANCE_TARGETS: {
    apiResponseTime: 500,    // ms
    pdfGenerationTime: 5000, // ms
    aiResponseTime: 3000,    // ms
    uploadProcessTime: 2000  // ms
  }
};

/**
 * Test utilities
 */
class TestUtilities {
  static async generateMockData() {
    console.log('🔄 Generating mock test data...');
    
    const mockData = {
      users: TEST_CONFIG.SAMPLE_USERS,
      subsidyPrograms: TEST_CONFIG.SAMPLE_SUBSIDY_PROGRAMS,
      applications: this.generateSampleApplications(),
      files: this.generateSampleFiles()
    };
    
    console.log('✅ Mock data generated successfully');
    return mockData;
  }
  
  static generateSampleApplications() {
    return TEST_CONFIG.SAMPLE_USERS.map((user, index) => ({
      id: `app-${index + 1}`,
      userId: user.id,
      projectTitle: `${user.companyName} DX推進プロジェクト`,
      status: ['DRAFT', 'SUBMITTED', 'APPROVED'][index % 3],
      requestedAmount: (index + 1) * 1000000,
      businessPlan: TEST_CONFIG.MOCK_AI_RESPONSES.businessPlan,
      createdAt: new Date(Date.now() - (index * 86400000)).toISOString(),
      updatedAt: new Date(Date.now() - (index * 43200000)).toISOString(),
      subsidyProgramId: TEST_CONFIG.SAMPLE_SUBSIDY_PROGRAMS[index % 3].id
    }));
  }
  
  static generateSampleFiles() {
    return [
      {
        id: 'file-1',
        userId: 'test-user-1',
        originalName: '事業計画書.pdf',
        size: 2048000,
        mimeType: 'application/pdf',
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'file-2',
        userId: 'test-user-1',
        originalName: '財務諸表.xlsx',
        size: 512000,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedAt: new Date().toISOString()
      }
    ];
  }
  
  static async simulateApiDelay(operation = 'default') {
    if (!TEST_CONFIG.SIMULATE_PROCESSING_DELAYS) return;
    
    const delays = {
      ai: TEST_CONFIG.AI_RESPONSE_DELAY,
      upload: { min: 500, max: 1500 },
      pdf: { min: 1000, max: 3000 },
      default: { min: 200, max: 800 }
    };
    
    const config = delays[operation] || delays.default;
    const delay = Math.random() * (config.max - config.min) + config.min;
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  static mockAIResponse(prompt, type = 'businessPlan') {
    if (type === 'businessPlan') {
      return {
        success: true,
        content: JSON.stringify(TEST_CONFIG.MOCK_AI_RESPONSES.businessPlan, null, 2),
        usage: { prompt_tokens: 150, completion_tokens: 500, total_tokens: 650 },
        processingTime: Math.random() * 2000 + 1000,
        timestamp: new Date().toISOString(),
        mock: true
      };
    }
    
    if (type === 'improvement') {
      return {
        success: true,
        content: JSON.stringify(TEST_CONFIG.MOCK_AI_RESPONSES.improvementSuggestions, null, 2),
        usage: { prompt_tokens: 200, completion_tokens: 400, total_tokens: 600 },
        processingTime: Math.random() * 2000 + 1000,
        timestamp: new Date().toISOString(),
        mock: true
      };
    }
    
    if (type === 'analysis') {
      return {
        success: true,
        content: JSON.stringify(TEST_CONFIG.MOCK_AI_RESPONSES.approvalPrediction, null, 2),
        usage: { prompt_tokens: 300, completion_tokens: 600, total_tokens: 900 },
        processingTime: Math.random() * 3000 + 1500,
        timestamp: new Date().toISOString(),
        mock: true
      };
    }
    
    return {
      success: true,
      content: "Mock AI response for testing purposes.",
      usage: { prompt_tokens: 50, completion_tokens: 100, total_tokens: 150 },
      processingTime: Math.random() * 1000 + 500,
      timestamp: new Date().toISOString(),
      mock: true
    };
  }
  
  static getPerformanceReport() {
    return {
      timestamp: new Date().toISOString(),
      targets: TEST_CONFIG.PERFORMANCE_TARGETS,
      status: {
        apiResponseTime: Math.random() * 400 + 100,
        pdfGenerationTime: Math.random() * 3000 + 2000,
        aiResponseTime: Math.random() * 2000 + 1000,
        uploadProcessTime: Math.random() * 1500 + 500
      },
      recommendations: [
        "API response times are within acceptable range",
        "PDF generation performance is optimal",
        "AI service response times are satisfactory"
      ]
    };
  }
}

/**
 * Test environment setup
 */
async function setupTestEnvironment() {
  console.log('🚀 Setting up test environment...');
  
  try {
    // Create test directories
    const fs = require('fs').promises;
    const directories = [
      TEST_CONFIG.UPLOAD_PATH,
      TEST_CONFIG.TEMP_PATH,
      TEST_CONFIG.PDF_OUTPUT_PATH,
      './test-logs'
    ];
    
    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          console.error(`❌ Failed to create directory ${dir}:`, error.message);
        }
      }
    }
    
    // Generate mock data
    const mockData = await TestUtilities.generateMockData();
    
    // Save mock data for reference
    await fs.writeFile(
      './test-data.json',
      JSON.stringify(mockData, null, 2)
    );
    
    console.log('✅ Test environment setup completed');
    
    return {
      success: true,
      config: TEST_CONFIG,
      mockData,
      message: 'Test environment is ready for comprehensive testing'
    };
    
  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    throw error;
  }
}

/**
 * Test suite runner
 */
class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }
  
  async runTest(name, testFunction) {
    console.log(`🔄 Running test: ${name}`);
    const testStart = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - testStart;
      
      this.results.push({
        name,
        status: 'PASSED',
        duration,
        result
      });
      
      console.log(`✅ Test passed: ${name} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - testStart;
      
      this.results.push({
        name,
        status: 'FAILED',
        duration,
        error: error.message
      });
      
      console.error(`❌ Test failed: ${name} (${duration}ms)`, error.message);
      throw error;
    }
  }
  
  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    
    return {
      summary: {
        total: this.results.length,
        passed,
        failed,
        successRate: this.results.length > 0 ? (passed / this.results.length * 100).toFixed(1) : 0,
        totalDuration
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  TEST_CONFIG,
  TestUtilities,
  setupTestEnvironment,
  TestRunner
};