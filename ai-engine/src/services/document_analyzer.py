"""
高度文書解析システム
多言語対応、リアルタイム処理、品質スコアリング機能付き
"""

from typing import Dict, List, Optional, Tuple, Any, Union
import re
import json
import asyncio
from dataclasses import dataclass, asdict
from datetime import datetime
import logging
from collections import Counter, defaultdict
import statistics

# NLP ライブラリ
try:
    import spacy
    from transformers import pipeline, AutoTokenizer, AutoModel
    from sentence_transformers import SentenceTransformer
    import torch
    NLP_AVAILABLE = True
except ImportError:
    NLP_AVAILABLE = False
    logging.warning("NLP ライブラリが利用できません。基本機能のみ使用します。")

logger = logging.getLogger(__name__)


@dataclass
class DocumentSummary:
    """文書要約結果"""
    summary: str
    key_points: List[str]
    summary_ratio: float  # 要約率
    confidence_score: float


@dataclass
class SentimentAnalysis:
    """感情・トーン分析結果"""
    overall_sentiment: str  # positive, negative, neutral
    confidence: float
    emotional_tone: str     # formal, casual, persuasive, etc.
    sentiment_scores: Dict[str, float]


@dataclass
class EntityExtraction:
    """固有表現抽出結果"""
    organizations: List[str]
    persons: List[str]
    locations: List[str]
    dates: List[str]
    monetary_values: List[str]
    technologies: List[str]
    custom_entities: Dict[str, List[str]]


@dataclass
class KeywordAnalysis:
    """キーワード・フレーズ分析"""
    keywords: List[Tuple[str, float]]        # (キーワード, スコア)
    key_phrases: List[Tuple[str, float]]     # (フレーズ, スコア)
    topic_distribution: Dict[str, float]     # トピック分布
    domain_keywords: List[str]               # ドメイン特化キーワード


@dataclass
class SimilaritySearch:
    """類似文書検索結果"""
    similar_documents: List[Dict[str, Any]]
    similarity_scores: List[float]
    search_method: str
    total_candidates: int


@dataclass
class QualityMetrics:
    """文書品質メトリクス"""
    readability_score: float        # 読みやすさ
    completeness_score: float       # 完全性
    coherence_score: float          # 一貫性
    clarity_score: float            # 明瞭性
    professional_score: float       # 専門性
    overall_quality: float          # 総合品質


@dataclass
class DocumentAnalysisResult:
    """包括的文書解析結果"""
    document_id: str
    summary: DocumentSummary
    sentiment: SentimentAnalysis
    entities: EntityExtraction
    keywords: KeywordAnalysis
    similar_documents: SimilaritySearch
    quality_metrics: QualityMetrics
    metadata: Dict[str, Any]
    processing_time: float
    timestamp: datetime


class DocumentAnalyzer:
    """高度文書解析システム"""
    
    def __init__(self):
        """初期化"""
        self.nlp_models = self._initialize_nlp_models()
        self.similarity_model = self._initialize_similarity_model()
        self.document_cache = {}  # 類似性計算用キャッシュ
        self.analysis_cache = {}  # 解析結果キャッシュ
        
        # ドメイン特化辞書
        self.domain_keywords = self._load_domain_keywords()
        self.technical_terms = self._load_technical_terms()
        
        # 感情分析器
        self.sentiment_analyzer = self._initialize_sentiment_analyzer()
        
        # 要約器
        self.summarizer = self._initialize_summarizer()

    async def analyze_document(
        self,
        document_text: str,
        analysis_options: Optional[Dict[str, bool]] = None,
        language: str = "ja"
    ) -> DocumentAnalysisResult:
        """
        包括的文書解析
        
        Args:
            document_text: 解析対象文書
            analysis_options: 解析オプション
            language: 言語コード
            
        Returns:
            DocumentAnalysisResult: 解析結果
        """
        start_time = asyncio.get_event_loop().time()
        document_id = f"doc_{hash(document_text[:100])}_{int(start_time)}"
        
        try:
            # デフォルトオプション
            if analysis_options is None:
                analysis_options = {
                    'summary': True,
                    'sentiment': True,
                    'entities': True,
                    'keywords': True,
                    'similarity': True,
                    'quality': True
                }
            
            logger.info(f"文書解析開始: {document_id}")
            
            # 並列解析実行
            tasks = []
            
            if analysis_options.get('summary', True):
                tasks.append(self._analyze_summary(document_text, language))
            else:
                tasks.append(self._empty_summary())
            
            if analysis_options.get('sentiment', True):
                tasks.append(self._analyze_sentiment(document_text, language))
            else:
                tasks.append(self._empty_sentiment())
            
            if analysis_options.get('entities', True):
                tasks.append(self._extract_entities(document_text, language))
            else:
                tasks.append(self._empty_entities())
            
            if analysis_options.get('keywords', True):
                tasks.append(self._analyze_keywords(document_text, language))
            else:
                tasks.append(self._empty_keywords())
            
            if analysis_options.get('similarity', True):
                tasks.append(self._find_similar_documents(document_text))
            else:
                tasks.append(self._empty_similarity())
            
            if analysis_options.get('quality', True):
                tasks.append(self._evaluate_quality(document_text, language))
            else:
                tasks.append(self._empty_quality())
            
            # 並列実行
            results = await asyncio.gather(*tasks)
            
            summary, sentiment, entities, keywords, similar_docs, quality = results
            
            # メタデータ作成
            metadata = {
                'document_length': len(document_text),
                'word_count': len(document_text.split()),
                'language': language,
                'analysis_options': analysis_options,
                'nlp_models_used': list(self.nlp_models.keys()),
                'processing_components': len([k for k, v in analysis_options.items() if v])
            }
            
            processing_time = asyncio.get_event_loop().time() - start_time
            
            result = DocumentAnalysisResult(
                document_id=document_id,
                summary=summary,
                sentiment=sentiment,
                entities=entities,
                keywords=keywords,
                similar_documents=similar_docs,
                quality_metrics=quality,
                metadata=metadata,
                processing_time=processing_time,
                timestamp=datetime.now()
            )
            
            # 結果をキャッシュ
            self.analysis_cache[document_id] = result
            
            logger.info(f"文書解析完了: {document_id} ({processing_time:.3f}秒)")
            return result
            
        except Exception as e:
            logger.error(f"文書解析エラー: {str(e)}")
            return await self._fallback_analysis(document_text, document_id, start_time)

    async def analyze_batch_documents(
        self,
        documents: List[Dict[str, str]],
        analysis_options: Optional[Dict[str, bool]] = None
    ) -> List[DocumentAnalysisResult]:
        """
        バッチ文書解析
        
        Args:
            documents: 文書リスト [{'id': str, 'text': str, 'language': str}]
            analysis_options: 解析オプション
            
        Returns:
            List[DocumentAnalysisResult]: 解析結果リスト
        """
        try:
            logger.info(f"バッチ解析開始: {len(documents)}文書")
            
            # 並列解析タスク作成
            tasks = []
            for doc in documents:
                task = self.analyze_document(
                    doc['text'],
                    analysis_options,
                    doc.get('language', 'ja')
                )
                tasks.append(task)
            
            # バッチ実行
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # エラーハンドリング
            valid_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"文書{i}の解析エラー: {str(result)}")
                    # フォールバック結果を追加
                    fallback = await self._fallback_analysis(
                        documents[i]['text'], 
                        f"batch_doc_{i}", 
                        0
                    )
                    valid_results.append(fallback)
                else:
                    valid_results.append(result)
            
            logger.info(f"バッチ解析完了: {len(valid_results)}文書")
            return valid_results
            
        except Exception as e:
            logger.error(f"バッチ解析エラー: {str(e)}")
            return []

    async def compare_documents(
        self,
        document1: str,
        document2: str,
        comparison_type: str = "semantic"
    ) -> Dict[str, Any]:
        """
        文書比較
        
        Args:
            document1: 文書1
            document2: 文書2
            comparison_type: 比較タイプ (semantic, structural, lexical)
            
        Returns:
            Dict: 比較結果
        """
        try:
            if comparison_type == "semantic":
                return await self._semantic_comparison(document1, document2)
            elif comparison_type == "structural":
                return await self._structural_comparison(document1, document2)
            elif comparison_type == "lexical":
                return await self._lexical_comparison(document1, document2)
            else:
                return await self._comprehensive_comparison(document1, document2)
                
        except Exception as e:
            logger.error(f"文書比較エラー: {str(e)}")
            return {"error": str(e)}

    async def _analyze_summary(self, text: str, language: str) -> DocumentSummary:
        """要約分析"""
        try:
            if self.summarizer and len(text) > 100:
                # 長文の場合は分割して要約
                chunks = self._split_text_into_chunks(text, max_length=1000)
                summaries = []
                
                for chunk in chunks:
                    summary_result = self.summarizer(
                        chunk, 
                        max_length=150, 
                        min_length=50, 
                        do_sample=False
                    )
                    summaries.append(summary_result[0]['summary_text'])
                
                # チャンク要約を統合
                final_summary = ' '.join(summaries)
                if len(final_summary) > 500:
                    # 最終要約
                    final_summary_result = self.summarizer(
                        final_summary,
                        max_length=200,
                        min_length=100,
                        do_sample=False
                    )
                    final_summary = final_summary_result[0]['summary_text']
            else:
                # 短文の場合は文を抽出して要約
                sentences = self._extract_key_sentences(text, num_sentences=3)
                final_summary = ' '.join(sentences)
            
            # キーポイント抽出
            key_points = self._extract_key_points(text)
            
            # 要約率計算
            summary_ratio = len(final_summary) / len(text) if text else 0
            
            # 信頼度計算
            confidence = self._calculate_summary_confidence(text, final_summary)
            
            return DocumentSummary(
                summary=final_summary,
                key_points=key_points,
                summary_ratio=summary_ratio,
                confidence_score=confidence
            )
            
        except Exception as e:
            logger.error(f"要約分析エラー: {str(e)}")
            return self._fallback_summary(text)

    async def _analyze_sentiment(self, text: str, language: str) -> SentimentAnalysis:
        """感情・トーン分析"""
        try:
            if self.sentiment_analyzer:
                # 感情分析実行
                sentiment_result = self.sentiment_analyzer(text[:512])  # トークン制限
                
                overall_sentiment = sentiment_result[0]['label'].lower()
                confidence = sentiment_result[0]['score']
                
                # より詳細な感情スコア
                sentiment_scores = {
                    'positive': confidence if overall_sentiment == 'positive' else 0.0,
                    'negative': confidence if overall_sentiment == 'negative' else 0.0,
                    'neutral': confidence if overall_sentiment == 'neutral' else 0.0
                }
            else:
                # フォールバック感情分析
                overall_sentiment, confidence, sentiment_scores = self._fallback_sentiment_analysis(text)
            
            # トーン分析
            emotional_tone = self._analyze_emotional_tone(text)
            
            return SentimentAnalysis(
                overall_sentiment=overall_sentiment,
                confidence=confidence,
                emotional_tone=emotional_tone,
                sentiment_scores=sentiment_scores
            )
            
        except Exception as e:
            logger.error(f"感情分析エラー: {str(e)}")
            return self._fallback_sentiment()

    async def _extract_entities(self, text: str, language: str) -> EntityExtraction:
        """固有表現抽出"""
        try:
            entities = EntityExtraction(
                organizations=[],
                persons=[],
                locations=[],
                dates=[],
                monetary_values=[],
                technologies=[],
                custom_entities={}
            )
            
            if language == 'ja' and 'ja_core_news_lg' in self.nlp_models:
                # spacyによる日本語固有表現抽出
                nlp = self.nlp_models['ja_core_news_lg']
                doc = nlp(text)
                
                for ent in doc.ents:
                    if ent.label_ == 'ORG':
                        entities.organizations.append(ent.text)
                    elif ent.label_ == 'PERSON':
                        entities.persons.append(ent.text)
                    elif ent.label_ == 'GPE':  # 地名
                        entities.locations.append(ent.text)
                    elif ent.label_ == 'DATE':
                        entities.dates.append(ent.text)
                    elif ent.label_ == 'MONEY':
                        entities.monetary_values.append(ent.text)
            
            # 正規表現による追加抽出
            entities.monetary_values.extend(self._extract_monetary_values(text))
            entities.dates.extend(self._extract_dates(text))
            entities.technologies.extend(self._extract_technologies(text))
            
            # カスタムエンティティ
            entities.custom_entities = self._extract_custom_entities(text)
            
            # 重複除去
            entities.organizations = list(set(entities.organizations))
            entities.persons = list(set(entities.persons))
            entities.locations = list(set(entities.locations))
            entities.dates = list(set(entities.dates))
            entities.monetary_values = list(set(entities.monetary_values))
            entities.technologies = list(set(entities.technologies))
            
            return entities
            
        except Exception as e:
            logger.error(f"固有表現抽出エラー: {str(e)}")
            return self._fallback_entities(text)

    async def _analyze_keywords(self, text: str, language: str) -> KeywordAnalysis:
        """キーワード・フレーズ分析"""
        try:
            # 基本キーワード抽出
            keywords = self._extract_keywords_tfidf(text)
            
            # フレーズ抽出
            key_phrases = self._extract_key_phrases(text)
            
            # トピック分布（簡易版）
            topic_distribution = self._analyze_topic_distribution(text)
            
            # ドメイン特化キーワード
            domain_keywords = self._identify_domain_keywords(text)
            
            return KeywordAnalysis(
                keywords=keywords,
                key_phrases=key_phrases,
                topic_distribution=topic_distribution,
                domain_keywords=domain_keywords
            )
            
        except Exception as e:
            logger.error(f"キーワード分析エラー: {str(e)}")
            return self._fallback_keywords()

    async def _find_similar_documents(self, text: str) -> SimilaritySearch:
        """類似文書検索"""
        try:
            if self.similarity_model:
                # 文書ベクトル化
                text_embedding = self.similarity_model.encode([text])[0]
                
                # キャッシュ内文書との類似度計算
                similar_docs = []
                similarity_scores = []
                
                for doc_id, cached_result in self.analysis_cache.items():
                    if hasattr(cached_result, 'text_embedding'):
                        similarity = self._calculate_cosine_similarity(
                            text_embedding, 
                            cached_result.text_embedding
                        )
                        if similarity > 0.3:  # 閾値
                            similar_docs.append({
                                'document_id': doc_id,
                                'summary': cached_result.summary.summary[:200],
                                'similarity': similarity
                            })
                            similarity_scores.append(similarity)
                
                # 類似度順にソート
                sorted_results = sorted(
                    zip(similar_docs, similarity_scores),
                    key=lambda x: x[1],
                    reverse=True
                )[:5]
                
                if sorted_results:
                    similar_docs, similarity_scores = zip(*sorted_results)
                else:
                    similar_docs, similarity_scores = [], []
            else:
                # フォールバック類似性検索
                similar_docs, similarity_scores = self._fallback_similarity_search(text)
            
            return SimilaritySearch(
                similar_documents=list(similar_docs),
                similarity_scores=list(similarity_scores),
                search_method="semantic_embedding" if self.similarity_model else "lexical",
                total_candidates=len(self.analysis_cache)
            )
            
        except Exception as e:
            logger.error(f"類似文書検索エラー: {str(e)}")
            return self._fallback_similarity()

    async def _evaluate_quality(self, text: str, language: str) -> QualityMetrics:
        """品質評価"""
        try:
            # 読みやすさ評価
            readability = self._calculate_readability(text)
            
            # 完全性評価
            completeness = self._evaluate_completeness(text)
            
            # 一貫性評価
            coherence = self._evaluate_coherence(text)
            
            # 明瞭性評価
            clarity = self._evaluate_clarity(text)
            
            # 専門性評価
            professional = self._evaluate_professionalism(text)
            
            # 総合品質
            overall = statistics.mean([
                readability, completeness, coherence, clarity, professional
            ])
            
            return QualityMetrics(
                readability_score=readability,
                completeness_score=completeness,
                coherence_score=coherence,
                clarity_score=clarity,
                professional_score=professional,
                overall_quality=overall
            )
            
        except Exception as e:
            logger.error(f"品質評価エラー: {str(e)}")
            return self._fallback_quality()

    # ヘルパーメソッド

    def _initialize_nlp_models(self) -> Dict:
        """NLPモデル初期化"""
        models = {}
        if NLP_AVAILABLE:
            try:
                # 日本語モデル
                models['ja_core_news_lg'] = spacy.load('ja_core_news_lg')
            except OSError:
                logger.warning("日本語spacyモデルが見つかりません")
            
            try:
                # 英語モデル
                models['en_core_web_lg'] = spacy.load('en_core_web_lg')
            except OSError:
                logger.warning("英語spacyモデルが見つかりません")
        
        return models

    def _initialize_similarity_model(self):
        """類似性モデル初期化"""
        if NLP_AVAILABLE:
            try:
                return SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                logger.warning(f"類似性モデル初期化エラー: {str(e)}")
        return None

    def _initialize_sentiment_analyzer(self):
        """感情分析器初期化"""
        if NLP_AVAILABLE:
            try:
                return pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest")
            except Exception as e:
                logger.warning(f"感情分析器初期化エラー: {str(e)}")
        return None

    def _initialize_summarizer(self):
        """要約器初期化"""
        if NLP_AVAILABLE:
            try:
                return pipeline("summarization", model="facebook/bart-large-cnn")
            except Exception as e:
                logger.warning(f"要約器初期化エラー: {str(e)}")
        return None

    def _load_domain_keywords(self) -> Dict:
        """ドメイン特化キーワード読み込み"""
        return {
            'technology': ['AI', '人工知能', 'IoT', 'DX', 'デジタル', 'システム', 'ソフトウェア'],
            'business': ['事業', 'ビジネス', '売上', '利益', '収益', '市場', '顧客'],
            'innovation': ['革新', '新技術', '改善', '効率化', '自動化', '最適化'],
            'finance': ['予算', '投資', 'ROI', 'コスト', '費用', '資金', '収支']
        }

    def _load_technical_terms(self) -> List[str]:
        """技術用語読み込み"""
        return [
            'API', 'クラウド', 'データベース', 'セキュリティ', 'インフラ',
            'アルゴリズム', '機械学習', 'ディープラーニング', 'ビッグデータ'
        ]

    def _split_text_into_chunks(self, text: str, max_length: int = 1000) -> List[str]:
        """テキストをチャンクに分割"""
        sentences = re.split(r'[。！？]', text)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk + sentence) < max_length:
                current_chunk += sentence + "。"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + "。"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks

    def _extract_key_sentences(self, text: str, num_sentences: int = 3) -> List[str]:
        """重要文抽出"""
        sentences = re.split(r'[。！？]', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        
        # 長さと位置に基づく簡易スコアリング
        scored_sentences = []
        for i, sentence in enumerate(sentences):
            score = len(sentence) * (1 - i / len(sentences))  # 前の方の文を重視
            scored_sentences.append((sentence, score))
        
        # スコア順にソートして上位を返す
        scored_sentences.sort(key=lambda x: x[1], reverse=True)
        return [s[0] for s in scored_sentences[:num_sentences]]

    def _extract_key_points(self, text: str) -> List[str]:
        """キーポイント抽出"""
        # 箇条書きや番号付きリストを検出
        bullet_points = re.findall(r'[・•]\s*(.+)', text)
        numbered_points = re.findall(r'\d+[.．]\s*(.+)', text)
        
        key_points = bullet_points + numbered_points
        
        # 重要そうな文も追加
        important_sentences = []
        for sentence in re.split(r'[。！？]', text):
            if any(keyword in sentence for keyword in ['重要', '課題', '効果', '目標', '成果']):
                important_sentences.append(sentence.strip())
        
        key_points.extend(important_sentences[:3])
        
        return key_points[:5]  # 最大5つ

    def _calculate_summary_confidence(self, original: str, summary: str) -> float:
        """要約信頼度計算"""
        if not original or not summary:
            return 0.0
        
        # 長さ比率
        length_ratio = len(summary) / len(original)
        if 0.1 <= length_ratio <= 0.5:
            length_score = 1.0
        else:
            length_score = 0.5
        
        # キーワード保持率
        original_words = set(original.split())
        summary_words = set(summary.split())
        keyword_retention = len(original_words & summary_words) / len(original_words)
        
        return (length_score + keyword_retention) / 2

    def _fallback_sentiment_analysis(self, text: str) -> Tuple[str, float, Dict[str, float]]:
        """フォールバック感情分析"""
        positive_words = ['良い', '素晴らしい', '優秀', '成功', '効果的', '満足']
        negative_words = ['悪い', '問題', '課題', '困難', '失敗', '不満']
        
        positive_count = sum(1 for word in positive_words if word in text)
        negative_count = sum(1 for word in negative_words if word in text)
        
        if positive_count > negative_count:
            sentiment = 'positive'
            confidence = min(positive_count / (positive_count + negative_count), 0.8)
        elif negative_count > positive_count:
            sentiment = 'negative'
            confidence = min(negative_count / (positive_count + negative_count), 0.8)
        else:
            sentiment = 'neutral'
            confidence = 0.5
        
        sentiment_scores = {
            'positive': confidence if sentiment == 'positive' else 0.0,
            'negative': confidence if sentiment == 'negative' else 0.0,
            'neutral': confidence if sentiment == 'neutral' else 0.0
        }
        
        return sentiment, confidence, sentiment_scores

    def _analyze_emotional_tone(self, text: str) -> str:
        """感情トーン分析"""
        formal_indicators = ['である', 'です', 'ます', 'いたします', '御社', '貴社']
        casual_indicators = ['だよ', 'じゃん', 'かな', '〜って', '〜みたい']
        persuasive_indicators = ['必要', 'べき', '重要', '効果的', '確実', '間違いなく']
        
        formal_count = sum(1 for indicator in formal_indicators if indicator in text)
        casual_count = sum(1 for indicator in casual_indicators if indicator in text)
        persuasive_count = sum(1 for indicator in persuasive_indicators if indicator in text)
        
        if formal_count > max(casual_count, persuasive_count):
            return 'formal'
        elif persuasive_count > max(formal_count, casual_count):
            return 'persuasive'
        elif casual_count > 0:
            return 'casual'
        else:
            return 'neutral'

    def _extract_monetary_values(self, text: str) -> List[str]:
        """金額抽出"""
        patterns = [
            r'\d+(?:,\d{3})*円',
            r'\d+万円',
            r'\d+億円',
            r'\$\d+(?:,\d{3})*',
            r'\d+ドル'
        ]
        
        monetary_values = []
        for pattern in patterns:
            matches = re.findall(pattern, text)
            monetary_values.extend(matches)
        
        return monetary_values

    def _extract_dates(self, text: str) -> List[str]:
        """日付抽出"""
        patterns = [
            r'\d{4}年\d{1,2}月\d{1,2}日',
            r'\d{4}年\d{1,2}月',
            r'\d{1,2}月\d{1,2}日',
            r'\d{4}/\d{1,2}/\d{1,2}',
            r'\d{1,2}/\d{1,2}'
        ]
        
        dates = []
        for pattern in patterns:
            matches = re.findall(pattern, text)
            dates.extend(matches)
        
        return dates

    def _extract_technologies(self, text: str) -> List[str]:
        """技術用語抽出"""
        return [term for term in self.technical_terms if term in text]

    def _extract_custom_entities(self, text: str) -> Dict[str, List[str]]:
        """カスタムエンティティ抽出"""
        custom_entities = {}
        
        # 補助金名
        subsidy_patterns = [r'(\w+補助金)', r'(\w+助成金)']
        subsidies = []
        for pattern in subsidy_patterns:
            subsidies.extend(re.findall(pattern, text))
        custom_entities['subsidies'] = subsidies
        
        # プロジェクト名
        project_patterns = [r'(\w+プロジェクト)', r'(\w+計画)']
        projects = []
        for pattern in project_patterns:
            projects.extend(re.findall(pattern, text))
        custom_entities['projects'] = projects
        
        return custom_entities

    def _extract_keywords_tfidf(self, text: str) -> List[Tuple[str, float]]:
        """TF-IDF基づくキーワード抽出（簡易版）"""
        words = re.findall(r'\w+', text)
        word_freq = Counter(words)
        
        # 簡易TF-IDFスコア（IDFは固定値）
        keywords = []
        for word, freq in word_freq.most_common(20):
            if len(word) > 1:  # 1文字除外
                tf_score = freq / len(words)
                keywords.append((word, tf_score))
        
        return keywords[:10]

    def _extract_key_phrases(self, text: str) -> List[Tuple[str, float]]:
        """キーフレーズ抽出"""
        # N-gramによるフレーズ抽出（簡易版）
        words = text.split()
        phrases = []
        
        # 2-gram
        for i in range(len(words) - 1):
            phrase = ' '.join(words[i:i+2])
            phrases.append(phrase)
        
        # 3-gram
        for i in range(len(words) - 2):
            phrase = ' '.join(words[i:i+3])
            phrases.append(phrase)
        
        phrase_freq = Counter(phrases)
        key_phrases = [(phrase, freq) for phrase, freq in phrase_freq.most_common(10)]
        
        return key_phrases

    def _analyze_topic_distribution(self, text: str) -> Dict[str, float]:
        """トピック分布分析（簡易版）"""
        topics = {}
        
        for topic, keywords in self.domain_keywords.items():
            topic_score = sum(1 for keyword in keywords if keyword in text)
            topics[topic] = topic_score / len(keywords) if keywords else 0
        
        return topics

    def _identify_domain_keywords(self, text: str) -> List[str]:
        """ドメイン特化キーワード特定"""
        domain_keywords = []
        
        for keyword_list in self.domain_keywords.values():
            for keyword in keyword_list:
                if keyword in text:
                    domain_keywords.append(keyword)
        
        return list(set(domain_keywords))

    def _calculate_readability(self, text: str) -> float:
        """読みやすさ計算"""
        if not text:
            return 0.0
        
        sentences = len(re.split(r'[。！？]', text))
        words = len(text.split())
        
        if sentences == 0:
            return 0.0
        
        avg_sentence_length = words / sentences
        
        # 平均文長に基づく読みやすさスコア
        if avg_sentence_length < 15:
            return 90.0
        elif avg_sentence_length < 25:
            return 70.0
        elif avg_sentence_length < 35:
            return 50.0
        else:
            return 30.0

    def _evaluate_completeness(self, text: str) -> float:
        """完全性評価"""
        required_elements = ['概要', '目的', '方法', '効果', '予算', 'スケジュール']
        present_elements = sum(1 for element in required_elements if element in text)
        
        completeness = (present_elements / len(required_elements)) * 100
        return min(completeness, 100.0)

    def _evaluate_coherence(self, text: str) -> float:
        """一貫性評価"""
        sentences = re.split(r'[。！？]', text)
        if len(sentences) < 2:
            return 50.0
        
        # 接続詞の使用
        connectors = ['そのため', 'したがって', 'また', 'さらに', 'その結果', 'つまり']
        connector_count = sum(1 for connector in connectors if connector in text)
        
        coherence_score = min((connector_count / len(sentences)) * 200, 100)
        return max(coherence_score, 40.0)

    def _evaluate_clarity(self, text: str) -> float:
        """明瞭性評価"""
        clarity_indicators = ['具体的', '明確', '詳細', '例えば', 'つまり']
        clarity_count = sum(1 for indicator in clarity_indicators if indicator in text)
        
        # 文字数と明瞭性指標のバランス
        text_length = len(text)
        clarity_density = clarity_count / (text_length / 1000) if text_length > 0 else 0
        
        return min(clarity_density * 50, 100.0)

    def _evaluate_professionalism(self, text: str) -> float:
        """専門性評価"""
        professional_terms = sum(1 for term in self.technical_terms if term in text)
        domain_terms = sum(
            1 for keyword_list in self.domain_keywords.values()
            for keyword in keyword_list if keyword in text
        )
        
        total_professional_terms = professional_terms + domain_terms
        text_length = len(text.split())
        
        if text_length == 0:
            return 0.0
        
        professionalism = (total_professional_terms / text_length) * 1000
        return min(professionalism, 100.0)

    # フォールバック・空メソッド

    async def _empty_summary(self) -> DocumentSummary:
        return DocumentSummary("", [], 0.0, 0.0)

    async def _empty_sentiment(self) -> SentimentAnalysis:
        return SentimentAnalysis("neutral", 0.0, "neutral", {"neutral": 1.0})

    async def _empty_entities(self) -> EntityExtraction:
        return EntityExtraction([], [], [], [], [], [], {})

    async def _empty_keywords(self) -> KeywordAnalysis:
        return KeywordAnalysis([], [], {}, [])

    async def _empty_similarity(self) -> SimilaritySearch:
        return SimilaritySearch([], [], "none", 0)

    async def _empty_quality(self) -> QualityMetrics:
        return QualityMetrics(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)

    def _fallback_summary(self, text: str) -> DocumentSummary:
        """フォールバック要約"""
        sentences = self._extract_key_sentences(text, 2)
        summary = ' '.join(sentences)
        return DocumentSummary(summary, sentences, 0.3, 0.6)

    def _fallback_sentiment(self) -> SentimentAnalysis:
        """フォールバック感情分析"""
        return SentimentAnalysis("neutral", 0.5, "neutral", {"neutral": 1.0})

    def _fallback_entities(self, text: str) -> EntityExtraction:
        """フォールバック固有表現抽出"""
        entities = EntityExtraction([], [], [], [], [], [], {})
        entities.monetary_values = self._extract_monetary_values(text)
        entities.dates = self._extract_dates(text)
        return entities

    def _fallback_keywords(self) -> KeywordAnalysis:
        """フォールバックキーワード分析"""
        return KeywordAnalysis([], [], {}, [])

    def _fallback_similarity(self) -> SimilaritySearch:
        """フォールバック類似検索"""
        return SimilaritySearch([], [], "fallback", 0)

    def _fallback_quality(self) -> QualityMetrics:
        """フォールバック品質評価"""
        return QualityMetrics(60.0, 60.0, 60.0, 60.0, 60.0, 60.0)

    async def _fallback_analysis(
        self, 
        text: str, 
        document_id: str, 
        start_time: float
    ) -> DocumentAnalysisResult:
        """フォールバック解析"""
        processing_time = asyncio.get_event_loop().time() - start_time
        
        return DocumentAnalysisResult(
            document_id=document_id,
            summary=self._fallback_summary(text),
            sentiment=self._fallback_sentiment(),
            entities=self._fallback_entities(text),
            keywords=self._fallback_keywords(),
            similar_documents=self._fallback_similarity(),
            quality_metrics=self._fallback_quality(),
            metadata={"fallback": True, "error": "Analysis failed"},
            processing_time=processing_time,
            timestamp=datetime.now()
        )

    # 比較メソッド

    async def _semantic_comparison(self, doc1: str, doc2: str) -> Dict[str, Any]:
        """意味的比較"""
        # 簡易実装
        return {"semantic_similarity": 0.5, "method": "fallback"}

    async def _structural_comparison(self, doc1: str, doc2: str) -> Dict[str, Any]:
        """構造的比較"""
        return {"structural_similarity": 0.5, "method": "fallback"}

    async def _lexical_comparison(self, doc1: str, doc2: str) -> Dict[str, Any]:
        """語彙的比較"""
        words1 = set(doc1.split())
        words2 = set(doc2.split())
        
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        
        jaccard_similarity = intersection / union if union > 0 else 0
        
        return {
            "lexical_similarity": jaccard_similarity,
            "common_words": intersection,
            "total_unique_words": union,
            "method": "jaccard"
        }

    async def _comprehensive_comparison(self, doc1: str, doc2: str) -> Dict[str, Any]:
        """包括的比較"""
        lexical = await self._lexical_comparison(doc1, doc2)
        semantic = await self._semantic_comparison(doc1, doc2)
        structural = await self._structural_comparison(doc1, doc2)
        
        return {
            "lexical": lexical,
            "semantic": semantic,
            "structural": structural,
            "overall_similarity": (
                lexical["lexical_similarity"] + 
                semantic["semantic_similarity"] + 
                structural["structural_similarity"]
            ) / 3
        }

    def _calculate_cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """コサイン類似度計算"""
        try:
            dot_product = np.dot(vec1, vec2)
            norm_a = np.linalg.norm(vec1)
            norm_b = np.linalg.norm(vec2)
            
            if norm_a == 0 or norm_b == 0:
                return 0.0
            
            return dot_product / (norm_a * norm_b)
        except:
            return 0.0

    def _fallback_similarity_search(self, text: str) -> Tuple[List, List]:
        """フォールバック類似検索"""
        return [], []