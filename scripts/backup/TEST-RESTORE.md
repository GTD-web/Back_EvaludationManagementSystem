# 백업 복구 테스트 가이드

## 목적

백업이 제대로 작동하는지 테스트하기 위해 데이터를 삭제하고 복구하는 절차입니다.

## ⚠️ 주의사항

**운영 환경에서는 절대 실행하지 마세요!**
- 개발/테스트 환경에서만 사용하세요
- 모든 데이터가 삭제됩니다 (테이블 구조는 유지)
- 복구 전에 반드시 백업이 있는지 확인하세요

## 테스트 절차

### 1단계: 백업 생성

먼저 현재 데이터를 백업합니다:

```bash
npm run db:backup
```

백업 파일 위치 확인:
```
scripts/backup/dumps/backup-2025-12-12-04-20-53-951Z.sql
```

### 2단계: 모든 데이터 삭제 (테스트용)

**방법 1: Node.js 스크립트 사용 (권장)**

```bash
npm run db:test:clear
```

안전 확인 메시지가 나타납니다:
```
⚠️  경고: 이 작업은 모든 데이터를 삭제합니다!
정말로 모든 데이터를 삭제하시겠습니까? (yes/no): yes
```

**방법 2: SQL 파일 직접 실행**

```bash
psql -h <HOST> -U <USER> -d <DATABASE> -f scripts/backup/test-clear-all-data.sql
```

### 3단계: 데이터 삭제 확인

데이터베이스에 접속하여 확인:

```sql
-- 각 테이블의 행 수 확인
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.tables t WHERE t.table_name = tables.table_name) as row_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

모든 테이블이 0행이어야 합니다.

### 4단계: 백업 복구

```bash
npm run db:restore
```

**1단계 - 백업 타입 선택:**

```
📂 백업 타입을 선택하세요:

  1. hourly     - 4시간마다 (최근 24시간, 6개 유지) (6개)
  2. daily      - 매일 자정 (30일 보관) (15개)
  3. weekly     - 매주 일요일 (12주 보관) (4개)

  0. 취소

백업 타입 번호를 선택하세요 (1-3): 1
```

**2단계 - 파일 선택:**

```
📋 hourly 백업 파일 목록:

   1. backup-hourly-2025-12-17-16-00-00-030-KST.sql
      2025. 12. 17. 오후 4:00:00 (145.2 KB)
   2. backup-hourly-2025-12-17-12-00-00-030-KST.sql
      2025. 12. 17. 오후 12:00:00 (144.8 KB)
   
   0. 취소

복구할 백업 파일 번호를 선택하세요 (1-2): 1
```

**특정 백업 파일을 직접 지정하려면:**

```bash
npm run db:restore -- backup/daily/backup-daily-2025-12-17-00-00-00-KST.sql
```

### 5단계: 복구 확인

복구 후 데이터 확인:

```bash
# 애플리케이션 실행
npm run start:dev

# API 테스트
curl http://localhost:3000/api/admin/employees
curl http://localhost:3000/api/admin/departments
```

또는 데이터베이스에서 직접 확인:

```sql
-- 각 테이블의 행 수 확인
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY tablename;
```

## 자동화된 테스트 스크립트 (선택사항)

전체 프로세스를 자동으로 실행하려면:

```bash
# 1. 백업
npm run db:backup

# 2. 데이터 삭제
npm run db:test:clear

# 3. 복구
npm run db:restore

# 4. 확인 (애플리케이션 실행하여 테스트)
npm run start:dev
```

## 파일 설명

- `test-clear-all-data.sql`: SQL로 직접 실행할 수 있는 데이터 삭제 스크립트
- `test-clear-all-data.ts`: Node.js로 안전하게 실행하는 데이터 삭제 스크립트
- `TEST-RESTORE.md`: 이 가이드 문서

## 트러블슈팅

### Foreign Key 제약조건 오류

Foreign Key 제약조건으로 인해 삭제가 실패하는 경우:

```sql
-- 제약조건 일시 비활성화
SET session_replication_role = 'replica';

-- 데이터 삭제
TRUNCATE TABLE "table_name" CASCADE;

-- 제약조건 다시 활성화
SET session_replication_role = 'origin';
```

### 복구 실패

복구 중 오류가 발생하는 경우:

1. 백업 파일이 손상되지 않았는지 확인
2. 데이터베이스 연결 정보가 올바른지 확인
3. 충분한 디스크 공간이 있는지 확인
4. 로그를 확인하여 구체적인 오류 확인

## 성공 기준

✅ 모든 테이블의 데이터가 삭제됨
✅ 백업 파일로부터 모든 데이터가 복구됨
✅ 애플리케이션이 정상적으로 작동함
✅ API 요청이 정상적으로 처리됨
✅ 데이터 무결성이 유지됨 (FK, PK 제약조건)
✅ roles와 isAccessible이 백업 당시 값으로 복구됨

## 권한 관리

### 복구 시 처리

복구 완료 후 백업 당시의 권한 정보가 그대로 복원됩니다:

- **roles**: 백업 당시의 역할 정보 (로그인 시 SSO에서 업데이트됨)
- **isAccessible**: 백업 당시의 접근 권한 (SSO 동기화 시 변경되지 않음)

### 권한 확인

```sql
-- 현재 권한 정보 확인
SELECT 
  employee_number,
  name,
  email,
  roles,
  is_accessible
FROM employee
ORDER BY employee_number;
```

### 역할(roles) 업데이트

각 직원이 **로그인할 때** SSO에서 최신 역할을 자동으로 가져옵니다:

1. **관리자 로그인**: `systemRoles['EMS-PROD']`에 `'admin'`이 있으면 `roles`에 `['admin']` 저장
2. **일반 사용자 로그인**: `systemRoles['EMS-PROD']`에 따라 역할 저장

### 접근 권한(isAccessible) 관리

- **복구 시**: 백업 당시의 값 유지
- **SSO 동기화 시**: 변경되지 않음 (기존 값 보존)
- **신규 직원 생성 시**: 기본값 `false` (관리자가 수동으로 권한 부여 필요)
- **수동 변경**: 관리자가 직접 수정 가능

```sql
-- 특정 직원에게 접근 권한 부여
UPDATE employee 
SET is_accessible = true 
WHERE employee_number = '17007';
```

## 주의: 운영 환경

**운영 환경에서는 절대 이 스크립트를 실행하지 마세요!**

운영 환경 복구는 다음 절차를 따르세요:
1. 서비스 중단 공지
2. 현재 상태 추가 백업
3. 복구 계획 수립
4. 복구 실행
5. 데이터 검증
6. 서비스 재개

