# 하위 프로젝트 자동 생성 API (재귀 트리)

## 개요

기존 상위 프로젝트들에 **재귀 트리 구조**의 하위 프로젝트를 자동으로 생성하는 API입니다.

### 재귀 트리 구조란?

각 상위 프로젝트마다 1개의 하위가 생성되고, 그 하위 아래 또 1개의 하위가 생성되는 **체인 구조**입니다.

```
상위 프로젝트 (PRJ-0001)
  └─ 1차 하위 (PRJ-0001-SUB1)
      └─ 2차 하위 (PRJ-0001-SUB1-SUB2)
          └─ 3차 하위 (PRJ-0001-SUB1-SUB2-SUB3)
              └─ 4차 하위 (PRJ-0001-SUB1-SUB2-SUB3-SUB4)
                  └─ 5차 하위 (PRJ-0001-SUB1-SUB2-SUB3-SUB4-SUB5)
```

- **depth=5**: 5단계 깊이의 트리 생성 (1차 → 2차 → 3차 → 4차 → 5차)
- **상위 11개 × depth 5 = 총 55개** 하위 프로젝트 생성

## 엔드포인트

```
POST /admin/projects/generate-children
```

## 인증

- Bearer Token 필요
- 관리자 권한 필요

## 요청

### Request Body

```json
{
  "childCountPerProject": 5,
  "skipIfExists": true
}
```

#### 파라미터

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `childCountPerProject` | number | ❌ | `5` | **재귀 트리 깊이** (1~10)<br/>• 예: `5` → 5단계 (1차→2차→3차→4차→5차)<br/>• 예: `3` → 3단계 (1차→2차→3차) |
| `skipIfExists` | boolean | ❌ | `true` | 이미 하위 프로젝트가 있는 경우 건너뛸지 여부<br/>• `"true"`, `"false"`, `"1"`, `"0"` 모두 허용 |

### 요청 예시

#### 1. 기본 생성 (5단계 트리)

```bash
curl -X POST "http://localhost:3000/admin/projects/generate-children" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**결과**: 각 상위 프로젝트마다 5단계 깊이의 재귀 트리 생성

#### 2. 3단계 트리 생성

```bash
curl -X POST "http://localhost:3000/admin/projects/generate-children" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "childCountPerProject": 3,
    "skipIfExists": true
  }'
```

**결과**: 1차 → 2차 → 3차 (3단계만)

#### 3. 10단계 깊은 트리 생성

```bash
curl -X POST "http://localhost:3000/admin/projects/generate-children" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "childCountPerProject": 10,
    "skipIfExists": false
  }'
```

**결과**: 1차 → 2차 → ... → 10차 (최대 깊이)

## 응답

### 성공 응답 (201 Created)

#### 예시: depth=5, 상위 11개 (하위 없음)

```json
{
  "success": true,
  "processedParentProjects": 11,
  "skippedParentProjects": 0,
  "totalChildProjectsCreated": 55,
  "failedChildProjects": 0,
  "duration": 8.432,
  "details": [
    {
      "parentProjectId": "98518c2c-d290-49ec-af5a-c2594a184296",
      "parentProjectName": "대박인ㄴ데ㅛㅇ",
      "childrenCreated": 5,
      "skipped": false,
      "errors": []
    },
    {
      "parentProjectId": "df062fe9-895c-4ae3-87a9-4ad3fb922599",
      "parentProjectName": "ㄱㄱㄱㄱ",
      "childrenCreated": 5,
      "skipped": false,
      "errors": []
    },
    {
      "parentProjectId": "9787c52f-ddd2-4256-ad60-596e27d34104",
      "parentProjectName": "옿키도키요",
      "childrenCreated": 5,
      "skipped": false,
      "errors": []
    }
  ],
  "errors": []
}
```

### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | boolean | 전체 작업 성공 여부 |
| `processedParentProjects` | number | 처리된 **최상위** 프로젝트 수 (parentProjectId가 null인 프로젝트) |
| `skippedParentProjects` | number | 건너뛴 최상위 프로젝트 수 (이미 하위가 있는 경우) |
| `totalChildProjectsCreated` | number | 생성된 하위 프로젝트 총 수 (모든 레벨 합산)<br/>• 예: 상위 11개 × depth 5 = 55개 |
| `failedChildProjects` | number | 실패한 하위 프로젝트 수 |
| `duration` | number | 소요 시간 (초) |
| `details` | array | 최상위 프로젝트별 상세 결과 |
| `details[].childrenCreated` | number | 해당 최상위 아래 생성된 재귀 트리 개수 (depth와 동일) |
| `errors` | array | 오류 메시지 목록 (있는 경우만) |

### 오류 응답

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "childCountPerProject must not be greater than 7",
  "error": "Bad Request"
}
```

#### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## 동작 방식

### 1. 최상위 프로젝트 조회

- `hierarchyLevel=parent` 필터로 최상위 프로젝트만 조회
- 최대 1000개까지 조회
- `parentProjectId IS NULL`인 프로젝트만 대상

### 2. 재귀 트리 생성

각 최상위 프로젝트마다:

1. **중복 확인**: 이미 하위가 있는지 확인
   - `skipIfExists=true`: 건너뛰기
   - `skipIfExists=false`: 추가 생성 (중복 허용)

2. **재귀 생성 로직** (depth 만큼 반복):

   ```
   currentParent = 최상위 프로젝트
   
   for level = 1 to depth:
     childProject = {
       name: "{currentParent.name} - {level}차 하위 프로젝트"
       projectCode: "{currentParent.projectCode}-SUB{level}"
       parentProjectId: currentParent.id  ✅ 부모 연결
       status: 최상위 프로젝트와 동일
       dates: 최상위 프로젝트와 동일
       managerId: 최상위 프로젝트와 동일 (DPM으로 간주)
     }
     
     currentParent = childProject  // 다음 단계의 부모로 설정
   ```

3. **생성 예시** (depth=5):
   - 1차: `"대박인ㄴ데ㅛㅇ - 1차 하위 프로젝트"` / `PRJ-2025-GDUR-SUB1` (parentId = 최상위 ID)
   - 2차: `"대박인ㄴ데ㅛㅇ - 2차 하위 프로젝트"` / `PRJ-2025-GDUR-SUB2` (parentId = 1차 ID)
   - 3차: `"대박인ㄴ데ㅛㅇ - 3차 하위 프로젝트"` / `PRJ-2025-GDUR-SUB3` (parentId = 2차 ID)
   - 4차: `"대박인ㄴ데ㅛㅇ - 4차 하위 프로젝트"` / `PRJ-2025-GDUR-SUB4` (parentId = 3차 ID)
   - 5차: `"대박인ㄴ데ㅛㅇ - 5차 하위 프로젝트"` / `PRJ-2025-GDUR-SUB5` (parentId = 4차 ID)

4. **오류 처리**:
   - 중간 단계 생성 실패 시 해당 트리는 중단
   - 다른 최상위 프로젝트는 계속 처리

### 3. 결과 반환

- 성공/실패 개수 (모든 레벨 합산)
- 최상위 프로젝트별 상세 결과
- 오류 메시지 (있는 경우)

## 사용 시나리오

### 1. 개발/테스트 환경 데이터 생성 (5단계 트리)

```bash
# 모든 최상위 프로젝트에 5단계 깊이의 재귀 트리 생성
POST /admin/projects/generate-children
{
  "childCountPerProject": 5
}
```

**결과**: 상위 11개 → 55개 하위 프로젝트 (11 × 5)

### 2. 얕은 트리 생성 (3단계)

```bash
# 3단계만 생성 (빠른 테스트용)
POST /admin/projects/generate-children
{
  "childCountPerProject": 3
}
```

**결과**: 1차 → 2차 → 3차 (3단계만)

### 3. 깊은 트리 생성 (10단계)

```bash
# 최대 깊이의 트리 생성
POST /admin/projects/generate-children
{
  "childCountPerProject": 10,
  "skipIfExists": false
}
```

**결과**: 1차 → 2차 → ... → 10차 (최대 깊이)

## 결과 확인

### 1. API로 확인 (재귀 구조 포함)

```bash
# 계층 구조로 조회 (재귀적으로 모든 하위 포함)
GET /admin/projects?hierarchyLevel=parent

# 응답 예시:
{
  "projects": [
    {
      "id": "...",
      "name": "상위 프로젝트",
      "childProjects": [
        {
          "id": "...",
          "name": "... - 1차 하위",
          "childProjects": [
            {
              "id": "...",
              "name": "... - 2차 하위",
              "childProjects": [...]  // 재귀적으로 계속
            }
          ]
        }
      ]
    }
  ]
}
```

```bash
# 모든 하위 프로젝트만 조회 (Flat 리스트)
GET /admin/projects?hierarchyLevel=child
```

### 2. 데이터베이스에서 확인

#### 직접 하위만 확인 (1단계)

```sql
-- 최상위 프로젝트별 직접 하위 개수 (childProjectCount)
SELECT 
  p.name,
  p."projectCode",
  COUNT(child.id) as direct_child_count
FROM project p
LEFT JOIN project child 
  ON child."parentProjectId" = p.id 
  AND child."deletedAt" IS NULL
WHERE p."deletedAt" IS NULL
  AND p."parentProjectId" IS NULL
GROUP BY p.id, p.name, p."projectCode"
ORDER BY direct_child_count DESC;
```

#### 재귀 트리 전체 확인

```sql
-- 재귀 CTE로 전체 트리 확인
WITH RECURSIVE project_tree AS (
  -- 최상위 프로젝트
  SELECT 
    id,
    name,
    "projectCode",
    "parentProjectId",
    0 as level,
    name as root_project
  FROM project
  WHERE "parentProjectId" IS NULL
    AND "deletedAt" IS NULL
  
  UNION ALL
  
  -- 하위 프로젝트 (재귀)
  SELECT 
    p.id,
    p.name,
    p."projectCode",
    p."parentProjectId",
    pt.level + 1,
    pt.root_project
  FROM project p
  INNER JOIN project_tree pt ON p."parentProjectId" = pt.id
  WHERE p."deletedAt" IS NULL
)
SELECT 
  root_project,
  level,
  COUNT(*) as count_at_level
FROM project_tree
WHERE level > 0
GROUP BY root_project, level
ORDER BY root_project, level;
```

**예상 결과** (depth=5):
```
root_project          | level | count_at_level
----------------------|-------|---------------
대박인ㄴ데ㅛㅇ        | 1     | 1
대박인ㄴ데ㅛㅇ        | 2     | 1
대박인ㄴ데ㅛㅇ        | 3     | 1
대박인ㄴ데ㅛㅇ        | 4     | 1
대박인ㄴ데ㅛㅇ        | 5     | 1
```

## 주의사항

### ⚠️ 운영 환경

- **운영 환경에서는 사용하지 마세요** (테스트/개발 전용)
- 백업 후 실행을 권장합니다
- 생성된 데이터는 실제 프로젝트 데이터가 됩니다
- **재귀 구조**이므로 삭제 시 CASCADE로 하위가 모두 삭제됩니다

### 💡 팁

1. **depth 조절**: 
   - 빠른 테스트: `depth=3`
   - 일반적: `depth=5` (기본값)
   - 깊은 테스트: `depth=10` (최대)

2. **skipIfExists**: 
   - 첫 실행: `true` (기본값, 중복 방지)
   - 추가 생성: `false` (이미 있어도 추가)

3. **성능 고려**:
   - 상위 11개 × depth 5 = 55개 생성
   - 소요 시간: 약 5~10초
   - depth 10: 약 10~15초

4. **데이터 정리**:
   - 불필요한 하위는 삭제하세요
   - CASCADE 설정으로 상위 삭제 시 하위 모두 삭제

### 🔄 롤백

생성된 재귀 트리를 삭제하려면:

#### 방법 1: SQL (CASCADE로 자동 삭제)

```sql
-- 특정 최상위 프로젝트의 1차 하위만 삭제 (CASCADE로 2차~5차 모두 자동 삭제)
DELETE FROM project 
WHERE "parentProjectId" = 'parent-project-id'
  AND "projectCode" LIKE '%-SUB1';

-- 예시: PRJ-0001의 전체 트리 삭제
DELETE FROM project 
WHERE "parentProjectId" = '0bab9609-2420-4073-8f82-fb702eb55801'
  AND "projectCode" = 'PRJ-0001-SUB1';
-- ✅ CASCADE로 SUB2, SUB3, SUB4, SUB5도 함께 삭제됨

-- 모든 하위 프로젝트 삭제 (⚠️ 주의!)
DELETE FROM project 
WHERE "parentProjectId" IS NOT NULL;
```

#### 방법 2: API로 개별 삭제

```bash
# 1차 하위만 삭제하면 CASCADE로 전체 트리 삭제
DELETE /admin/projects/{first-child-project-id}
```

#### 주의사항

- **CASCADE 설정**: `ON DELETE CASCADE`로 인해 상위 삭제 시 하위 모두 삭제
- **1차만 삭제**: 1차 하위를 삭제하면 2차~5차 모두 자동 삭제
- **복구 불가**: 소프트 삭제가 아닌 경우 복구 불가능

## Swagger UI

Swagger UI에서 직접 테스트할 수 있습니다:

1. http://localhost:3000/api-docs 접속
2. "B-0. 관리자 - 프로젝트 관리" 섹션 찾기
3. "POST /admin/projects/generate-children" 엔드포인트 찾기
4. "Try it out" 클릭
5. 파라미터 입력 후 "Execute"

## 예상 결과

### 12개의 상위 프로젝트가 있는 경우:

- `childCountPerProject=5`: 60개 하위 생성
- 랜덤 (3~5개): 36~60개 하위 생성
- 소요 시간: 약 30~60초

## 문제 해결

### "하위 프로젝트 수 제한 초과"

```json
{
  "errors": [
    "[프로젝트명] 1번째 하위 생성 실패: 상위 프로젝트는 최대 7개의 하위 프로젝트만 가질 수 있습니다."
  ]
}
```

→ 정상 동작입니다. 이미 7개가 있으면 더 생성되지 않습니다.

### "프로젝트 코드 중복"

```json
{
  "errors": [
    "[프로젝트명] 2번째 하위 생성 실패: 프로젝트 코드 PRJ-2025-GDUR-SUB2는 이미 사용 중입니다."
  ]
}
```

→ 같은 이름의 하위가 이미 존재합니다. `skipIfExists=true`로 설정하세요.

## 관련 API

- [프로젝트 목록 조회](./admin-project-list.md)
- [프로젝트 상세 조회](./admin-project-detail.md)
- [프로젝트 생성](./admin-project-create.md)

