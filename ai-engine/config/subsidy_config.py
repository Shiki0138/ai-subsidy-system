"""
ものづくり補助金の設定ファイル
"""

MONOZUKURI_CONFIG = {
    "subsidy_type": "monozukuri-hojokin",
    "max_subsidy_amount": 10000000,  # 1000万円
    "subsidy_rate": 0.5,  # 50%
    "min_investment": 1000000,  # 100万円
    "max_implementation_period": 24,  # 24ヶ月
    
    "evaluation_criteria": {
        "technical_innovation": {
            "weight": 0.35,
            "keywords": [
                "革新的", "AI", "IoT", "DX", "自動化", "効率化",
                "デジタル", "スマート", "Industry4.0", "データ活用"
            ]
        },
        "business_feasibility": {
            "weight": 0.30,
            "keywords": [
                "市場性", "競争力", "収益性", "実現可能性",
                "事業化", "持続性", "拡張性"
            ]
        },
        "policy_significance": {
            "weight": 0.20,
            "keywords": [
                "地域経済", "雇用創出", "カーボンニュートラル",
                "サプライチェーン", "技術伝承", "働き方改革"
            ]
        },
        "completeness": {
            "weight": 0.15,
            "required_sections": [
                "事業計画名", "事業の背景・目的", "技術的課題と解決方法",
                "導入設備の詳細", "実施体制", "市場性・将来性",
                "収支計画", "効果測定方法", "スケジュール"
            ]
        }
    },
    
    "industries": [
        "製造業", "金属加工", "食品製造", "繊維・アパレル",
        "化学工業", "電子部品・デバイス", "機械製造", "その他製造業"
    ],
    
    "equipment_types": [
        "CNC工作機械", "3Dプリンター", "レーザー加工機",
        "IoTセンサー・システム", "生産管理システム", "AI画像検査装置",
        "協働ロボット", "自動化ライン", "品質管理システム"
    ],
    
    "success_patterns": {
        "製造業": {
            "common_equipment": ["CNC工作機械", "協働ロボット", "IoTセンサー"],
            "avg_productivity_improvement": 25,
            "avg_investment": 5000000,
            "success_rate": 0.75
        },
        "金属加工": {
            "common_equipment": ["レーザー加工機", "CNC工作機械", "3Dプリンター"],
            "avg_productivity_improvement": 30,
            "avg_investment": 8000000,
            "success_rate": 0.80
        }
    },
    
    "quality_thresholds": {
        "excellent": 90,
        "good": 75,
        "acceptable": 60,
        "needs_improvement": 45
    },
    
    "adoption_probability_factors": {
        "high_score_keywords": {
            "weight": 0.25,
            "keywords": [
                "革新的", "生産性向上", "競争力強化", "DX推進",
                "カーボンニュートラル", "サプライチェーン強化"
            ]
        },
        "quantitative_data": {
            "weight": 0.30,
            "indicators": ["具体的数値", "改善率", "投資効果"]
        },
        "technical_feasibility": {
            "weight": 0.25,
            "indicators": ["技術的根拠", "実装計画", "リスク対策"]
        },
        "business_impact": {
            "weight": 0.20,
            "indicators": ["市場効果", "競争力向上", "収益改善"]
        }
    }
}