import express, { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/authenticate'
import { conditionalAuth } from '../middleware/devAuthBypass'
import { asyncHandler } from '../utils/asyncHandler'
import { 
  ValidationError, 
  NotFoundError,
  AuthenticationError 
} from '../middleware/errorHandler'
import AIOrchestrator from '../../../ai-engine/src/models/ai-orchestrator'
import pdfRoutes from './pdf'

const router = express.Router()
const prisma = new PrismaClient()
const aiOrchestrator = new AIOrchestrator()

// バリデーションスキーマ
const createApplicationSchema = z.object({
  subsidyProgramId: z.string().min(1, '補助金プログラムを選択してください'),
  projectTitle: z.string().min(1, '事業名は必須です').max(100),
  projectDescription: z.string().min(50, '事業概要は50文字以上で入力してください').max(2000),
  purpose: z.string().min(30, '事業の目的・背景は30文字以上で入力してください').max(1000),
  targetMarket: z.string().min(30, 'ターゲット市場は30文字以上で入力してください').max(1000),
  expectedEffects: z.string().min(30, '期待される効果は30文字以上で入力してください').max(1000),
  budget: z.number().min(1, '予算は1円以上で入力してください').max(100000000),
  timeline: z.string().min(10, 'スケジュールは10文字以上で入力してください').max(500),
  challenges: z.string().min(20, '現在の課題は20文字以上で入力してください').max(1000),
  innovation: z.string().min(20, '新規性・独自性は20文字以上で入力してください').max(1000),
})

// 補助金プログラムの取得
router.get('/subsidy-programs', asyncHandler(async (req: Request, res: Response) => {
  const programs = await prisma.subsidyProgram.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      category: true,
      maxAmount: true,
      requirements: true,
      evaluationCriteria: true,
      applicationEnd: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({
    success: true,
    data: programs,
  })
}))

// 申請書の作成
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createApplicationSchema.parse(req.body)
  const userId = req.user!.id

  try {
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        companyName: true,
        businessType: true,
        foundedYear: true,
        employeeCount: true,
        website: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'ユーザーが見つかりません' },
      })
    }

    // 補助金プログラム情報を取得
    const subsidyProgram = await prisma.subsidyProgram.findUnique({
      where: { id: validatedData.subsidyProgramId },
      select: {
        id: true,
        name: true,
        requirements: true,
        evaluationCriteria: true,
      },
    })

    if (!subsidyProgram) {
      return res.status(404).json({
        success: false,
        error: { message: '補助金プログラムが見つかりません' },
      })
    }

    // まずドラフト状態で申請書を作成
    const draftApplication = await prisma.application.create({
      data: {
        userId,
        subsidyProgramId: validatedData.subsidyProgramId,
        title: validatedData.projectTitle,
        status: 'GENERATING',
        inputData: JSON.stringify(validatedData),
      },
    })

    // レスポンスを即座に返す（AI生成は非同期で実行）
    res.json({
      success: true,
      data: {
        applicationId: draftApplication.id,
        status: 'GENERATING',
        message: 'AI申請書生成を開始しました',
      },
    })

    // AI生成を非同期で実行
    generateApplicationAsync(draftApplication.id, user, subsidyProgram, validatedData)
      .catch(error => {
        console.error('AI generation failed:', error)
        // エラー時は申請書のステータスを更新
        prisma.application.update({
          where: { id: draftApplication.id },
          data: { status: 'FAILED' },
        }).catch(console.error)
      })

  } catch (error) {
    console.error('Application creation error:', error)
    res.status(500).json({
      success: false,
      error: { message: '申請書の作成に失敗しました' },
    })
  }
}))

// 申請書の取得
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const applicationId = req.params.id
  const userId = req.user!.id

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
    },
  })

  if (!application) {
    return res.status(404).json({
      success: false,
      error: { message: '申請書が見つかりません' },
    })
  }

  res.json({
    success: true,
    data: application,
  })
}))

// ユーザーの申請書一覧取得
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const offset = (page - 1) * limit

  const applications = await prisma.application.findMany({
    where: { userId },
    include: {
      subsidyProgram: {
        select: {
          name: true,
          category: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    skip: offset,
    take: limit,
  })

  const total = await prisma.application.count({
    where: { userId },
  })

  res.json({
    success: true,
    data: {
      applications,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: applications.length,
        totalItems: total,
      },
    },
  })
}))

// 申請書生成ステータスの確認
router.get('/:id/status', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const applicationId = req.params.id
  const userId = req.user!.id

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId,
    },
    select: {
      id: true,
      status: true,
      progress: true,
      errorMessage: true,
      updatedAt: true,
    },
  })

  if (!application) {
    return res.status(404).json({
      success: false,
      error: { message: '申請書が見つかりません' },
    })
  }

  res.json({
    success: true,
    data: application,
  })
}))

/**
 * AI申請書生成の非同期実行
 */
async function generateApplicationAsync(
  applicationId: string,
  user: any,
  subsidyProgram: any,
  inputData: any
) {
  try {
    // 進捗を0%に設定
    await prisma.application.update({
      where: { id: applicationId },
      data: { progress: 0 },
    })

    // AI生成用のデータを準備
    const aiInput = {
      companyInfo: {
        name: user.companyName,
        businessType: user.businessType,
        foundedYear: user.foundedYear,
        employeeCount: user.employeeCount,
        website: user.website || undefined,
      },
      businessPlan: {
        projectTitle: inputData.projectTitle,
        projectDescription: inputData.projectDescription,
        purpose: inputData.purpose,
        targetMarket: inputData.targetMarket,
        expectedEffects: inputData.expectedEffects,
        budget: inputData.budget,
        timeline: inputData.timeline,
      },
      subsidyInfo: {
        programId: subsidyProgram.id,
        programName: subsidyProgram.name,
        requirements: subsidyProgram.requirements,
        evaluationCriteria: subsidyProgram.evaluationCriteria,
      },
    }

    // 進捗を25%に更新
    await prisma.application.update({
      where: { id: applicationId },
      data: { progress: 25 },
    })

    // AI申請書生成を実行
    const generatedApplication = await aiOrchestrator.generateApplication(aiInput)

    // 進捗を75%に更新
    await prisma.application.update({
      where: { id: applicationId },
      data: { progress: 75 },
    })

    // 生成された申請書をデータベースに保存
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'GENERATED',
        progress: 100,
        generatedContent: JSON.stringify(generatedApplication),
        estimatedScore: generatedApplication.metadata.estimatedScore,
        wordCount: generatedApplication.metadata.wordCount,
      },
    })

    console.log(`AI申請書生成完了: ${applicationId}`)

  } catch (error) {
    console.error('AI generation error:', error)
    
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : '不明なエラー',
      },
    })
  }
}

/**
 * 申請書内容の更新
 * PUT /api/applications/:id
 */
router.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const applicationId = req.params.id
  const userId = req.user!.id
  
  // 更新可能なフィールドのバリデーション
  const updateSchema = z.object({
    title: z.string().min(1, '事業名は必須です').max(100).optional(),
    generatedContent: z.any().optional(), // JSONデータ
    status: z.enum(['DRAFT', 'EDITING', 'COMPLETED']).optional(),
    notes: z.string().max(2000).optional(),
  })
  
  const validatedData = updateSchema.parse(req.body)
  
  // 申請書の存在確認と権限チェック
  const existingApplication = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId,
    },
  })
  
  if (!existingApplication) {
    throw new NotFoundError('申請書が見つかりません')
  }
  
  // 生成中やエラー状態の申請書は編集不可
  if (['GENERATING', 'FAILED'].includes(existingApplication.status)) {
    throw new ValidationError('この申請書は現在編集できません')
  }
  
  // 申請書を更新
  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: {
      ...validatedData,
      generatedContent: validatedData.generatedContent ? 
        JSON.stringify(validatedData.generatedContent) : undefined,
      updatedAt: new Date(),
    },
    include: {
      subsidyProgram: {
        select: {
          name: true,
          category: true,
          maxAmount: true,
        },
      },
    },
  })
  
  // AI使用ログを記録（内容が変更された場合）
  if (validatedData.generatedContent) {
    await prisma.aiUsageLog.create({
      data: {
        userId,
        applicationId,
        // action: 'EDIT_APPLICATION',
        model: 'MANUAL_EDIT',
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost: 0,
      },
    })
  }
  
  res.json({
    success: true,
    message: '申請書を更新しました',
    data: updatedApplication,
  })
}))

/**
 * 申請書の削除
 * DELETE /api/applications/:id
 */
router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const applicationId = req.params.id
  const userId = req.user!.id
  
  // 申請書の存在確認と権限チェック
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId,
    },
  })
  
  if (!application) {
    throw new NotFoundError('申請書が見つかりません')
  }
  
  // 提出済みの申請書は削除不可
  if (application.status === 'SUBMITTED') {
    throw new ValidationError('提出済みの申請書は削除できません')
  }
  
  // 関連データも含めて削除（トランザクション）
  await prisma.$transaction(async (tx) => {
    // AI使用ログを削除
    await tx.aiUsageLog.deleteMany({
      where: { applicationId },
    })
    
    // 申請書を削除
    await tx.application.delete({
      where: { id: applicationId },
    })
  })
  
  res.json({
    success: true,
    message: '申請書を削除しました',
  })
}))

/**
 * 申請書の提出
 * POST /api/applications/:id/submit
 */
router.post('/:id/submit', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const applicationId = req.params.id
  const userId = req.user!.id
  
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
          applicationEnd: true,
        },
      },
    },
  })
  
  if (!application) {
    throw new NotFoundError('申請書が見つかりません')
  }
  
  // 提出可能な状態かチェック
  if (application.status !== 'COMPLETED') {
    throw new ValidationError('完成状態の申請書のみ提出できます')
  }
  
  // 既に提出済みかチェック
  if (application.status === 'SUBMITTED') {
    throw new ValidationError('この申請書は既に提出済みです')
  }
  
  // 申請期限をチェック
  if (application.subsidyProgram.applicationEnd && 
      new Date() > application.subsidyProgram.applicationEnd) {
    throw new ValidationError('申請期限を過ぎています')
  }
  
  // 申請書の内容チェック（生成済みコンテンツがあるか）
  if (!application.generatedContent) {
    throw new ValidationError('申請書の内容が生成されていません')
  }
  
  // 提出処理
  const submittedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      updatedAt: new Date(),
    },
    include: {
      subsidyProgram: {
        select: {
          name: true,
          category: true,
        },
      },
    },
  })
  
  // 提出ログを記録
  await prisma.aiUsageLog.create({
    data: {
      userId,
      applicationId,
      // action: 'SUBMIT_APPLICATION',
      model: 'SYSTEM',
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
    },
  })
  
  res.json({
    success: true,
    message: '申請書を提出しました',
    data: submittedApplication,
  })
}))

/**
 * AI申請書セクション再生成
 * POST /api/applications/:id/regenerate
 */
router.post('/:id/regenerate', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const applicationId = req.params.id
  const userId = req.user!.id
  
  const regenerateSchema = z.object({
    section: z.string().min(1, '再生成するセクションを指定してください'),
    instructions: z.string().max(500).optional(),
  })
  
  const { section, instructions } = regenerateSchema.parse(req.body)
  
  // 申請書の存在確認と権限チェック
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId,
    },
    include: {
      subsidyProgram: true,
      user: {
        select: {
          companyName: true,
          businessType: true,
        },
      },
    },
  })
  
  if (!application) {
    throw new NotFoundError('申請書が見つかりません')
  }
  
  // 再生成可能な状態かチェック
  if (!['GENERATED', 'EDITING', 'COMPLETED'].includes(application.status)) {
    throw new ValidationError('この申請書は現在再生成できません')
  }
  
  try {
    // AI再生成を実行
    const inputData = JSON.parse(application.inputData as string || '{}')
    const currentContent = JSON.parse(application.generatedContent as string || '{}')
    
    const aiInput = {
      companyInfo: {
        name: application.user.companyName,
        businessType: application.user.businessType,
      },
      businessPlan: inputData,
      subsidyInfo: {
        programName: application.subsidyProgram.name,
        requirements: application.subsidyProgram.requirements,
      },
      regenerationRequest: {
        section,
        instructions,
        currentContent,
      },
    }
    
    const regeneratedContent = await aiOrchestrator.regenerateSection(aiInput)
    
    // 申請書の該当セクションを更新
    const updatedContent = {
      ...currentContent,
      [section]: regeneratedContent,
    }
    
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        generatedContent: JSON.stringify(updatedContent),
        status: 'EDITING',
        updatedAt: new Date(),
      },
    })
    
    // AI使用ログを記録
    await prisma.aiUsageLog.create({
      data: {
        userId,
        applicationId,
        // action: 'REGENERATE_SECTION',
        model: 'GPT-4O',
        inputTokens: 800, // 推定値
        outputTokens: 400, // 推定値
        estimatedCost: 0.02, // 推定値
      },
    })
    
    res.json({
      success: true,
      message: `${section}セクションを再生成しました`,
      data: {
        applicationId,
        section,
        content: regeneratedContent,
        fullContent: updatedContent,
      },
    })
    
  } catch (error) {
    console.error('Section regeneration error:', error)
    
    res.status(500).json({
      success: false,
      error: { message: 'セクション再生成に失敗しました' },
    })
  }
}))

/**
 * AI申請書分析・スコアリング
 * GET /api/applications/:id/analysis
 */
router.get('/:id/analysis', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const applicationId = req.params.id
  const userId = req.user!.id
  
  // 申請書の存在確認と権限チェック
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId,
    },
    include: {
      subsidyProgram: true,
    },
  })
  
  if (!application) {
    throw new NotFoundError('申請書が見つかりません')
  }
  
  // 分析可能な状態かチェック
  if (!application.generatedContent) {
    throw new ValidationError('申請書の内容が生成されていません')
  }
  
  try {
    const content = JSON.parse(application.generatedContent as string)
    
    // AI分析を実行
    const analysisInput = {
      applicationContent: content,
      subsidyProgram: {
        name: application.subsidyProgram.name,
        requirements: application.subsidyProgram.requirements,
        evaluationCriteria: application.subsidyProgram.evaluationCriteria,
      },
    }
    
    const analysis = await aiOrchestrator.analyzeApplication(analysisInput)
    
    // 分析結果をデータベースに保存
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        estimatedScore: analysis.score,
        // analysisResult: JSON.stringify(analysis),
        updatedAt: new Date(),
      },
    })
    
    // AI使用ログを記録
    await prisma.aiUsageLog.create({
      data: {
        userId,
        applicationId,
        // action: 'ANALYZE_APPLICATION',
        model: 'CLAUDE-3-5-SONNET',
        inputTokens: 1200, // 推定値
        outputTokens: 600, // 推定値
        estimatedCost: 0.025, // 推定値
      },
    })
    
    res.json({
      success: true,
      message: '申請書の分析が完了しました',
      data: analysis,
    })
    
  } catch (error) {
    console.error('Application analysis error:', error)
    
    res.status(500).json({
      success: false,
      error: { message: '申請書の分析に失敗しました' },
    })
  }
}))

/**
 * 補助金推奨API
 * GET /api/applications/recommendations
 */
router.get('/recommendations', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  // ユーザー企業情報を取得
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      companyName: true,
      businessType: true,
      foundedYear: true,
      employeeCount: true,
    },
  });

  if (!user) {
    throw new NotFoundError('ユーザーが見つかりません');
  }

  // アクティブな補助金プログラムを取得
  const subsidyPrograms = await prisma.subsidyProgram.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      category: true,
      maxAmount: true,
      requirements: true,
      evaluationCriteria: true,
      applicationEnd: true,
    },
  });

  try {
    // AI推奨エンジンを使用して最適な補助金を分析
    const recommendationInput = {
      companyProfile: {
        name: user.companyName,
        businessType: user.businessType,
        foundedYear: user.foundedYear,
        employeeCount: user.employeeCount,
        // description: user.description || '',
      },
      availablePrograms: subsidyPrograms,
    };

    const recommendations = await aiOrchestrator.recommendSubsidyPrograms(recommendationInput);

    // 推奨結果をログに記録
    await prisma.aiUsageLog.create({
      data: {
        userId,
        // action: 'RECOMMEND_SUBSIDIES',
        model: 'GPT-4O',
        inputTokens: 500, // 推定値
        outputTokens: 300, // 推定値
        estimatedCost: 0.015, // 推定値
      },
    });

    res.json({
      success: true,
      message: '補助金推奨を取得しました',
      data: recommendations,
    });

  } catch (error) {
    console.error('Subsidy recommendation error:', error);
    
    res.status(500).json({
      success: false,
      error: { message: '補助金推奨の取得に失敗しました' },
    });
  }
}));

/**
 * 申請書テンプレート取得API
 * GET /api/applications/templates/:subsidyProgramId
 */
router.get('/templates/:subsidyProgramId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const subsidyProgramId = req.params.subsidyProgramId;
  const userId = req.user!.id;

  // 補助金プログラム情報を取得
  const subsidyProgram = await prisma.subsidyProgram.findUnique({
    where: { id: subsidyProgramId },
    select: {
      id: true,
      name: true,
      category: true,
      requirements: true,
      evaluationCriteria: true,
    },
  });

  if (!subsidyProgram) {
    throw new NotFoundError('補助金プログラムが見つかりません');
  }

  try {
    // AIテンプレート生成
    const templateInput = {
      subsidyProgram,
      requestType: 'template', // テンプレート生成モード
    };

    const template = await aiOrchestrator.generateApplicationTemplate(templateInput);

    // AI使用ログを記録
    await prisma.aiUsageLog.create({
      data: {
        userId,
        // action: 'GENERATE_TEMPLATE',
        model: 'GPT-4O',
        inputTokens: 300, // 推定値
        outputTokens: 200, // 推定値
        estimatedCost: 0.01, // 推定値
      },
    });

    res.json({
      success: true,
      message: '申請書テンプレートを生成しました',
      data: template,
    });

  } catch (error) {
    console.error('Template generation error:', error);
    
    res.status(500).json({
      success: false,
      error: { message: 'テンプレート生成に失敗しました' },
    });
  }
}));

/**
 * 申請書比較分析API
 * POST /api/applications/compare
 */
router.post('/compare', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const compareSchema = z.object({
    applicationIds: z.array(z.string()).min(2, '比較には2つ以上の申請書が必要です').max(5, '最大5つまで比較可能です'),
  });
  
  const { applicationIds } = compareSchema.parse(req.body);
  
  // 申請書を取得（権限チェック含む）
  const applications = await prisma.application.findMany({
    where: {
      id: { in: applicationIds },
      userId,
    },
    include: {
      subsidyProgram: {
        select: {
          name: true,
          category: true,
        },
      },
    },
  });

  if (applications.length !== applicationIds.length) {
    throw new ValidationError('指定された申請書の一部が見つからないか、アクセス権限がありません');
  }

  try {
    // AI比較分析を実行
    const comparisonInput = {
      applications: applications.map(app => ({
        id: app.id,
        title: app.title,
        content: app.generatedContent ? JSON.parse(app.generatedContent as string) : null,
        subsidyProgram: app.subsidyProgram,
        estimatedScore: app.estimatedScore,
      })),
    };

    const comparison = await aiOrchestrator.compareApplications(comparisonInput);

    // AI使用ログを記録
    await prisma.aiUsageLog.create({
      data: {
        userId,
        // action: 'COMPARE_APPLICATIONS',
        model: 'CLAUDE-3-5-SONNET',
        inputTokens: 1000, // 推定値
        outputTokens: 500, // 推定値
        estimatedCost: 0.02, // 推定値
      },
    });

    res.json({
      success: true,
      message: '申請書比較分析が完了しました',
      data: comparison,
    });

  } catch (error) {
    console.error('Application comparison error:', error);
    
    res.status(500).json({
      success: false,
      error: { message: '申請書比較分析に失敗しました' },
    });
  }
}));

// PDF関連のルートを追加
// ダッシュボード統計
router.get('/stats/dashboard', conditionalAuth, asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    throw new AuthenticationError('認証が必要です')
  }

  const [totalApplications, inProgressCount, submittedCount, approvedCount] = await Promise.all([
    prisma.application.count({ where: { userId } }),
    prisma.application.count({ where: { userId, status: 'DRAFT' } }),
    prisma.application.count({ where: { userId, status: 'SUBMITTED' } }),
    prisma.application.count({ where: { userId, status: 'APPROVED' } })
  ])

  const recentApplications = await prisma.application.findMany({
    where: { userId },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      subsidyProgram: {
        select: { name: true, category: true }
      }
    }
  })

  res.json({
    success: true,
    data: {
      stats: {
        total: totalApplications,
        inProgress: inProgressCount,
        submitted: submittedCount,
        approved: approvedCount,
        successRate: totalApplications > 0 ? Math.round((approvedCount / totalApplications) * 100) : 0
      },
      recentApplications: recentApplications.map(app => ({
        id: app.id,
        title: app.projectTitle,
        status: app.status,
        subsidyProgram: app.subsidyProgram.name,
        category: app.subsidyProgram.category,
        updatedAt: app.updatedAt
      }))
    }
  })
}))

// 最近のアクティビティ
router.get('/activity/recent', conditionalAuth, asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    throw new AuthenticationError('認証が必要です')
  }

  const activities = await prisma.application.findMany({
    where: { userId },
    take: 20,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      projectTitle: true,
      status: true,
      updatedAt: true,
      subsidyProgram: {
        select: { name: true }
      }
    }
  })

  res.json({
    success: true,
    data: activities.map(activity => ({
      id: activity.id,
      action: `申請書「${activity.projectTitle}」を更新`,
      status: activity.status,
      subsidyProgram: activity.subsidyProgram.name,
      timestamp: activity.updatedAt
    }))
  })
}))

// 申請書の複製
router.post('/:id/duplicate', conditionalAuth, asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id

  if (!userId) {
    throw new AuthenticationError('認証が必要です')
  }

  const original = await prisma.application.findFirst({
    where: { id, userId }
  })

  if (!original) {
    throw new NotFoundError('申請書が見つかりません')
  }

  const duplicated = await prisma.application.create({
    data: {
      userId,
      subsidyProgramId: original.subsidyProgramId,
      projectTitle: `${original.projectTitle} (コピー)`,
      projectDescription: original.projectDescription,
      purpose: original.purpose,
      targetMarket: original.targetMarket,
      expectedEffects: original.expectedEffects,
      budget: original.budget,
      timeline: original.timeline,
      challenges: original.challenges,
      innovation: original.innovation,
      status: 'DRAFT',
      completionRate: 0
    }
  })

  res.status(201).json({
    success: true,
    data: duplicated
  })
}))

// AI生成履歴
router.get('/:id/ai-history', conditionalAuth, asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id

  if (!userId) {
    throw new AuthenticationError('認証が必要です')
  }

  const application = await prisma.application.findFirst({
    where: { id, userId }
  })

  if (!application) {
    throw new NotFoundError('申請書が見つかりません')
  }

  // TODO: AI生成履歴テーブルを作成して実装
  // 現在はモックデータを返す
  res.json({
    success: true,
    data: {
      history: [
        {
          id: '1',
          generatedAt: new Date(),
          field: 'projectDescription',
          originalText: application.projectDescription,
          generatedText: application.projectDescription,
          status: 'accepted'
        }
      ]
    }
  })
}))

// 申請書の提出
router.post('/:id/submit', conditionalAuth, asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id

  if (!userId) {
    throw new AuthenticationError('認証が必要です')
  }

  const application = await prisma.application.findFirst({
    where: { id, userId }
  })

  if (!application) {
    throw new NotFoundError('申請書が見つかりません')
  }

  if (application.status !== 'DRAFT') {
    throw new ValidationError('下書き状態の申請書のみ提出できます')
  }

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date()
    }
  })

  res.json({
    success: true,
    data: updated,
    message: '申請書を提出しました'
  })
}))

// プロセスステータス確認（汎用的な非同期処理用）
router.get('/processes/:processId/status', asyncHandler(async (req: Request, res: Response) => {
  const { processId } = req.params
  
  // TODO: 実際のプロセス管理システムと連携
  // 現在はモックレスポンス
  res.json({
    success: true,
    data: {
      processId,
      status: 'completed',
      progress: 100,
      result: {
        message: '処理が完了しました'
      }
    }
  })
}))

// 一括削除
router.post('/batch/delete', conditionalAuth, asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const { applicationIds } = req.body
  const userId = req.user?.id

  if (!userId) {
    throw new AuthenticationError('認証が必要です')
  }

  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    throw new ValidationError('削除する申請書IDを指定してください')
  }

  const deleteResults = await Promise.allSettled(
    applicationIds.map(async (id) => {
      const app = await prisma.application.findFirst({
        where: { id, userId }
      })
      
      if (!app) {
        throw new Error('申請書が見つかりません')
      }
      
      return prisma.application.delete({ where: { id } })
    })
  )

  const errors = deleteResults
    .map((result, index) => {
      if (result.status === 'rejected') {
        return { id: applicationIds[index], error: result.reason.message }
      }
      return null
    })
    .filter(Boolean)

  res.json({
    success: true,
    data: {
      deletedCount: deleteResults.filter(r => r.status === 'fulfilled').length,
      errors
    }
  })
}))

// エクスポート
router.post('/export', conditionalAuth, asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const { applicationIds, format } = req.body
  const userId = req.user?.id

  if (!userId) {
    throw new AuthenticationError('認証が必要です')
  }

  if (!['pdf', 'excel', 'csv'].includes(format)) {
    throw new ValidationError('無効なフォーマットです')
  }

  // TODO: 実際のエクスポート処理を実装
  // 現在はモックレスポンス
  const fileName = `applications_export_${Date.now()}.${format}`
  const downloadUrl = `/api/downloads/${fileName}`

  res.json({
    success: true,
    data: {
      downloadUrl,
      fileName,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24時間後
    }
  })
}))

// コメント機能
router.get('/:id/comments', conditionalAuth, asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id

  if (!userId) {
    throw new AuthenticationError('認証が必要です')
  }

  const application = await prisma.application.findFirst({
    where: { id, userId }
  })

  if (!application) {
    throw new NotFoundError('申請書が見つかりません')
  }

  // TODO: コメントテーブルを作成して実装
  // 現在はモックデータを返す
  res.json({
    success: true,
    data: [
      {
        id: '1',
        content: 'この部分をもう少し詳しく記載してください',
        author: {
          id: userId,
          name: 'あなた',
          role: 'user'
        },
        section: 'projectDescription',
        isResolved: false,
        createdAt: new Date().toISOString(),
        replies: []
      }
    ]
  })
}))

// スコア推定
router.get('/:id/score', conditionalAuth, asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id

  if (!userId) {
    throw new AuthenticationError('認証が必要です')
  }

  const application = await prisma.application.findFirst({
    where: { id, userId },
    include: { subsidyProgram: true }
  })

  if (!application) {
    throw new NotFoundError('申請書が見つかりません')
  }

  // TODO: AI分析によるスコア推定を実装
  // 現在はモックデータを返す
  res.json({
    success: true,
    data: {
      estimatedScore: 78,
      maxScore: 100,
      scoreBreakdown: {
        innovation: { score: 18, maxScore: 25 },
        feasibility: { score: 20, maxScore: 25 },
        impact: { score: 22, maxScore: 25 },
        budget: { score: 18, maxScore: 25 }
      },
      recommendations: [
        '新規性・独自性の記述をより具体的にすることで、イノベーション項目のスコアが向上する可能性があります',
        '期待される効果に定量的な指標を追加することで、インパクト項目のスコアが向上する可能性があります'
      ]
    }
  })
}))

router.use('/', pdfRoutes)

export default router