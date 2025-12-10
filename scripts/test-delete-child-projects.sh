#!/bin/bash

# 하위 프로젝트 일괄 삭제 테스트 스크립트
# 사용법: ./scripts/test-delete-child-projects.sh [soft|hard|force-hard]

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
API_URL="${API_URL:-http://localhost:3000}"
TOKEN="${TOKEN:-YOUR_BEARER_TOKEN}"

# 삭제 모드 (기본값: soft)
MODE="${1:-soft}"

# 헤더
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    하위 프로젝트 일괄 삭제 테스트${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 모드별 설정
case "$MODE" in
  "soft")
    echo -e "${GREEN}모드: Soft Delete (안전)${NC}"
    BODY='{"forceDelete":false,"hardDelete":false}'
    ;;
  "hard")
    echo -e "${YELLOW}모드: Hard Delete (영구 삭제)${NC}"
    BODY='{"forceDelete":false,"hardDelete":true}'
    ;;
  "force-hard")
    echo -e "${RED}모드: Force Hard Delete (⚠️ 매우 위험)${NC}"
    BODY='{"forceDelete":true,"hardDelete":true}'
    echo -e "${RED}경고: 할당 체크를 건너뛰고 영구 삭제합니다!${NC}"
    read -p "계속하시겠습니까? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
      echo -e "${YELLOW}취소되었습니다.${NC}"
      exit 0
    fi
    ;;
  *)
    echo -e "${RED}올바르지 않은 모드: $MODE${NC}"
    echo "사용법: $0 [soft|hard|force-hard]"
    exit 1
    ;;
esac

echo ""
echo -e "${BLUE}[1/3] 삭제 전 하위 프로젝트 확인...${NC}"
echo ""

# 삭제 전 카운트
BEFORE_COUNT=$(curl -s -X GET "$API_URL/admin/projects?limit=1000" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq -r '.projects | map(select(.parentProjectId != null)) | length')

echo -e "삭제 전 하위 프로젝트 수: ${GREEN}$BEFORE_COUNT${NC}개"

if [ "$BEFORE_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}삭제할 하위 프로젝트가 없습니다.${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}[2/3] 하위 프로젝트 일괄 삭제 실행...${NC}"
echo ""

# API 호출
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/admin/projects/children" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BODY")

# HTTP 상태 코드 추출
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY_RESPONSE=$(echo "$RESPONSE" | head -n-1)

echo "HTTP 상태 코드: $HTTP_CODE"
echo ""

# 응답 처리
if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ 삭제 성공!${NC}"
  echo ""
  
  # 결과 출력
  DELETED_COUNT=$(echo "$BODY_RESPONSE" | jq -r '.deletedCount')
  DELETE_TYPE=$(echo "$BODY_RESPONSE" | jq -r '.deleteType')
  EXECUTION_TIME=$(echo "$BODY_RESPONSE" | jq -r '.executionTimeSeconds')
  ASSIGNMENT_CHECK=$(echo "$BODY_RESPONSE" | jq -r '.assignmentCheckPerformed')
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "삭제된 프로젝트 수: ${GREEN}$DELETED_COUNT${NC}개"
  echo "삭제 유형: $DELETE_TYPE"
  echo "할당 체크 수행: $ASSIGNMENT_CHECK"
  echo "실행 시간: ${EXECUTION_TIME}초"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  echo ""
  echo "삭제된 프로젝트 상세:"
  echo "$BODY_RESPONSE" | jq -r '.deletedProjects[] | "  - \(.projectCode): \(.name)"' | head -20
  
  TOTAL_DELETED=$(echo "$BODY_RESPONSE" | jq -r '.deletedProjects | length')
  if [ "$TOTAL_DELETED" -gt 20 ]; then
    echo "  ... 외 $(($TOTAL_DELETED - 20))개"
  fi
  
elif [ "$HTTP_CODE" -eq 404 ]; then
  echo -e "${YELLOW}⚠️  삭제할 하위 프로젝트를 찾을 수 없습니다.${NC}"
  
elif [ "$HTTP_CODE" -eq 400 ]; then
  echo -e "${RED}❌ 삭제 실패: 할당이 있는 프로젝트가 포함되어 있습니다.${NC}"
  echo ""
  MESSAGE=$(echo "$BODY_RESPONSE" | jq -r '.message')
  echo "메시지: $MESSAGE"
  echo ""
  echo -e "${YELLOW}해결 방법:${NC}"
  echo "1. 할당을 먼저 다른 프로젝트로 이동"
  echo "2. 할당을 종료 처리"
  echo "3. forceDelete: true 사용 (⚠️ 위험)"
  
else
  echo -e "${RED}❌ 오류 발생 (HTTP $HTTP_CODE)${NC}"
  echo ""
  echo "$BODY_RESPONSE" | jq '.'
fi

echo ""
echo -e "${BLUE}[3/3] 삭제 후 하위 프로젝트 확인...${NC}"
echo ""

# 삭제 후 카운트
AFTER_COUNT=$(curl -s -X GET "$API_URL/admin/projects?limit=1000" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq -r '.projects | map(select(.parentProjectId != null)) | length')

echo -e "삭제 후 하위 프로젝트 수: ${GREEN}$AFTER_COUNT${NC}개"

if [ "$HTTP_CODE" -eq 200 ]; then
  if [ "$DELETE_TYPE" == "soft" ]; then
    echo ""
    echo -e "${YELLOW}💡 Soft Delete로 삭제되었습니다.${NC}"
    echo "   데이터는 보존되며 복구 가능합니다."
  else
    echo ""
    echo -e "${RED}⚠️  Hard Delete로 영구 삭제되었습니다.${NC}"
    echo "   복구할 수 없습니다."
  fi
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    테스트 완료${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

