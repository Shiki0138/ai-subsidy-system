#!/bin/bash
# health-check.sh

# ¨óÉÝ¤óÈ
API_URL="https://api.your-domain.com"
FRONTEND_URL="https://your-domain.com"

# Slack Webhook URL
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Øë¹Á§Ã¯¢p
check_health() {
    local url=$1
    local name=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" $url/health)
    
    if [ $response -eq 200 ]; then
        echo "$name is healthy"
    else
        echo "$name is unhealthy (HTTP $response)"
        
        # Slackkå
        curl -X POST -H 'Content-type: application/json' \
          --data "{\"text\":\"  $name is down! HTTP Status: $response\"}" \
          $SLACK_WEBHOOK
    fi
}

# Á§Ã¯ŸL
check_health $API_URL "Backend API"
check_health $FRONTEND_URL "Frontend"

# Çü¿Ùü¹¥šÁ§Ã¯
docker-compose -f /var/www/ai-subsidy-system/docker-compose.production.yml \
  exec -T postgres pg_isready -U postgres || \
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"  PostgreSQL is not responding!"}' \
    $SLACK_WEBHOOK

# Redis¥šÁ§Ã¯
docker-compose -f /var/www/ai-subsidy-system/docker-compose.production.yml \
  exec -T redis redis-cli ping || \
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"  Redis is not responding!"}' \
    $SLACK_WEBHOOK