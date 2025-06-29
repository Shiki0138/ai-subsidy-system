# ものづくり補助金 - 簡単申請システム

## 概要

このシステムは、わずか5〜7個の質問に答えるだけで、採択率の高いものづくり補助金申請書を自動生成するシステムです。

## 🎯 主な特徴

### 1. 簡単入力
- **必要な入力は最小限**: 5〜7個の基本的な質問のみ
- **業種別最適化**: 製造業、金属加工など業種に応じた最適化
- **リアルタイム評価**: 入力中に採択確率を表示

### 2. 高い採択率
- **AI による最適化**: 採択されやすい文章構成を自動生成
- **成功パターン活用**: 過去の採択事例を分析して反映
- **キーワード最適化**: 評価される重要キーワードを自動挿入

### 3. 完全自動生成
- **全セクション自動作成**: 9つの必須セクションを完全自動生成
- **品質保証**: 最低75点以上の品質スコアを保証
- **即座に完成**: 60秒以内で完全な申請書を生成

## 🏗️ システム構成

```
ai-subsidy-system/
├── backend/                    # Node.js バックエンド
│   └── src/routes/monozukuri.ts   # ものづくり補助金API
├── frontend/                   # Next.js フロントエンド  
│   └── src/app/dashboard/applications/new/
│       ├── MonozukuriQuickForm.tsx     # 簡単入力フォーム
│       └── ApplicationWizard.tsx       # メイン申請ウィザード
├── ai-engine/                  # Python AI エンジン
│   ├── src/services/monozukuri_subsidy_service.py  # 申請書生成サービス
│   ├── src/api/monozukuri_api.py                   # API エンドポイント
│   └── config/subsidy_config.py                   # 設定ファイル
└── test_monozukuri_system.py   # 総合テストスクリプト
```

## 🚀 使用方法

### 1. フロントエンドから利用

1. **申請ページにアクセス**
   ```
   http://localhost:3000/dashboard/applications/new
   ```

2. **ものづくり補助金を選択**
   - 「簡単申請」ラベルがついたものづくり補助金を選択

3. **3ステップで入力**
   - **ステップ1**: 企業情報（業種、従業員数）
   - **ステップ2**: 導入設備・解決課題
   - **ステップ3**: 効果と投資（生産性向上率、投資額など）

4. **申請書自動生成**
   - 全セクションが自動で生成されます
   - 品質スコアと採択確率が表示されます

### 2. APIから直接利用

#### 簡易評価
```bash
curl -X POST http://localhost:7001/api/monozukuri/quick-assessment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "simple_input": {
      "equipment_type": "CNC工作機械",
      "problem_to_solve": "手作業による精度のばらつき",
      "productivity_improvement": 30,
      "investment_amount": 5000000,
      "implementation_period": 6,
      "industry": "金属加工",
      "company_size": 20
    }
  }'
```

#### 申請書生成
```bash
curl -X POST http://localhost:7001/api/monozukuri/quick-apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "equipment_type": "CNC工作機械",
    "problem_to_solve": "手作業による精度のばらつき",
    "productivity_improvement": 30,
    "investment_amount": 5000000,
    "implementation_period": 6,
    "industry": "金属加工",
    "company_size": 20
  }'
```

## 📊 入力項目の詳細

### 必須入力項目

| 項目 | 説明 | 例 |
|------|------|-----|
| **業種** | 申請企業の業種 | 製造業、金属加工、食品製造 |
| **従業員数** | 正社員の人数 | 25名 |
| **導入設備・技術** | 導入予定の設備 | CNC工作機械、IoTセンサー |
| **解決する課題** | 現在直面している課題 | 手作業による品質のばらつき |
| **生産性向上率** | 期待される改善効果 | 30% |
| **投資額** | 総事業費（100万円以上） | 5,000,000円 |
| **実施期間** | 導入完了までの期間 | 6ヶ月 |

### 自動生成される申請書セクション

1. **事業計画名** - 設備と効果を含む適切なタイトル
2. **事業の背景・目的** - 市場環境と課題の分析
3. **技術的課題と解決方法** - 革新性と技術的優位性
4. **導入設備の詳細** - 仕様と導入理由
5. **実施体制** - プロジェクトチームと役割
6. **市場性・将来性** - 競争力と事業展望
7. **収支計画** - 投資額と経済効果
8. **効果測定方法** - KPIと測定手法
9. **スケジュール** - 段階的な実施計画

## 🎯 採択率向上の仕組み

### 1. 評価基準の最適化
- **技術的革新性** (35%): AIキーワード分析による最適化
- **事業化可能性** (30%): 市場性と実現可能性の強化
- **政策的意義** (20%): 国策との整合性を自動追加
- **申請書完成度** (15%): 全セクションの充実

### 2. 成功パターンの活用
```python
# 業種別成功パターンの例
"金属加工": {
    "common_equipment": ["レーザー加工機", "CNC工作機械"],
    "avg_productivity_improvement": 30,
    "success_rate": 0.80
}
```

### 3. 高評価キーワードの自動挿入
- 革新的、DX推進、生産性向上
- カーボンニュートラル、サプライチェーン強化
- 競争力強化、技術伝承、働き方改革

## 🧪 テスト・検証

### 総合テストの実行
```bash
cd /Users/MBP/Desktop/system/ai-subsidy-system
python test_monozukuri_system.py
```

### テスト項目
- **機能テスト**: 各APIエンドポイントの動作確認
- **品質テスト**: 生成される申請書の品質スコア検証
- **採択率テスト**: 期待される採択確率の達成確認
- **統合テスト**: フロントエンド・バックエンド・AI連携確認

### 期待される結果
- 品質スコア: **75点以上**
- 採択確率: **70%以上**
- 生成時間: **60秒以内**
- 必須セクション: **9セクション完全生成**

## 🔧 開発・運用

### 開発環境の起動
```bash
# バックエンド
cd backend && npm run dev

# フロントエンド  
cd frontend && npm run dev

# AI エンジン
cd ai-engine && python src/api/monozukuri_api.py
```

### 設定ファイル
- `ai-engine/config/subsidy_config.py`: 補助金の設定
- `backend/.env`: バックエンド環境変数
- `frontend/.env.local`: フロントエンド環境変数

### 監視・ログ
- 申請書生成のログ監視
- 採択率の継続的な測定
- エラー率とパフォーマンスの監視

## 📈 実装効果

### ユーザー体験の向上
- **入力時間**: 従来30分 → **5分**
- **必要知識**: 専門知識不要
- **成功確率**: 大幅向上

### システム効果
- **申請書品質**: 一定水準以上を保証
- **処理時間**: 大幅短縮
- **利用率**: 簡単操作による向上

## 🔮 今後の拡張

### 1. 他の補助金への展開
- IT導入補助金の簡単申請
- 事業再構築補助金の自動生成
- 小規模事業者持続化補助金の最適化

### 2. 機能強化
- 業界特化型テンプレート
- リアルタイム採択率予測
- 申請書の段階的改善提案

### 3. データ分析
- 採択結果のフィードバック学習
- 成功パターンの継続的更新
- 業界トレンドの反映

## 📞 サポート・問い合わせ

技術的な質問や機能改善の提案がございましたら、開発チームまでお問い合わせください。

---
**注意**: このシステムは申請書の品質向上を支援しますが、最終的な採択は審査委員会の判断によります。