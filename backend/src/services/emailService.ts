import nodemailer from 'nodemailer';
import { logger } from '../config/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface PasswordResetEmailData {
  userName: string;
  resetLink: string;
  expiryTime: string;
}

interface ApplicationCompleteEmailData {
  userName: string;
  applicationTitle: string;
  applicationId: string;
  dashboardLink: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // 開発環境では実際にメールを送信せず、ログに出力
      if (process.env.NODE_ENV === 'development') {
        logger.info('📧 Email sending (Development Mode)', {
          to: options.to,
          subject: options.subject,
          html: options.html.substring(0, 200) + '...'
        });
        return true;
      }

      const info = await this.transporter.sendMail({
        from: `"AI補助金申請システム" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info('📧 Email sent successfully', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject
      });

      return true;
    } catch (error) {
      logger.error('❌ Email sending failed', {
        error: error.message,
        to: options.to,
        subject: options.subject
      });
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, data: PasswordResetEmailData): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>パスワードリセット</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 パスワードリセット</h1>
    </div>
    <div class="content">
        <p>こんにちは、${data.userName}様</p>
        
        <p>AI補助金申請システムのパスワードリセットリクエストを受け付けました。</p>
        
        <p>下記のボタンをクリックして、新しいパスワードを設定してください：</p>
        
        <div style="text-align: center;">
            <a href="${data.resetLink}" class="button">パスワードをリセット</a>
        </div>
        
        <div class="warning">
            <strong>⚠️ 重要な注意事項</strong>
            <ul>
                <li>このリンクは<strong>${data.expiryTime}</strong>まで有効です</li>
                <li>セキュリティのため、リンクは1回のみ使用可能です</li>
                <li>心当たりがない場合は、このメールを無視してください</li>
            </ul>
        </div>
        
        <p>もしボタンがクリックできない場合は、以下のURLを直接ブラウザにコピーしてください：</p>
        <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px;">
            ${data.resetLink}
        </p>
    </div>
    
    <div class="footer">
        <p>このメールは自動送信されています。返信はできません。</p>
        <p>© 2024 AI補助金申請システム</p>
    </div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: '【AI補助金申請システム】パスワードリセットのご案内',
      html,
      text: `パスワードリセット\n\n${data.userName}様\n\n以下のリンクからパスワードをリセットしてください：\n${data.resetLink}\n\n有効期限: ${data.expiryTime}`
    });
  }

  async sendApplicationCompleteEmail(email: string, data: ApplicationCompleteEmailData): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>申請書生成完了</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .success-badge {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
        }
        .button {
            display: inline-block;
            background: #28a745;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
        }
        .info-box {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 申請書生成完了</h1>
    </div>
    <div class="content">
        <p>おめでとうございます、${data.userName}様</p>
        
        <div class="success-badge">
            <strong>✅ 申請書「${data.applicationTitle}」の生成が完了しました</strong>
        </div>
        
        <p>AI技術を活用して、高品質な申請書を作成いたしました。</p>
        
        <div class="info-box">
            <h3>📋 次のステップ</h3>
            <ol>
                <li><strong>内容確認</strong>：生成された申請書の内容をご確認ください</li>
                <li><strong>編集・調整</strong>：必要に応じて内容を編集・カスタマイズできます</li>
                <li><strong>PDF出力</strong>：最終版をPDFとしてダウンロードできます</li>
                <li><strong>提出準備</strong>：必要書類を揃えて提出準備を進めてください</li>
            </ol>
        </div>
        
        <div style="text-align: center;">
            <a href="${data.dashboardLink}" class="button">ダッシュボードで確認</a>
        </div>
        
        <div class="info-box">
            <h3>💡 成功のヒント</h3>
            <ul>
                <li><strong>具体的な数値</strong>：売上予測、効果測定などの数値を具体的に記載</li>
                <li><strong>独自性のアピール</strong>：他社との差別化ポイントを明確に</li>
                <li><strong>実現可能性</strong>：計画の実現可能性を論理的に説明</li>
                <li><strong>社会的意義</strong>：プロジェクトの社会的な価値を強調</li>
            </ul>
        </div>
        
        <p>ご質問やサポートが必要な場合は、お気軽にお問い合わせください。</p>
        <p>申請の成功を心よりお祈りしております。</p>
    </div>
    
    <div class="footer">
        <p>このメールは自動送信されています。</p>
        <p>© 2024 AI補助金申請システム</p>
    </div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: '【AI補助金申請システム】申請書生成完了のお知らせ',
      html,
      text: `申請書生成完了\n\n${data.userName}様\n\n申請書「${data.applicationTitle}」の生成が完了しました。\n\nダッシュボードで確認: ${data.dashboardLink}`
    });
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ようこそ</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .feature-list {
            background: white;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .feature-item {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .feature-item:last-child {
            border-bottom: none;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 ようこそ！</h1>
        <p>AI補助金申請システムへ</p>
    </div>
    <div class="content">
        <p>こんにちは、${userName}様</p>
        
        <p>AI補助金申請システムへのご登録、ありがとうございます。</p>
        
        <div class="feature-list">
            <h3>🚀 主な機能</h3>
            <div class="feature-item">
                <strong>🤖 AI自動生成</strong><br>
                世界最高レベルのAI技術で申請書を自動生成
            </div>
            <div class="feature-item">
                <strong>📊 採択率予測</strong><br>
                過去のデータを基に採択可能性を分析
            </div>
            <div class="feature-item">
                <strong>📄 PDF出力</strong><br>
                プロフェッショナルな形式でPDF出力
            </div>
            <div class="feature-item">
                <strong>🔒 セキュリティ</strong><br>
                企業レベルのセキュリティで情報を保護
            </div>
        </div>
        
        <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
                今すぐ申請書を作成
            </a>
        </div>
        
        <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
        <p>申請の成功をサポートいたします！</p>
    </div>
    
    <div class="footer">
        <p>このメールは自動送信されています。</p>
        <p>© 2024 AI補助金申請システム</p>
    </div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: '【AI補助金申請システム】ご登録ありがとうございます',
      html,
      text: `ようこそ！\n\n${userName}様\n\nAI補助金申請システムへのご登録ありがとうございます。\n今すぐ申請書作成を始めましょう！`
    });
  }

  async sendSystemNotification(email: string, subject: string, message: string): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>システム通知</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #f8f9fa;
            text-align: center;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            border-bottom: 3px solid #667eea;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            border: 1px solid #dee2e6;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📢 ${subject}</h1>
    </div>
    <div class="content">
        <div style="white-space: pre-line;">${message}</div>
    </div>
    
    <div class="footer">
        <p>このメールは自動送信されています。</p>
        <p>© 2024 AI補助金申請システム</p>
    </div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: `【AI補助金申請システム】${subject}`,
      html,
      text: message
    });
  }

  // メール送信テスト
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('📧 Email service connection verified');
      return true;
    } catch (error) {
      logger.error('❌ Email service connection failed', { error: error.message });
      return false;
    }
  }
}

export const emailService = new EmailService();