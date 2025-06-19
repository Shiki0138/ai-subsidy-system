#!/bin/bash
# backup.sh

# 設定
BACKUP_DIR="/backup/ai-subsidy"
S3_BUCKET="s3://your-backup-bucket"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# ディレクトリ作成
mkdir -p $BACKUP_DIR/{db,files,configs}

# PostgreSQLバックアップ
echo "Starting database backup..."
docker-compose -f /var/www/ai-subsidy-system/docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres ai_subsidy | gzip > $BACKUP_DIR/db/ai_subsidy_$DATE.sql.gz

# アップロードファイルバックアップ
echo "Starting file backup..."
tar -czf $BACKUP_DIR/files/uploads_$DATE.tar.gz \
  /var/www/ai-subsidy-system/backend/uploads

# 設定ファイルバックアップ
echo "Starting config backup..."
tar -czf $BACKUP_DIR/configs/configs_$DATE.tar.gz \
  /var/www/ai-subsidy-system/.env \
  /var/www/ai-subsidy-system/nginx \
  /var/www/ai-subsidy-system/docker-compose.production.yml

# S3へアップロード
echo "Uploading to S3..."
aws s3 sync $BACKUP_DIR $S3_BUCKET/backups/

# 古いバックアップを削除
echo "Cleaning up old backups..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed!"