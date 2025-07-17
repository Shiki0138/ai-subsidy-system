import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini APIの初期化
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subsidyType, companyInfo, projectInfo, uploadedDocuments } = body;

    // Geminiモデルの取得
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // 補助金情報の定義
    const subsidyInfo = getSubsidyInfo(subsidyType);

    // プロンプトの構築
    const prompt = buildPrompt(subsidyType, companyInfo, projectInfo, uploadedDocuments, subsidyInfo);

    // Geminiによる生成
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // 生成されたテキストを構造化
    const structuredContent = parseGeneratedContent(generatedText);

    return NextResponse.json({
      success: true,
      data: structuredContent
    });
  } catch (error) {
    console.error('Application generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate application' },
      { status: 500 }
    );
  }
}

function getSubsidyInfo(subsidyType: string) {
  const subsidies = {
    jizokuka: {
      name: '小規模企業持続化補助金',
      maxAmount: '200万円',
      rate: '2/3',
      keywords: ['販路開拓', '業務効率化', '生産性向上', '地域経済', '持続的発展']
    },
    gyomukaizen: {
      name: '業務改善助成金',
      maxAmount: '600万円',
      rate: '最大90%',
      keywords: ['賃金引上げ', '生産性向上', '設備投資', '労働環境改善', '最低賃金']
    },
    it: {
      name: 'IT導入補助金',
      maxAmount: '450万円',
      rate: '1/2〜3/4',
      keywords: ['デジタル化', 'DX推進', 'クラウド', 'セキュリティ', '業務効率化']
    },
    monozukuri: {
      name: 'ものづくり補助金',
      maxAmount: '1,250万円',
      rate: '1/2〜2/3',
      keywords: ['革新的サービス', '試作品開発', '生産プロセス改善', '設備投資', '技術革新']
    },
    saikochiku: {
      name: '事業再構築補助金',
      maxAmount: '1.5億円',
      rate: '1/2〜3/4',
      keywords: ['新分野展開', '事業転換', '業態転換', '事業再編', 'ポストコロナ']
    }
  };
  return subsidies[subsidyType as keyof typeof subsidies];
}

function buildPrompt(
  subsidyType: string,
  companyInfo: any,
  projectInfo: any,
  uploadedDocuments: any,
  subsidyInfo: any
): string {
  let prompt = `あなたは日本の補助金申請の専門家です。以下の情報を基に、${subsidyInfo.name}の申請書を作成してください。

【重要な指示】
1. 採択率を高めるため、補助金の審査ポイントを意識して記載してください
2. 具体的な数値目標と定量的な効果を必ず含めてください
3. 実現可能性が高く、説得力のある内容にしてください
4. キーワード「${subsidyInfo.keywords.join('、')}」を適切に使用してください

【企業情報】
- 企業名: ${companyInfo.name}
- 所在地: ${companyInfo.address}
- 業種: ${companyInfo.industry}
- 従業員数: ${companyInfo.employees}名
- 年間売上高: ${companyInfo.revenue}

【事業計画】
- 事業名: ${projectInfo.title}
- 事業目的: ${projectInfo.purpose}
- 事業内容: ${projectInfo.content}
- 事業費用: ${projectInfo.budget}
- 実施期間: ${projectInfo.period}

`;

  // アップロードされたドキュメントがある場合
  if (uploadedDocuments) {
    if (uploadedDocuments.guidelines) {
      prompt += `
【募集要項の重要ポイント】
${uploadedDocuments.guidelines}
`;
    }
    if (uploadedDocuments.successExamples) {
      prompt += `
【採択事例の傾向】
${uploadedDocuments.successExamples}
`;
    }
  }

  prompt += `
以下の形式で申請書を作成してください：

【事業概要】
（企業の強みと事業の必要性を明確に記載）

【実施計画】
（具体的な実施ステップと期間を記載）

【期待効果】
（定量的・定性的効果を記載）

【資金計画】
（詳細な費用内訳と資金調達計画を記載）

【事業計画書】
（より詳細な事業計画）

【収支計画書】
（3カ年の収支計画）
`;

  return prompt;
}

function parseGeneratedContent(generatedText: string): any {
  // 生成されたテキストをセクションごとに分割
  const sections = generatedText.split(/【(.*?)】/).filter(Boolean);
  
  const content: any = {};
  
  for (let i = 0; i < sections.length; i += 2) {
    const sectionTitle = sections[i];
    const sectionContent = sections[i + 1] || '';
    
    // セクションタイトルに基づいて適切なキーに割り当て
    switch (sectionTitle) {
      case '事業概要':
        content.事業概要 = sectionContent.trim();
        break;
      case '実施計画':
        content.実施計画 = sectionContent.trim();
        break;
      case '期待効果':
        content.期待効果 = sectionContent.trim();
        break;
      case '資金計画':
        content.資金計画 = sectionContent.trim();
        break;
      case '事業計画書':
        if (!content.添付書類) content.添付書類 = {};
        content.添付書類.事業計画書 = sectionContent.trim();
        break;
      case '収支計画書':
        if (!content.添付書類) content.添付書類 = {};
        content.添付書類.収支計画書 = sectionContent.trim();
        break;
    }
  }

  // 生成されなかったセクションがある場合はデフォルト値を設定
  if (!content.事業概要) content.事業概要 = '（生成エラー）';
  if (!content.実施計画) content.実施計画 = '（生成エラー）';
  if (!content.期待効果) content.期待効果 = '（生成エラー）';
  if (!content.資金計画) content.資金計画 = '（生成エラー）';

  return content;
}