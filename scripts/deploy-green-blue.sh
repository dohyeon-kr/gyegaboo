#!/bin/bash
set -e

APP_ROOT=/home/ec2-user/apps/gyegaboo
FRONTEND_PORT_GREEN=4173
FRONTEND_PORT_BLUE=4174
BACKEND_PORT_GREEN=3001
BACKEND_PORT_BLUE=3002

cd "$APP_ROOT"

# Shared 디렉토리 및 데이터베이스 권한 확인 및 설정
echo "Shared 디렉토리 권한 설정 중..."
mkdir -p "$APP_ROOT/shared/data"
mkdir -p "$APP_ROOT/shared/uploads/profiles"
mkdir -p "$APP_ROOT/shared/uploads/receipts"

# 디렉토리 권한 설정
chmod -R 755 "$APP_ROOT/shared" 2>/dev/null || true

# 데이터베이스 파일 권한 설정
if [ -f "$APP_ROOT/shared/data/gyegaboo.db" ]; then
  chmod 664 "$APP_ROOT/shared/data/gyegaboo.db" 2>/dev/null || true
fi

# 현재 활성 인스턴스 확인
CURRENT_FRONTEND=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name == "gyegaboo-frontend-green" or .name == "gyegaboo-frontend-blue") | select(.pm2_env.status == "online") | .name' 2>/dev/null | head -1 || echo "")
CURRENT_BACKEND=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name == "gyegaboo-backend-green" or .name == "gyegaboo-backend-blue") | select(.pm2_env.status == "online") | .name' 2>/dev/null | head -1 || echo "")

# 배포할 인스턴스 결정
if [[ "$CURRENT_FRONTEND" == *"green"* ]] || [[ "$CURRENT_BACKEND" == *"green"* ]]; then
  DEPLOY_FRONTEND="blue"
  DEPLOY_BACKEND="blue"
  FRONTEND_PORT=$FRONTEND_PORT_BLUE
  BACKEND_PORT=$BACKEND_PORT_BLUE
else
  DEPLOY_FRONTEND="green"
  DEPLOY_BACKEND="green"
  FRONTEND_PORT=$FRONTEND_PORT_GREEN
  BACKEND_PORT=$BACKEND_PORT_GREEN
fi

echo "=========================================="
echo "Green-Blue 배포 시작"
echo "=========================================="
echo "현재 활성 인스턴스: Frontend=$CURRENT_FRONTEND, Backend=$CURRENT_BACKEND"
echo "배포할 인스턴스: Frontend=$DEPLOY_FRONTEND (포트 $FRONTEND_PORT), Backend=$DEPLOY_BACKEND (포트 $BACKEND_PORT)"
echo "=========================================="

# 기존 인스턴스 중지 (있는 경우)
echo "기존 인스턴스 정리 중..."
pm2 stop "gyegaboo-frontend-$DEPLOY_FRONTEND" 2>/dev/null || true
pm2 delete "gyegaboo-frontend-$DEPLOY_FRONTEND" 2>/dev/null || true
pm2 stop "gyegaboo-backend-$DEPLOY_BACKEND" 2>/dev/null || true
pm2 delete "gyegaboo-backend-$DEPLOY_BACKEND" 2>/dev/null || true

# 백엔드 시작
echo ""
echo "백엔드 시작 중 ($DEPLOY_BACKEND, 포트 $BACKEND_PORT)..."
cd "$APP_ROOT"
export PORT=$BACKEND_PORT
export DB_PATH="$APP_ROOT/shared/data/gyegaboo.db"
export UPLOAD_DIR="$APP_ROOT/shared/uploads"
export JWT_SECRET="${JWT_SECRET:-gyegaboo-secret-key-change-in-production}"

pm2 start npm \
  --name "gyegaboo-backend-$DEPLOY_BACKEND" \
  --cwd "$APP_ROOT" \
  -- run server

# 백엔드 헬스 체크
echo "백엔드 헬스 체크 중..."
sleep 3

MAX_RETRIES=30
RETRY_COUNT=0
BACKEND_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -f -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
    echo "✅ 백엔드 헬스 체크 통과"
    BACKEND_HEALTHY=true
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $((RETRY_COUNT % 5)) -eq 0 ]; then
    echo "백엔드 헬스 체크 재시도 중... ($RETRY_COUNT/$MAX_RETRIES)"
  fi
  sleep 2
done

if [ "$BACKEND_HEALTHY" = false ]; then
  echo "❌ 백엔드 헬스 체크 실패. 배포 롤백..."
  pm2 stop "gyegaboo-backend-$DEPLOY_BACKEND" 2>/dev/null || true
  pm2 delete "gyegaboo-backend-$DEPLOY_BACKEND" 2>/dev/null || true
  exit 1
fi

# 프론트엔드 시작
echo ""
echo "프론트엔드 시작 중 ($DEPLOY_FRONTEND, 포트 $FRONTEND_PORT)..."
cd "$APP_ROOT"

# vite preview는 --port 옵션으로 포트 지정
# 백엔드 포트를 환경 변수로 전달하여 프록시 설정
export VITE_PREVIEW_PORT=$FRONTEND_PORT
export VITE_API_TARGET="http://localhost:$BACKEND_PORT"

pm2 start npm \
  --name "gyegaboo-frontend-$DEPLOY_FRONTEND" \
  --cwd "$APP_ROOT" \
  -- \
  run preview -- --port $FRONTEND_PORT --host

# 프론트엔드 헬스 체크
echo "프론트엔드 헬스 체크 중..."
sleep 5

RETRY_COUNT=0
FRONTEND_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -f -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
    echo "✅ 프론트엔드 헬스 체크 통과"
    FRONTEND_HEALTHY=true
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $((RETRY_COUNT % 5)) -eq 0 ]; then
    echo "프론트엔드 헬스 체크 재시도 중... ($RETRY_COUNT/$MAX_RETRIES)"
  fi
  sleep 2
done

if [ "$FRONTEND_HEALTHY" = false ]; then
  echo "❌ 프론트엔드 헬스 체크 실패. 배포 롤백..."
  pm2 stop "gyegaboo-frontend-$DEPLOY_FRONTEND" 2>/dev/null || true
  pm2 delete "gyegaboo-frontend-$DEPLOY_FRONTEND" 2>/dev/null || true
  pm2 stop "gyegaboo-backend-$DEPLOY_BACKEND" 2>/dev/null || true
  pm2 delete "gyegaboo-backend-$DEPLOY_BACKEND" 2>/dev/null || true
  exit 1
fi

# 트래픽 전환 (nginx가 있는 경우)
if command -v nginx &> /dev/null; then
  echo ""
  echo "Nginx 트래픽 전환 중..."
  bash "$APP_ROOT/scripts/switch-traffic.sh" || echo "⚠️  트래픽 전환 스크립트 실행 실패 (계속 진행)"
fi

# 이전 인스턴스 종료
echo ""
echo "이전 인스턴스 종료 중..."
if [ -n "$CURRENT_FRONTEND" ] && [ "$CURRENT_FRONTEND" != "gyegaboo-frontend-$DEPLOY_FRONTEND" ]; then
  echo "이전 프론트엔드 종료: $CURRENT_FRONTEND"
  pm2 stop "$CURRENT_FRONTEND" 2>/dev/null || true
  sleep 2
  pm2 delete "$CURRENT_FRONTEND" 2>/dev/null || true
fi

if [ -n "$CURRENT_BACKEND" ] && [ "$CURRENT_BACKEND" != "gyegaboo-backend-$DEPLOY_BACKEND" ]; then
  echo "이전 백엔드 종료: $CURRENT_BACKEND"
  pm2 stop "$CURRENT_BACKEND" 2>/dev/null || true
  sleep 2
  pm2 delete "$CURRENT_BACKEND" 2>/dev/null || true
fi

pm2 save

echo ""
echo "=========================================="
echo "✅ Green-Blue 배포 완료!"
echo "=========================================="
echo "현재 활성 인스턴스:"
echo "  - Frontend: $DEPLOY_FRONTEND (포트 $FRONTEND_PORT)"
echo "  - Backend: $DEPLOY_BACKEND (포트 $BACKEND_PORT)"
echo "=========================================="
