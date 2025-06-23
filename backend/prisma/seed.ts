import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // サンプルユーザー作成
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash,
      companyName: 'デモ株式会社',
      representativeName: '山田太郎',
      businessType: '製造業',
      phoneNumber: '03-1234-5678',
      postalCode: '100-0001',
      address: '東京都千代田区千代田1-1',
      role: 'USER',
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  // サンプル補助金プログラム作成
  const programs = [
    {
      id: 'it-doshitu',
      name: 'IT導入補助金',
      officialName: 'サービス等生産性向上IT導入支援事業',
      category: 'IT・デジタル化',
      organizationName: '一般社団法人サービスデザイン推進協議会',
      description: 'ITツール導入による業務効率化と売上向上を支援する補助金です。',
      maxAmount: 4500000,
      subsidyRate: 0.5,
      targetBusiness: '中小企業・小規模事業者',
      requirements: {
        employeeCount: { min: 1, max: 300 },
        industryTypes: ['全業種'],
        otherConditions: ['生産性向上を目的としたITツール導入']
      },
      applicationStart: new Date('2024-01-01'),
      applicationEnd: new Date('2024-12-31'),
      evaluationCriteria: {
        productivity: 30,
        innovation: 25,
        feasibility: 25,
        sustainability: 20
      },
      sourceUrl: 'https://www.it-hojo.jp/',
      lastUpdated: new Date()
    },
    {
      id: 'jigyou-saikouchiku',
      name: '事業再構築補助金',
      officialName: '中小企業等事業再構築促進事業',
      category: '事業転換・新分野展開',
      organizationName: '中小企業庁',
      description: '新分野展開や事業転換、業種転換等の思い切った事業再構築に意欲を有する中小企業等の挑戦を支援します。',
      maxAmount: 150000000,
      subsidyRate: 0.75,
      targetBusiness: '中小企業・中堅企業',
      requirements: {
        employeeCount: { min: 1, max: 2000 },
        industryTypes: ['全業種'],
        otherConditions: ['売上減少要件を満たすこと', '事業再構築指針に沿った事業計画']
      },
      applicationStart: new Date('2024-03-01'),
      applicationEnd: new Date('2024-06-30'),
      evaluationCriteria: {
        productivity: 25,
        innovation: 30,
        feasibility: 25,
        sustainability: 20
      },
      sourceUrl: 'https://jigyou-saikouchiku.go.jp/',
      lastUpdated: new Date()
    }
  ];

  // 補助金プログラムを作成
  for (const program of programs) {
    const createdProgram = await prisma.subsidyProgram.upsert({
      where: { id: program.id },
      update: program,
      create: program
    });

    // サンプル資料を作成
    const documents = [
      {
        type: 'OVERVIEW',
        title: `${program.name} 概要説明資料（2024年度版）`,
        description: '補助金の概要、対象者、補助率、申請の流れなどをまとめた資料です。',
        content: `【${program.name}の概要】

1. 目的
${program.description}

2. 補助対象者
${program.targetBusiness}

3. 補助率・補助上限額
- 補助率: ${program.subsidyRate * 100}%
- 上限額: ${program.maxAmount.toLocaleString()}円

4. 申請期間
${program.applicationStart.toLocaleDateString('ja-JP')} 〜 ${program.applicationEnd.toLocaleDateString('ja-JP')}

5. お問い合わせ先
${program.organizationName}`,
        version: '2024.1',
        publishedDate: new Date('2024-01-15'),
        isLatest: true
      },
      {
        type: 'GUIDELINE',
        title: `${program.name} 募集要項（第1次公募）`,
        description: '申請に必要な要件、提出書類、審査基準などの詳細を記載した公式募集要項です。',
        fileUrl: `https://example.com/guidelines/${program.id}_guideline_2024.pdf`,
        fileSize: 2048000,
        mimeType: 'application/pdf',
        version: '2024.1',
        publishedDate: new Date('2024-01-01'),
        isLatest: true
      },
      {
        type: 'APPLICATION_FORM',
        title: '申請書様式一式',
        description: '申請に必要な各種様式をまとめたファイルです。',
        fileUrl: `https://example.com/forms/${program.id}_forms_2024.zip`,
        fileSize: 512000,
        mimeType: 'application/zip',
        version: '2024.1',
        publishedDate: new Date('2024-01-01'),
        isLatest: true
      },
      {
        type: 'FAQ',
        title: 'よくある質問と回答',
        description: '申請者からよく寄せられる質問とその回答をまとめています。',
        content: `Q1. 申請に必要な書類は何ですか？
A1. 事業計画書、決算書（3期分）、会社概要等が必要です。

Q2. 申請から採択まではどのくらいかかりますか？
A2. 通常、申請締切から2〜3ヶ月程度で採択結果が通知されます。

Q3. 不採択の場合、再申請は可能ですか？
A3. はい、次回の公募で再申請が可能です。`,
        version: '2024.1',
        publishedDate: new Date('2024-02-01'),
        isLatest: true
      }
    ];

    // 資料を作成
    for (const doc of documents) {
      await prisma.subsidyDocument.create({
        data: {
          ...doc,
          subsidyProgramId: createdProgram.id,
          type: doc.type as any
        }
      });
    }
  }

  console.log('✅ シードデータの作成が完了しました');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });