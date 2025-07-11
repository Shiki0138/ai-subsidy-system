"""
フォーム自動入力サービス
申請書フォームの自動入力・データ連携機能
"""

from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from datetime import datetime, date
from enum import Enum
import asyncio
import logging
import json
import re
from decimal import Decimal

logger = logging.getLogger(__name__)


class FormFieldType(Enum):
    """フォームフィールドタイプ"""
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    PHONE = "phone"
    EMAIL = "email"
    ADDRESS = "address"
    CURRENCY = "currency"
    PERCENTAGE = "percentage"
    BOOLEAN = "boolean"
    SELECT = "select"
    MULTI_SELECT = "multi_select"
    FILE = "file"


class DataSource(Enum):
    """データソース"""
    USER_PROFILE = "user_profile"
    COMPANY_INFO = "company_info"
    PREVIOUS_APPLICATION = "previous_application"
    TAX_RECORDS = "tax_records"
    BANK_INFO = "bank_info"
    AI_GENERATED = "ai_generated"
    EXTERNAL_API = "external_api"


@dataclass
class FormField:
    """フォームフィールド定義"""
    id: str
    name: str
    field_type: FormFieldType
    required: bool = False
    default_value: Optional[str] = None
    validation_pattern: Optional[str] = None
    data_source: Optional[DataSource] = None
    ai_prompt: Optional[str] = None
    dependencies: List[str] = field(default_factory=list)
    

@dataclass
class AutoFillRule:
    """自動入力ルール"""
    field_id: str
    source_field: str
    transformation: Optional[str] = None
    condition: Optional[str] = None
    priority: int = 1


@dataclass
class FormDefinition:
    """フォーム定義"""
    form_id: str
    name: str
    version: str
    fields: List[FormField]
    auto_fill_rules: List[AutoFillRule] = field(default_factory=list)
    validation_rules: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AutoFillResult:
    """自動入力結果"""
    form_id: str
    filled_fields: Dict[str, Any]
    confidence_scores: Dict[str, float]
    suggestions: Dict[str, List[str]]
    validation_results: Dict[str, bool]
    missing_required: List[str]
    ai_generated_content: Dict[str, str]


class FormAutoFillService:
    """フォーム自動入力サービス"""
    
    def __init__(self):
        self.form_definitions = {}
        self.user_data_cache = {}
        self.ai_service = None  # AI サービスの注入
        
        # 持続化補助金フォーム定義をロード
        self._load_jizokuka_form_definitions()
    
    
    def _load_jizokuka_form_definitions(self):
        """持続化補助金フォーム定義の読み込み"""
        
        # 様式1：申請書フォーム
        form1_fields = [
            FormField("company_name", "事業者名", FormFieldType.TEXT, True, 
                     data_source=DataSource.COMPANY_INFO),
            FormField("representative_name", "代表者氏名", FormFieldType.TEXT, True,
                     data_source=DataSource.USER_PROFILE),
            FormField("postal_code", "郵便番号", FormFieldType.TEXT, True,
                     validation_pattern=r"^\d{3}-\d{4}$",
                     data_source=DataSource.COMPANY_INFO),
            FormField("address", "住所", FormFieldType.ADDRESS, True,
                     data_source=DataSource.COMPANY_INFO),
            FormField("phone", "電話番号", FormFieldType.PHONE, True,
                     validation_pattern=r"^\d{2,4}-\d{2,4}-\d{4}$",
                     data_source=DataSource.COMPANY_INFO),
            FormField("email", "メールアドレス", FormFieldType.EMAIL, True,
                     data_source=DataSource.USER_PROFILE),
            FormField("business_type", "事業形態", FormFieldType.SELECT, True,
                     data_source=DataSource.COMPANY_INFO),
            FormField("establishment_date", "設立年月日", FormFieldType.DATE, True,
                     data_source=DataSource.COMPANY_INFO),
            FormField("capital", "資本金", FormFieldType.CURRENCY, True,
                     data_source=DataSource.COMPANY_INFO),
            FormField("employee_count", "従業員数", FormFieldType.NUMBER, True,
                     data_source=DataSource.COMPANY_INFO),
            FormField("annual_revenue", "年間売上高", FormFieldType.CURRENCY, True,
                     data_source=DataSource.TAX_RECORDS),
            FormField("subsidy_amount", "申請金額", FormFieldType.CURRENCY, True,
                     ai_prompt="事業計画に基づいて適切な補助金申請額を算出してください"),
            FormField("business_overview", "事業概要", FormFieldType.TEXT, True,
                     ai_prompt="会社情報と事業内容から簡潔な事業概要を生成してください",
                     data_source=DataSource.AI_GENERATED),
        ]
        
        # 様式2：経営計画書フォーム
        form2_fields = [
            FormField("current_situation", "現在の事業状況", FormFieldType.TEXT, True,
                     ai_prompt="企業の現状分析と課題を整理してください",
                     data_source=DataSource.AI_GENERATED),
            FormField("market_analysis", "市場分析", FormFieldType.TEXT, True,
                     ai_prompt="業界動向と市場環境の分析を作成してください",
                     data_source=DataSource.AI_GENERATED),
            FormField("competitive_advantage", "競合優位性", FormFieldType.TEXT, True,
                     ai_prompt="自社の強みと差別化要因を明確にしてください",
                     data_source=DataSource.AI_GENERATED),
            FormField("target_market", "ターゲット市場", FormFieldType.TEXT, True,
                     ai_prompt="ターゲット顧客層と市場セグメントを定義してください",
                     data_source=DataSource.AI_GENERATED),
            FormField("sales_strategy", "販売戦略", FormFieldType.TEXT, True,
                     ai_prompt="具体的な販売戦略と施策を立案してください",
                     data_source=DataSource.AI_GENERATED),
        ]
        
        # 様式3：補助事業計画書フォーム
        form3_fields = [
            FormField("project_title", "事業名", FormFieldType.TEXT, True,
                     ai_prompt="事業内容を表現する適切な事業名を提案してください",
                     data_source=DataSource.AI_GENERATED),
            FormField("project_purpose", "事業目的", FormFieldType.TEXT, True,
                     ai_prompt="補助事業の目的と期待効果を明確にしてください",
                     data_source=DataSource.AI_GENERATED),
            FormField("project_content", "事業内容", FormFieldType.TEXT, True,
                     ai_prompt="具体的な事業内容と実施方法を詳述してください",
                     data_source=DataSource.AI_GENERATED),
            FormField("schedule", "実施スケジュール", FormFieldType.TEXT, True,
                     ai_prompt="事業実施の詳細なタイムラインを作成してください",
                     data_source=DataSource.AI_GENERATED),
            FormField("budget_breakdown", "経費内訳", FormFieldType.TEXT, True,
                     ai_prompt="補助対象経費の詳細な内訳を作成してください",
                     data_source=DataSource.AI_GENERATED),
            FormField("expected_effects", "期待される効果", FormFieldType.TEXT, True,
                     ai_prompt="事業実施による具体的な効果と成果指標を設定してください",
                     data_source=DataSource.AI_GENERATED),
        ]
        
        # フォーム定義の登録
        self.form_definitions = {
            "jizokuka_form1": FormDefinition(
                "jizokuka_form1", "持続化補助金申請書（様式1）", "2024.1",
                form1_fields,
                auto_fill_rules=[
                    AutoFillRule("postal_code", "company_address", "extract_postal"),
                    AutoFillRule("address", "company_address", "remove_postal"),
                    AutoFillRule("subsidy_amount", "project_budget", "calculate_subsidy"),
                ]
            ),
            "jizokuka_form2": FormDefinition(
                "jizokuka_form2", "経営計画書（様式2）", "2024.1",
                form2_fields
            ),
            "jizokuka_form3": FormDefinition(
                "jizokuka_form3", "補助事業計画書（様式3）", "2024.1",
                form3_fields
            )
        }
    
    
    async def auto_fill_form(
        self,
        form_id: str,
        user_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> AutoFillResult:
        """フォーム自動入力実行"""
        
        if form_id not in self.form_definitions:
            raise ValueError(f"フォーム定義が見つかりません: {form_id}")
        
        form_def = self.form_definitions[form_id]
        filled_fields = {}
        confidence_scores = {}
        suggestions = {}
        ai_generated_content = {}
        
        logger.info(f"フォーム自動入力開始: {form_id}")
        
        # 各フィールドの自動入力
        for field in form_def.fields:
            try:
                result = await self._fill_single_field(field, user_data, context)
                
                if result["value"] is not None:
                    filled_fields[field.id] = result["value"]
                    confidence_scores[field.id] = result["confidence"]
                    
                    if result.get("suggestions"):
                        suggestions[field.id] = result["suggestions"]
                    
                    if field.data_source == DataSource.AI_GENERATED:
                        ai_generated_content[field.id] = result["value"]
                
            except Exception as e:
                logger.error(f"フィールド入力エラー {field.id}: {e}")
                confidence_scores[field.id] = 0.0
        
        # バリデーション実行
        validation_results = await self._validate_filled_form(form_def, filled_fields)
        
        # 必須フィールドチェック
        missing_required = [
            field.id for field in form_def.fields 
            if field.required and field.id not in filled_fields
        ]
        
        result = AutoFillResult(
            form_id=form_id,
            filled_fields=filled_fields,
            confidence_scores=confidence_scores,
            suggestions=suggestions,
            validation_results=validation_results,
            missing_required=missing_required,
            ai_generated_content=ai_generated_content
        )
        
        logger.info(f"フォーム自動入力完了: {len(filled_fields)}件入力")
        return result
    
    
    async def _fill_single_field(
        self,
        field: FormField,
        user_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """単一フィールドの入力"""
        
        result = {
            "value": None,
            "confidence": 0.0,
            "suggestions": []
        }
        
        # データソース別処理
        if field.data_source == DataSource.USER_PROFILE:
            result = await self._fill_from_user_profile(field, user_data)
            
        elif field.data_source == DataSource.COMPANY_INFO:
            result = await self._fill_from_company_info(field, user_data)
            
        elif field.data_source == DataSource.PREVIOUS_APPLICATION:
            result = await self._fill_from_previous_application(field, user_data)
            
        elif field.data_source == DataSource.TAX_RECORDS:
            result = await self._fill_from_tax_records(field, user_data)
            
        elif field.data_source == DataSource.AI_GENERATED:
            result = await self._fill_with_ai(field, user_data, context)
            
        else:
            # デフォルト値の使用
            if field.default_value:
                result["value"] = field.default_value
                result["confidence"] = 0.5
        
        # フィールドタイプ別フォーマット
        if result["value"]:
            result["value"] = await self._format_field_value(
                result["value"], field.field_type
            )
        
        return result
    
    
    async def _fill_from_user_profile(
        self,
        field: FormField,
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """ユーザープロファイルからの入力"""
        
        mapping = {
            "representative_name": "name",
            "email": "email",
            "phone": "phone"
        }
        
        source_key = mapping.get(field.id)
        if source_key and source_key in user_data:
            return {
                "value": user_data[source_key],
                "confidence": 0.9,
                "suggestions": []
            }
        
        return {"value": None, "confidence": 0.0, "suggestions": []}
    
    
    async def _fill_from_company_info(
        self,
        field: FormField,
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """会社情報からの入力"""
        
        company_info = user_data.get("company_info", {})
        
        mapping = {
            "company_name": "name",
            "postal_code": "postal_code", 
            "address": "address",
            "phone": "phone",
            "business_type": "business_type",
            "establishment_date": "establishment_date",
            "capital": "capital",
            "employee_count": "employee_count"
        }
        
        source_key = mapping.get(field.id)
        if source_key and source_key in company_info:
            return {
                "value": company_info[source_key],
                "confidence": 0.95,
                "suggestions": []
            }
        
        return {"value": None, "confidence": 0.0, "suggestions": []}
    
    
    async def _fill_from_tax_records(
        self,
        field: FormField,
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """税務記録からの入力"""
        
        tax_records = user_data.get("tax_records", {})
        
        if field.id == "annual_revenue" and "annual_revenue" in tax_records:
            return {
                "value": tax_records["annual_revenue"],
                "confidence": 0.9,
                "suggestions": []
            }
        
        return {"value": None, "confidence": 0.0, "suggestions": []}
    
    
    async def _fill_from_previous_application(
        self,
        field: FormField,
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """過去申請からの入力"""
        
        previous_apps = user_data.get("previous_applications", [])
        if not previous_apps:
            return {"value": None, "confidence": 0.0, "suggestions": []}
        
        # 最新の申請データを使用
        latest_app = max(previous_apps, key=lambda x: x.get("date", ""))
        
        if field.id in latest_app:
            return {
                "value": latest_app[field.id],
                "confidence": 0.7,  # 過去データなので信頼度は中程度
                "suggestions": []
            }
        
        return {"value": None, "confidence": 0.0, "suggestions": []}
    
    
    async def _fill_with_ai(
        self,
        field: FormField,
        user_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """AI生成による入力"""
        
        if not field.ai_prompt:
            return {"value": None, "confidence": 0.0, "suggestions": []}
        
        try:
            # AI用のコンテキスト準備
            ai_context = {
                "user_data": user_data,
                "field_info": {
                    "name": field.name,
                    "type": field.field_type.value,
                    "required": field.required
                },
                "context": context or {}
            }
            
            # AI サービスの呼び出し（実装時に注入）
            if self.ai_service:
                ai_response = await self.ai_service.generate_field_content(
                    field.ai_prompt, ai_context
                )
                
                return {
                    "value": ai_response.get("content", ""),
                    "confidence": ai_response.get("confidence", 0.8),
                    "suggestions": ai_response.get("alternatives", [])
                }
            
            # AI サービスが利用できない場合のフォールバック
            return await self._generate_fallback_content(field, user_data)
            
        except Exception as e:
            logger.error(f"AI生成エラー {field.id}: {e}")
            return {"value": None, "confidence": 0.0, "suggestions": []}
    
    
    async def _generate_fallback_content(
        self,
        field: FormField,
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """AI生成のフォールバック処理"""
        
        company_info = user_data.get("company_info", {})
        company_name = company_info.get("name", "当社")
        
        fallback_content = {
            "business_overview": f"{company_name}は、お客様のニーズに応える優れた商品・サービスを提供する企業です。",
            "current_situation": f"{company_name}は現在、持続的な成長と顧客満足度の向上を目指し、事業展開を行っています。",
            "project_title": "販路開拓・事業拡大プロジェクト",
            "project_purpose": "新規顧客の獲得と既存事業の競争力強化を通じて、持続的な成長を実現する。"
        }
        
        content = fallback_content.get(field.id, "")
        
        return {
            "value": content,
            "confidence": 0.6,  # フォールバックなので信頼度は低め
            "suggestions": []
        }
    
    
    async def _format_field_value(
        self,
        value: Any,
        field_type: FormFieldType
    ) -> str:
        """フィールド値のフォーマット"""
        
        if value is None:
            return ""
        
        if field_type == FormFieldType.CURRENCY:
            # 通貨フォーマット
            if isinstance(value, (int, float, Decimal)):
                return f"{value:,}円"
            return str(value)
            
        elif field_type == FormFieldType.DATE:
            # 日付フォーマット
            if isinstance(value, datetime):
                return value.strftime("%Y年%m月%d日")
            elif isinstance(value, date):
                return value.strftime("%Y年%m月%d日")
            return str(value)
            
        elif field_type == FormFieldType.PHONE:
            # 電話番号フォーマット
            phone_clean = re.sub(r'[^\d]', '', str(value))
            if len(phone_clean) == 10:
                return f"{phone_clean[:2]}-{phone_clean[2:6]}-{phone_clean[6:]}"
            elif len(phone_clean) == 11:
                return f"{phone_clean[:3]}-{phone_clean[3:7]}-{phone_clean[7:]}"
            return str(value)
            
        else:
            return str(value)
    
    
    async def _validate_filled_form(
        self,
        form_def: FormDefinition,
        filled_fields: Dict[str, Any]
    ) -> Dict[str, bool]:
        """フォーム入力値のバリデーション"""
        
        validation_results = {}
        
        for field in form_def.fields:
            field_value = filled_fields.get(field.id)
            
            # 必須チェック
            if field.required and not field_value:
                validation_results[field.id] = False
                continue
            
            # パターンマッチング
            if field.validation_pattern and field_value:
                pattern_match = re.match(field.validation_pattern, str(field_value))
                validation_results[field.id] = bool(pattern_match)
            else:
                validation_results[field.id] = True
        
        return validation_results
    
    
    async def get_suggestions_for_field(
        self,
        field_id: str,
        form_id: str,
        user_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """特定フィールドの入力候補取得"""
        
        if form_id not in self.form_definitions:
            return []
        
        form_def = self.form_definitions[form_id]
        field = next((f for f in form_def.fields if f.id == field_id), None)
        
        if not field:
            return []
        
        # フィールドタイプ別の候補生成
        if field.field_type == FormFieldType.SELECT:
            return await self._get_select_options(field, user_data)
        elif field.data_source == DataSource.AI_GENERATED:
            return await self._get_ai_suggestions(field, user_data, context)
        else:
            return []
    
    
    async def _get_select_options(
        self,
        field: FormField,
        user_data: Dict[str, Any]
    ) -> List[str]:
        """選択フィールドのオプション取得"""
        
        options_map = {
            "business_type": ["法人", "個人事業主", "組合", "NPO法人"],
            "subsidy_purpose": ["販路開拓", "生産性向上", "新商品開発", "IT導入"],
            "employee_range": ["5人以下", "6-20人", "21-50人", "51-100人"]
        }
        
        return options_map.get(field.id, [])
    
    
    async def _get_ai_suggestions(
        self,
        field: FormField,
        user_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """AI生成による入力候補"""
        
        # 複数のバリエーション生成
        suggestions = []
        
        if field.id == "project_title":
            company_name = user_data.get("company_info", {}).get("name", "当社")
            suggestions = [
                f"{company_name} 販路開拓プロジェクト",
                f"{company_name} デジタル化推進事業",
                f"{company_name} 新規事業展開計画"
            ]
        
        elif field.id == "business_overview":
            suggestions = [
                "お客様第一主義で高品質な商品・サービスを提供",
                "地域密着型で信頼性の高いサービスを展開",
                "革新的な技術で業界をリードする企業"
            ]
        
        return suggestions
    
    
    def set_ai_service(self, ai_service):
        """AI サービスの設定"""
        self.ai_service = ai_service
    
    
    async def export_filled_form(
        self,
        form_id: str,
        filled_fields: Dict[str, Any],
        format_type: str = "json"
    ) -> Dict[str, Any]:
        """入力済みフォームのエクスポート"""
        
        if form_id not in self.form_definitions:
            raise ValueError(f"フォーム定義が見つかりません: {form_id}")
        
        form_def = self.form_definitions[form_id]
        
        export_data = {
            "form_info": {
                "id": form_def.form_id,
                "name": form_def.name,
                "version": form_def.version,
                "exported_at": datetime.now().isoformat()
            },
            "fields": {},
            "metadata": {
                "total_fields": len(form_def.fields),
                "filled_fields": len(filled_fields),
                "completion_rate": len(filled_fields) / len(form_def.fields)
            }
        }
        
        # フィールド情報の追加
        for field in form_def.fields:
            field_data = {
                "name": field.name,
                "type": field.field_type.value,
                "required": field.required,
                "value": filled_fields.get(field.id),
                "filled": field.id in filled_fields
            }
            export_data["fields"][field.id] = field_data
        
        return export_data