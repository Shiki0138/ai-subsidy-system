"""
採択可能性予測強化システム
機械学習とAIを組み合わせた高精度な採択予測
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from dataclasses import dataclass, asdict
from datetime import datetime
import json
import logging
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import os

logger = logging.getLogger(__name__)


@dataclass
class ApplicationFeatures:
    """申請特徴量"""
    text_length: int
    keyword_density: float
    innovation_score: float
    market_potential: float
    feasibility_score: float
    budget_reasonableness: float
    company_track_record: float
    industry_alignment: float
    technology_readiness: float
    team_capability: float
    risk_assessment: float
    competitive_advantage: float


@dataclass
class PredictionResult:
    """予測結果"""
    adoption_probability: float
    confidence_score: float
    score_breakdown: Dict[str, float]
    key_factors: List[str]
    improvement_suggestions: List[str]
    risk_factors: List[str]
    benchmark_comparison: Dict[str, float]
    prediction_explanation: List[str]


@dataclass
class TrainingData:
    """訓練データ"""
    features: np.ndarray
    labels: np.ndarray
    feature_names: List[str]
    sample_weights: Optional[np.ndarray] = None


class AdoptionPredictor:
    """採択可能性予測器"""
    
    def __init__(self, model_path: Optional[str] = None):
        """
        初期化
        
        Args:
            model_path: 学習済みモデルのパス
        """
        self.model_path = model_path or "models/adoption_predictor.pkl"
        self.scaler_path = "models/feature_scaler.pkl"
        self.encoders_path = "models/label_encoders.pkl"
        
        # モデル初期化
        self.classifier = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        
        # 特徴量定義
        self.feature_extractors = self._initialize_feature_extractors()
        
        # 業界別重み
        self.industry_weights = self._load_industry_weights()
        
        # 補助金タイプ別パラメータ
        self.subsidy_parameters = self._load_subsidy_parameters()
        
        # 学習済みモデル読み込み
        self._load_trained_model()

    def predict_adoption_probability(
        self,
        application_data: Dict,
        subsidy_program: Dict,
        company_profile: Dict
    ) -> PredictionResult:
        """
        採択可能性予測
        
        Args:
            application_data: 申請データ
            subsidy_program: 補助金プログラム情報
            company_profile: 企業プロファイル
            
        Returns:
            PredictionResult: 予測結果
        """
        try:
            # 特徴量抽出
            features = self._extract_comprehensive_features(
                application_data, subsidy_program, company_profile
            )
            
            # 特徴量前処理
            feature_vector = self._preprocess_features(features)
            
            # 基本予測
            if self.classifier:
                probability = self.classifier.predict_proba([feature_vector])[0][1]
                feature_importance = self._get_feature_importance()
            else:
                # フォールバック予測（ルールベース）
                probability = self._rule_based_prediction(features, subsidy_program)
                feature_importance = self._get_fallback_importance()
            
            # 信頼度計算
            confidence = self._calculate_confidence(features, probability)
            
            # スコア内訳
            score_breakdown = self._calculate_score_breakdown(features)
            
            # 重要因子特定
            key_factors = self._identify_key_factors(features, feature_importance)
            
            # 改善提案生成
            improvement_suggestions = self._generate_improvement_suggestions(
                features, score_breakdown, subsidy_program
            )
            
            # リスク因子分析
            risk_factors = self._analyze_risk_factors(features, application_data)
            
            # ベンチマーク比較
            benchmark_comparison = self._benchmark_comparison(
                features, subsidy_program, company_profile
            )
            
            # 予測説明生成
            prediction_explanation = self._generate_prediction_explanation(
                features, probability, key_factors
            )
            
            return PredictionResult(
                adoption_probability=round(probability, 3),
                confidence_score=round(confidence, 3),
                score_breakdown=score_breakdown,
                key_factors=key_factors,
                improvement_suggestions=improvement_suggestions,
                risk_factors=risk_factors,
                benchmark_comparison=benchmark_comparison,
                prediction_explanation=prediction_explanation
            )
            
        except Exception as e:
            logger.error(f"採択可能性予測エラー: {str(e)}")
            return self._fallback_prediction(application_data, subsidy_program)

    def train_model(
        self,
        training_data: List[Dict],
        labels: List[int],
        validation_split: float = 0.2
    ) -> Dict[str, Any]:
        """
        モデル訓練
        
        Args:
            training_data: 訓練データ
            labels: ラベル (1: 採択, 0: 不採択)
            validation_split: 検証データ分割比率
            
        Returns:
            Dict: 訓練結果
        """
        try:
            logger.info("モデル訓練開始")
            
            # 特徴量抽出・前処理
            features_list = []
            for data in training_data:
                features = self._extract_comprehensive_features(
                    data.get('application_data', {}),
                    data.get('subsidy_program', {}),
                    data.get('company_profile', {})
                )
                features_list.append(self._features_to_vector(features))
            
            X = np.array(features_list)
            y = np.array(labels)
            
            # データ分割
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=validation_split, random_state=42, stratify=y
            )
            
            # 特徴量正規化
            self.scaler.fit(X_train)
            X_train_scaled = self.scaler.transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # アンサンブルモデル訓練
            models = {
                'random_forest': RandomForestClassifier(
                    n_estimators=100, 
                    max_depth=10, 
                    random_state=42,
                    class_weight='balanced'
                ),
                'gradient_boosting': GradientBoostingClassifier(
                    n_estimators=100,
                    learning_rate=0.1,
                    max_depth=6,
                    random_state=42
                )
            }
            
            best_model = None
            best_score = 0
            model_scores = {}
            
            for name, model in models.items():
                # 交差検証
                cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
                avg_score = np.mean(cv_scores)
                model_scores[name] = avg_score
                
                logger.info(f"{name} CV Score: {avg_score:.3f}")
                
                if avg_score > best_score:
                    best_score = avg_score
                    best_model = model
            
            # 最良モデルで最終訓練
            best_model.fit(X_train_scaled, y_train)
            self.classifier = best_model
            
            # テストセット評価
            test_score = best_model.score(X_test_scaled, y_test)
            y_pred = best_model.predict(X_test_scaled)
            
            # 評価レポート
            classification_rep = classification_report(y_test, y_pred, output_dict=True)
            confusion_mat = confusion_matrix(y_test, y_pred)
            
            # モデル保存
            self._save_model()
            
            training_result = {
                'best_model': type(best_model).__name__,
                'cross_validation_score': best_score,
                'test_score': test_score,
                'model_scores': model_scores,
                'classification_report': classification_rep,
                'confusion_matrix': confusion_mat.tolist(),
                'feature_importance': self._get_feature_importance(),
                'training_samples': len(X_train),
                'test_samples': len(X_test)
            }
            
            logger.info(f"モデル訓練完了: テストスコア {test_score:.3f}")
            return training_result
            
        except Exception as e:
            logger.error(f"モデル訓練エラー: {str(e)}")
            return {"error": str(e)}

    def _extract_comprehensive_features(
        self,
        application_data: Dict,
        subsidy_program: Dict,
        company_profile: Dict
    ) -> ApplicationFeatures:
        """包括的特徴量抽出"""
        
        # テキスト特徴量
        text_content = str(application_data.get('content', ''))
        text_length = len(text_content)
        
        # キーワード密度
        keyword_density = self._calculate_keyword_density(text_content, subsidy_program)
        
        # AI評価スコア
        innovation_score = self._evaluate_innovation(application_data, company_profile)
        market_potential = self._evaluate_market_potential(application_data, company_profile)
        feasibility_score = self._evaluate_feasibility(application_data, company_profile)
        
        # 予算・財務分析
        budget_reasonableness = self._evaluate_budget(application_data, subsidy_program)
        
        # 企業評価
        company_track_record = self._evaluate_company_track_record(company_profile)
        industry_alignment = self._evaluate_industry_alignment(
            company_profile, subsidy_program
        )
        
        # 技術・チーム評価
        technology_readiness = self._evaluate_technology_readiness(application_data)
        team_capability = self._evaluate_team_capability(company_profile)
        
        # リスク・競争優位性
        risk_assessment = self._assess_risks(application_data, company_profile)
        competitive_advantage = self._evaluate_competitive_advantage(application_data)
        
        return ApplicationFeatures(
            text_length=text_length,
            keyword_density=keyword_density,
            innovation_score=innovation_score,
            market_potential=market_potential,
            feasibility_score=feasibility_score,
            budget_reasonableness=budget_reasonableness,
            company_track_record=company_track_record,
            industry_alignment=industry_alignment,
            technology_readiness=technology_readiness,
            team_capability=team_capability,
            risk_assessment=risk_assessment,
            competitive_advantage=competitive_advantage
        )

    def _calculate_keyword_density(self, text: str, subsidy_program: Dict) -> float:
        """キーワード密度計算"""
        if not text:
            return 0.0
        
        program_type = subsidy_program.get('type', '')
        target_keywords = self.subsidy_parameters.get(program_type, {}).get('keywords', [])
        
        text_lower = text.lower()
        keyword_count = sum(1 for keyword in target_keywords if keyword.lower() in text_lower)
        
        return min(keyword_count / len(target_keywords) if target_keywords else 0, 1.0)

    def _evaluate_innovation(self, application_data: Dict, company_profile: Dict) -> float:
        """革新性評価"""
        innovation_indicators = [
            'AI', '人工知能', 'IoT', 'DX', 'デジタル変革',
            '自動化', '最適化', '革新', '新技術', 'ビッグデータ'
        ]
        
        content = str(application_data.get('content', ''))
        score = 0.5  # ベーススコア
        
        for indicator in innovation_indicators:
            if indicator in content:
                score += 0.05
        
        # 企業の技術力も考慮
        if company_profile.get('industry') in ['IT', 'テクノロジー', '製造業']:
            score += 0.1
        
        return min(score, 1.0)

    def _evaluate_market_potential(self, application_data: Dict, company_profile: Dict) -> float:
        """市場性評価"""
        market_indicators = [
            '市場規模', '成長性', '需要', 'ニーズ', 'ターゲット',
            '競争優位', 'シェア', '収益性'
        ]
        
        content = str(application_data.get('content', ''))
        score = 0.5
        
        for indicator in market_indicators:
            if indicator in content:
                score += 0.04
        
        # 従業員数による企業規模考慮
        employee_count = company_profile.get('employee_count', 0)
        if employee_count > 50:
            score += 0.1
        elif employee_count > 10:
            score += 0.05
        
        return min(score, 1.0)

    def _evaluate_feasibility(self, application_data: Dict, company_profile: Dict) -> float:
        """実現可能性評価"""
        feasibility_indicators = [
            'スケジュール', '計画', '実施体制', 'リソース',
            '経験', '実績', '技術力', '準備'
        ]
        
        content = str(application_data.get('content', ''))
        score = 0.5
        
        for indicator in feasibility_indicators:
            if indicator in content:
                score += 0.04
        
        # 企業設立年数による安定性考慮
        founded_year = company_profile.get('founded_year', datetime.now().year)
        years_in_business = datetime.now().year - founded_year
        if years_in_business > 5:
            score += 0.1
        elif years_in_business > 2:
            score += 0.05
        
        return min(score, 1.0)

    def _evaluate_budget(self, application_data: Dict, subsidy_program: Dict) -> float:
        """予算妥当性評価"""
        requested_amount = application_data.get('budget', {}).get('total', 0)
        max_amount = subsidy_program.get('max_amount', float('inf'))
        
        if requested_amount == 0:
            return 0.3
        
        if requested_amount > max_amount:
            return 0.1  # 予算超過
        
        # 予算利用率による評価
        budget_ratio = requested_amount / max_amount if max_amount != float('inf') else 0.5
        
        if 0.3 <= budget_ratio <= 0.8:
            return 0.9  # 適切な範囲
        elif 0.1 <= budget_ratio < 0.3:
            return 0.7  # やや少ない
        elif 0.8 < budget_ratio <= 1.0:
            return 0.6  # やや多い
        else:
            return 0.4  # 極端

    def _evaluate_company_track_record(self, company_profile: Dict) -> float:
        """企業実績評価"""
        score = 0.5
        
        # 従業員数
        employee_count = company_profile.get('employee_count', 0)
        if employee_count > 100:
            score += 0.2
        elif employee_count > 50:
            score += 0.15
        elif employee_count > 10:
            score += 0.1
        
        # 設立年数
        founded_year = company_profile.get('founded_year', datetime.now().year)
        years = datetime.now().year - founded_year
        if years > 10:
            score += 0.15
        elif years > 5:
            score += 0.1
        elif years > 2:
            score += 0.05
        
        # 売上規模（もしあれば）
        revenue = company_profile.get('revenue', 0)
        if revenue > 1000000000:  # 10億円以上
            score += 0.15
        elif revenue > 100000000:  # 1億円以上
            score += 0.1
        
        return min(score, 1.0)

    def _evaluate_industry_alignment(
        self, 
        company_profile: Dict, 
        subsidy_program: Dict
    ) -> float:
        """業界適合性評価"""
        company_industry = company_profile.get('industry', '')
        program_target_industries = subsidy_program.get('target_industries', [])
        
        if not program_target_industries:
            return 0.7  # 制限なし
        
        # 完全一致
        if company_industry in program_target_industries:
            return 1.0
        
        # 部分一致チェック
        for target in program_target_industries:
            if target in company_industry or company_industry in target:
                return 0.8
        
        return 0.3  # 一致しない

    def _evaluate_technology_readiness(self, application_data: Dict) -> float:
        """技術準備度評価"""
        tech_indicators = [
            'プロトタイプ', '実証実験', 'PoC', '技術検証',
            '開発済み', '実装', '稼働', '運用'
        ]
        
        content = str(application_data.get('content', ''))
        score = 0.4
        
        for indicator in tech_indicators:
            if indicator in content:
                score += 0.08
        
        return min(score, 1.0)

    def _evaluate_team_capability(self, company_profile: Dict) -> float:
        """チーム能力評価"""
        score = 0.5
        
        # 従業員数による基本評価
        employee_count = company_profile.get('employee_count', 0)
        if employee_count >= 20:
            score += 0.2
        elif employee_count >= 10:
            score += 0.15
        elif employee_count >= 5:
            score += 0.1
        
        # 業界経験
        industry = company_profile.get('industry', '')
        tech_industries = ['IT', 'テクノロジー', '製造業', '研究開発']
        if industry in tech_industries:
            score += 0.15
        
        return min(score, 1.0)

    def _assess_risks(self, application_data: Dict, company_profile: Dict) -> float:
        """リスク評価（低い方が良い）"""
        risk_factors = [
            '課題', 'リスク', '困難', '問題', '制約',
            '不確実', '未経験', '初回'
        ]
        
        content = str(application_data.get('content', ''))
        risk_count = sum(1 for factor in risk_factors if factor in content)
        
        # リスク数に基づくスコア（逆転）
        risk_score = max(0.2, 1.0 - (risk_count * 0.1))
        
        return risk_score

    def _evaluate_competitive_advantage(self, application_data: Dict) -> float:
        """競争優位性評価"""
        advantage_indicators = [
            '独自性', '特許', '差別化', '優位性', '先進性',
            '革新的', 'ユニーク', '独占', '先行'
        ]
        
        content = str(application_data.get('content', ''))
        score = 0.4
        
        for indicator in advantage_indicators:
            if indicator in content:
                score += 0.07
        
        return min(score, 1.0)

    def _preprocess_features(self, features: ApplicationFeatures) -> np.ndarray:
        """特徴量前処理"""
        feature_vector = self._features_to_vector(features)
        
        if hasattr(self.scaler, 'mean_'):
            return self.scaler.transform([feature_vector])[0]
        else:
            return feature_vector

    def _features_to_vector(self, features: ApplicationFeatures) -> np.ndarray:
        """特徴量をベクトルに変換"""
        return np.array([
            features.text_length / 10000,  # 正規化
            features.keyword_density,
            features.innovation_score,
            features.market_potential,
            features.feasibility_score,
            features.budget_reasonableness,
            features.company_track_record,
            features.industry_alignment,
            features.technology_readiness,
            features.team_capability,
            features.risk_assessment,
            features.competitive_advantage
        ])

    def _rule_based_prediction(
        self, 
        features: ApplicationFeatures, 
        subsidy_program: Dict
    ) -> float:
        """ルールベース予測（フォールバック）"""
        score = 0.5  # ベーススコア
        
        # 各要素の重み付けスコア
        weights = {
            'innovation': 0.15,
            'market_potential': 0.15,
            'feasibility': 0.15,
            'budget': 0.1,
            'track_record': 0.1,
            'industry_alignment': 0.1,
            'technology_readiness': 0.1,
            'team_capability': 0.08,
            'risk_assessment': 0.05,
            'competitive_advantage': 0.02
        }
        
        weighted_score = (
            features.innovation_score * weights['innovation'] +
            features.market_potential * weights['market_potential'] +
            features.feasibility_score * weights['feasibility'] +
            features.budget_reasonableness * weights['budget'] +
            features.company_track_record * weights['track_record'] +
            features.industry_alignment * weights['industry_alignment'] +
            features.technology_readiness * weights['technology_readiness'] +
            features.team_capability * weights['team_capability'] +
            features.risk_assessment * weights['risk_assessment'] +
            features.competitive_advantage * weights['competitive_advantage']
        )
        
        return min(max(weighted_score, 0.05), 0.95)

    def _calculate_confidence(self, features: ApplicationFeatures, probability: float) -> float:
        """信頼度計算"""
        # 特徴量の完全性
        feature_completeness = sum([
            1 if features.text_length > 100 else 0,
            1 if features.keyword_density > 0.1 else 0,
            1 if features.innovation_score > 0.3 else 0,
            1 if features.market_potential > 0.3 else 0,
            1 if features.feasibility_score > 0.3 else 0
        ]) / 5
        
        # 予測の確実性（0.5から離れているほど確実）
        prediction_certainty = abs(probability - 0.5) * 2
        
        # 総合信頼度
        confidence = (feature_completeness + prediction_certainty) / 2
        
        return min(max(confidence, 0.3), 0.95)

    def _calculate_score_breakdown(self, features: ApplicationFeatures) -> Dict[str, float]:
        """スコア内訳計算"""
        return {
            "innovation_score": round(features.innovation_score * 100, 1),
            "market_potential_score": round(features.market_potential * 100, 1),
            "feasibility_score": round(features.feasibility_score * 100, 1),
            "budget_adequacy_score": round(features.budget_reasonableness * 100, 1),
            "company_strength_score": round(features.company_track_record * 100, 1),
            "industry_alignment_score": round(features.industry_alignment * 100, 1),
            "technology_readiness_score": round(features.technology_readiness * 100, 1),
            "team_capability_score": round(features.team_capability * 100, 1),
            "risk_mitigation_score": round(features.risk_assessment * 100, 1),
            "competitive_advantage_score": round(features.competitive_advantage * 100, 1)
        }

    def _identify_key_factors(
        self, 
        features: ApplicationFeatures, 
        feature_importance: Optional[np.ndarray]
    ) -> List[str]:
        """重要因子特定"""
        factor_scores = [
            ("革新性・技術的優位性", features.innovation_score),
            ("市場性・事業性", features.market_potential),
            ("実現可能性", features.feasibility_score),
            ("予算計画の妥当性", features.budget_reasonableness),
            ("企業の実績・信頼性", features.company_track_record),
            ("業界適合性", features.industry_alignment),
            ("技術準備度", features.technology_readiness),
            ("チーム能力", features.team_capability),
            ("リスク管理", features.risk_assessment),
            ("競争優位性", features.competitive_advantage)
        ]
        
        # スコア順にソートして上位5つを選択
        sorted_factors = sorted(factor_scores, key=lambda x: x[1], reverse=True)
        return [factor[0] for factor in sorted_factors[:5]]

    def _generate_improvement_suggestions(
        self, 
        features: ApplicationFeatures,
        score_breakdown: Dict[str, float],
        subsidy_program: Dict
    ) -> List[str]:
        """改善提案生成"""
        suggestions = []
        
        if features.innovation_score < 0.6:
            suggestions.append("技術的革新性や独自性をより具体的に記載してください")
        
        if features.market_potential < 0.6:
            suggestions.append("市場規模や事業性を数値的根拠を含めて説明してください")
        
        if features.feasibility_score < 0.6:
            suggestions.append("実施計画をより詳細で実現可能なものに強化してください")
        
        if features.budget_reasonableness < 0.6:
            suggestions.append("予算計画の妥当性と費用対効果を明確に示してください")
        
        if features.company_track_record < 0.6:
            suggestions.append("企業の過去実績や専門性をより強調してください")
        
        if features.technology_readiness < 0.6:
            suggestions.append("技術的準備度や開発状況を具体的に説明してください")
        
        if len(suggestions) == 0:
            suggestions.append("全体的に高い評価です。細部の精度向上に注力してください")
        
        return suggestions[:5]  # 最大5つまで

    def _analyze_risk_factors(
        self, 
        features: ApplicationFeatures,
        application_data: Dict
    ) -> List[str]:
        """リスク因子分析"""
        risks = []
        
        if features.feasibility_score < 0.5:
            risks.append("実現可能性に懸念があります")
        
        if features.budget_reasonableness < 0.4:
            risks.append("予算計画に問題があります")
        
        if features.company_track_record < 0.4:
            risks.append("企業実績が不足しています")
        
        if features.technology_readiness < 0.4:
            risks.append("技術的準備が不十分です")
        
        if features.market_potential < 0.4:
            risks.append("市場性の根拠が薄弱です")
        
        return risks[:3]  # 最大3つまで

    def _benchmark_comparison(
        self,
        features: ApplicationFeatures,
        subsidy_program: Dict,
        company_profile: Dict
    ) -> Dict[str, float]:
        """ベンチマーク比較"""
        # 業界平均値（仮想データ）
        industry_benchmarks = {
            "innovation_benchmark": 0.65,
            "market_potential_benchmark": 0.60,
            "feasibility_benchmark": 0.70,
            "budget_appropriateness_benchmark": 0.75,
            "company_strength_benchmark": 0.58
        }
        
        current_scores = {
            "innovation_benchmark": features.innovation_score,
            "market_potential_benchmark": features.market_potential,
            "feasibility_benchmark": features.feasibility_score,
            "budget_appropriateness_benchmark": features.budget_reasonableness,
            "company_strength_benchmark": features.company_track_record
        }
        
        # 相対評価
        comparison = {}
        for key in industry_benchmarks:
            comparison[key] = round(
                (current_scores[key] / industry_benchmarks[key]) * 100, 1
            )
        
        return comparison

    def _generate_prediction_explanation(
        self,
        features: ApplicationFeatures,
        probability: float,
        key_factors: List[str]
    ) -> List[str]:
        """予測説明生成"""
        explanations = []
        
        if probability > 0.8:
            explanations.append("採択可能性が非常に高い申請内容です")
        elif probability > 0.6:
            explanations.append("採択可能性が高い申請内容です")
        elif probability > 0.4:
            explanations.append("採択可能性は中程度です")
        else:
            explanations.append("採択可能性は低めです")
        
        explanations.append(f"主要な評価要因: {', '.join(key_factors[:3])}")
        
        if features.innovation_score > 0.7:
            explanations.append("技術的革新性が高く評価されています")
        
        if features.market_potential > 0.7:
            explanations.append("市場性・事業性が優れています")
        
        return explanations

    def _get_feature_importance(self) -> Optional[np.ndarray]:
        """特徴量重要度取得"""
        if hasattr(self.classifier, 'feature_importances_'):
            return self.classifier.feature_importances_
        return None

    def _get_fallback_importance(self) -> np.ndarray:
        """フォールバック重要度"""
        return np.array([0.05, 0.08, 0.15, 0.15, 0.15, 0.1, 0.1, 0.1, 0.08, 0.08, 0.05, 0.02])

    def _fallback_prediction(
        self, 
        application_data: Dict, 
        subsidy_program: Dict
    ) -> PredictionResult:
        """フォールバック予測"""
        return PredictionResult(
            adoption_probability=0.6,
            confidence_score=0.5,
            score_breakdown={
                "innovation_score": 60.0,
                "market_potential_score": 65.0,
                "feasibility_score": 70.0,
                "budget_adequacy_score": 65.0,
                "company_strength_score": 55.0
            },
            key_factors=["基本評価のみ実施"],
            improvement_suggestions=["詳細分析が必要です"],
            risk_factors=["評価データ不足"],
            benchmark_comparison={"overall": 100.0},
            prediction_explanation=["簡易評価による結果です"]
        )

    def _load_trained_model(self) -> None:
        """学習済みモデル読み込み"""
        try:
            if os.path.exists(self.model_path):
                self.classifier = joblib.load(self.model_path)
                logger.info("学習済みモデルを読み込みました")
            
            if os.path.exists(self.scaler_path):
                self.scaler = joblib.load(self.scaler_path)
                logger.info("特徴量スケーラーを読み込みました")
                
        except Exception as e:
            logger.warning(f"モデル読み込みエラー: {str(e)}")

    def _save_model(self) -> None:
        """モデル保存"""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            
            if self.classifier:
                joblib.dump(self.classifier, self.model_path)
            
            if hasattr(self.scaler, 'mean_'):
                joblib.dump(self.scaler, self.scaler_path)
                
            logger.info("モデルを保存しました")
            
        except Exception as e:
            logger.error(f"モデル保存エラー: {str(e)}")

    def _initialize_feature_extractors(self) -> Dict:
        """特徴量抽出器初期化"""
        return {
            'text_analyzer': None,  # 将来的にNLP特徴量抽出器を追加
            'numerical_analyzer': None
        }

    def _load_industry_weights(self) -> Dict:
        """業界別重み読み込み"""
        return {
            'IT': {'innovation': 1.2, 'technology': 1.3},
            '製造業': {'feasibility': 1.2, 'budget': 1.1},
            'サービス業': {'market_potential': 1.2, 'team': 1.1}
        }

    def _load_subsidy_parameters(self) -> Dict:
        """補助金タイプ別パラメータ読み込み"""
        return {
            'IT導入補助金': {
                'keywords': ['IT', 'システム', 'デジタル', '効率化', 'DX'],
                'weights': {'innovation': 1.3, 'technology': 1.2}
            },
            'ものづくり補助金': {
                'keywords': ['製造', '技術', '設備', '開発', '生産性'],
                'weights': {'feasibility': 1.2, 'budget': 1.1}
            },
            '事業再構築補助金': {
                'keywords': ['事業転換', '新分野', '業態転換', '再構築'],
                'weights': {'market_potential': 1.3, 'innovation': 1.1}
            }
        }