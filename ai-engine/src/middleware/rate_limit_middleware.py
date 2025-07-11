"""
レート制限ミドルウェア
"""

from functools import wraps
from flask import request, jsonify
import time
from collections import defaultdict, deque

# レート制限データを保存する辞書
rate_limit_data = defaultdict(lambda: deque())

def rate_limit(limit=10, window=3600):
    """
    レート制限デコレータ
    
    Args:
        limit: 制限回数
        window: 時間窓（秒）
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # クライアントIPを取得
            client_ip = request.remote_addr or 'unknown'
            current_time = time.time()
            
            # 現在のクライアントのアクセス履歴を取得
            access_times = rate_limit_data[client_ip]
            
            # 時間窓外の古いアクセス記録を削除
            while access_times and access_times[0] < current_time - window:
                access_times.popleft()
            
            # 制限回数をチェック
            if len(access_times) >= limit:
                return jsonify({
                    'success': False,
                    'error': f'レート制限に達しました。{window}秒間に{limit}回まで利用可能です。'
                }), 429
            
            # 現在のアクセス時刻を記録
            access_times.append(current_time)
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator