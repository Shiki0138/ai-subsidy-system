"""
補助金タイプ定義・設定
主要な補助金の詳細情報と申請要件
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime


class SubsidyCategory(Enum):
    """補助金カテゴリ"""
    DIGITALIZATION = "digitalization"      # デジタル化
    MANUFACTURING = "manufacturing"        # 製造業
    INNOVATION = "innovation"              # イノベーション
    STARTUP = "startup"                    # 創業・スタートアップ
    EMPLOYMENT = "employment"              # 雇用・人材
    REGIONAL = "regional"                  # 地域振興
    ENVIRONMENT = "environment"            # 環境・エネルギー
    RESEARCH = "research"                  # 研究開発
    EXPORT = "export"                      # 海外展開
    SUCCESSION = "succession"              # 事業承継


@dataclass
class SubsidyRequirement:
    """補助金要件"""
    min_employees: Optional[int] = None
    max_employees: Optional[int] = None
    min_capital: Optional[int] = None
    max_capital: Optional[int] = None
    target_industries: List[str] = field(default_factory=list)
    excluded_industries: List[str] = field(default_factory=list)
    years_in_business: Optional[int] = None
    special_conditions: List[str] = field(default_factory=list)


@dataclass
class SubsidyType:
    """補助金タイプ詳細"""
    id: str
    name: str
    full_name: str
    category: SubsidyCategory
    description: str
    max_amount: int
    subsidy_rate: float
    target_expenses: List[str]
    requirements: SubsidyRequirement
    application_period: str
    evaluation_criteria: List[str]
    required_documents: List[str]
    tips: List[str]
    success_rate: float = 0.0
    popular_sections: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class SubsidyRegistry:
    """補助金レジストリ"""
    
    def __init__(self):
        """初期化"""
        self.subsidies: Dict[str, SubsidyType] = {}
        self._register_all_subsidies()
    
    def _register_all_subsidies(self):
        """全補助金登録"""
        
        # 1. IT導入補助金
        self.subsidies["it_subsidy"] = SubsidyType(
            id="it_subsidy",
            name="IT導入補助金",
            full_name="IT導入補助金（通常枠・デジタル化基盤導入枠）",
            category=SubsidyCategory.DIGITALIZATION,
            description="中小企業・小規模事業者のITツール導入を支援",
            max_amount=4500000,
            subsidy_rate=0.5,
            target_expenses=[
                "ソフトウェア費",
                "クラウド利用料",
                "導入関連費",
                "ハードウェア購入費（デジタル化基盤導入枠のみ）"
            ],
            requirements=SubsidyRequirement(
                max_capital=300000000,
                max_employees=300,
                excluded_industries=["金融業", "風営法対象業種"]
            ),
            application_period="通年（締切日複数回）",
            evaluation_criteria=[
                "生産性向上の見込み",
                "IT活用の具体性",
                "実現可能性",
                "費用対効果"
            ],
            required_documents=[
                "事業計画書",
                "導入ITツール説明書",
                "見積書",
                "決算書（2期分）"
            ],
            tips=[
                "IT導入支援事業者との連携が必須",
                "クラウドサービスの活用を重視",
                "セキュリティ対策の記載が重要"
            ],
            success_rate=0.65,
            popular_sections=["PROJECT_DESCRIPTION", "EXPECTED_OUTCOMES", "IMPLEMENTATION_PLAN"]
        )
        
        # 2. ものづくり補助金
        self.subsidies["monozukuri_subsidy"] = SubsidyType(
            id="monozukuri_subsidy",
            name="ものづくり補助金",
            full_name="ものづくり・商業・サービス生産性向上促進補助金",
            category=SubsidyCategory.MANUFACTURING,
            description="革新的サービス開発・試作品開発・生産プロセス改善を支援",
            max_amount=50000000,
            subsidy_rate=0.5,
            target_expenses=[
                "機械装置・システム構築費",
                "技術導入費",
                "専門家経費",
                "運搬費",
                "クラウドサービス利用費"
            ],
            requirements=SubsidyRequirement(
                min_capital=1000000,
                years_in_business=3,
                special_conditions=["経営革新計画等の承認", "賃上げ計画の策定"]
            ),
            application_period="年3-4回公募",
            evaluation_criteria=[
                "技術的革新性",
                "事業化可能性",
                "収益性",
                "政策加点（賃上げ、グリーン等）"
            ],
            required_documents=[
                "事業計画書（10ページ程度）",
                "決算書（3期分）",
                "技術説明資料",
                "賃金引上げ計画書"
            ],
            tips=[
                "革新性の具体的な説明が重要",
                "数値目標を明確に設定",
                "専門用語は分かりやすく説明",
                "加点要素を積極的に活用"
            ],
            success_rate=0.45,
            popular_sections=["INNOVATION_TECHNOLOGY", "PROJECT_DESCRIPTION", "MARKET_ANALYSIS"]
        )
        
        # 3. 小規模事業者持続化補助金
        self.subsidies["jizokuka_subsidy"] = SubsidyType(
            id="jizokuka_subsidy",
            name="小規模事業者持続化補助金",
            full_name="小規模事業者持続化補助金（一般型・低感染リスク型）",
            category=SubsidyCategory.REGIONAL,
            description="小規模事業者の販路開拓・生産性向上の取組を支援",
            max_amount=2000000,
            subsidy_rate=0.75,
            target_expenses=[
                "広報費",
                "ウェブサイト関連費",
                "展示会等出展費",
                "開発費",
                "機械装置等費"
            ],
            requirements=SubsidyRequirement(
                max_employees=20,  # 商業・サービス業は5人以下
                special_conditions=["商工会・商工会議所の支援"]
            ),
            application_period="年4-5回公募",
            evaluation_criteria=[
                "経営計画の適切性",
                "補助事業計画の有効性",
                "積算の透明・適切性",
                "地域への波及効果"
            ],
            required_documents=[
                "経営計画書",
                "補助事業計画書",
                "商工会・商工会議所の事業支援計画書",
                "見積書"
            ],
            tips=[
                "商工会・商工会議所との事前相談が必須",
                "地域性を活かした計画が評価される",
                "具体的な販路開拓方法を明記"
            ],
            success_rate=0.70,
            popular_sections=["BUSINESS_MODEL", "MARKET_ANALYSIS", "EXPECTED_OUTCOMES"]
        )
        
        # 4. 事業再構築補助金
        self.subsidies["saikochiku_subsidy"] = SubsidyType(
            id="saikochiku_subsidy",
            name="事業再構築補助金",
            full_name="中小企業等事業再構築促進事業",
            category=SubsidyCategory.INNOVATION,
            description="新分野展開や業態転換、事業・業種転換等の事業再構築を支援",
            max_amount=150000000,
            subsidy_rate=0.75,
            target_expenses=[
                "建物費",
                "機械装置・システム構築費",
                "技術導入費",
                "広告宣伝・販売促進費",
                "研修費"
            ],
            requirements=SubsidyRequirement(
                special_conditions=[
                    "売上高10%以上減少",
                    "事業再構築指針に沿った事業計画",
                    "認定経営革新等支援機関の確認"
                ]
            ),
            application_period="年2-3回公募",
            evaluation_criteria=[
                "事業再構築の必要性・妥当性",
                "新規性・革新性",
                "実現可能性",
                "成長性・収益性"
            ],
            required_documents=[
                "事業計画書（15ページ程度）",
                "認定支援機関確認書",
                "売上高減少証明書",
                "決算書",
                "市場分析資料"
            ],
            tips=[
                "事業再構築の必要性を明確に説明",
                "新規事業の市場性を具体的に分析",
                "既存事業とのシナジー効果を記載",
                "数値計画は保守的かつ現実的に"
            ],
            success_rate=0.40,
            popular_sections=["CURRENT_SITUATION", "PROJECT_DESCRIPTION", "MARKET_ANALYSIS", "BUSINESS_MODEL"]
        )
        
        # 5. 創業補助金
        self.subsidies["sogyo_subsidy"] = SubsidyType(
            id="sogyo_subsidy",
            name="創業補助金",
            full_name="地域創造的起業補助金",
            category=SubsidyCategory.STARTUP,
            description="新たに創業する者に対して創業に要する経費の一部を補助",
            max_amount=2000000,
            subsidy_rate=0.5,
            target_expenses=[
                "人件費",
                "店舗等借料",
                "設備費",
                "原材料費",
                "広報費"
            ],
            requirements=SubsidyRequirement(
                years_in_business=0,
                special_conditions=["創業予定または創業後1年未満", "地域への貢献"]
            ),
            application_period="自治体により異なる",
            evaluation_criteria=[
                "事業の独創性",
                "事業の実現可能性",
                "地域への貢献度",
                "収益性・成長性"
            ],
            required_documents=[
                "創業計画書",
                "収支計画書",
                "資金調達計画書",
                "履歴書・職務経歴書"
            ],
            tips=[
                "地域課題の解決を意識した計画",
                "具体的な顧客ターゲットの設定",
                "初期の資金計画を詳細に",
                "メンターや支援機関の活用計画"
            ],
            success_rate=0.35,
            popular_sections=["BUSINESS_MODEL", "MARKET_ANALYSIS", "IMPLEMENTATION_PLAN"]
        )
        
        # 6. 雇用関係助成金
        self.subsidies["koyo_subsidy"] = SubsidyType(
            id="koyo_subsidy",
            name="雇用関係助成金",
            full_name="キャリアアップ助成金・人材開発支援助成金",
            category=SubsidyCategory.EMPLOYMENT,
            description="非正規雇用労働者の正社員化、人材育成の取組を支援",
            max_amount=7200000,  # 1事業所あたり年間
            subsidy_rate=1.0,  # 定額支給
            target_expenses=[
                "正社員転換に伴う賃金増額分",
                "教育訓練経費",
                "賃金助成",
                "OJT実施助成"
            ],
            requirements=SubsidyRequirement(
                special_conditions=[
                    "雇用保険適用事業所",
                    "キャリアアップ計画の作成・認定",
                    "就業規則の整備"
                ]
            ),
            application_period="随時申請可能",
            evaluation_criteria=[
                "計画の具体性",
                "実施体制",
                "継続性",
                "労働条件の改善度"
            ],
            required_documents=[
                "キャリアアップ計画書",
                "就業規則",
                "賃金台帳",
                "出勤簿",
                "雇用契約書"
            ],
            tips=[
                "事前にキャリアアップ計画の認定が必要",
                "正社員化後6ヶ月の賃金支払い実績が必要",
                "訓練計画は具体的かつ実現可能に"
            ],
            success_rate=0.80,
            popular_sections=["IMPLEMENTATION_PLAN", "EXPECTED_OUTCOMES"]
        )
        
        # 7. 省エネ補助金
        self.subsidies["shoene_subsidy"] = SubsidyType(
            id="shoene_subsidy",
            name="省エネ補助金",
            full_name="省エネルギー投資促進支援事業費補助金",
            category=SubsidyCategory.ENVIRONMENT,
            description="工場・事業場等における省エネ設備への更新を支援",
            max_amount=150000000,
            subsidy_rate=0.33,
            target_expenses=[
                "高効率設備導入費",
                "エネルギー管理システム導入費",
                "計測装置導入費",
                "工事費"
            ],
            requirements=SubsidyRequirement(
                special_conditions=[
                    "省エネ率5%以上または省エネ量500kl以上",
                    "エネルギー管理士等の関与"
                ]
            ),
            application_period="年1-2回公募",
            evaluation_criteria=[
                "省エネ効果",
                "費用対効果",
                "技術の先進性",
                "普及可能性"
            ],
            required_documents=[
                "省エネ計算書",
                "設備仕様書",
                "エネルギー使用量実績",
                "投資回収計画"
            ],
            tips=[
                "省エネ効果の算定根拠を明確に",
                "投資回収年数は3-5年程度が理想",
                "エネルギー管理の継続性を強調",
                "CO2削減効果も併せて記載"
            ],
            success_rate=0.55,
            popular_sections=["PROJECT_DESCRIPTION", "EXPECTED_OUTCOMES", "BUDGET_PLAN"]
        )
        
        # 8. 研究開発助成金
        self.subsidies["kenkyu_subsidy"] = SubsidyType(
            id="kenkyu_subsidy",
            name="研究開発助成金",
            full_name="中小企業技術革新制度（SBIR）・戦略的基盤技術高度化支援事業",
            category=SubsidyCategory.RESEARCH,
            description="中小企業の研究開発・技術開発を支援",
            max_amount=45000000,
            subsidy_rate=0.67,
            target_expenses=[
                "研究員人件費",
                "原材料費",
                "機械装置費",
                "外注費",
                "技術指導費"
            ],
            requirements=SubsidyRequirement(
                special_conditions=[
                    "技術的課題の明確化",
                    "大学・研究機関との連携",
                    "事業化計画の策定"
                ]
            ),
            application_period="年1-2回公募",
            evaluation_criteria=[
                "技術の新規性・優位性",
                "研究開発体制",
                "事業化可能性",
                "社会的インパクト"
            ],
            required_documents=[
                "研究開発計画書",
                "技術説明資料",
                "研究体制図",
                "知財戦略",
                "事業化計画"
            ],
            tips=[
                "技術の新規性を論文等で裏付け",
                "研究体制に外部専門家を含める",
                "知的財産戦略を明確に",
                "段階的な事業化計画を策定"
            ],
            success_rate=0.30,
            popular_sections=["INNOVATION_TECHNOLOGY", "PROJECT_DESCRIPTION", "IMPLEMENTATION_PLAN"]
        )
        
        # 9. 海外展開支援補助金
        self.subsidies["kaigai_subsidy"] = SubsidyType(
            id="kaigai_subsidy",
            name="海外展開支援補助金",
            full_name="JAPANブランド育成支援等事業",
            category=SubsidyCategory.EXPORT,
            description="中小企業の海外展開・輸出拡大を支援",
            max_amount=5000000,
            subsidy_rate=0.67,
            target_expenses=[
                "市場調査費",
                "展示会出展費",
                "通訳・翻訳費",
                "海外旅費",
                "認証取得費"
            ],
            requirements=SubsidyRequirement(
                special_conditions=[
                    "海外展開計画の策定",
                    "現地パートナーの確保（推奨）"
                ]
            ),
            application_period="年2-3回公募",
            evaluation_criteria=[
                "海外展開戦略の明確性",
                "製品・サービスの競争力",
                "現地市場の理解度",
                "実施体制"
            ],
            required_documents=[
                "海外展開計画書",
                "市場調査レポート",
                "製品カタログ（英語版）",
                "財務諸表"
            ],
            tips=[
                "ターゲット国・地域を明確に",
                "現地の規制・認証要件を調査",
                "段階的な展開計画を策定",
                "現地パートナー候補をリストアップ"
            ],
            success_rate=0.50,
            popular_sections=["MARKET_ANALYSIS", "BUSINESS_MODEL", "IMPLEMENTATION_PLAN"]
        )
        
        # 10. 事業承継補助金
        self.subsidies["shokei_subsidy"] = SubsidyType(
            id="shokei_subsidy",
            name="事業承継補助金",
            full_name="事業承継・引継ぎ補助金",
            category=SubsidyCategory.SUCCESSION,
            description="事業承継やM&Aを契機とした新たな取組を支援",
            max_amount=6000000,
            subsidy_rate=0.67,
            target_expenses=[
                "設備投資費",
                "店舗改装費",
                "マーケティング費",
                "専門家活用費",
                "システム構築費"
            ],
            requirements=SubsidyRequirement(
                special_conditions=[
                    "事業承継の実施（予定含む）",
                    "経営革新計画の策定",
                    "承継後の事業計画"
                ]
            ),
            application_period="年2回程度公募",
            evaluation_criteria=[
                "事業承継の確実性",
                "経営革新の内容",
                "地域経済への貢献",
                "雇用の維持・創出"
            ],
            required_documents=[
                "事業承継計画書",
                "経営革新計画書",
                "承継スキーム図",
                "財務諸表",
                "後継者の経歴書"
            ],
            tips=[
                "承継前後の体制を明確に図示",
                "経営革新の具体的内容を記載",
                "従業員の雇用維持を明記",
                "地域への貢献を強調"
            ],
            success_rate=0.60,
            popular_sections=["COMPANY_OVERVIEW", "PROJECT_DESCRIPTION", "IMPLEMENTATION_PLAN"]
        )
    
    def get_subsidy(self, subsidy_id: str) -> Optional[SubsidyType]:
        """補助金情報取得"""
        return self.subsidies.get(subsidy_id)
    
    def get_subsidies_by_category(self, category: SubsidyCategory) -> List[SubsidyType]:
        """カテゴリ別補助金取得"""
        return [s for s in self.subsidies.values() if s.category == category]
    
    def get_subsidies_for_company(
        self,
        company_profile: Dict[str, Any]
    ) -> List[SubsidyType]:
        """企業に適した補助金取得"""
        eligible_subsidies = []
        
        employees = company_profile.get("employee_count", 0)
        capital = company_profile.get("capital", 0)
        industry = company_profile.get("industry", "")
        years = company_profile.get("years_in_business", 0)
        
        for subsidy in self.subsidies.values():
            req = subsidy.requirements
            
            # 従業員数チェック
            if req.min_employees and employees < req.min_employees:
                continue
            if req.max_employees and employees > req.max_employees:
                continue
            
            # 資本金チェック
            if req.min_capital and capital < req.min_capital:
                continue
            if req.max_capital and capital > req.max_capital:
                continue
            
            # 業界チェック
            if req.target_industries and industry not in req.target_industries:
                continue
            if req.excluded_industries and industry in req.excluded_industries:
                continue
            
            # 設立年数チェック
            if req.years_in_business and years < req.years_in_business:
                continue
            
            eligible_subsidies.append(subsidy)
        
        return eligible_subsidies
    
    def search_subsidies(
        self,
        keyword: str = "",
        category: Optional[SubsidyCategory] = None,
        max_amount: Optional[int] = None,
        min_subsidy_rate: Optional[float] = None
    ) -> List[SubsidyType]:
        """補助金検索"""
        results = list(self.subsidies.values())
        
        # キーワード検索
        if keyword:
            keyword_lower = keyword.lower()
            results = [
                s for s in results
                if keyword_lower in s.name.lower() or
                   keyword_lower in s.description.lower() or
                   keyword_lower in s.full_name.lower()
            ]
        
        # カテゴリフィルタ
        if category:
            results = [s for s in results if s.category == category]
        
        # 最大金額フィルタ
        if max_amount:
            results = [s for s in results if s.max_amount <= max_amount]
        
        # 最小補助率フィルタ
        if min_subsidy_rate:
            results = [s for s in results if s.subsidy_rate >= min_subsidy_rate]
        
        return results


# グローバルインスタンス
subsidy_registry = SubsidyRegistry()


def get_all_subsidy_types() -> List[str]:
    """全補助金タイプID取得"""
    return list(subsidy_registry.subsidies.keys())


def get_subsidy_info(subsidy_id: str) -> Optional[SubsidyType]:
    """補助金情報取得"""
    return subsidy_registry.get_subsidy(subsidy_id)


def get_eligible_subsidies(company_profile: Dict[str, Any]) -> List[SubsidyType]:
    """企業に適した補助金取得"""
    return subsidy_registry.get_subsidies_for_company(company_profile)