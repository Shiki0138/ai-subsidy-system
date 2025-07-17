import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('type') as string; // guidelines, examples, etc.
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // ファイルの内容を読み取る
    const fileContent = await file.text();
    
    // Geminiモデルの取得
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // ドキュメントタイプに応じたプロンプト
    let prompt = '';
    
    if (documentType === 'guidelines') {
      prompt = `以下の補助金募集要項を分析し、重要なポイントを抽出してください：

${fileContent}

以下の観点で分析してください：
1. 審査の重要ポイント
2. 必須要件
3. 加点要素
4. 注意事項
5. 申請書作成のコツ

簡潔にまとめて出力してください。`;
    } else if (documentType === 'examples') {
      prompt = `以下の採択事例を分析し、成功パターンを抽出してください：

${fileContent}

以下の観点で分析してください：
1. 採択された事業の共通点
2. 効果的な記載方法
3. 使用されているキーワード
4. 数値目標の設定方法
5. 成功要因

簡潔にまとめて出力してください。`;
    }
    
    // Geminiによる分析
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();
    
    return NextResponse.json({
      success: true,
      analysis: analysis,
      fileName: file.name,
      type: documentType
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze document' },
      { status: 500 }
    );
  }
}