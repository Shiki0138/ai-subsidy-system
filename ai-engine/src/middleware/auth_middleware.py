"""
認証ミドルウェア
"""

from functools import wraps
from flask import request, jsonify
import os

def require_api_key(f):
    """API キー認証を要求するデコレータ"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('Authorization')
        
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'API キーが必要です'
            }), 401
        
        # Bearer トークン形式の場合
        if api_key.startswith('Bearer '):
            api_key = api_key[7:]  # "Bearer " を除去
        
        # 環境変数から有効な API キーを取得
        valid_api_keys = [
            os.environ.get('AI_ENGINE_API_KEY', 'default-dev-key'),
            'test-token'  # テスト用
        ]
        
        if api_key not in valid_api_keys:
            return jsonify({
                'success': False,
                'error': '無効な API キーです'
            }), 401
        
        return f(*args, **kwargs)
    
    return decorated_function