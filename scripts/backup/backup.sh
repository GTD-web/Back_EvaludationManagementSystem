#!/bin/bash

# 데이터베이스 전체 백업 스크립트
# 사용법: ./scripts/backup/backup.sh

set -e

# 환경 변수 로드
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# 백업 설정
BACKUP_DIR="scripts/backup/dumps"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup-${TIMESTAMP}.sql"

# 데이터베이스 연결 정보
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_USER=${DATABASE_USERNAME:-postgres}
DB_NAME=${DATABASE_NAME:-ems}

echo "📦 데이터베이스 백업 시작..."
echo "   호스트: ${DB_HOST}:${DB_PORT}"
echo "   데이터베이스: ${DB_NAME}"
echo "   백업 파일: ${BACKUP_FILE}"
echo ""

# pg_dump 실행
PGPASSWORD=${DATABASE_PASSWORD} pg_dump \
  -h ${DB_HOST} \
  -p ${DB_PORT} \
  -U ${DB_USER} \
  -d ${DB_NAME} \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  -f ${BACKUP_FILE}

if [ $? -eq 0 ]; then
  FILE_SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
  echo ""
  echo "✅ 백업 완료!"
  echo "   파일: ${BACKUP_FILE}"
  echo "   크기: ${FILE_SIZE}"
  
  # 30일 이상 된 백업 파일 자동 삭제
  echo ""
  echo "🗑️  오래된 백업 파일 정리..."
  find ${BACKUP_DIR} -name "backup-*.sql" -type f -mtime +30 -delete
  echo "   (30일 이상 된 파일 삭제 완료)"
else
  echo ""
  echo "❌ 백업 실패!"
  exit 1
fi

