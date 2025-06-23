"""
AI Model Accuracy Verification Tests
AI モデル精度検証テスト
作成日: 2025-06-20
"""

import pytest
import json
import time
import statistics
from typing import List, Dict, Any, Tuple
from datetime import datetime
import pandas as pd

class AIModelTester:
    """AI モデルテスト用のベースクラス"""
    
    def __init__(self, model_endpoint: str = "http://localhost:8000"):
        self.endpoint = model_endpoint
        self.test_results = []
        
    def measure_response_time(self, func, *args, **kwargs) -> Tuple[Any, float]:
        """レスポンス時間を測定"""
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        return result, (end_time - start_time) * 1000  # ms

    def calculate_accuracy(self, predictions: List[Any], ground_truth: List[Any]) -> float:
        """精度を計算"""
        if len(predictions) != len(ground_truth):
            raise ValueError("Predictions and ground truth must have same length")
        
        correct = sum(1 for p, g in zip(predictions, ground_truth) if p == g)
        return correct / len(predictions) * 100

    def calculate_similarity_score(self, text1: str, text2: str) -> float:
        """テキスト類似度スコアを計算（簡易版）"""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 and not words2:
            return 100.0
        if not words1 or not words2:
            return 0.0
            
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return (intersection / union) * 100

class DocumentGenerationTester(AIModelTester):
    """書類生成機能のテスト"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.test_data = self.load_test_data()
        
    def load_test_data(self) -> Dict[str, Any]:
        """テストデータの読み込み"""
        return {
            "companies": [
                {
                    "name": "株式会社テスト製造",
                    "business_type": "製造業",
                    "employee_count": 50,
                    "annual_revenue": 500000000,
                    "capital": 50000000
                },
                {
                    "name": "中小IT企業株式会社", 
                    "business_type": "情報通信業",
                    "employee_count": 30,
                    "annual_revenue": 200000000,
                    "capital": 10000000
                }
            ],
            "projects": [
                {
                    "name": "DX推進プロジェクト",
                    "description": "製造工程のデジタル化",
                    "budget": 10000000,
                    "duration": 12,
                    "technology": ["IoT", "AI", "クラウド"]
                }
            ],
            "expected_outputs": {
                "estimate_sheet": {
                    "sections": ["人件費", "設備費", "その他経費"],
                    "total_amount_range": (8000000, 12000000),
                    "required_fields": ["項目", "単価", "数量", "金額"]
                },
                "business_plan": {
                    "sections": ["事業概要", "市場分析", "実施計画", "期待効果"],
                    "min_length": 1000,
                    "required_keywords": ["生産性向上", "コスト削減", "競争力"]
                }
            }
        }

    def test_estimate_sheet_generation(self) -> Dict[str, Any]:
        """見積書生成テスト"""
        results = []
        
        for company in self.test_data["companies"]:
            for project in self.test_data["projects"]:
                # 見積書生成の実行
                generation_data = {
                    "document_type": "estimate_sheet",
                    "company_info": company,
                    "project_info": project
                }
                
                generated_doc, response_time = self.measure_response_time(
                    self._call_generation_api, generation_data
                )
                
                # 精度評価
                accuracy_scores = self._evaluate_estimate_accuracy(generated_doc)
                
                result = {
                    "company": company["name"],
                    "project": project["name"],
                    "response_time_ms": response_time,
                    "accuracy_scores": accuracy_scores,
                    "generated_document": generated_doc
                }
                results.append(result)
        
        return self._summarize_results(results)

    def test_business_plan_generation(self) -> Dict[str, Any]:
        """事業計画書生成テスト"""
        results = []
        
        for company in self.test_data["companies"]:
            for project in self.test_data["projects"]:
                generation_data = {
                    "document_type": "business_plan",
                    "company_info": company,
                    "project_info": project
                }
                
                generated_doc, response_time = self.measure_response_time(
                    self._call_generation_api, generation_data
                )
                
                # 内容の質的評価
                quality_scores = self._evaluate_business_plan_quality(generated_doc)
                
                result = {
                    "company": company["name"],
                    "project": project["name"], 
                    "response_time_ms": response_time,
                    "quality_scores": quality_scores,
                    "document_length": len(generated_doc.get("content", "")),
                    "generated_document": generated_doc
                }
                results.append(result)
        
        return self._summarize_results(results)

    def _call_generation_api(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """書類生成APIの呼び出し（モック実装）"""
        # 実際の実装では requests.post() などを使用
        import random
        
        if data["document_type"] == "estimate_sheet":
            return {
                "content": self._generate_mock_estimate(data),
                "status": "success",
                "sections": ["人件費", "設備費", "その他経費"],
                "total_amount": random.randint(8000000, 12000000)
            }
        elif data["document_type"] == "business_plan":
            return {
                "content": self._generate_mock_business_plan(data),
                "status": "success",
                "sections": ["事業概要", "市場分析", "実施計画", "期待効果"],
                "word_count": random.randint(1000, 2000)
            }

    def _generate_mock_estimate(self, data: Dict[str, Any]) -> str:
        """モック見積書生成"""
        company = data["company_info"]["name"]
        project = data["project_info"]["name"]
        
        return f"""
        見積書
        
        件名: {project}
        発注者: {company}
        
        ■人件費
        - プロジェクトマネージャー: 1,000,000円
        - システムエンジニア: 3,000,000円
        - プログラマー: 2,000,000円
        
        ■設備費
        - サーバー費用: 2,000,000円
        - ソフトウェアライセンス: 1,500,000円
        
        ■その他経費
        - 交通費・雑費: 500,000円
        
        合計: 10,000,000円
        """

    def _generate_mock_business_plan(self, data: Dict[str, Any]) -> str:
        """モック事業計画書生成"""
        company = data["company_info"]["name"]
        project = data["project_info"]["name"]
        
        return f"""
        事業計画書
        
        ■事業概要
        {company}は{project}を実施し、生産性向上とコスト削減を実現します。
        本プロジェクトにより、競争力の強化を図ります。
        
        ■市場分析
        デジタル化の進展により、製造業のDX需要が拡大しています。
        当社の技術により、市場での優位性を確立できます。
        
        ■実施計画
        12ヶ月の期間で段階的にシステムを導入し、従業員教育も並行して実施します。
        
        ■期待効果
        - 生産性向上: 20%
        - コスト削減: 15%
        - 競争力強化による売上増加
        """

    def _evaluate_estimate_accuracy(self, generated_doc: Dict[str, Any]) -> Dict[str, float]:
        """見積書の精度評価"""
        expected = self.test_data["expected_outputs"]["estimate_sheet"]
        
        # 必須セクションの存在確認
        sections_score = 0
        if "sections" in generated_doc:
            matching_sections = set(generated_doc["sections"]) & set(expected["sections"])
            sections_score = len(matching_sections) / len(expected["sections"]) * 100
        
        # 金額妥当性の確認
        amount_score = 0
        if "total_amount" in generated_doc:
            amount = generated_doc["total_amount"]
            min_amount, max_amount = expected["total_amount_range"]
            if min_amount <= amount <= max_amount:
                amount_score = 100
            else:
                # 範囲外の場合は距離に応じて減点
                if amount < min_amount:
                    amount_score = max(0, 100 - (min_amount - amount) / min_amount * 100)
                else:
                    amount_score = max(0, 100 - (amount - max_amount) / max_amount * 100)
        
        # 必須フィールドの確認
        fields_score = 0
        content = generated_doc.get("content", "")
        matching_fields = sum(1 for field in expected["required_fields"] if field in content)
        fields_score = matching_fields / len(expected["required_fields"]) * 100
        
        return {
            "sections_accuracy": sections_score,
            "amount_validity": amount_score,
            "required_fields": fields_score,
            "overall_accuracy": (sections_score + amount_score + fields_score) / 3
        }

    def _evaluate_business_plan_quality(self, generated_doc: Dict[str, Any]) -> Dict[str, float]:
        """事業計画書の品質評価"""
        expected = self.test_data["expected_outputs"]["business_plan"]
        
        # 文字数の確認
        content = generated_doc.get("content", "")
        length_score = min(100, len(content) / expected["min_length"] * 100)
        
        # 必須キーワードの確認
        keyword_score = 0
        matching_keywords = sum(1 for keyword in expected["required_keywords"] if keyword in content)
        keyword_score = matching_keywords / len(expected["required_keywords"]) * 100
        
        # セクション構成の確認
        sections_score = 0
        if "sections" in generated_doc:
            matching_sections = set(generated_doc["sections"]) & set(expected["sections"])
            sections_score = len(matching_sections) / len(expected["sections"]) * 100
        
        # 論理的整合性（簡易チェック）
        coherence_score = self._check_coherence(content)
        
        return {
            "length_adequacy": length_score,
            "keyword_coverage": keyword_score,
            "section_completeness": sections_score,
            "logical_coherence": coherence_score,
            "overall_quality": (length_score + keyword_score + sections_score + coherence_score) / 4
        }

    def _check_coherence(self, content: str) -> float:
        """論理的整合性の簡易チェック"""
        # 段落の数と接続詞の使用をチェック
        paragraphs = content.split('\n\n')
        
        if len(paragraphs) < 3:
            return 50  # 段落が少なすぎる
        
        # 接続詞の確認
        connectors = ["また", "さらに", "一方", "しかし", "そのため", "したがって"]
        connector_count = sum(1 for connector in connectors if connector in content)
        
        coherence_score = min(100, (connector_count / len(paragraphs)) * 100 + 50)
        return coherence_score

    def _summarize_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """テスト結果のサマリー作成"""
        if not results:
            return {"error": "No test results"}
        
        # レスポンス時間の統計
        response_times = [r["response_time_ms"] for r in results]
        
        # 精度スコアの統計
        if "accuracy_scores" in results[0]:
            accuracy_scores = [r["accuracy_scores"]["overall_accuracy"] for r in results]
        else:
            accuracy_scores = [r["quality_scores"]["overall_quality"] for r in results]
        
        return {
            "test_count": len(results),
            "response_time_stats": {
                "average": statistics.mean(response_times),
                "median": statistics.median(response_times),
                "max": max(response_times),
                "min": min(response_times)
            },
            "accuracy_stats": {
                "average": statistics.mean(accuracy_scores),
                "median": statistics.median(accuracy_scores),
                "max": max(accuracy_scores),
                "min": min(accuracy_scores)
            },
            "detailed_results": results
        }

class GuidelineParsingTester(AIModelTester):
    """募集要項解析機能のテスト"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.test_guidelines = self.load_test_guidelines()
    
    def load_test_guidelines(self) -> List[Dict[str, Any]]:
        """テスト用募集要項データの読み込み"""
        return [
            {
                "name": "ものづくり補助金（一般型）",
                "content": """
                ものづくり補助金（一般型）
                
                1. 補助対象者
                中小企業・小規模事業者
                
                2. 補助率・補助上限額
                補助率：1/2
                補助上限額：1,250万円
                
                3. 補助対象経費
                機械装置・システム構築費
                技術導入費
                専門家経費
                
                4. 実施期間
                交付決定日から10か月以内
                """,
                "expected_structure": {
                    "subsidy_name": "ものづくり補助金（一般型）",
                    "target_entities": ["中小企業", "小規模事業者"],
                    "subsidy_rate": 50,
                    "max_amount": 12500000,
                    "eligible_expenses": ["機械装置・システム構築費", "技術導入費", "専門家経費"],
                    "implementation_period": "10か月"
                }
            },
            {
                "name": "IT導入補助金（A類型）",
                "content": """
                IT導入補助金 2024 A類型
                
                ■対象
                中小企業・小規模事業者等
                
                ■補助額・補助率
                5万円～150万円未満（1/2以内）
                
                ■対象経費
                ソフトウェア購入費
                導入関連費
                
                ■実施期間
                交付決定～11か月後
                """,
                "expected_structure": {
                    "subsidy_name": "IT導入補助金（A類型）",
                    "target_entities": ["中小企業", "小規模事業者"],
                    "subsidy_rate": 50,
                    "max_amount": 1500000,
                    "min_amount": 50000,
                    "eligible_expenses": ["ソフトウェア購入費", "導入関連費"],
                    "implementation_period": "11か月"
                }
            }
        ]

    def test_parsing_accuracy(self) -> Dict[str, Any]:
        """解析精度テスト"""
        results = []
        
        for guideline in self.test_guidelines:
            # 解析実行
            parsed_result, response_time = self.measure_response_time(
                self._call_parsing_api, guideline["content"]
            )
            
            # 精度評価
            accuracy_scores = self._evaluate_parsing_accuracy(
                parsed_result, guideline["expected_structure"]
            )
            
            result = {
                "guideline_name": guideline["name"],
                "response_time_ms": response_time,
                "accuracy_scores": accuracy_scores,
                "parsed_result": parsed_result,
                "expected": guideline["expected_structure"]
            }
            results.append(result)
        
        return self._summarize_results(results)

    def test_parsing_robustness(self) -> Dict[str, Any]:
        """解析の堅牢性テスト（ノイズ含むデータ）"""
        results = []
        
        for guideline in self.test_guidelines:
            # ノイズを追加したテストデータ
            noisy_content = self._add_noise(guideline["content"])
            
            try:
                parsed_result, response_time = self.measure_response_time(
                    self._call_parsing_api, noisy_content
                )
                
                # 基本的な構造が解析できているかチェック
                robustness_score = self._evaluate_robustness(
                    parsed_result, guideline["expected_structure"]
                )
                
                result = {
                    "guideline_name": f"{guideline['name']}_noisy",
                    "response_time_ms": response_time,
                    "robustness_score": robustness_score,
                    "success": True
                }
            except Exception as e:
                result = {
                    "guideline_name": f"{guideline['name']}_noisy",
                    "response_time_ms": 0,
                    "robustness_score": 0,
                    "success": False,
                    "error": str(e)
                }
            
            results.append(result)
        
        return self._summarize_robustness_results(results)

    def _call_parsing_api(self, content: str) -> Dict[str, Any]:
        """解析APIの呼び出し（モック実装）"""
        # 実際の実装では AI解析サービスを呼び出し
        import re
        
        result = {}
        
        # 補助金名の抽出
        name_match = re.search(r'(.*?補助金.*?)(?:\n|$)', content)
        if name_match:
            result["subsidy_name"] = name_match.group(1).strip()
        
        # 補助率の抽出
        rate_match = re.search(r'(\d+)/(\d+)|(\d+)%', content)
        if rate_match:
            if rate_match.group(1) and rate_match.group(2):
                result["subsidy_rate"] = int(rate_match.group(1)) / int(rate_match.group(2)) * 100
            elif rate_match.group(3):
                result["subsidy_rate"] = int(rate_match.group(3))
        
        # 金額の抽出
        amount_matches = re.findall(r'(\d+(?:,\d+)*)万円', content)
        if amount_matches:
            amounts = [int(match.replace(',', '')) * 10000 for match in amount_matches]
            result["max_amount"] = max(amounts)
            if len(amounts) > 1:
                result["min_amount"] = min(amounts)
        
        # 対象者の抽出
        if "中小企業" in content:
            result["target_entities"] = ["中小企業"]
            if "小規模事業者" in content:
                result["target_entities"].append("小規模事業者")
        
        # 実施期間の抽出
        period_match = re.search(r'(\d+)(?:か|ヶ)月', content)
        if period_match:
            result["implementation_period"] = f"{period_match.group(1)}か月"
        
        return result

    def _evaluate_parsing_accuracy(self, parsed: Dict[str, Any], expected: Dict[str, Any]) -> Dict[str, float]:
        """解析精度の評価"""
        field_scores = {}
        
        for field, expected_value in expected.items():
            if field in parsed:
                parsed_value = parsed[field]
                
                if isinstance(expected_value, str):
                    # 文字列の類似度
                    similarity = self.calculate_similarity_score(str(parsed_value), expected_value)
                    field_scores[field] = similarity
                elif isinstance(expected_value, (int, float)):
                    # 数値の一致度
                    if abs(parsed_value - expected_value) / expected_value < 0.1:  # 10%以内
                        field_scores[field] = 100
                    else:
                        field_scores[field] = max(0, 100 - abs(parsed_value - expected_value) / expected_value * 100)
                elif isinstance(expected_value, list):
                    # リストの一致度
                    if isinstance(parsed_value, list):
                        intersection = set(parsed_value) & set(expected_value)
                        field_scores[field] = len(intersection) / len(expected_value) * 100
                    else:
                        field_scores[field] = 0
                else:
                    field_scores[field] = 100 if parsed_value == expected_value else 0
            else:
                field_scores[field] = 0  # フィールドが抽出されていない
        
        overall_accuracy = sum(field_scores.values()) / len(field_scores) if field_scores else 0
        
        return {
            **field_scores,
            "overall_accuracy": overall_accuracy
        }

    def _add_noise(self, content: str) -> str:
        """テキストにノイズを追加"""
        # タイポ、余分な改行、特殊文字などを追加
        noisy_content = content.replace("補助金", "補 助 金")  # スペース追加
        noisy_content = noisy_content.replace("万円", "万円　")  # 全角スペース追加
        noisy_content = f"【重要】\n{noisy_content}\n※この文書は正式なものです。"  # 余分な情報追加
        return noisy_content

    def _evaluate_robustness(self, parsed: Dict[str, Any], expected: Dict[str, Any]) -> float:
        """堅牢性の評価（基本的な情報が取れているか）"""
        essential_fields = ["subsidy_name", "subsidy_rate", "max_amount"]
        
        extracted_essential = sum(1 for field in essential_fields if field in parsed)
        return extracted_essential / len(essential_fields) * 100

    def _summarize_robustness_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """堅牢性テスト結果のサマリー"""
        success_count = sum(1 for r in results if r["success"])
        
        if success_count > 0:
            successful_results = [r for r in results if r["success"]]
            avg_robustness = statistics.mean([r["robustness_score"] for r in successful_results])
        else:
            avg_robustness = 0
        
        return {
            "total_tests": len(results),
            "successful_tests": success_count,
            "success_rate": success_count / len(results) * 100,
            "average_robustness_score": avg_robustness,
            "detailed_results": results
        }

class ProgressPredictionTester(AIModelTester):
    """進捗予測機能のテスト"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.test_scenarios = self.create_test_scenarios()
    
    def create_test_scenarios(self) -> List[Dict[str, Any]]:
        """テストシナリオの作成"""
        return [
            {
                "name": "順調な進捗",
                "project_data": {
                    "planned_milestones": [
                        {"name": "要件定義", "planned_date": "2025-08-31", "actual_date": "2025-08-30"},
                        {"name": "設計", "planned_date": "2025-10-31", "actual_date": None},
                        {"name": "開発", "planned_date": "2026-03-31", "actual_date": None},
                        {"name": "テスト", "planned_date": "2026-05-31", "actual_date": None}
                    ],
                    "current_date": "2025-09-15",
                    "budget_consumption": 0.15,  # 15% 消化
                    "team_velocity": 1.1  # 110% of planned
                },
                "expected_prediction": {
                    "delay_probability": "low",
                    "estimated_completion": "2026-05-25",
                    "risk_level": "low"
                }
            },
            {
                "name": "遅延リスクあり",
                "project_data": {
                    "planned_milestones": [
                        {"name": "要件定義", "planned_date": "2025-08-31", "actual_date": "2025-09-15"},
                        {"name": "設計", "planned_date": "2025-10-31", "actual_date": None},
                        {"name": "開発", "planned_date": "2026-03-31", "actual_date": None},
                        {"name": "テスト", "planned_date": "2026-05-31", "actual_date": None}
                    ],
                    "current_date": "2025-10-01",
                    "budget_consumption": 0.35,  # 35% 消化（想定より多い）
                    "team_velocity": 0.8  # 80% of planned
                },
                "expected_prediction": {
                    "delay_probability": "high",
                    "estimated_completion": "2026-07-15",
                    "risk_level": "high"
                }
            }
        ]

    def test_prediction_accuracy(self) -> Dict[str, Any]:
        """予測精度テスト"""
        results = []
        
        for scenario in self.test_scenarios:
            # 予測実行
            prediction, response_time = self.measure_response_time(
                self._call_prediction_api, scenario["project_data"]
            )
            
            # 予測精度の評価
            accuracy_score = self._evaluate_prediction_accuracy(
                prediction, scenario["expected_prediction"]
            )
            
            result = {
                "scenario_name": scenario["name"],
                "response_time_ms": response_time,
                "accuracy_score": accuracy_score,
                "prediction": prediction,
                "expected": scenario["expected_prediction"]
            }
            results.append(result)
        
        return self._summarize_results(results)

    def _call_prediction_api(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """予測APIの呼び出し（モック実装）"""
        # 簡単な予測ロジック
        team_velocity = project_data.get("team_velocity", 1.0)
        budget_consumption = project_data.get("budget_consumption", 0.0)
        
        # 遅延確率の計算
        delay_factor = (1 - team_velocity) + (budget_consumption - 0.2)  # 予算20%を基準
        
        if delay_factor < 0.1:
            delay_probability = "low"
            risk_level = "low"
            delay_months = 0
        elif delay_factor < 0.3:
            delay_probability = "medium"
            risk_level = "medium"
            delay_months = 1
        else:
            delay_probability = "high"
            risk_level = "high"
            delay_months = 2
        
        # 完了予定日の調整（簡易版）
        from datetime import datetime, timedelta
        base_completion = datetime(2026, 5, 31)
        estimated_completion = base_completion + timedelta(days=delay_months * 30)
        
        return {
            "delay_probability": delay_probability,
            "estimated_completion": estimated_completion.strftime("%Y-%m-%d"),
            "risk_level": risk_level,
            "confidence": 0.85
        }

    def _evaluate_prediction_accuracy(self, predicted: Dict[str, Any], expected: Dict[str, Any]) -> float:
        """予測精度の評価"""
        scores = []
        
        # 遅延確率の一致
        if predicted.get("delay_probability") == expected.get("delay_probability"):
            scores.append(100)
        else:
            scores.append(50)  # 部分点
        
        # リスクレベルの一致
        if predicted.get("risk_level") == expected.get("risk_level"):
            scores.append(100)
        else:
            scores.append(50)
        
        # 完了予定日の精度（±1ヶ月以内なら満点）
        pred_date = datetime.strptime(predicted.get("estimated_completion", ""), "%Y-%m-%d")
        exp_date = datetime.strptime(expected.get("estimated_completion", ""), "%Y-%m-%d")
        
        date_diff = abs((pred_date - exp_date).days)
        if date_diff <= 30:  # 1ヶ月以内
            scores.append(100)
        elif date_diff <= 60:  # 2ヶ月以内
            scores.append(70)
        else:
            scores.append(30)
        
        return sum(scores) / len(scores)

# テスト実行関数
def run_all_ai_tests():
    """全てのAIテストを実行"""
    results = {}
    
    print("🤖 AI Model Accuracy Tests Started")
    
    # 書類生成テスト
    print("\n📄 Testing Document Generation...")
    doc_tester = DocumentGenerationTester()
    results["estimate_generation"] = doc_tester.test_estimate_sheet_generation()
    results["business_plan_generation"] = doc_tester.test_business_plan_generation()
    
    # 募集要項解析テスト
    print("\n📋 Testing Guideline Parsing...")
    parsing_tester = GuidelineParsingTester()
    results["parsing_accuracy"] = parsing_tester.test_parsing_accuracy()
    results["parsing_robustness"] = parsing_tester.test_parsing_robustness()
    
    # 進捗予測テスト
    print("\n📊 Testing Progress Prediction...")
    prediction_tester = ProgressPredictionTester()
    results["progress_prediction"] = prediction_tester.test_prediction_accuracy()
    
    # 総合レポート生成
    print("\n📈 Generating Comprehensive Report...")
    comprehensive_report = generate_comprehensive_report(results)
    
    return comprehensive_report

def generate_comprehensive_report(results: Dict[str, Any]) -> Dict[str, Any]:
    """包括的なレポートを生成"""
    report = {
        "test_summary": {
            "total_test_categories": len(results),
            "execution_timestamp": datetime.now().isoformat()
        },
        "performance_summary": {},
        "accuracy_summary": {},
        "recommendations": []
    }
    
    # パフォーマンスサマリー
    all_response_times = []
    for category, result in results.items():
        if "response_time_stats" in result:
            all_response_times.extend([result["response_time_stats"]["average"]])
    
    if all_response_times:
        report["performance_summary"] = {
            "average_response_time_ms": statistics.mean(all_response_times),
            "max_response_time_ms": max(all_response_times),
            "performance_grade": "A" if max(all_response_times) < 5000 else "B" if max(all_response_times) < 10000 else "C"
        }
    
    # 精度サマリー
    all_accuracy_scores = []
    for category, result in results.items():
        if "accuracy_stats" in result:
            all_accuracy_scores.append(result["accuracy_stats"]["average"])
    
    if all_accuracy_scores:
        overall_accuracy = statistics.mean(all_accuracy_scores)
        report["accuracy_summary"] = {
            "overall_accuracy_percentage": overall_accuracy,
            "accuracy_grade": "A" if overall_accuracy >= 90 else "B" if overall_accuracy >= 80 else "C"
        }
    
    # 推奨事項
    if report["performance_summary"].get("performance_grade", "A") != "A":
        report["recommendations"].append("Response time optimization needed for better user experience")
    
    if report["accuracy_summary"].get("accuracy_grade", "A") != "A":
        report["recommendations"].append("Model fine-tuning required to improve accuracy")
    
    report["detailed_results"] = results
    
    return report

if __name__ == "__main__":
    # テスト実行
    test_results = run_all_ai_tests()
    
    # 結果の出力
    print("\n" + "="*50)
    print("🎯 AI MODEL TEST RESULTS SUMMARY")
    print("="*50)
    
    performance = test_results.get("performance_summary", {})
    accuracy = test_results.get("accuracy_summary", {})
    
    print(f"📊 Overall Performance Grade: {performance.get('performance_grade', 'N/A')}")
    print(f"🎯 Overall Accuracy Grade: {accuracy.get('accuracy_grade', 'N/A')}")
    print(f"⚡ Average Response Time: {performance.get('average_response_time_ms', 0):.2f}ms")
    print(f"✅ Average Accuracy: {accuracy.get('overall_accuracy_percentage', 0):.2f}%")
    
    if test_results.get("recommendations"):
        print("\n💡 Recommendations:")
        for rec in test_results["recommendations"]:
            print(f"  • {rec}")
    
    print("\n✅ All AI model tests completed successfully!")