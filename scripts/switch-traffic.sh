#!/bin/bash
set -e

# 트래픽 전환 스크립트
# nginx를 사용하는 경우 nginx 설정을 업데이트
# 또는 리버스 프록시 설정을 변경

NGINX_CONFIG="/etc/nginx/sites-available/gyegaboo"
FRONTEND_PORT_GREEN=4173
FRONTEND_PORT_BLUE=4174
BACKEND_PORT_GREEN=3001
BACKEND_PORT_BLUE=3002

# 현재 활성 포트 확인
CURRENT_FRONTEND=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name == "gyegaboo-frontend-green" or .name == "gyegaboo-frontend-blue") | select(.pm2_env.status == "online") | .name' 2>/dev/null | head -1 || echo "")
CURRENT_BACKEND=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name == "gyegaboo-backend-green" or .name == "gyegaboo-backend-blue") | select(.pm2_env.status == "online") | .name' 2>/dev/null | head -1 || echo "")

if [[ "$CURRENT_FRONTEND" == *"green"* ]]; then
  ACTIVE_FRONTEND_PORT=$FRONTEND_PORT_GREEN
  ACTIVE_BACKEND_PORT=$BACKEND_PORT_GREEN
else
  ACTIVE_FRONTEND_PORT=$FRONTEND_PORT_BLUE
  ACTIVE_BACKEND_PORT=$BACKEND_PORT_BLUE
fi

echo "현재 활성 포트: Frontend=$ACTIVE_FRONTEND_PORT, Backend=$ACTIVE_BACKEND_PORT"

# nginx가 설치되어 있는 경우 설정 업데이트
if command -v nginx &> /dev/null && [ -f "$NGINX_CONFIG" ]; then
  echo "Nginx 설정 업데이트 중..."
  # nginx 설정 파일 백업
  cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup"
  
  # 프론트엔드 프록시 설정 업데이트
  sed -i "s|proxy_pass http://localhost:[0-9]*;|proxy_pass http://localhost:$ACTIVE_FRONTEND_PORT;|g" "$NGINX_CONFIG"
  
  # 백엔드 API 프록시 설정 업데이트
  sed -i "s|proxy_pass http://localhost:[0-9]*/api|proxy_pass http://localhost:$ACTIVE_BACKEND_PORT|g" "$NGINX_CONFIG"
  sed -i "s|proxy_pass http://localhost:[0-9]*;.*# api|proxy_pass http://localhost:$ACTIVE_BACKEND_PORT; # api|g" "$NGINX_CONFIG"
  
  # nginx 설정 테스트 및 리로드
  if nginx -t; then
    nginx -s reload
    echo "✅ Nginx 설정 업데이트 완료"
  else
    echo "❌ Nginx 설정 오류. 백업에서 복원 중..."
    cp "$NGINX_CONFIG.backup" "$NGINX_CONFIG"
    exit 1
  fi
else
  echo "⚠️  Nginx가 설치되어 있지 않거나 설정 파일이 없습니다."
  echo "포트 직접 접근: Frontend=$ACTIVE_FRONTEND_PORT, Backend=$ACTIVE_BACKEND_PORT"
  echo "프록시 설정이 필요하면 nginx를 설치하고 설정 파일을 생성하세요."
fi
