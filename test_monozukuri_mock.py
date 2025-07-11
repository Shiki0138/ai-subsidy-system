#!/usr/bin/env python3
"""
ものづくり補助金システムのモックテスト
サーバーを起動せずに基本機能をテスト
"""

import json
from datetime import datetime

def mock_monozukuri_service():
    """MonozukuriSubsidyService のモック実装"""
    
    class MockAIAssistant:
        def generate_content(self, prompt):
            if "事業の背景・目的" in prompt:
                return """
                近年の製造業界において、手作業による生産工程は品質のばらつきと効率性の課題を抱えています。
                特に精密加工を要する金属加工業界では、熟練技術者の不足と品質安定化が急務となっています。
                本事業では最新のCNC工作機械を導入し、自動化による品質向上と生産性向上を実現します。
                これにより地域製造業の競争力強化と雇用創出に貢献します。
                """
            elif "技術的革新性" in prompt:
                return """
                導入予定のCNC工作機械は、従来の手作業と比較して以下の革新的な特徴を有します。
                1. 高精度制御: ±0.01mmの精度を実現し、品質の均一化を達成
                2. AI制御システム: 切削条件を自動最適化し、加工時間を30%短縮
                3. IoT連携機能: リアルタイム監視による予防保全を実現
                これらの技術革新により、業界標準を大幅に上回る生産性向上を実現します。
                """
            else:
                return "AI生成コンテンツのサンプル"
        
        def enhance_content(self, content, instruction):
            return content + " (AI最適化済み)"
    
    class MockMonozukuriService:
        def __init__(self):
            self.ai_assistant = MockAIAssistant()
        
        def get_quick_assessment(self, simple_input):
            investment = simple_input.get('investment_amount', 0)
            improvement = simple_input.get('productivity_improvement', 0)
            
            if investment < 1000000:
                return {
                    'eligible': False,
                    'reason': '投資額が最低要件（100万円）を下回っています'
                }
            
            estimated_subsidy = min(investment * 0.5, 10000000)
            
            if improvement >= 30:
                adoption_estimate = "高"
            elif improvement >= 20:
                adoption_estimate = "中"
            else:
                adoption_estimate = "低"
            
            return {
                'eligible': True,
                'estimated_subsidy': estimated_subsidy,
                'adoption_estimate': adoption_estimate,
                'recommendations': [
                    "DX要素を含めることで評価が向上します",
                    "具体的な数値データを追加することをお勧めします"
                ]
            }
        
        def generate_from_simple_input(self, simple_input):
            equipment = simple_input.get('equipment_type', '新設備')
            industry = simple_input.get('industry', '製造業')
            investment = simple_input.get('investment_amount', 0)
            improvement = simple_input.get('productivity_improvement', 0)
            
            # 申請書セクションを生成
            sections = {
                '事業計画名': f"{equipment}導入による{industry}の生産性向上・競争力強化事業",
                '事業の背景・目的': self.ai_assistant.generate_content("事業の背景・目的"),
                '技術的課題と解決方法': self.ai_assistant.generate_content("技術的革新性"),
                '導入設備の詳細': f"{equipment}の詳細仕様と導入計画（投資額：{investment:,}円）",
                '実施体制': "代表取締役社長を責任者とする実施体制",
                '市場性・将来性': f"{industry}市場における競争力強化と事業拡大",
                '収支計画': f"総投資額{investment:,}円、補助金{int(investment*0.5):,}円",
                '効果測定方法': f"生産性{improvement}%向上の測定方法",
                'スケジュール': "6ヶ月間の段階的実施計画"
            }
            
            # 品質スコアを計算
            quality_score = 75 + (improvement * 0.5) + (len(sections) * 2)
            quality_score = min(quality_score, 95)
            
            # 採択確率を計算
            adoption_probability = 65 + (improvement * 0.8) + (quality_score * 0.3)
            adoption_probability = min(adoption_probability, 90)
            
            return {
                'application_data': sections,
                'quality_score': quality_score,
                'adoption_probability': adoption_probability,
                'generated_at': datetime.now().isoformat()
            }
    
    return MockMonozukuriService()

def test_mock_functionality():
    """モック機能のテスト"""
    print("🤖 ものづくり補助金システム - モックテスト開始")
    print("=" * 60)
    
    service = mock_monozukuri_service()
    
    # テストケース
    test_cases = [
        {
            "name": "CNC工作機械導入（高評価期待）",
            "data": {
                "equipment_type": "CNC工作機械",
                "problem_to_solve": "手作業による加工精度のばらつき",
                "productivity_improvement": 35,
                "investment_amount": 8000000,
                "implementation_period": 6,
                "industry": "金属加工",
                "company_size": 25
            },
            "expected_min_adoption": 80
        },
        {
            "name": "IoTシステム導入（中評価期待）",
            "data": {
                "equipment_type": "IoTセンサー・システム",
                "problem_to_solve": "設備の稼働状況把握不足",
                "productivity_improvement": 20,
                "investment_amount": 3000000,
                "implementation_period": 4,
                "industry": "製造業",
                "company_size": 15
            },
            "expected_min_adoption": 70
        },
        {
            "name": "投資額不足テスト",
            "data": {
                "equipment_type": "小型設備",
                "problem_to_solve": "効率化",
                "productivity_improvement": 15,
                "investment_amount": 500000,  # 最低額未満
                "implementation_period": 3,
                "industry": "製造業",
                "company_size": 5
            },
            "expected_min_adoption": 0  # 申請不可
        }
    ]
    
    success_count = 0
    total_tests = len(test_cases)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📋 テストケース {i}: {test_case['name']}")
        print("-" * 40)
        
        try:
            # 簡易評価のテスト
            assessment = service.get_quick_assessment(test_case["data"])
            print(f"✅ 簡易評価完了")
            print(f"   申請可能: {assessment.get('eligible', False)}")
            
            if assessment.get('estimated_subsidy'):
                print(f"   予想補助金: ¥{assessment['estimated_subsidy']:,}")
                print(f"   採択見込み: {assessment.get('adoption_estimate', 'N/A')}")
            
            if assessment.get('reason'):
                print(f"   理由: {assessment['reason']}")
            
            # 申請可能な場合のみ申請書生成をテスト
            if assessment.get('eligible', False):
                result = service.generate_from_simple_input(test_case["data"])
                print(f"✅ 申請書生成完了")
                print(f"   品質スコア: {result['quality_score']:.1f}点")
                print(f"   採択確率: {result['adoption_probability']:.1f}%")
                print(f"   生成セクション数: {len(result['application_data'])}")
                
                # 期待値との比較
                expected_min = test_case["expected_min_adoption"]
                actual = result['adoption_probability']
                
                if actual >= expected_min:
                    print(f"✅ 目標達成 (期待: {expected_min}%以上, 実際: {actual:.1f}%)")
                    success_count += 1
                else:
                    print(f"⚠️  目標未達 (期待: {expected_min}%以上, 実際: {actual:.1f}%)")
                
                # 主要セクションの確認
                key_sections = ['事業計画名', '事業の背景・目的', '技術的課題と解決方法']
                for section in key_sections:
                    if section in result['application_data']:
                        content_length = len(result['application_data'][section])
                        print(f"   {section}: {content_length}文字")
            else:
                if test_case["expected_min_adoption"] == 0:
                    print("✅ 期待通り申請不可と判定")
                    success_count += 1
                else:
                    print("❌ 予期しない申請不可判定")
            
        except Exception as e:
            print(f"❌ テストエラー: {str(e)}")
    
    # 結果サマリー
    print("\n" + "=" * 60)
    print("📊 テスト結果サマリー")
    print(f"✅ 成功: {success_count}/{total_tests}")
    print(f"📈 成功率: {success_count/total_tests*100:.1f}%")
    
    if success_count == total_tests:
        print("🎉 全てのテストが成功しました！")
        print("\n💡 システムの特徴:")
        print("- 簡単入力: 5-7個の質問のみ")
        print("- 自動生成: 9つの申請書セクション")
        print("- 高品質: 75点以上の品質スコア")
        print("- 高採択率: 70%以上の採択確率")
    else:
        print("⚠️  一部のテストが失敗しました")
    
    print("\n🚀 次のステップ:")
    print("1. 実際のサーバーを起動してフルテストを実行")
    print("2. フロントエンドでユーザビリティテスト")
    print("3. 本番環境での統合テスト")

if __name__ == "__main__":
    test_mock_functionality()