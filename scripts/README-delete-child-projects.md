# 하위 프로젝트 일괄 삭제 가이드

자동 생성된 하위 프로젝트를 일괄 삭제하는 방법을 안내합니다.

## 📋 목차

- [개요](#개요)
- [삭제 방법](#삭제-방법)
  - [1. Swagger UI 사용 (권장)](#1-swagger-ui-사용-권장)
  - [2. cURL 사용](#2-curl-사용)
  - [3. 테스트 스크립트 사용](#3-테스트-스크립트-사용)
  - [4. SQL 직접 실행](#4-sql-직접-실행)
- [삭제 모드](#삭제-모드)
- [주의사항](#주의사항)

---

## 개요

하위 프로젝트 일괄 삭제 API를 사용하면 자동 생성된 모든 하위 프로젝트를 한 번에 삭제할 수 있습니다.

**삭제 대상:**
- `parentProjectId`가 NULL이 아닌 프로젝트
- 프로젝트 코드에 `-SUB` 패턴이 포함된 프로젝트
- 이름에 "하위" 또는 "N차" 패턴이 포함된 프로젝트

---

## 삭제 방법

### 1. Swagger UI 사용 (권장) ✅

가장 간단하고 안전한 방법입니다.

#### 단계:

1. **Swagger UI 접속**
   ```
   http://localhost:3000/api-docs
   ```

2. **인증**
   - 우측 상단 **Authorize** 버튼 클릭
   - Bearer Token 입력
   - **Authorize** 클릭

3. **API 실행**
   - **B-0. 관리자 - 프로젝트 관리** 섹션 찾기
   - **DELETE /admin/projects/children** 클릭
   - **Try it out** 버튼 클릭
   - Request Body 입력:
     ```json
     {
       "forceDelete": false,
       "hardDelete": false
     }
     ```
   - **Execute** 버튼 클릭

4. **결과 확인**
   - Response Body에서 `deletedCount` 확인
   - `deletedProjects` 목록 확인

---

### 2. cURL 사용

#### 안전한 삭제 (Soft Delete)

```bash
curl -X DELETE http://localhost:3000/admin/projects/children \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "forceDelete": false,
    "hardDelete": false
  }'
```

#### 영구 삭제 (Hard Delete)

```bash
curl -X DELETE http://localhost:3000/admin/projects/children \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "forceDelete": false,
    "hardDelete": true
  }'
```

#### 강제 영구 삭제 (⚠️ 위험)

```bash
curl -X DELETE http://localhost:3000/admin/projects/children \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "forceDelete": true,
    "hardDelete": true
  }'
```

---

### 3. 테스트 스크립트 사용

자동화된 테스트 스크립트를 제공합니다.

#### Linux/Mac

```bash
# 환경 변수 설정
export API_URL=http://localhost:3000
export TOKEN=your_bearer_token_here

# Soft Delete (안전)
./scripts/test-delete-child-projects.sh soft

# Hard Delete (영구 삭제)
./scripts/test-delete-child-projects.sh hard

# Force Hard Delete (⚠️ 매우 위험)
./scripts/test-delete-child-projects.sh force-hard
```

#### Windows

```cmd
REM 환경 변수 설정
set API_URL=http://localhost:3000
set TOKEN=your_bearer_token_here

REM Soft Delete (안전)
scripts\test-delete-child-projects.bat soft

REM Hard Delete (영구 삭제)
scripts\test-delete-child-projects.bat hard

REM Force Hard Delete (⚠️ 매우 위험)
scripts\test-delete-child-projects.bat force-hard
```

---

### 4. SQL 직접 실행

#### 4-1. 삭제 전 확인

```sql
-- 삭제 대상 확인
SELECT 
    id,
    name,
    "projectCode",
    "parentProjectId",
    "deletedAt"
FROM project
WHERE "deletedAt" IS NULL
  AND (
    "parentProjectId" IS NOT NULL
    OR "projectCode" LIKE '%-SUB%'
    OR name LIKE '%하위%'
    OR name LIKE '% - _차%'
  )
ORDER BY "projectCode";

-- 개수 확인
SELECT COUNT(*) AS "삭제 대상 개수"
FROM project
WHERE "deletedAt" IS NULL
  AND (
    "parentProjectId" IS NOT NULL
    OR "projectCode" LIKE '%-SUB%'
    OR name LIKE '%하위%'
  );

-- 할당 확인
SELECT 
    COUNT(*) AS "할당 개수"
FROM evaluation_project_assignment
WHERE "projectId" IN (
    SELECT id
    FROM project
    WHERE "parentProjectId" IS NOT NULL
);
```

#### 4-2. Soft Delete (SQL)

```sql
-- Soft Delete: deletedAt만 업데이트
UPDATE project
SET 
    "deletedAt" = NOW(),
    "updatedAt" = NOW()
WHERE "deletedAt" IS NULL
  AND (
    "parentProjectId" IS NOT NULL
    OR "projectCode" LIKE '%-SUB%'
    OR name LIKE '%하위%'
  );

-- 결과 확인
SELECT COUNT(*) AS "Soft Delete된 개수"
FROM project
WHERE "deletedAt" IS NOT NULL
  AND (
    "parentProjectId" IS NOT NULL
    OR "projectCode" LIKE '%-SUB%'
  );
```

#### 4-3. Hard Delete (SQL) ⚠️

```sql
-- ⚠️ 영구 삭제 (복구 불가능)
DELETE FROM project
WHERE (
    "parentProjectId" IS NOT NULL
    OR "projectCode" LIKE '%-SUB%'
    OR name LIKE '%하위%'
  );

-- 결과 확인
SELECT COUNT(*) AS "남은 하위 프로젝트 개수"
FROM project
WHERE "parentProjectId" IS NOT NULL;
-- 결과: 0이어야 함
```

#### 4-4. Soft Delete 복구 (필요시)

```sql
-- Soft Delete된 하위 프로젝트 복구
UPDATE project
SET 
    "deletedAt" = NULL,
    "updatedAt" = NOW()
WHERE "deletedAt" IS NOT NULL
  AND "parentProjectId" IS NOT NULL;

-- 결과 확인
SELECT COUNT(*) AS "복구된 개수"
FROM project
WHERE "deletedAt" IS NULL
  AND "parentProjectId" IS NOT NULL;
```

---

## 삭제 모드

### Soft Delete (안전) ✅

```json
{
  "forceDelete": false,
  "hardDelete": false
}
```

- `deletedAt` 필드만 업데이트
- 데이터는 보존
- 복구 가능
- **가장 안전한 방법**

**권장 사용:**
- 개발/테스트 환경
- 운영 환경 (첫 삭제)
- 복구 가능성이 필요한 경우

---

### Hard Delete (영구 삭제)

```json
{
  "forceDelete": false,
  "hardDelete": true
}
```

- 데이터베이스에서 완전 삭제
- 복구 불가능
- 할당 체크는 수행

**권장 사용:**
- Soft Delete 후 확인 뒤 완전 제거
- 데이터베이스 용량 절약 필요 시
- 백업 완료 후

---

### Force Hard Delete (⚠️ 매우 위험)

```json
{
  "forceDelete": true,
  "hardDelete": true
}
```

- 할당 체크 생략
- 데이터베이스에서 완전 삭제
- 데이터 무결성 위반 가능
- **매우 위험**

**사용 금지:**
- 운영 환경에서는 **절대 사용 금지**
- 할당이 있는 프로젝트 삭제 시 FK 제약 위반 가능

**허용되는 경우:**
- 로컬 개발 환경
- 테스트 데이터 완전 정리
- 백업 완료 후

---

## 주의사항

### ⚠️ 실행 전 필수 체크리스트

- [ ] 백업 완료
- [ ] 삭제 대상 확인
- [ ] 할당 데이터 확인
- [ ] 환경 확인 (개발/운영)
- [ ] 삭제 모드 확인
- [ ] 복구 계획 수립

### ⚠️ Soft Delete vs Hard Delete

| 항목 | Soft Delete | Hard Delete |
|------|-------------|-------------|
| 데이터 보존 | ✅ | ❌ |
| 복구 가능 | ✅ | ❌ |
| DB 용량 | 차지함 | 절약됨 |
| 안전성 | 높음 | 낮음 |
| 권장 여부 | **권장** | 신중하게 |

### ⚠️ Force Delete 주의

- **데이터 무결성 위반** 가능
- **FK 제약** 위반 시 삭제 실패
- **고아 레코드** 생성 가능
- **운영 환경에서 절대 사용 금지**

---

## 실행 예제

### 예제 1: 안전한 삭제

```bash
# 1. Swagger UI에서 실행
# Request Body:
{
  "forceDelete": false,
  "hardDelete": false
}

# 2. 응답 확인
{
  "deletedCount": 25,
  "deleteType": "soft",
  "assignmentCheckPerformed": true,
  "deletedProjects": [...],
  "executionTimeSeconds": 1.234
}

# 3. 결과 확인
# - deletedCount가 예상과 일치하는지 확인
# - deletedProjects 목록 확인
```

### 예제 2: 영구 삭제 (2단계)

```bash
# Step 1: 먼저 Soft Delete
{
  "forceDelete": false,
  "hardDelete": false
}

# Step 2: 문제 없으면 Hard Delete
{
  "forceDelete": false,
  "hardDelete": true
}
```

---

## 문제 해결

### 문제 1: "할당이 있어 삭제할 수 없습니다"

**원인**: 삭제 대상 프로젝트에 할당이 있음

**해결 방법:**

1. **할당을 먼저 처리** (권장)
   ```sql
   -- 할당 확인
   SELECT * 
   FROM evaluation_project_assignment
   WHERE "projectId" IN (
     SELECT id FROM project WHERE "parentProjectId" IS NOT NULL
   );
   
   -- 할당을 다른 프로젝트로 이동 또는 종료 처리
   ```

2. **Force Delete 사용** (⚠️ 위험)
   ```json
   {
     "forceDelete": true,
     "hardDelete": false
   }
   ```

### 문제 2: "삭제할 하위 프로젝트를 찾을 수 없습니다"

**원인**: 이미 모든 하위 프로젝트가 삭제됨

**확인:**
```sql
SELECT COUNT(*) FROM project WHERE "parentProjectId" IS NOT NULL;
-- 결과가 0이면 정상
```

### 문제 3: FK 제약 위반

**원인**: 다른 테이블에서 해당 프로젝트를 참조

**해결:**
```sql
-- 참조하는 테이블 확인
SELECT 
    tc.table_name, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.table_name = 'project';

-- 참조 데이터 먼저 삭제 또는 Soft Delete 사용
```

---

## 관련 문서

- [하위 프로젝트 일괄 삭제 API 문서](../docs/interface/admin/admin-project-delete-children.md)
- [하위 프로젝트 자동 생성](./README-generate-child-projects.md)
- [프로젝트 계층 구조](../docs/interface/admin/admin-project-hierarchy-structure.md)

---

## 버전 이력

- **v1.0.0** (2025-12-10): 초기 버전
  - Soft Delete / Hard Delete 지원
  - 할당 체크 기능
  - Force Delete 옵션
  - 테스트 스크립트 제공
