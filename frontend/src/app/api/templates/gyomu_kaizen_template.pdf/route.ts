import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // テンプレートファイルのパスを指定
    const templatePath = path.join(process.cwd(), '..', 'backend', 'assets', 'templates', 'gyomu_kaizen_template.pdf');
    
    // ファイルが存在するかチェック
    try {
      await fs.access(templatePath);
    } catch (error) {
      return NextResponse.json(
        { error: 'テンプレートファイルが見つかりません' },
        { status: 404 }
      );
    }
    
    // ファイルを読み取り
    const fileBuffer = await fs.readFile(templatePath);
    
    // レスポンスヘッダーを設定
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', 'attachment; filename="gyomu_kaizen_template.pdf"');
    headers.set('Content-Length', fileBuffer.length.toString());
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error('テンプレート取得エラー:', error);
    return NextResponse.json(
      { error: 'テンプレートの取得に失敗しました' },
      { status: 500 }
    );
  }
}