#!/bin/bash

# 데이터베이스 복구 스크립트
# 사용법: 
#   ./scripts/backup/restore.sh                    # 최신 백업 파일로 복구
#   ./scripts/backup/restore.sh <백업파일경로>      # 특정 백업 파일로 복구

set -e

# 환경 변수 로드
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# 백업 설정
BACKUP_DIR="scripts/backup/dumps"

# 백업 파일 결정
if [ -z "$1" ]; then
  # 인자가 없으면 최신 백업 파일 사용
  BACKUP_FILE=$(ls -t ${BACKUP_DIR}/backup-*.sql 2>/dev/null | head -n 1)
  
  if [ -z "$BACKUP_FILE" ]; then
    echo "❌ 백업 파일을 찾을 수 없습니다."
    echo "   경로: ${BACKUP_DIR}/"
    exit 1
  fi
  
  echo "📂 최신 백업 파일을 사용합니다: ${BACKUP_FILE}"
else
  BACKUP_FILE=$1
  
  if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 백업 파일이 존재하지 않습니다: ${BACKUP_FILE}"
    exit 1
  fi
fi

# 데이터베이스 연결 정보
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_USER=${DATABASE_USERNAME:-postgres}
DB_NAME=${DATABASE_NAME:-ems}

echo ""
echo "⚠️  경고: 이 작업은 기존 데이터베이스를 완전히 덮어씁니다!"
echo ""
echo "   호스트: ${DB_HOST}:${DB_PORT}"
echo "   데이터베이스: ${DB_NAME}"
echo "   백업 파일: ${BACKUP_FILE}"
echo ""
read -p "계속하시겠습니까? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "복구 작업이 취소되었습니다."
  exit 0
fi

echo ""
echo "🔄 데이터베이스 복구 시작..."

# psql 실행
PGPASSWORD=${DATABASE_PASSWORD} psql \
  -h ${DB_HOST} \
  -p ${DB_PORT} \
  -U ${DB_USER} \
  -d ${DB_NAME} \
  -f ${BACKUP_FILE}

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 복구 완료!"
  echo "   데이터베이스가 성공적으로 복구되었습니다."
else
  echo ""
  echo "❌ 복구 실패!"
  exit 1
fi

