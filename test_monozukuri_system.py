#!/usr/bin/env python3
"""
ものづくり補助金システムのテストスクリプト
簡単な入力から高品質な申請書が生成されることを確認
"""

import sys
import json
import requests
from datetime import datetime

# テスト用の簡単入力データ
test_simple_inputs = [
    {
        "name": "CNC工作機械導入テスト",
        "data": {
            "equipment_type": "CNC工作機械",
            "problem_to_solve": "手作業による加工精度のばらつきと生産効率の低下",
            "productivity_improvement": 35,
            "investment_amount": 8000000,
            "implementation_period": 6,
            "industry": "金属加工",
            "company_size": 25
        },
        "expected_adoption_rate": 80
    },
    {
        "name": "IoTシステム導入テスト",
        "data": {
            "equipment_type": "IoTセンサー・システム",
            "problem_to_solve": "設備の稼働状況が把握できず、予防保全ができていない",
            "productivity_improvement": 20,
            "investment_amount": 3000000,
            "implementation_period": 4,
            "industry": "製造業",
            "company_size": 15
        },
        "expected_adoption_rate": 70
    },
    {
        "name": "協働ロボット導入テスト",
        "data": {
            "equipment_type": "協働ロボット",
            "problem_to_solve": "人手不足による生産能力の制約と作業者の負担増加",
            "productivity_improvement": 40,
            "investment_amount": 12000000,
            "implementation_period": 8,
            "industry": "製造業",
            "company_size": 30
        },
        "expected_adoption_rate": 85
    }
]

def test_backend_api():
    """バックエンドAPIのテスト"""
    print("🔧 バックエンドAPIのテスト開始")
    
    backend_url = "http://localhost:7001"
    
    for test_case in test_simple_inputs:
        print(f"\n📋 テストケース: {test_case['name']}")
        
        try:
            # 簡易評価のテスト
            assessment_response = requests.post(
                f"{backend_url}/api/monozukuri/quick-assessment",
                json={"simple_input": test_case["data"]},
                headers={"Authorization": "Bearer test-token"}
            )
            
            if assessment_response.status_code == 200:
                assessment = assessment_response.json()
                print(f"✅ 簡易評価: {assessment.get('eligible', 'N/A')}")
                if assessment.get('estimated_subsidy'):
                    print(f"💰 予想補助金: ¥{assessment['estimated_subsidy']:,}")
            else:
                print(f"❌ 簡易評価エラー: {assessment_response.status_code}")
            
            # 申請書生成のテスト
            generation_response = requests.post(
                f"{backend_url}/api/monozukuri/quick-apply",
                json=test_case["data"],
                headers={"Authorization": "Bearer test-token"}
            )
            
            if generation_response.status_code == 200:
                result = generation_response.json()
                print(f"✅ 申請書生成成功")
                print(f"📊 品質スコア: {result.get('qualityScore', 'N/A')}")
                print(f"📈 採択確率: {result.get('adoptionProbability', 'N/A')}%")
                
                # 期待値との比較
                expected_rate = test_case["expected_adoption_rate"]
                actual_rate = result.get('adoptionProbability', 0)
                
                if actual_rate >= expected_rate - 10:  # 10%の誤差を許容
                    print(f"✅ 採択率目標達成 (期待: {expected_rate}%, 実際: {actual_rate}%)")
                else:
                    print(f"⚠️  採択率が期待値を下回る (期待: {expected_rate}%, 実際: {actual_rate}%)")
                    
            else:
                print(f"❌ 申請書生成エラー: {generation_response.status_code}")
                print(f"エラー詳細: {generation_response.text}")
                
        except Exception as e:
            print(f"❌ テスト実行エラー: {str(e)}")

def test_ai_engine():
    """AI エンジンの直接テスト"""
    print("\n🤖 AI エンジンの直接テスト開始")
    
    try:
        # AI エンジンサービスを直接インポートしてテスト
        sys.path.append('/Users/MBP/Desktop/system/ai-subsidy-system/ai-engine/src')
        from services.monozukuri_subsidy_service import MonozukuriSubsidyService
        
        service = MonozukuriSubsidyService()
        
        for test_case in test_simple_inputs:
            print(f"\n📋 AI テストケース: {test_case['name']}")
            
            try:
                # 簡易評価
                assessment = service.get_quick_assessment(test_case["data"])
                print(f"✅ 簡易評価完了: {assessment.get('eligible', 'N/A')}")
                
                # 申請書生成
                result = service.generate_from_simple_input(test_case["data"])
                print(f"✅ 申請書生成完了")
                print(f"📊 品質スコア: {result['quality_score']}")
                print(f"📈 採択確率: {result['adoption_probability']}%")
                
                # 生成されたセクション数の確認
                sections = result['application_data']
                print(f"📄 生成セクション数: {len(sections)}")
                
                # 主要セクションの内容長確認
                for section_name, content in sections.items():
                    if isinstance(content, str) and len(content) > 100:
                        print(f"  {section_name}: {len(content)}文字")
                
            except Exception as e:
                print(f"❌ AI テストエラー: {str(e)}")
                
    except ImportError as e:
        print(f"❌ AI エンジンのインポートエラー: {str(e)}")
        print("AI エンジンが正しく設定されていない可能性があります")

def test_frontend_integration():
    """フロントエンド統合のテスト"""
    print("\n🌐 フロントエンド統合テスト")
    
    frontend_url = "http://localhost:3000"
    
    try:
        # フロントエンドのヘルスチェック
        response = requests.get(f"{frontend_url}/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ フロントエンドサーバー稼働中")
        else:
            print("⚠️  フロントエンドサーバー応答異常")
    except Exception as e:
        print(f"❌ フロントエンド接続エラー: {str(e)}")
        print("フロントエンドサーバーが起動していない可能性があります")

def generate_test_report():
    """テスト結果レポートの生成"""
    print("\n📋 テスト結果レポート生成")
    
    report = {
        "test_timestamp": datetime.now().isoformat(),
        "test_summary": {
            "total_test_cases": len(test_simple_inputs),
            "system_components": ["Backend API", "AI Engine", "Frontend Integration"],
            "test_objectives": [
                "簡単入力での申請書自動生成",
                "高い採択確率の実現",
                "システム統合の確認"
            ]
        },
        "test_cases": test_simple_inputs,
        "system_requirements": {
            "min_adoption_rate": 70,
            "min_quality_score": 75,
            "max_generation_time": 60,
            "required_sections": 9
        }
    }
    
    try:
        with open('monozukuri_test_report.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print("✅ テストレポートを 'monozukuri_test_report.json' に保存しました")
    except Exception as e:
        print(f"❌ レポート保存エラー: {str(e)}")

def main():
    """メインテスト実行"""
    print("🚀 ものづくり補助金システム - 総合テスト開始")
    print("=" * 60)
    
    # システム要件の確認
    print("📋 システム要件:")
    print("- 簡単入力: 5-7個の質問のみ")
    print("- 採択率: 70%以上を目標")
    print("- 品質スコア: 75点以上")
    print("- 生成時間: 60秒以内")
    print("")
    
    # 各テストの実行
    test_backend_api()
    test_ai_engine()
    test_frontend_integration()
    
    # レポート生成
    generate_test_report()
    
    print("\n" + "=" * 60)
    print("🎯 テスト完了")
    print("\n💡 次のステップ:")
    print("1. バックエンドサーバーを起動: npm run dev (backend/)")
    print("2. フロントエンドサーバーを起動: npm run dev (frontend/)")
    print("3. AI エンジンを起動: python src/api/monozukuri_api.py (ai-engine/)")
    print("4. ブラウザで動作確認: http://localhost:3000/dashboard/applications/new")

if __name__ == "__main__":
    main()