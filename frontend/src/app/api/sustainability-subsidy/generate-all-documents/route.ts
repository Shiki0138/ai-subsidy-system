import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📄 書類生成リクエストを受信:', body);
    
    // 模擬的な遅延
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return NextResponse.json({
      success: true,
      message: 'All application documents generated successfully',
      data: {
        documents: [
          {
            id: 'form1',
            title: '様式1：申請書',
            description: '小規模事業者持続化補助金に係る申請書',
            content: '申請書の内容がここに生成されます...',
            downloadUrl: '/mock/form1.pdf'
          },
          {
            id: 'form2',
            title: '様式2：経営計画書',
            description: '経営計画書兼補助事業計画書①',
            content: 'AI生成された経営計画書の内容...',
            downloadUrl: '/mock/form2.pdf'
          },
          {
            id: 'form3',
            title: '様式3：補助事業計画書',
            description: '補助事業計画書②（経費明細）',
            content: '経費明細を含む補助事業計画書...',
            downloadUrl: '/mock/form3.pdf'
          },
          {
            id: 'form5',
            title: '様式5：交付申請書',
            description: '補助金交付申請書',
            content: '交付申請書の内容...',
            downloadUrl: '/mock/form5.pdf'
          },
          {
            id: 'form6',
            title: '様式6：宣誓・同意書',
            description: '宣誓・同意書',
            content: '宣誓・同意書の内容...',
            downloadUrl: '/mock/form6.pdf'
          }
        ],
        summary: {
          totalDocuments: 5,
          estimatedSubsidyAmount: body.budgetPlan?.subsidyAmount || 1000000,
          projectCost: body.budgetPlan?.totalProjectCost || 1500000,
          subsidyRate: ((body.budgetPlan?.subsidyAmount || 1000000) / (body.budgetPlan?.totalProjectCost || 1500000) * 100).toFixed(1) + '%'
        }
      }
    });
  } catch (error) {
    console.error('Error in document generation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Document generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}