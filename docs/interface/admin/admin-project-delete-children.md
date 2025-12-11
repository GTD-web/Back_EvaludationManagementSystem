# 하위 프로젝트 일괄 삭제 API

자동 생성된 모든 하위 프로젝트를 일괄 삭제하는 API입니다.

## 📋 목차

- [API 명세](#api-명세)
- [삭제 대상](#삭제-대상)
- [삭제 방식](#삭제-방식)
- [할당 체크](#할당-체크)
- [요청 예제](#요청-예제)
- [응답 예제](#응답-예제)
- [주의사항](#주의사항)
- [사용 시나리오](#사용-시나리오)

---

## API 명세

### 기본 정보

- **Method**: `DELETE`
- **Endpoint**: `/admin/projects/children`
- **인증**: Bearer Token 필요
- **권한**: 관리자

### 요청 Body

```typescript
{
  forceDelete?: boolean;  // 할당 체크 건너뛰기 (기본값: false)
  hardDelete?: boolean;   // 영구 삭제 여부 (기본값: false)
}
```

### 응답 Body

```typescript
{
  deletedCount: number;              // 삭제된 프로젝트 수
  deleteType: 'soft' | 'hard';       // 삭제 유형
  assignmentCheckPerformed: boolean; // 할당 체크 수행 여부
  deletedProjects: Array<{           // 삭제된 프로젝트 상세
    id: string;
    name: string;
    projectCode: string;
    parentProjectId: string | null;
  }>;
  executionTimeSeconds: number;      // 실행 시간 (초)
}
```

---

## 삭제 대상

다음 조건 중 **하나라도** 해당하는 프로젝트가 삭제됩니다:

1. **`parentProjectId`가 NULL이 아닌 프로젝트**
   - 상위 프로젝트가 있는 모든 하위 프로젝트

2. **프로젝트 코드에 `-SUB` 패턴이 포함된 프로젝트**
   - 예: `PRJ-0001-SUB1`, `PRJ-0002-SUB5`

3. **이름에 "하위" 텍스트가 포함된 프로젝트**
   - 예: "프로젝트명 - 1차 하위 프로젝트"

4. **이름에 "N차" 패턴이 포함된 프로젝트** (1차~10차)
   - 예: "프로젝트명 - 5차 하위 프로젝트"

---

## 삭제 방식

### 1. Soft Delete (기본값)

```json
{
  "forceDelete": false,
  "hardDelete": false
}
```

- `deletedAt` 필드만 업데이트
- 데이터는 데이터베이스에 보존
- 복구 가능
- **안전한 방식** ✅

#### 장점
- 실수로 삭제해도 복구 가능
- 데이터 무결성 유지
- 감사 추적(audit trail) 가능

#### 단점
- 데이터베이스 용량 차지
- 완전히 제거되지 않음

### 2. Hard Delete (영구 삭제)

```json
{
  "forceDelete": false,
  "hardDelete": true
}
```

- 데이터베이스에서 **영구 삭제**
- 복구 **불가능** ⚠️
- 완전히 제거됨

#### 장점
- 데이터베이스 용량 절약
- 완전한 제거

#### 단점
- **복구 불가능**
- 실수 시 치명적
- 데이터 무결성 위험

---

## 할당 체크

### 기본 동작 (forceDelete=false)

기본적으로 **할당이 있는 프로젝트는 삭제하지 않습니다**.

```json
{
  "forceDelete": false
}
```

#### 체크 항목
- `evaluation_project_assignment` 테이블에 해당 프로젝트의 할당이 있는지 확인
- 할당이 **하나라도** 있으면 삭제 실패
- 에러 메시지: `"N개의 할당이 있는 하위 프로젝트가 포함되어 있어 삭제할 수 없습니다"`

### 강제 삭제 (forceDelete=true) ⚠️

```json
{
  "forceDelete": true
}
```

- 할당 체크를 **건너뜁니다**
- 할당이 있어도 삭제됩니다
- **데이터 무결성 위반 가능** ⚠️
- **매우 위험합니다**

#### 사용 시 주의사항
- 반드시 백업 완료
- 개발/테스트 환경에서만 사용
- 운영 환경에서는 **절대 사용 금지**

---

## 요청 예제

### 1. 안전한 삭제 (기본값, 권장) ✅

```bash
curl -X DELETE http://localhost:3000/admin/projects/children \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

- Soft Delete
- 할당 체크 수행
- 가장 안전한 방법

### 2. 영구 삭제 (복구 불가)

```bash
curl -X DELETE http://localhost:3000/admin/projects/children \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hardDelete": true
  }'
```

- Hard Delete
- 할당 체크 수행
- 복구 불가능

### 3. 강제 영구 삭제 (⚠️ 매우 위험)

```bash
curl -X DELETE http://localhost:3000/admin/projects/children \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "forceDelete": true,
    "hardDelete": true
  }'
```

- Hard Delete
- 할당 체크 생략
- **데이터 무결성 위반 가능**
- **운영 환경에서 절대 사용 금지**

---

## 응답 예제

### 성공 응답 (200 OK)

```json
{
  "deletedCount": 25,
  "deleteType": "soft",
  "assignmentCheckPerformed": true,
  "deletedProjects": [
    {
      "id": "uuid-1",
      "name": "PRJ-001 프로젝트 - 1차 하위 프로젝트",
      "projectCode": "PRJ-001-SUB1",
      "parentProjectId": "parent-uuid-1"
    },
    {
      "id": "uuid-2",
      "name": "PRJ-001 프로젝트 - 2차 하위 프로젝트",
      "projectCode": "PRJ-001-SUB2",
      "parentProjectId": "uuid-1"
    }
    // ... 더 많은 삭제된 프로젝트
  ],
  "executionTimeSeconds": 1.234
}
```

### 실패 응답 (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "삭제할 하위 프로젝트를 찾을 수 없습니다",
  "error": "Not Found"
}
```

### 실패 응답 (400 Bad Request)

할당이 있는 프로젝트가 포함된 경우:

```json
{
  "statusCode": 400,
  "message": "5개의 할당이 있는 하위 프로젝트가 포함되어 있어 삭제할 수 없습니다",
  "error": "Bad Request"
}
```

---

## 주의사항

### ⚠️ 백업 필수

```bash
# PostgreSQL 백업 예제
pg_dump -h localhost -U postgres -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### ⚠️ 실행 전 확인사항

1. **백업 완료 여부**
   - 데이터베이스 전체 백업
   - 또는 최소한 `project` 테이블 백업

2. **삭제할 프로젝트 목록 확인**
   ```sql
   SELECT 
       id,
       name,
       "projectCode",
       "parentProjectId"
   FROM project
   WHERE "deletedAt" IS NULL
     AND (
       "parentProjectId" IS NOT NULL
       OR "projectCode" LIKE '%-SUB%'
       OR name LIKE '%하위%'
       OR name LIKE '% - _차%'
     )
   ORDER BY "projectCode";
   ```

3. **할당 데이터 확인**
   ```sql
   SELECT 
       COUNT(*) AS "할당 개수"
   FROM evaluation_project_assignment
   WHERE "projectId" IN (
       SELECT id
       FROM project
       WHERE "parentProjectId" IS NOT NULL
   );
   ```

4. **운영 환경 여부**
   - 운영 환경에서는 더욱 신중하게
   - 가능하면 개발/테스트 환경에서 먼저 테스트

### ⚠️ Hard Delete 시 고려사항

- **복구 불가능**: 삭제된 데이터는 영구히 사라집니다
- **FK 제약**: 다른 테이블에서 참조하는 경우 삭제 실패할 수 있습니다
- **감사 추적 불가**: 삭제 이력이 남지 않습니다

### ⚠️ Force Delete 시 고려사항

- **데이터 무결성 위반**: 할당 데이터가 고아(orphan) 레코드가 됩니다
- **참조 무결성**: FK 제약이 있으면 오히려 삭제 실패할 수 있습니다
- **운영 환경 사용 금지**: 실제 서비스에서는 절대 사용하지 마세요

---

## 사용 시나리오

### 시나리오 1: 테스트 데이터 정리 ✅

**상황**: 개발 중 생성한 테스트 하위 프로젝트 제거

**권장 방법**:
```json
{
  "forceDelete": false,
  "hardDelete": false
}
```

**이유**:
- Soft Delete로 안전하게 제거
- 필요 시 복구 가능
- 할당 체크로 실수 방지

---

### 시나리오 2: 데모 후 완전 제거

**상황**: 데모를 위해 생성한 하위 프로젝트를 완전히 제거

**권장 순서**:

1. **먼저 Soft Delete**
   ```json
   {
     "forceDelete": false,
     "hardDelete": false
   }
   ```

2. **확인 후 Hard Delete**
   ```json
   {
     "forceDelete": false,
     "hardDelete": true
   }
   ```

**이유**:
- 2단계로 나눠 안전성 확보
- 첫 삭제 후 문제 없으면 영구 삭제

---

### 시나리오 3: 재생성 준비

**상황**: 기존 하위 프로젝트를 삭제하고 새로 생성

**권장 방법**:
```json
{
  "forceDelete": false,
  "hardDelete": true
}
```

**순서**:
1. 하위 프로젝트 일괄 삭제 (Hard Delete)
2. 상위 프로젝트 확인
3. 하위 프로젝트 재생성 API 호출

**이유**:
- Hard Delete로 깨끗하게 제거
- 새로 생성 시 충돌 방지

---

### 시나리오 4: 운영 환경 정리 (⚠️ 매우 신중)

**상황**: 운영 환경에서 하위 프로젝트 제거 필요

**권장 절차**:

1. **백업**
   ```bash
   pg_dump -h prod-db -U user -d ems_db > backup_before_delete.sql
   ```

2. **삭제 대상 확인**
   ```sql
   SELECT COUNT(*) FROM project WHERE "parentProjectId" IS NOT NULL;
   ```

3. **할당 확인**
   ```sql
   SELECT COUNT(*) 
   FROM evaluation_project_assignment 
   WHERE "projectId" IN (
     SELECT id FROM project WHERE "parentProjectId" IS NOT NULL
   );
   ```

4. **할당 정리** (할당이 있는 경우)
   - 먼저 할당을 다른 프로젝트로 이동하거나
   - 할당을 종료 처리

5. **Soft Delete 실행**
   ```json
   {
     "forceDelete": false,
     "hardDelete": false
   }
   ```

6. **결과 확인 및 모니터링** (1~2주)

7. **Hard Delete 실행** (선택)
   ```json
   {
     "forceDelete": false,
     "hardDelete": true
   }
   ```

**주의**:
- 운영 환경에서는 절대 `forceDelete: true` 사용 금지
- 반드시 백업 완료 후 실행
- 삭제 후 충분한 시간 모니터링

---

## Swagger에서 테스트

### 1. Swagger UI 접속

```
http://localhost:3000/api-docs
```

### 2. 인증

1. 우측 상단 **Authorize** 버튼 클릭
2. Bearer Token 입력
3. **Authorize** 버튼 클릭

### 3. API 실행

1. **B-0. 관리자 - 프로젝트 관리** 섹션 찾기
2. **DELETE /admin/projects/children** 엔드포인트 클릭
3. **Try it out** 버튼 클릭
4. Request Body 입력:
   ```json
   {
     "forceDelete": false,
     "hardDelete": false
   }
   ```
5. **Execute** 버튼 클릭
6. 응답 확인

### 4. 결과 확인

- **200 OK**: 성공
  - `deletedCount` 확인
  - `deletedProjects` 목록 확인

- **404 Not Found**: 삭제할 프로젝트 없음

- **400 Bad Request**: 할당이 있어 삭제 실패

---

## 관련 API

- [하위 프로젝트 자동 생성](./admin-project-generate-children.md)
- [프로젝트 계층 구조](./admin-project-hierarchy-structure.md)
- [프로젝트 관리 API](./admin-project-management.md)

---

## FAQ

### Q1. Soft Delete와 Hard Delete의 차이는?

**A**: 
- **Soft Delete**: `deletedAt` 필드만 업데이트, 데이터 보존, 복구 가능
- **Hard Delete**: 데이터베이스에서 완전 삭제, 복구 불가능

### Q2. 할당이 있는 프로젝트는 삭제할 수 없나요?

**A**: 기본적으로 삭제할 수 없습니다. `forceDelete: true`로 강제 삭제할 수 있지만, 데이터 무결성 위반 가능성이 있어 권장하지 않습니다.

### Q3. 삭제된 프로젝트를 복구할 수 있나요?

**A**: 
- **Soft Delete**: 복구 가능 (SQL로 `deletedAt`을 NULL로 변경)
- **Hard Delete**: 복구 불가능 (백업에서만 복구 가능)

### Q4. 상위 프로젝트도 같이 삭제되나요?

**A**: 아니요. 이 API는 **하위 프로젝트만** 삭제합니다. 상위 프로젝트는 그대로 유지됩니다.

### Q5. 일부 하위 프로젝트만 삭제할 수 있나요?

**A**: 이 API는 **모든 하위 프로젝트를 일괄 삭제**합니다. 특정 프로젝트만 삭제하려면 개별 프로젝트 삭제 API를 사용하세요.

### Q6. 실행 시간이 얼마나 걸리나요?

**A**: 프로젝트 수에 따라 다르지만, 일반적으로:
- 10개: ~0.5초
- 100개: ~2초
- 1000개: ~10초

응답의 `executionTimeSeconds` 필드에서 실제 실행 시간을 확인할 수 있습니다.

---

## 버전 이력

- **v1.0.0** (2025-12-10): 초기 버전
  - Soft Delete / Hard Delete 지원
  - 할당 체크 기능
  - Force Delete 옵션


