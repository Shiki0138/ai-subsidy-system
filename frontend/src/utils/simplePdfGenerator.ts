// シンプルなPDF生成ユーティリティ
// 日本語フォントの問題を回避するため、HTMLプレビューを優先的に使用

export const downloadApplicationAsPDF = async (applicationData: any) => {
  // jsPDFで直接PDF生成を試みる
  try {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    
    // 日本語フォントがない場合でも基本的な情報は表示
    doc.setFontSize(20)
    doc.text(applicationData.title || 'Application', 20, 20)
    
    doc.setFontSize(12)
    let yPos = 40
    
    // 基本情報を追加（英語ラベルで）
    const addLine = (label: string, value: string) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      doc.text(`${label}: ${value || '-'}`, 20, yPos)
      yPos += 10
    }
    
    addLine('Company', applicationData.companyName || '')
    addLine('Type', applicationData.subsidyProgramName || '')
    addLine('Status', applicationData.status || '')
    addLine('Created', new Date(applicationData.createdAt || Date.now()).toLocaleDateString())
    
    // PDFを保存
    const fileName = `${applicationData.title || 'application'}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
    
    return true
  } catch (error) {
    console.error('PDF generation failed:', error)
    // フォールバックとしてHTMLプレビューを表示
    showApplicationPreview(applicationData)
    throw new Error('HTMLプレビューを使用してください')
  }
}

// HTMLプレビューを新しいウィンドウで表示
export const showApplicationPreview = (applicationData: any) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>申請書プレビュー - ${applicationData.title || '補助金申請書'}</title>
    <style>
        @media print {
            .no-print { display: none; }
            body { margin: 0; }
            .container { max-width: 100%; padding: 10mm; }
        }
        body {
            font-family: 'Hiragino Sans', 'Meiryo', 'Yu Gothic', sans-serif;
            line-height: 1.8;
            color: #333;
            background: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        h1 { 
            text-align: center; 
            color: #2c3e50;
            border-bottom: 3px solid #3498db; 
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        h2 { 
            background: linear-gradient(to right, #3498db, #2980b9);
            color: white;
            padding: 15px 20px;
            margin: 30px -20px 20px -20px;
            font-size: 18px;
        }
        .subtitle {
            text-align: center;
            color: #7f8c8d;
            font-size: 14px;
            margin-top: -20px;
            margin-bottom: 30px;
        }
        .info-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 30px 0;
            background: white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .info-table td { 
            padding: 15px; 
            border: 1px solid #ecf0f1;
        }
        .info-table td:first-child { 
            background: #f8f9fa; 
            font-weight: bold; 
            width: 30%;
            color: #2c3e50;
        }
        .content { 
            margin: 20px 0; 
            padding: 20px; 
            background: #f8f9fa; 
            border-left: 5px solid #3498db;
            line-height: 2;
        }
        .footer { 
            text-align: center; 
            margin-top: 60px; 
            padding-top: 30px;
            border-top: 1px solid #ecf0f1;
            color: #95a5a6; 
            font-size: 12px; 
        }
        .print-button { 
            position: fixed; 
            top: 30px; 
            right: 30px; 
            padding: 12px 30px; 
            background: linear-gradient(to right, #27ae60, #229954);
            color: white; 
            border: none; 
            cursor: pointer; 
            font-size: 16px;
            border-radius: 50px;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        .print-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
        }
        .notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            color: #856404;
        }
        @page {
            size: A4;
            margin: 15mm;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">
        📄 印刷 / PDF保存
    </button>
    
    <div class="container">
        <h1>${applicationData.subsidyProgramName || '補助金申請書'}</h1>
        <p class="subtitle">AI補助金申請システム 自動生成文書</p>
        
        <div class="notice no-print">
            <strong>📌 PDF保存方法：</strong>
            <ol style="margin: 10px 0 0 20px; padding: 0;">
                <li>右上の「印刷 / PDF保存」ボタンをクリック</li>
                <li>印刷画面で「送信先」を「PDFに保存」に変更</li>
                <li>「保存」ボタンをクリックしてダウンロード</li>
            </ol>
            <p style="margin-top: 10px; font-size: 0.9em;">
                ※ブラウザにより手順が異なる場合があります。<br>
                Chrome: 「送信先」→「PDFに保存」<br>
                Safari/Mac: 「PDF」→「PDFとして保存」<br>
                Edge: 「プリンター」→「PDFとして保存」
            </p>
        </div>
        
        <table class="info-table">
            <tr>
                <td>事業名</td>
                <td><strong>${applicationData.title || '未入力'}</strong></td>
            </tr>
            <tr>
                <td>申請者（企業名）</td>
                <td>${applicationData.companyName || '未入力'}</td>
            </tr>
            <tr>
                <td>代表者名</td>
                <td>${applicationData.representativeName || '未入力'}</td>
            </tr>
            <tr>
                <td>申請日</td>
                <td>${new Date(applicationData.createdAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                })}</td>
            </tr>
            <tr>
                <td>補助金種別</td>
                <td>${applicationData.subsidyProgramCategory || '一般型'}</td>
            </tr>
        </table>
        
        <h2>1. 事業概要</h2>
        <div class="content">
            ${(applicationData.projectDescription || '事業概要が入力されていません。').replace(/\n/g, '<br>')}
        </div>
        
        <h2>2. 事業の目的・背景</h2>
        <div class="content">
            ${(applicationData.purpose || '事業の目的・背景が入力されていません。').replace(/\n/g, '<br>')}
        </div>
        
        ${applicationData.targetMarket ? `
        <h2>3. ターゲット市場</h2>
        <div class="content">
            ${applicationData.targetMarket.replace(/\n/g, '<br>')}
        </div>
        ` : ''}
        
        ${applicationData.budget ? `
        <h2>4. 事業予算</h2>
        <div class="content">
            <strong style="font-size: 20px; color: #e74c3c;">
                ${applicationData.budget.toLocaleString('ja-JP')}円
            </strong>
            ${applicationData.timeline ? `<br><br><strong>実施期間：</strong>${applicationData.timeline}` : ''}
        </div>
        ` : ''}
        
        ${applicationData.expectedEffects ? `
        <h2>5. 期待される効果</h2>
        <div class="content">
            ${applicationData.expectedEffects.replace(/\n/g, '<br>')}
        </div>
        ` : ''}
        
        ${applicationData.challenges ? `
        <h2>6. 現在の課題</h2>
        <div class="content">
            ${applicationData.challenges.replace(/\n/g, '<br>')}
        </div>
        ` : ''}
        
        ${applicationData.innovation ? `
        <h2>7. 新規性・独自性</h2>
        <div class="content">
            ${applicationData.innovation.replace(/\n/g, '<br>')}
        </div>
        ` : ''}
        
        <div class="footer">
            <p><strong>AI補助金申請システム</strong></p>
            <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
            <p>文書ID: ${applicationData.id || 'N/A'}</p>
            <p class="no-print" style="margin-top: 20px; color: #3498db;">
                ※ この文書は自動生成されました。正式な申請前に内容をご確認ください。
            </p>
        </div>
    </div>
</body>
</html>
  `
  
  const printWindow = window.open('', '_blank', 'width=900,height=800')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // 印刷ダイアログを自動的に開く（ユーザーが望む場合）
    printWindow.onload = () => {
      setTimeout(() => {
        // printWindow.print() // 自動印刷は無効化（ユーザー体験を考慮）
      }, 500)
    }
  } else {
    alert('ポップアップがブロックされました。ポップアップを許可してください。')
  }
}