"""
新補助金タイプテスト
追加された補助金の動作確認
"""

import asyncio
import sys
import os
from datetime import datetime

# パス設定
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.config.subsidy_types import (
    subsidy_registry, get_all_subsidy_types, get_eligible_subsidies,
    SubsidyCategory
)
from src.utils.subsidy_selector import recommend_best_subsidies


def test_subsidy_registry():
    """補助金レジストリテスト"""
    print("🏛️ 補助金レジストリテスト")
    print("="*60)
    
    # 全補助金タイプ取得
    all_types = get_all_subsidy_types()
    print(f"✅ 登録済み補助金数: {len(all_types)}")
    
    # カテゴリ別集計
    category_count = {}
    for subsidy_id in all_types:
        subsidy = subsidy_registry.get_subsidy(subsidy_id)
        if subsidy:
            category = subsidy.category.value
            category_count[category] = category_count.get(category, 0) + 1
    
    print("\n📊 カテゴリ別補助金数:")
    for category, count in category_count.items():
        print(f"  - {category}: {count}件")
    
    # 各補助金の詳細表示
    print("\n📋 補助金一覧:")
    for i, subsidy_id in enumerate(all_types, 1):
        subsidy = subsidy_registry.get_subsidy(subsidy_id)
        if subsidy:
            print(f"\n{i}. {subsidy.name} ({subsidy.id})")
            print(f"   正式名称: {subsidy.full_name}")
            print(f"   カテゴリ: {subsidy.category.value}")
            print(f"   最大金額: {subsidy.max_amount:,}円")
            print(f"   補助率: {subsidy.subsidy_rate*100:.0f}%")
            print(f"   成功率: {subsidy.success_rate*100:.0f}%")


def test_eligibility_check():
    """適格性チェックテスト"""
    print("\n\n🔍 適格性チェックテスト")
    print("="*60)
    
    # テスト企業プロファイル
    test_companies = [
        {
            "name": "小規模IT企業",
            "industry": "IT",
            "employee_count": 10,
            "capital": 5000000,
            "years_in_business": 3
        },
        {
            "name": "中規模製造業",
            "industry": "製造業",
            "employee_count": 150,
            "capital": 50000000,
            "years_in_business": 10
        },
        {
            "name": "スタートアップ",
            "industry": "サービス業",
            "employee_count": 5,
            "capital": 1000000,
            "years_in_business": 0
        }
    ]
    
    for company in test_companies:
        print(f"\n🏢 {company['name']}:")
        print(f"   業界: {company['industry']}, 従業員: {company['employee_count']}人")
        
        eligible = get_eligible_subsidies(company)
        print(f"   ✅ 適格な補助金: {len(eligible)}件")
        
        for subsidy in eligible[:5]:  # 上位5件
            print(f"      - {subsidy.name}")


def test_subsidy_recommendation():
    """補助金推奨テスト"""
    print("\n\n🎯 補助金推奨テスト")
    print("="*60)
    
    # テストケース
    test_cases = [
        {
            "company": {
                "name": "デジタル変革株式会社",
                "industry": "IT",
                "employee_count": 50,
                "capital": 30000000,
                "certifications": ["ISO27001"],
                "years_in_business": 5
            },
            "project": {
                "title": "AI活用による業務自動化システム",
                "budget": 10000000,
                "type": "DX推進",
                "keywords": ["AI", "自動化", "効率化"],
                "expense_types": ["ソフトウェア費", "クラウド利用料"],
                "innovation_level": "high"
            }
        },
        {
            "company": {
                "name": "エコ製造株式会社",
                "industry": "製造業",
                "employee_count": 200,
                "capital": 100000000,
                "years_in_business": 20
            },
            "project": {
                "title": "省エネ設備導入プロジェクト",
                "budget": 50000000,
                "type": "設備投資",
                "keywords": ["省エネ", "CO2削減", "環境"],
                "expense_types": ["機械装置費", "工事費"],
                "strengths": ["エネルギー効率向上", "環境負荷低減"]
            }
        },
        {
            "company": {
                "name": "グローバル商事",
                "industry": "卸売業",
                "employee_count": 30,
                "capital": 20000000,
                "years_in_business": 8
            },
            "project": {
                "title": "海外市場開拓プロジェクト",
                "budget": 5000000,
                "type": "海外展開",
                "keywords": ["輸出", "海外", "展示会"],
                "expense_types": ["展示会出展費", "通訳費", "市場調査費"]
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📌 ケース{i}: {test_case['company']['name']}")
        print(f"   プロジェクト: {test_case['project']['title']}")
        print(f"   予算: {test_case['project']['budget']:,}円")
        
        recommendations = recommend_best_subsidies(
            test_case['company'],
            test_case['project'],
            top_n=3
        )
        
        if recommendations:
            print(f"\n   🏆 推奨補助金:")
            for j, rec in enumerate(recommendations, 1):
                print(f"\n   {j}. {rec.subsidy.name}")
                print(f"      マッチ度: {rec.match_score*100:.1f}%")
                print(f"      推定補助額: {rec.estimated_amount:,}円")
                print(f"      成功確率: {rec.success_probability*100:.1f}%")
                
                if rec.reasons:
                    print(f"      理由: {', '.join(rec.reasons)}")
                if rec.warnings:
                    print(f"      ⚠️ 注意: {', '.join(rec.warnings)}")
        else:
            print("   ❌ 推奨できる補助金が見つかりませんでした")


def test_category_search():
    """カテゴリ別検索テスト"""
    print("\n\n🔎 カテゴリ別検索テスト")
    print("="*60)
    
    # 各カテゴリの補助金を検索
    for category in SubsidyCategory:
        subsidies = subsidy_registry.get_subsidies_by_category(category)
        if subsidies:
            print(f"\n📁 {category.value}カテゴリ:")
            for subsidy in subsidies:
                print(f"   - {subsidy.name} (最大{subsidy.max_amount//10000}万円)")


def main():
    """メイン実行"""
    print("="*60)
    print("🧪 新補助金タイプ動作確認テスト")
    print(f"📅 実行日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # 各テスト実行
    test_subsidy_registry()
    test_eligibility_check()
    test_subsidy_recommendation()
    test_category_search()
    
    print("\n\n✅ 全テスト完了")
    print("="*60)


if __name__ == "__main__":
    main()