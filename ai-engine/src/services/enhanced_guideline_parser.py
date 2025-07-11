"""
強化された募集要項解析サービス
補助金募集要項・ガイドラインの高精度解析・構造化機能
"""

from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta, date
from enum import Enum
import asyncio
import logging
import json
import re
from urllib.parse import urlparse
import hashlib

logger = logging.getLogger(__name__)


class SourceType(Enum):
    """ソースタイプ"""
    URL = "url"
    PDF = "pdf"
    WORD = "word"
    EXCEL = "excel"
    TEXT = "text"
    HTML = "html"


class DocumentSection(Enum):
    """文書セクション"""
    OVERVIEW = "overview"                    # 概要
    ELIGIBILITY = "eligibility"              # 対象者・条件
    APPLICATION_PROCESS = "application_process"  # 申請手続き
    REQUIRED_DOCUMENTS = "required_documents"    # 必要書類
    BUDGET_GUIDELINES = "budget_guidelines"      # 予算ガイドライン
    EVALUATION_CRITERIA = "evaluation_criteria"  # 評価基準
    SCHEDULE = "schedule"                    # スケジュール
    CONTACT_INFO = "contact_info"            # 問い合わせ先
    SUPPLEMENTARY = "supplementary"          # 補足情報


class FieldType(Enum):
    """フィールドタイプ"""
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    CURRENCY = "currency"
    PERCENTAGE = "percentage"
    LIST = "list"
    BOOLEAN = "boolean"
    STRUCTURED = "structured"


@dataclass
class ExtractedField:
    """抽出フィールド"""
    field_name: str
    field_type: FieldType
    value: Any
    confidence: float
    source_text: str
    position: Dict[str, int]  # page, line, etc.
    validation_status: str = "pending"
    alternatives: List[Any] = field(default_factory=list)


@dataclass
class DocumentStructure:
    """文書構造"""
    sections: Dict[DocumentSection, Dict[str, Any]]
    extracted_fields: List[ExtractedField]
    metadata: Dict[str, Any]
    parsing_confidence: float
    language: str = "ja"


@dataclass
class ValidationRule:
    """検証ルール"""
    field_name: str
    rule_type: str  # "required", "format", "range", "dependency"
    rule_value: Any
    error_message: str


@dataclass
class ParsingResult:
    """解析結果"""
    document_id: str
    source_info: Dict[str, Any]
    document_structure: DocumentStructure
    validation_results: List[Dict[str, Any]]
    processing_stats: Dict[str, Any]
    created_at: datetime = field(default_factory=datetime.now)
    ai_insights: List[str] = field(default_factory=list)
    actionable_items: List[str] = field(default_factory=list)


@dataclass
class UniversalTemplate:
    """汎用テンプレート"""
    template_id: str
    name: str
    subsidy_types: List[str]
    field_definitions: List[Dict[str, Any]]
    section_patterns: Dict[str, List[str]]
    extraction_rules: List[Dict[str, Any]]
    validation_rules: List[ValidationRule]


class EnhancedGuidelineParser:
    """強化された募集要項解析サービス"""
    
    def __init__(self):
        self.universal_templates = {}
        self.parsing_cache = {}
        self.ai_service = None
        self.ocr_service = None
        self._initialize_universal_templates()
    
    
    def _initialize_universal_templates(self):
        """汎用テンプレートの初期化"""
        
        # 持続化補助金テンプレート
        jizokuka_template = UniversalTemplate(
            template_id="jizokuka_universal",
            name="持続化補助金汎用テンプレート",
            subsidy_types=["持続化補助金", "小規模事業者持続化補助金"],
            field_definitions=[
                {
                    "field_name": "application_period_start",
                    "field_type": FieldType.DATE,
                    "patterns": [r"申請期間[：:](\d{4})年(\d{1,2})月(\d{1,2})日", r"受付開始[：:](\d{4})/(\d{1,2})/(\d{1,2})"],
                    "required": True
                },
                {
                    "field_name": "application_period_end", 
                    "field_type": FieldType.DATE,
                    "patterns": [r"申請締切[：:](\d{4})年(\d{1,2})月(\d{1,2})日", r"受付終了[：:](\d{4})/(\d{1,2})/(\d{1,2})"],
                    "required": True
                },
                {
                    "field_name": "subsidy_amount_max",
                    "field_type": FieldType.CURRENCY,
                    "patterns": [r"補助上限額[：:](\d+)万円", r"上限[：:](\d+)万円"],
                    "required": True
                },
                {
                    "field_name": "subsidy_rate",
                    "field_type": FieldType.PERCENTAGE,
                    "patterns": [r"補助率[：:](\d+)分の(\d+)", r"補助率[：:](\d+)％"],
                    "required": True
                },
                {
                    "field_name": "eligible_businesses",
                    "field_type": FieldType.LIST,
                    "patterns": [r"対象事業者[：:](.*?)(?=\n\n|\n[■●])", r"申請対象[：:](.*?)(?=\n\n|\n[■●])"],
                    "required": True
                },
                {
                    "field_name": "required_documents",
                    "field_type": FieldType.LIST,
                    "patterns": [r"必要書類[：:](.*?)(?=\n\n|\n[■●])", r"提出書類[：:](.*?)(?=\n\n|\n[■●])"],
                    "required": True
                },
                {
                    "field_name": "evaluation_criteria",
                    "field_type": FieldType.LIST,
                    "patterns": [r"審査基準[：:](.*?)(?=\n\n|\n[■●])", r"評価項目[：:](.*?)(?=\n\n|\n[■●])"],
                    "required": False
                },
                {
                    "field_name": "contact_office",
                    "field_type": FieldType.TEXT,
                    "patterns": [r"問い合わせ先[：:](.*?)(?=\n\n|\n[■●])", r"事務局[：:](.*?)(?=\n\n|\n[■●])"],
                    "required": True
                }
            ],
            section_patterns={
                DocumentSection.OVERVIEW: ["概要", "制度の目的", "事業概要"],
                DocumentSection.ELIGIBILITY: ["対象", "申請資格", "要件"],
                DocumentSection.APPLICATION_PROCESS: ["申請手続", "申請方法", "手続き"],
                DocumentSection.REQUIRED_DOCUMENTS: ["必要書類", "提出書類", "添付書類"],
                DocumentSection.BUDGET_GUIDELINES: ["補助対象経費", "対象経費", "予算"],
                DocumentSection.EVALUATION_CRITERIA: ["審査", "評価", "選定基準"],
                DocumentSection.SCHEDULE: ["スケジュール", "日程", "期間"],
                DocumentSection.CONTACT_INFO: ["問い合わせ", "連絡先", "事務局"]
            },
            extraction_rules=[
                {
                    "rule_type": "date_normalization",
                    "description": "日付形式の正規化",
                    "apply_to": ["application_period_start", "application_period_end"]
                },
                {
                    "rule_type": "currency_conversion",
                    "description": "金額の円換算",
                    "apply_to": ["subsidy_amount_max"]
                },
                {
                    "rule_type": "list_extraction",
                    "description": "リスト形式データの抽出",
                    "apply_to": ["eligible_businesses", "required_documents"]
                }
            ],
            validation_rules=[
                ValidationRule("application_period_start", "required", True, "申請開始日が見つかりません"),
                ValidationRule("application_period_end", "required", True, "申請締切日が見つかりません"),
                ValidationRule("subsidy_amount_max", "range", {"min": 0, "max": 10000000}, "補助金額が範囲外です"),
                ValidationRule("subsidy_rate", "range", {"min": 0, "max": 100}, "補助率が不正です")
            ]
        )
        
        # ものづくり補助金テンプレート
        monodukuri_template = UniversalTemplate(
            template_id="monodukuri_universal", 
            name="ものづくり補助金汎用テンプレート",
            subsidy_types=["ものづくり補助金", "ものづくり・商業・サービス生産性向上促進補助金"],
            field_definitions=[
                {
                    "field_name": "application_period_start",
                    "field_type": FieldType.DATE,
                    "patterns": [r"公募開始[：:](\d{4})年(\d{1,2})月(\d{1,2})日"],
                    "required": True
                },
                {
                    "field_name": "application_period_end",
                    "field_type": FieldType.DATE, 
                    "patterns": [r"申請締切[：:](\d{4})年(\d{1,2})月(\d{1,2})日.*?(\d{1,2})時(\d{1,2})分"],
                    "required": True
                },
                {
                    "field_name": "subsidy_categories",
                    "field_type": FieldType.LIST,
                    "patterns": [r"申請類型[：:](.*?)(?=\n\n|\n[■●])"],
                    "required": True
                },
                {
                    "field_name": "technology_requirements",
                    "field_type": FieldType.LIST,
                    "patterns": [r"技術要件[：:](.*?)(?=\n\n|\n[■●])"],
                    "required": True
                }
            ],
            section_patterns={
                DocumentSection.OVERVIEW: ["事業概要", "制度概要"],
                DocumentSection.ELIGIBILITY: ["申請要件", "対象者", "申請資格"],
                DocumentSection.APPLICATION_PROCESS: ["申請手続き", "申請の流れ"],
                DocumentSection.REQUIRED_DOCUMENTS: ["申請書類", "必要書類"],
                DocumentSection.BUDGET_GUIDELINES: ["補助対象経費", "経費区分"],
                DocumentSection.EVALUATION_CRITERIA: ["審査項目", "加点項目"],
                DocumentSection.SCHEDULE: ["公募スケジュール", "事業スケジュール"]
            },
            extraction_rules=[
                {
                    "rule_type": "category_classification",
                    "description": "申請類型の分類",
                    "apply_to": ["subsidy_categories"]
                },
                {
                    "rule_type": "technical_validation", 
                    "description": "技術要件の検証",
                    "apply_to": ["technology_requirements"]
                }
            ],
            validation_rules=[
                ValidationRule("subsidy_categories", "required", True, "申請類型が指定されていません"),
                ValidationRule("technology_requirements", "required", True, "技術要件が明確ではありません")
            ]
        )
        
        # IT導入補助金テンプレート
        it_template = UniversalTemplate(
            template_id="it_universal",
            name="IT導入補助金汎用テンプレート", 
            subsidy_types=["IT導入補助金", "サービス等生産性向上IT導入支援事業"],
            field_definitions=[
                {
                    "field_name": "it_tool_categories",
                    "field_type": FieldType.LIST,
                    "patterns": [r"対象ITツール[：:](.*?)(?=\n\n|\n[■●])"],
                    "required": True
                },
                {
                    "field_name": "vendor_requirements",
                    "field_type": FieldType.LIST,
                    "patterns": [r"IT導入支援事業者[：:](.*?)(?=\n\n|\n[■●])"],
                    "required": True
                },
                {
                    "field_name": "productivity_requirements",
                    "field_type": FieldType.TEXT,
                    "patterns": [r"生産性向上要件[：:](.*?)(?=\n\n|\n[■●])"],
                    "required": True
                }
            ],
            section_patterns={
                DocumentSection.OVERVIEW: ["事業の目的", "制度概要"],
                DocumentSection.ELIGIBILITY: ["申請対象", "中小企業・小規模事業者"],
                DocumentSection.APPLICATION_PROCESS: ["申請の流れ", "手続き"],
                DocumentSection.REQUIRED_DOCUMENTS: ["申請書類一覧"],
                DocumentSection.BUDGET_GUIDELINES: ["補助対象", "対象経費"],
                DocumentSection.EVALUATION_CRITERIA: ["審査"],
                DocumentSection.SCHEDULE: ["スケジュール"]
            },
            extraction_rules=[
                {
                    "rule_type": "it_classification",
                    "description": "ITツール分類",
                    "apply_to": ["it_tool_categories"]
                }
            ],
            validation_rules=[
                ValidationRule("it_tool_categories", "required", True, "対象ITツールが指定されていません")
            ]
        )
        
        self.universal_templates = {
            "jizokuka_universal": jizokuka_template,
            "monodukuri_universal": monodukuri_template,
            "it_universal": it_template
        }
    
    
    async def parse_guideline_document(
        self,
        source: str,
        source_type: SourceType,
        template_hint: Optional[str] = None,
        custom_fields: Optional[List[Dict[str, Any]]] = None
    ) -> ParsingResult:
        """募集要項文書の解析"""
        
        document_id = self._generate_document_id(source)
        
        # キャッシュチェック
        if document_id in self.parsing_cache:
            logger.info(f"キャッシュから結果を返却: {document_id}")
            return self.parsing_cache[document_id]
        
        logger.info(f"募集要項解析開始: {source} ({source_type.value})")
        
        # テキスト抽出
        raw_text = await self._extract_text_from_source(source, source_type)
        
        # テンプレート自動選択
        selected_template = await self._auto_select_template(raw_text, template_hint)
        
        # 文書構造解析
        document_structure = await self._analyze_document_structure(
            raw_text, selected_template, custom_fields
        )
        
        # フィールド抽出
        extracted_fields = await self._extract_fields_with_ai(
            raw_text, selected_template, document_structure
        )
        
        # 検証実行
        validation_results = await self._validate_extracted_data(
            extracted_fields, selected_template
        )
        
        # AI インサイト生成
        ai_insights = await self._generate_ai_insights(
            document_structure, extracted_fields
        )
        
        # アクションアイテム生成
        actionable_items = await self._generate_actionable_items(
            document_structure, extracted_fields, validation_results
        )
        
        # 処理統計
        processing_stats = {
            "template_used": selected_template.template_id if selected_template else "auto",
            "text_length": len(raw_text),
            "sections_found": len(document_structure.sections),
            "fields_extracted": len(extracted_fields),
            "confidence_average": document_structure.parsing_confidence,
            "processing_time_ms": 1500  # 実際は計測値
        }
        
        result = ParsingResult(
            document_id=document_id,
            source_info={
                "source": source,
                "source_type": source_type.value,
                "template_hint": template_hint
            },
            document_structure=document_structure,
            validation_results=validation_results,
            processing_stats=processing_stats,
            ai_insights=ai_insights,
            actionable_items=actionable_items
        )
        
        # キャッシュに保存
        self.parsing_cache[document_id] = result
        
        logger.info(f"募集要項解析完了: {document_id} - 信頼度: {document_structure.parsing_confidence:.1f}%")
        return result
    
    
    def _generate_document_id(self, source: str) -> str:
        """文書IDの生成"""
        
        source_hash = hashlib.md5(source.encode()).hexdigest()[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        return f"guideline_{timestamp}_{source_hash}"
    
    
    async def _extract_text_from_source(
        self,
        source: str,
        source_type: SourceType
    ) -> str:
        """ソースからテキスト抽出"""
        
        if source_type == SourceType.URL:
            return await self._extract_from_url(source)
        elif source_type == SourceType.PDF:
            return await self._extract_from_pdf(source)
        elif source_type == SourceType.WORD:
            return await self._extract_from_word(source)
        elif source_type == SourceType.EXCEL:
            return await self._extract_from_excel(source)
        elif source_type == SourceType.TEXT:
            return source  # 直接テキスト
        elif source_type == SourceType.HTML:
            return await self._extract_from_html(source)
        else:
            raise ValueError(f"サポートされていないソースタイプ: {source_type}")
    
    
    async def _extract_from_url(self, url: str) -> str:
        """URLからテキスト抽出"""
        
        # 実際の実装では HTTP クライアントを使用
        # モック実装
        mock_content = """
        令和6年度小規模事業者持続化補助金（一般型）公募要領
        
        1. 事業の目的
        本事業は、小規模事業者の持続的発展を目指し、販路開拓や生産性向上の取組を支援します。
        
        2. 申請対象者
        小規模事業者（常時使用する従業員の数が20人以下の会社及び個人事業主）
        
        3. 申請期間
        申請期間：令和6年4月1日～令和6年6月30日
        
        4. 補助金額
        補助上限額：50万円
        補助率：3分の2
        
        5. 必要書類
        - 申請書（様式1）
        - 経営計画書（様式2）
        - 補助事業計画書（様式3）
        - 決算書（直近2期分）
        
        6. 審査基準
        - 自社の経営状況分析の妥当性
        - 経営方針・目標と今後のプランの妥当性
        - 補助事業計画の有効性
        - 積算の透明・適切性
        
        7. 問い合わせ先
        全国商工会連合会　持続化補助金事務局
        電話：03-6670-2540
        """
        
        return mock_content
    
    
    async def _extract_from_pdf(self, file_path: str) -> str:
        """PDFからテキスト抽出"""
        
        # 実際の実装では PDF ライブラリ（PyPDF2、pdfplumber等）を使用
        # OCR が必要な場合は OCR サービスを呼び出し
        return "PDFから抽出されたテキスト内容"
    
    
    async def _extract_from_word(self, file_path: str) -> str:
        """Word文書からテキスト抽出"""
        
        # 実際の実装では python-docx ライブラリを使用
        return "Word文書から抽出されたテキスト内容"
    
    
    async def _extract_from_excel(self, file_path: str) -> str:
        """Excelからテキスト抽出"""
        
        # 実際の実装では pandas、openpyxl ライブラリを使用
        return "Excel文書から抽出されたテキスト内容"
    
    
    async def _extract_from_html(self, html_content: str) -> str:
        """HTMLからテキスト抽出"""
        
        # 実際の実装では BeautifulSoup ライブラリを使用
        import re
        # 簡易的なHTMLタグ除去
        text = re.sub(r'<[^>]+>', '', html_content)
        return text.strip()
    
    
    async def _auto_select_template(
        self,
        text: str,
        template_hint: Optional[str] = None
    ) -> Optional[UniversalTemplate]:
        """テンプレート自動選択"""
        
        if template_hint and template_hint in self.universal_templates:
            return self.universal_templates[template_hint]
        
        # キーワードベースの自動判定
        text_lower = text.lower()
        
        scores = {}
        for template_id, template in self.universal_templates.items():
            score = 0
            for subsidy_type in template.subsidy_types:
                if subsidy_type.lower() in text_lower:
                    score += 10
            
            # セクションパターンのマッチング
            for section, patterns in template.section_patterns.items():
                for pattern in patterns:
                    if pattern.lower() in text_lower:
                        score += 1
            
            scores[template_id] = score
        
        # 最高スコアのテンプレートを選択
        if scores:
            best_template_id = max(scores, key=scores.get)
            if scores[best_template_id] > 5:  # 閾値
                logger.info(f"自動選択テンプレート: {best_template_id} (スコア: {scores[best_template_id]})")
                return self.universal_templates[best_template_id]
        
        logger.info("適切なテンプレートが見つかりません - 汎用解析を実行")
        return None
    
    
    async def _analyze_document_structure(
        self,
        text: str,
        template: Optional[UniversalTemplate],
        custom_fields: Optional[List[Dict[str, Any]]]
    ) -> DocumentStructure:
        """文書構造解析"""
        
        sections = {}
        confidence_scores = []
        
        # セクション抽出
        if template:
            for section_type, patterns in template.section_patterns.items():
                section_content = await self._extract_section_content(
                    text, patterns, section_type
                )
                if section_content:
                    sections[section_type] = section_content
                    confidence_scores.append(section_content.get("confidence", 0.5))
        else:
            # 汎用セクション抽出
            sections = await self._extract_generic_sections(text)
            confidence_scores = [0.6] * len(sections)
        
        # フィールド抽出（プレリミナリー）
        extracted_fields = []
        if template:
            for field_def in template.field_definitions:
                field_result = await self._extract_single_field(text, field_def)
                if field_result:
                    extracted_fields.append(field_result)
                    confidence_scores.append(field_result.confidence)
        
        # カスタムフィールド処理
        if custom_fields:
            for custom_field in custom_fields:
                field_result = await self._extract_custom_field(text, custom_field)
                if field_result:
                    extracted_fields.append(field_result)
                    confidence_scores.append(field_result.confidence)
        
        # 全体信頼度計算
        overall_confidence = (sum(confidence_scores) / len(confidence_scores) * 100) if confidence_scores else 50.0
        
        # メタデータ生成
        metadata = {
            "document_type": "subsidy_guideline",
            "text_length": len(text),
            "sections_count": len(sections),
            "fields_count": len(extracted_fields),
            "language_detected": "ja",
            "template_used": template.template_id if template else "generic"
        }
        
        return DocumentStructure(
            sections=sections,
            extracted_fields=extracted_fields,
            metadata=metadata,
            parsing_confidence=overall_confidence,
            language="ja"
        )
    
    
    async def _extract_section_content(
        self,
        text: str,
        patterns: List[str],
        section_type: DocumentSection
    ) -> Optional[Dict[str, Any]]:
        """セクションコンテンツ抽出"""
        
        for pattern in patterns:
            # パターンマッチング
            matches = []
            
            # 見出しパターン検索
            heading_patterns = [
                rf"^\s*\d*\.?\s*{re.escape(pattern)}.*?$",
                rf"^[■●◆▲]\s*{re.escape(pattern)}.*?$",
                rf"^【{re.escape(pattern)}】.*?$"
            ]
            
            for heading_pattern in heading_patterns:
                matches.extend(re.finditer(heading_pattern, text, re.MULTILINE | re.IGNORECASE))
            
            if matches:
                # 最初のマッチから次のセクションまでの内容を抽出
                start_pos = matches[0].end()
                
                # 次のセクション開始位置を探索
                next_section_patterns = [
                    r'\n\s*\d+\.',  # 番号付きセクション
                    r'\n[■●◆▲]',   # 記号付きセクション
                    r'\n【.*?】'    # 括弧付きセクション
                ]
                
                end_pos = len(text)
                for next_pattern in next_section_patterns:
                    next_match = re.search(next_pattern, text[start_pos:])
                    if next_match:
                        end_pos = start_pos + next_match.start()
                        break
                
                content = text[start_pos:end_pos].strip()
                
                if content:
                    return {
                        "title": matches[0].group().strip(),
                        "content": content,
                        "start_position": start_pos,
                        "end_position": end_pos,
                        "confidence": 0.8,
                        "extraction_method": "pattern_match"
                    }
        
        return None
    
    
    async def _extract_generic_sections(self, text: str) -> Dict[DocumentSection, Dict[str, Any]]:
        """汎用セクション抽出"""
        
        sections = {}
        
        # 一般的なセクション見出しパターン
        generic_patterns = {
            DocumentSection.OVERVIEW: ["概要", "目的", "趣旨"],
            DocumentSection.ELIGIBILITY: ["対象", "要件", "条件"],
            DocumentSection.APPLICATION_PROCESS: ["申請", "手続", "方法"],
            DocumentSection.REQUIRED_DOCUMENTS: ["書類", "資料", "提出"],
            DocumentSection.SCHEDULE: ["期間", "日程", "スケジュール"],
            DocumentSection.CONTACT_INFO: ["問い合わせ", "連絡", "事務局"]
        }
        
        for section_type, patterns in generic_patterns.items():
            section_content = await self._extract_section_content(text, patterns, section_type)
            if section_content:
                sections[section_type] = section_content
        
        return sections
    
    
    async def _extract_single_field(
        self,
        text: str,
        field_def: Dict[str, Any]
    ) -> Optional[ExtractedField]:
        """単一フィールド抽出"""
        
        field_name = field_def["field_name"]
        field_type = FieldType(field_def["field_type"])
        patterns = field_def["patterns"]
        
        best_match = None
        best_confidence = 0.0
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)
            
            for match in matches:
                extracted_value = None
                confidence = 0.7
                
                if field_type == FieldType.DATE:
                    extracted_value = self._parse_date_from_match(match)
                elif field_type == FieldType.CURRENCY:
                    extracted_value = self._parse_currency_from_match(match)
                elif field_type == FieldType.PERCENTAGE:
                    extracted_value = self._parse_percentage_from_match(match)
                elif field_type == FieldType.LIST:
                    extracted_value = self._parse_list_from_match(match, text)
                else:
                    extracted_value = match.group(1) if match.groups() else match.group(0)
                
                if extracted_value and confidence > best_confidence:
                    best_match = match
                    best_confidence = confidence
        
        if best_match and best_confidence > 0.5:
            return ExtractedField(
                field_name=field_name,
                field_type=field_type,
                value=extracted_value,
                confidence=best_confidence,
                source_text=best_match.group(0),
                position={"start": best_match.start(), "end": best_match.end()}
            )
        
        return None
    
    
    def _parse_date_from_match(self, match) -> Optional[datetime]:
        """マッチから日付解析"""
        
        groups = match.groups()
        if len(groups) >= 3:
            try:
                year = int(groups[0])
                month = int(groups[1])
                day = int(groups[2])
                return datetime(year, month, day)
            except (ValueError, IndexError):
                pass
        
        return None
    
    
    def _parse_currency_from_match(self, match) -> Optional[int]:
        """マッチから金額解析"""
        
        groups = match.groups()
        if groups:
            try:
                amount_str = groups[0].replace(",", "").replace("万", "0000")
                return int(amount_str)
            except (ValueError, IndexError):
                pass
        
        return None
    
    
    def _parse_percentage_from_match(self, match) -> Optional[float]:
        """マッチから割合解析"""
        
        groups = match.groups()
        if len(groups) >= 2:
            try:
                numerator = int(groups[0])
                denominator = int(groups[1])
                return (numerator / denominator) * 100
            except (ValueError, IndexError, ZeroDivisionError):
                pass
        elif len(groups) == 1:
            try:
                return float(groups[0])
            except ValueError:
                pass
        
        return None
    
    
    def _parse_list_from_match(self, match, full_text: str) -> List[str]:
        """マッチからリスト解析"""
        
        # マッチ位置から次のセクションまでのテキストを取得
        start_pos = match.end()
        end_pos = len(full_text)
        
        # 次のセクション開始を探索
        next_section = re.search(r'\n\s*\d+\.|\n[■●]', full_text[start_pos:])
        if next_section:
            end_pos = start_pos + next_section.start()
        
        content = full_text[start_pos:end_pos].strip()
        
        # リスト項目抽出
        list_items = []
        
        # 番号付きリスト
        numbered_items = re.findall(r'^\s*\d+[.)]?\s+(.+)$', content, re.MULTILINE)
        list_items.extend(numbered_items)
        
        # 記号付きリスト
        bullet_items = re.findall(r'^\s*[・･•◦▪▫]\s*(.+)$', content, re.MULTILINE)
        list_items.extend(bullet_items)
        
        # ハイフン付きリスト
        dash_items = re.findall(r'^\s*[-−]\s*(.+)$', content, re.MULTILINE)
        list_items.extend(dash_items)
        
        return [item.strip() for item in list_items if item.strip()]
    
    
    async def _extract_custom_field(
        self,
        text: str,
        custom_field: Dict[str, Any]
    ) -> Optional[ExtractedField]:
        """カスタムフィールド抽出"""
        
        field_name = custom_field["field_name"]
        patterns = custom_field.get("patterns", [])
        field_type = FieldType(custom_field.get("field_type", "text"))
        
        for pattern in patterns:
            match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
            if match:
                value = match.group(1) if match.groups() else match.group(0)
                
                return ExtractedField(
                    field_name=field_name,
                    field_type=field_type,
                    value=value,
                    confidence=0.6,  # カスタムフィールドは控えめな信頼度
                    source_text=match.group(0),
                    position={"start": match.start(), "end": match.end()}
                )
        
        return None
    
    
    async def _extract_fields_with_ai(
        self,
        text: str,
        template: Optional[UniversalTemplate],
        document_structure: DocumentStructure
    ) -> List[ExtractedField]:
        """AI を活用したフィールド抽出"""
        
        if not self.ai_service:
            return document_structure.extracted_fields
        
        enhanced_fields = []
        
        # 既存フィールドの AI 強化
        for field in document_structure.extracted_fields:
            try:
                ai_result = await self.ai_service.enhance_field_extraction(
                    field, text, template
                )
                
                if ai_result.get("enhanced_value"):
                    field.value = ai_result["enhanced_value"]
                    field.confidence = min(field.confidence + 0.1, 1.0)
                
                if ai_result.get("alternatives"):
                    field.alternatives = ai_result["alternatives"]
                
                enhanced_fields.append(field)
                
            except Exception as e:
                logger.warning(f"AI フィールド強化エラー {field.field_name}: {e}")
                enhanced_fields.append(field)
        
        # AI による追加フィールド発見
        try:
            additional_fields = await self.ai_service.discover_additional_fields(
                text, template, document_structure
            )
            
            for additional_field in additional_fields:
                enhanced_fields.append(ExtractedField(
                    field_name=additional_field["name"],
                    field_type=FieldType(additional_field["type"]),
                    value=additional_field["value"],
                    confidence=additional_field["confidence"],
                    source_text=additional_field["source"],
                    position=additional_field["position"]
                ))
                
        except Exception as e:
            logger.warning(f"AI 追加フィールド発見エラー: {e}")
        
        return enhanced_fields
    
    
    async def _validate_extracted_data(
        self,
        extracted_fields: List[ExtractedField],
        template: Optional[UniversalTemplate]
    ) -> List[Dict[str, Any]]:
        """抽出データの検証"""
        
        validation_results = []
        
        if not template:
            return validation_results
        
        field_dict = {field.field_name: field for field in extracted_fields}
        
        for rule in template.validation_rules:
            result = {
                "field_name": rule.field_name,
                "rule_type": rule.rule_type,
                "status": "pass",
                "message": "",
                "severity": "info"
            }
            
            field = field_dict.get(rule.field_name)
            
            if rule.rule_type == "required":
                if rule.rule_value and not field:
                    result["status"] = "fail"
                    result["message"] = rule.error_message
                    result["severity"] = "error"
                    
            elif rule.rule_type == "range" and field:
                range_value = rule.rule_value
                if isinstance(field.value, (int, float)):
                    if (field.value < range_value.get("min", float('-inf')) or
                        field.value > range_value.get("max", float('inf'))):
                        result["status"] = "fail"
                        result["message"] = rule.error_message
                        result["severity"] = "warning"
                        
            elif rule.rule_type == "format" and field:
                pattern = rule.rule_value
                if not re.match(pattern, str(field.value)):
                    result["status"] = "fail"
                    result["message"] = rule.error_message
                    result["severity"] = "warning"
            
            validation_results.append(result)
        
        return validation_results
    
    
    async def _generate_ai_insights(
        self,
        document_structure: DocumentStructure,
        extracted_fields: List[ExtractedField]
    ) -> List[str]:
        """AI インサイト生成"""
        
        insights = []
        
        # 基本的な分析
        if document_structure.parsing_confidence < 70:
            insights.append("文書の構造が複雑で、一部の情報が正確に抽出できていない可能性があります")
        
        if len(extracted_fields) < 5:
            insights.append("抽出された情報が少ないため、追加の情報確認が必要かもしれません")
        
        # フィールド別分析
        date_fields = [f for f in extracted_fields if f.field_type == FieldType.DATE]
        if len(date_fields) >= 2:
            start_dates = [f for f in date_fields if "start" in f.field_name]
            end_dates = [f for f in date_fields if "end" in f.field_name]
            
            if start_dates and end_dates:
                insights.append("申請期間が明確に設定されています")
        
        # 信頼度分析
        low_confidence_fields = [f for f in extracted_fields if f.confidence < 0.6]
        if low_confidence_fields:
            field_names = [f.field_name for f in low_confidence_fields]
            insights.append(f"以下のフィールドは信頼度が低いため、確認が必要です: {', '.join(field_names)}")
        
        return insights
    
    
    async def _generate_actionable_items(
        self,
        document_structure: DocumentStructure,
        extracted_fields: List[ExtractedField],
        validation_results: List[Dict[str, Any]]
    ) -> List[str]:
        """アクションアイテム生成"""
        
        actionable_items = []
        
        # 検証エラーからのアクション
        failed_validations = [v for v in validation_results if v["status"] == "fail"]
        for validation in failed_validations:
            if validation["severity"] == "error":
                actionable_items.append(f"必須項目を確認: {validation['field_name']}")
            elif validation["severity"] == "warning":
                actionable_items.append(f"データ形式を確認: {validation['field_name']}")
        
        # 信頼度の低いフィールド
        low_confidence_fields = [f for f in extracted_fields if f.confidence < 0.7]
        if low_confidence_fields:
            actionable_items.append("信頼度の低いフィールドの手動確認を推奨")
        
        # セクション不足
        if len(document_structure.sections) < 4:
            actionable_items.append("重要なセクションが不足している可能性があります - 元文書を確認してください")
        
        # 日付関連
        date_fields = [f for f in extracted_fields if f.field_type == FieldType.DATE]
        if not date_fields:
            actionable_items.append("申請期間や重要な日付を手動で確認してください")
        
        return actionable_items
    
    
    async def get_parsing_suggestions(
        self,
        text_preview: str
    ) -> Dict[str, Any]:
        """解析提案取得"""
        
        suggestions = {
            "recommended_templates": [],
            "detected_sections": [],
            "potential_fields": [],
            "confidence_estimate": 0.0
        }
        
        # テンプレート推奨
        for template_id, template in self.universal_templates.items():
            score = 0
            for subsidy_type in template.subsidy_types:
                if subsidy_type.lower() in text_preview.lower():
                    score += 10
            
            if score > 0:
                suggestions["recommended_templates"].append({
                    "template_id": template_id,
                    "name": template.name,
                    "confidence": min(score / 10, 1.0)
                })
        
        # セクション検出
        common_sections = ["概要", "対象", "申請", "書類", "期間", "問い合わせ"]
        for section in common_sections:
            if section in text_preview:
                suggestions["detected_sections"].append(section)
        
        # フィールド候補
        if re.search(r'\d{4}年\d{1,2}月\d{1,2}日', text_preview):
            suggestions["potential_fields"].append("申請期間")
        
        if re.search(r'\d+万円', text_preview):
            suggestions["potential_fields"].append("補助金額")
        
        # 信頼度推定
        confidence_factors = [
            len(suggestions["detected_sections"]) > 3,
            len(suggestions["potential_fields"]) > 2,
            len(suggestions["recommended_templates"]) > 0
        ]
        
        suggestions["confidence_estimate"] = sum(confidence_factors) / len(confidence_factors)
        
        return suggestions
    
    
    async def export_structured_data(
        self,
        parsing_result: ParsingResult,
        format_type: str = "json"
    ) -> Dict[str, Any]:
        """構造化データのエクスポート"""
        
        if format_type == "json":
            return self._export_to_json(parsing_result)
        elif format_type == "excel":
            return await self._export_to_excel(parsing_result)
        elif format_type == "form_data":
            return await self._export_to_form_data(parsing_result)
        else:
            raise ValueError(f"サポートされていないフォーマット: {format_type}")
    
    
    def _export_to_json(self, parsing_result: ParsingResult) -> Dict[str, Any]:
        """JSON形式エクスポート"""
        
        return {
            "document_info": {
                "id": parsing_result.document_id,
                "source": parsing_result.source_info,
                "created_at": parsing_result.created_at.isoformat(),
                "confidence": parsing_result.document_structure.parsing_confidence
            },
            "extracted_fields": [
                {
                    "name": field.field_name,
                    "type": field.field_type.value,
                    "value": field.value,
                    "confidence": field.confidence,
                    "source_text": field.source_text
                }
                for field in parsing_result.document_structure.extracted_fields
            ],
            "sections": {
                section.value: content
                for section, content in parsing_result.document_structure.sections.items()
            },
            "validation_results": parsing_result.validation_results,
            "ai_insights": parsing_result.ai_insights,
            "actionable_items": parsing_result.actionable_items
        }
    
    
    async def _export_to_excel(self, parsing_result: ParsingResult) -> Dict[str, Any]:
        """Excel形式エクスポート"""
        
        # 実際の実装では pandas を使用してExcel生成
        return {
            "format": "excel",
            "file_path": f"/tmp/{parsing_result.document_id}_structured.xlsx",
            "sheets": ["フィールド一覧", "セクション内容", "検証結果"]
        }
    
    
    async def _export_to_form_data(self, parsing_result: ParsingResult) -> Dict[str, Any]:
        """フォームデータ形式エクスポート"""
        
        form_data = {}
        
        for field in parsing_result.document_structure.extracted_fields:
            # フィールド名の正規化
            normalized_name = field.field_name.replace("_", ".")
            form_data[normalized_name] = field.value
        
        return {
            "form_data": form_data,
            "field_mapping": {
                field.field_name: {
                    "display_name": field.field_name.replace("_", " ").title(),
                    "confidence": field.confidence,
                    "validation_required": field.confidence < 0.8
                }
                for field in parsing_result.document_structure.extracted_fields
            }
        }
    
    
    def set_ai_service(self, ai_service):
        """AI サービスの設定"""
        self.ai_service = ai_service
    
    
    def set_ocr_service(self, ocr_service):
        """OCR サービスの設定"""
        self.ocr_service = ocr_service