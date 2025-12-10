# 역할 기반 접근 제어(RBAC) 테스트 가이드

## 개요

이 테스트는 EMS 시스템의 역할 기반 접근 제어(Role-Based Access Control)가 올바르게 작동하는지 검증합니다.

## 테스트 범위

### 1. Admin 역할 테스트
- ✅ `/admin/*` 엔드포인트 접근 가능
- ❌ `/evaluator/*` 엔드포인트 접근 차단 (403 Forbidden)
- ❌ `/user/*` 엔드포인트 접근 차단 (403 Forbidden)
- ✅ `isAccessible=true`인 경우만 접근 가능

### 2. Evaluator 역할 테스트
- ✅ `/evaluator/*` 엔드포인트 접근 가능
- ❌ `/admin/*` 엔드포인트 접근 차단 (403 Forbidden)
- ❌ `/user/*` 엔드포인트 접근 차단 (403 Forbidden)
- ✅ `isAccessible=true`인 경우만 접근 가능

### 3. User 역할 테스트
- ✅ `/user/*` 엔드포인트 접근 가능
- ❌ `/admin/*` 엔드포인트 접근 차단 (403 Forbidden)
- ❌ `/evaluator/*` 엔드포인트 접근 차단 (403 Forbidden)
- ✅ `isAccessible=true`인 경우만 접근 가능

### 4. 복합 역할 테스트
- `admin + user`: admin과 user 엔드포인트 모두 접근 가능
- `evaluator + user`: evaluator와 user 엔드포인트 모두 접근 가능
- `admin + evaluator + user`: 모든 엔드포인트 접근 가능

### 5. 관리자 권한 체크 (isAccessible)
- Admin, Evaluator, User 모두 `isAccessible=false`면 접근 차단
- 역할 라벨에 맞는 에러 메시지 반환

### 6. 역할 없음 테스트
- 역할이 비어있으면 모든 보호된 엔드포인트 접근 차단

## 사전 요구사항

### Docker 설치 (권장)

E2E 테스트는 PostgreSQL 테스트 컨테이너를 사용합니다. Docker가 설치되어 있어야 합니다.

**Windows:**
- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) 다운로드 및 설치
- Docker Desktop 실행 확인

**macOS:**
- [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) 다운로드 및 설치
- Docker Desktop 실행 확인

**Linux:**
```bash
# Docker 설치
sudo apt-get update
sudo apt-get install docker.io

# Docker 시작
sudo systemctl start docker
sudo systemctl enable docker
```

### Docker 없이 실행 (대안)

로컬 PostgreSQL을 사용할 수도 있습니다:

1. PostgreSQL 설치 및 실행
2. 테스트용 데이터베이스 생성:
```sql
CREATE DATABASE test_db;
```
3. 환경 변수 설정:
```bash
export DATABASE_URL=postgresql://postgres:password@localhost:5432/test_db
export DATABASE_HOST=localhost
export DATABASE_PORT=5432
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=password
export DATABASE_NAME=test_db
```

## 테스트 실행 방법

### Docker 상태 확인

```bash
# Windows/macOS
# Docker Desktop이 실행 중인지 확인

# Linux
sudo systemctl status docker
```

### 단일 테스트 파일 실행
```bash
npm run test:e2e -- role-based-access-control.e2e-spec.ts
```

### 모든 interface 테스트 실행
```bash
npm run test:e2e -- test/interface
```

### watch 모드로 실행
```bash
npm run test:e2e:watch -- role-based-access-control.e2e-spec.ts
```

## 테스트 케이스 구조

```
역할 기반 접근 제어(RBAC) E2E 테스트
├── Admin 역할 접근 제어
│   ├── ✅ Admin 역할이 자신의 엔드포인트에 접근
│   │   ├── GET /admin/auth/me
│   │   ├── GET /admin/dashboard
│   │   └── GET /admin/employees
│   └── ❌ Admin 역할이 다른 역할의 엔드포인트에 접근 차단
│       ├── GET /evaluator/auth/me (403)
│       ├── GET /user/auth/me (403)
│       ├── GET /evaluator/dashboard (403)
│       └── GET /user/dashboard (403)
│
├── Evaluator 역할 접근 제어
│   ├── ✅ Evaluator 역할이 자신의 엔드포인트에 접근
│   │   ├── GET /evaluator/auth/me
│   │   ├── GET /evaluator/dashboard
│   │   └── GET /evaluator/employees
│   └── ❌ Evaluator 역할이 다른 역할의 엔드포인트에 접근 차단
│       ├── GET /admin/auth/me (403)
│       ├── GET /user/auth/me (403)
│       ├── GET /admin/employees (403)
│       └── GET /user/dashboard (403)
│
├── User 역할 접근 제어
│   ├── ✅ User 역할이 자신의 엔드포인트에 접근
│   │   ├── GET /user/auth/me
│   │   └── GET /user/dashboard
│   └── ❌ User 역할이 다른 역할의 엔드포인트에 접근 차단
│       ├── GET /admin/auth/me (403)
│       ├── GET /evaluator/auth/me (403)
│       ├── GET /admin/employees (403)
│       ├── GET /evaluator/employees (403)
│       └── GET /admin/dashboard (403)
│
├── 복합 역할(Multiple Roles) 접근 제어
│   ├── admin + user 역할
│   ├── evaluator + user 역할
│   └── admin + evaluator + user 역할
│
├── 관리자 권한 체크 (isAccessible)
│   ├── admin 역할 + isAccessible=false
│   ├── evaluator 역할 + isAccessible=false
│   └── user 역할 + isAccessible=false
│
└── 역할 없음 (빈 배열) 접근 제어
    ├── GET /admin/auth/me (403)
    ├── GET /evaluator/auth/me (403)
    └── GET /user/auth/me (403)
```

## 주요 검증 사항

### 1. 역할별 접근 제어
각 역할은 자신에게 할당된 엔드포인트에만 접근할 수 있습니다.

### 2. 403 Forbidden 에러 메시지
접근이 차단될 때 역할에 맞는 에러 메시지가 반환됩니다:
- Admin 엔드포인트: "이 작업을 수행할 권한이 없습니다. 필요한 역할: admin"
- Evaluator 엔드포인트: "이 작업을 수행할 권한이 없습니다. 필요한 역할: evaluator"
- User 엔드포인트: "이 작업을 수행할 권한이 없습니다. 필요한 역할: user"

### 3. isAccessible 체크
`isAccessible=false`인 경우 역할 라벨에 맞는 에러 메시지가 반환됩니다:
- Admin: "EMS 관리자 권한이 없습니다"
- Evaluator: "EMS 평가자 권한이 없습니다"
- User: "EMS 유저 권한이 없습니다"

## 테스트 데이터 구조

```typescript
// Admin 권한 직원
{
  email: 'admin@test.com',
  name: 'Admin User',
  employeeNumber: 'ADMIN001',
  roles: ['admin'],
  isAccessible: true
}

// Evaluator 권한 직원
{
  email: 'evaluator@test.com',
  name: 'Evaluator User',
  employeeNumber: 'EVAL001',
  roles: ['evaluator'],
  isAccessible: true
}

// User 권한 직원
{
  email: 'user@test.com',
  name: 'Normal User',
  employeeNumber: 'USER001',
  roles: ['user'],
  isAccessible: true
}
```

## 관련 파일

- **테스트 파일**: `test/interface/role-based-access-control.e2e-spec.ts`
- **Guards**: `src/interface/common/guards/roles.guard.ts`
- **Decorators**: 
  - `src/interface/common/decorators/roles.decorator.ts`
  - `src/interface/common/decorators/auth/auth.decorators.ts`
- **Module 설정**:
  - `src/interface/admin/admin-interface.module.ts`
  - `src/interface/evaluator/evaluator-interface.module.ts`
  - `src/interface/user/user-interface.module.ts`

## 예상 결과

모든 테스트가 통과하면 역할 기반 접근 제어가 올바르게 작동하는 것입니다.

```
 PASS  test/interface/role-based-access-control.e2e-spec.ts
  역할 기반 접근 제어(RBAC) E2E 테스트
    Admin 역할 접근 제어
      ✅ Admin 역할이 자신의 엔드포인트에 접근
        ✓ GET /admin/auth/me - Admin만 접근 가능
        ✓ GET /admin/dashboard - Admin 대시보드 접근 가능
        ✓ GET /admin/employees - Admin 직원 관리 접근 가능
      ❌ Admin 역할이 다른 역할의 엔드포인트에 접근 차단
        ✓ GET /evaluator/auth/me - Evaluator 엔드포인트 접근 차단 (403)
        ✓ GET /user/auth/me - User 엔드포인트 접근 차단 (403)
        ...
```

## 문제 해결

### "Could not find a working container runtime strategy" 에러

이 에러는 Docker가 실행되지 않았을 때 발생합니다.

**해결 방법:**

1. **Docker Desktop 실행 (권장)**
   - Windows/macOS: Docker Desktop 앱을 실행
   - Linux: `sudo systemctl start docker`

2. **로컬 PostgreSQL 사용 (대안)**
   - PostgreSQL을 설치하고 실행
   - 환경 변수를 설정 (위의 "사전 요구사항" 참조)

### 테스트 실패 시 확인 사항

1. **RolesGuard 설정 확인**
   - 각 모듈에서 `ROLES_GUARD_OPTIONS`가 올바르게 설정되어 있는지 확인

2. **@Roles() 데코레이터 확인**
   - 모든 컨트롤러 클래스에 `@Roles()` 데코레이터가 추가되어 있는지 확인

3. **Auth 데코레이터 확인**
   - `/admin/auth/me`: `@GetMeAsAdmin()`
   - `/evaluator/auth/me`: `@GetMeAsEvaluator()`
   - `/user/auth/me`: `@GetMeAsUser()`

4. **데이터베이스 상태 확인**
   - 테스트 데이터가 올바르게 생성되었는지 확인
   - `isAccessible` 필드가 올바른 값으로 설정되어 있는지 확인

### Docker 관련 문제

**문제: Docker Desktop이 시작되지 않음**
- 시스템을 재시작하고 다시 시도
- Docker Desktop을 재설치

**문제: 포트 충돌**
- 로컬 PostgreSQL이 5432 포트를 사용 중인 경우, 중지 필요
- Windows: `services.msc`에서 PostgreSQL 서비스 중지
- macOS/Linux: `sudo systemctl stop postgresql`

**문제: 권한 문제 (Linux)**
```bash
# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 재로그인 또는 다음 명령어 실행
newgrp docker
```

## 추가 테스트 케이스 제안

필요에 따라 다음 테스트 케이스를 추가할 수 있습니다:

1. **토큰 없이 접근 (401 Unauthorized)**
2. **만료된 토큰으로 접근 (401 Unauthorized)**
3. **잘못된 형식의 토큰으로 접근 (401 Unauthorized)**
4. **다른 컨트롤러 엔드포인트 접근 제어 검증**
   - 평가 기간 관리
   - 평가 기준 관리
   - 성과평가 관리 등

