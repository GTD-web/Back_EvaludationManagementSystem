# 프로젝트 계층 구조 조회 가이드

## 개요

프로젝트 목록 조회 시 **계층 구조**로 데이터를 반환합니다.
상위 프로젝트 안에 하위 프로젝트들이 nested되어 있어 한 눈에 구조를 파악할 수 있습니다.

## 계층 구조 vs Flat 구조

### 계층 구조 (기본)

상위 프로젝트 안에 하위 프로젝트들이 포함된 형태:

```json
{
  "projects": [
    {
      "id": "parent-1",
      "name": "EMS 프로젝트",
      "manager": { "name": "홍길동 (PM)" },
      "childProjects": [
        { "id": "child-1", "name": "EMS 프로젝트 - 1차 하위", "manager": { "name": "김철수 (DPM)" } },
        { "id": "child-2", "name": "EMS 프로젝트 - 2차 하위", "manager": { "name": "이영희 (DPM)" } }
      ],
      "childProjectCount": 2
    },
    {
      "id": "parent-2",
      "name": "HRM 프로젝트",
      "manager": { "name": "박민수 (PM)" },
      "childProjects": [...],
      "childProjectCount": 3
    }
  ]
}
```

### Flat 구조

모든 프로젝트가 1차원 배열로 나열:

```json
{
  "projects": [
    { "id": "child-1", "name": "EMS - 1차 하위", "parentProjectId": "parent-1" },
    { "id": "child-2", "name": "EMS - 2차 하위", "parentProjectId": "parent-1" },
    { "id": "child-3", "name": "HRM - 1차 하위", "parentProjectId": "parent-2" }
  ]
}
```

## API 사용법

### 1. 기본 조회 (계층 구조) ✨

**파라미터 없음 또는 `hierarchyLevel=parent`**

```bash
GET /admin/projects
# 또는
GET /admin/projects?hierarchyLevel=parent
```

**응답:**

```json
{
  "projects": [
    {
      "id": "98518c2c-d290-49ec-af5a-c2594a184296",
      "name": "대박인ㄴ데ㅛㅇ",
      "projectCode": "PRJ-2025-GDUR",
      "status": "ACTIVE",
      "manager": {
        "managerId": "604a5c05-e0c0-495f-97bc-b86046db4342",
        "employeeId": "75e5ae30-bfed-4998-bcbe-46d6e051a7d6",
        "name": "김종식",
        "email": "kim.jongsik@lumir.space"
      },
      "childProjects": [
        {
          "id": "child-1-id",
          "name": "대박인ㄴ데ㅛㅇ - 1차 하위 프로젝트",
          "projectCode": "PRJ-2025-GDUR-SUB1",
          "status": "ACTIVE",
          "managerId": "604a5c05-e0c0-495f-97bc-b86046db4342",
          "manager": {
            "managerId": "604a5c05-e0c0-495f-97bc-b86046db4342",
            "name": "김종식"
          }
        },
        {
          "id": "child-2-id",
          "name": "대박인ㄴ데ㅛㅇ - 2차 하위 프로젝트",
          "projectCode": "PRJ-2025-GDUR-SUB2",
          "status": "ACTIVE",
          "managerId": "604a5c05-e0c0-495f-97bc-b86046db4342",
          "manager": {
            "managerId": "604a5c05-e0c0-495f-97bc-b86046db4342",
            "name": "김종식"
          }
        }
      ],
      "childProjectCount": 2,
      "createdAt": "2025-12-08T07:44:17.147Z",
      "updatedAt": "2025-12-08T07:44:17.147Z",
      "isActive": true
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### 2. 하위 프로젝트만 조회 (Flat)

```bash
GET /admin/projects?hierarchyLevel=child
```

**응답:**

```json
{
  "projects": [
    {
      "id": "child-1-id",
      "name": "대박인ㄴ데ㅛㅇ - 1차 하위 프로젝트",
      "projectCode": "PRJ-2025-GDUR-SUB1",
      "parentProjectId": "98518c2c-d290-49ec-af5a-c2594a184296",
      "manager": {...}
    },
    {
      "id": "child-2-id",
      "name": "대박인ㄴ데ㅛㅇ - 2차 하위 프로젝트",
      "parentProjectId": "98518c2c-d290-49ec-af5a-c2594a184296",
      "manager": {...}
    }
  ],
  "total": 48
}
```

### 3. 특정 상위의 하위만 조회 (Flat)

```bash
GET /admin/projects?parentProjectId=98518c2c-d290-49ec-af5a-c2594a184296
```

**응답:**

```json
{
  "projects": [
    {
      "id": "child-1-id",
      "name": "대박인ㄴ데ㅛㅇ - 1차 하위 프로젝트",
      "parentProjectId": "98518c2c-d290-49ec-af5a-c2594a184296"
    },
    {
      "id": "child-2-id",
      "name": "대박인ㄴ데ㅛㅇ - 2차 하위 프로젝트",
      "parentProjectId": "98518c2c-d290-49ec-af5a-c2594a184296"
    }
  ],
  "total": 2
}
```

## 동작 로직

### 계층 구조 조회 (기본)

```typescript
// 1. 상위 프로젝트만 조회 (page, limit 적용)
const parents = await 목록_조회한다({ hierarchyLevel: 'parent' });

// 2. 각 상위 프로젝트의 하위 조회
for (const parent of parents) {
  parent.childProjects = await 하위_프로젝트_목록_조회한다(parent.id);
}

// 3. 계층 구조로 반환
return { projects: parents };
```

### Flat 조회 (hierarchyLevel=child 또는 parentProjectId 지정)

```typescript
// hierarchyLevel 또는 parentProjectId로 직접 필터링
const projects = await 목록_조회한다({
  filter: { hierarchyLevel: 'child' }
});

return { projects }; // childProjects 없음
```

## 페이징 동작

### 계층 구조에서의 페이징

- **페이징 기준**: 상위 프로젝트
- **limit=20**: 상위 프로젝트 20개 (각각의 하위는 전부 포함)
- **total**: 상위 프로젝트 총 개수

예시:
```
limit=10 → 상위 10개 + 각 상위의 모든 하위
상위 10개 × 평균 5개 하위 = 총 50개 프로젝트 반환
```

### Flat 구조에서의 페이징

- **페이징 기준**: 모든 프로젝트
- **limit=20**: 프로젝트 20개
- **total**: 전체 프로젝트 개수

## 필터 적용

### 계층 구조에서 필터

필터는 **상위 프로젝트**에만 적용됩니다:

```bash
# PM이 "김종식"인 상위 프로젝트 + 그 하위 전부
GET /admin/projects?managerId=604a5c05-e0c0-495f-97bc-b86046db4342

# 상태가 ACTIVE인 상위 프로젝트 + 그 하위 전부
GET /admin/projects?status=ACTIVE
```

### Flat 구조에서 필터

모든 프로젝트에 필터 적용:

```bash
# DPM이 "이영희"인 하위 프로젝트만
GET /admin/projects?hierarchyLevel=child&managerId=xxx
```

## UI 표시 예시

### React/Vue 등에서 트리 구조 렌더링

```typescript
// 계층 구조 데이터
const { projects } = await fetchProjects();

// 렌더링
projects.map(parent => (
  <ProjectCard key={parent.id}>
    <h3>{parent.name} (PM: {parent.manager.name})</h3>
    <div className="children">
      {parent.childProjects?.map(child => (
        <ProjectCard key={child.id} isChild>
          <h4>{child.name} (DPM: {child.manager.name})</h4>
        </ProjectCard>
      ))}
    </div>
  </ProjectCard>
));
```

### 테이블 표시 (접기/펼치기)

```typescript
const [expanded, setExpanded] = useState<Set<string>>(new Set());

projects.map(parent => (
  <>
    <tr onClick={() => toggleExpand(parent.id)}>
      <td>{expanded.has(parent.id) ? '▼' : '▶'} {parent.name}</td>
      <td>{parent.manager.name}</td>
      <td>{parent.childProjectCount}개</td>
    </tr>
    {expanded.has(parent.id) && parent.childProjects?.map(child => (
      <tr className="child-row">
        <td>&nbsp;&nbsp;└ {child.name}</td>
        <td>{child.manager.name}</td>
        <td>-</td>
      </tr>
    ))}
  </>
));
```

## 성능 고려사항

### 계층 구조 조회

- **장점**: 한 번의 요청으로 전체 구조 파악
- **단점**: 상위가 많으면 응답 크기가 커질 수 있음
- **권장**: limit을 적절히 설정 (기본 20개)

```bash
# 상위 10개만 조회 (각 하위 전부 포함)
GET /admin/projects?limit=10
```

### Flat 구조 조회

- **장점**: 빠른 응답, 가벼운 데이터
- **단점**: 구조 파악이 어려움
- **권장**: 특정 목적 (검색, 필터링) 시 사용

```bash
# 하위 프로젝트 검색
GET /admin/projects?hierarchyLevel=child&search=백엔드
```

## 마이그레이션 가이드

기존 Flat 구조를 사용하던 클라이언트:

### Before (Flat)

```typescript
// 모든 프로젝트가 1차원 배열
GET /admin/projects
→ [project1, project2, project3, ...]
```

### After (계층 구조)

```typescript
// 상위 안에 하위 nested
GET /admin/projects
→ [
  { ...parent1, childProjects: [...] },
  { ...parent2, childProjects: [...] }
]

// Flat이 필요하면 명시
GET /admin/projects?hierarchyLevel=child
→ [child1, child2, child3, ...]
```

## 관련 API

- [프로젝트 상세 조회](./admin-project-detail.md) - 단일 프로젝트 + 하위 전체
- [프로젝트 생성](./admin-project-create.md) - 상위/하위 프로젝트 생성
- [하위 프로젝트 자동 생성](./admin-project-generate-children.md) - 일괄 생성

