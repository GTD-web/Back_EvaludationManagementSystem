# 데이터베이스 백업 및 복구 가이드

## 개요

평가관리시스템의 전체 데이터베이스를 백업하고 복구하는 스크립트입니다.

**✨ 추가 설치 불필요!** 이미 설치된 `pg` 라이브러리만으로 작동합니다.

## 사용 방법

### 1. 백업

```bash
npm run db:backup
```

### 2. 복구

```bash
npm run db:restore
```

- **2단계 선택 방식**으로 복구할 백업을 선택합니다
  - **1단계**: 백업 타입 선택 (hourly, daily, weekly, monthly, yearly, dumps)
  - **2단계**: 해당 타입의 백업 파일 중 선택
- 각 단계에서 `0`을 입력하면 취소 가능
- 특정 파일을 직접 지정하려면: `npm run db:restore -- <파일경로>`

**예시:**

**1단계 - 백업 타입 선택:**
```
📂 백업 타입을 선택하세요:

  1. hourly     - 4시간마다 (최근 24시간, 6개 유지) (6개)
  2. daily      - 매일 자정 (30일 보관) (15개)
  3. weekly     - 매주 일요일 (12주 보관) (4개)
  4. monthly    - 매월 1일 (12개월 보관) (2개)

  0. 취소

백업 타입 번호를 선택하세요 (1-4): 1
```

**2단계 - 파일 선택:**
```
📋 hourly 백업 파일 목록:

   1. backup-hourly-2025-12-17-16-00-00-030-KST.sql
      2025. 12. 17. 오후 4:00:00 (145.2 KB)
   2. backup-hourly-2025-12-17-12-00-00-030-KST.sql
      2025. 12. 17. 오후 12:00:00 (144.8 KB)
   3. backup-hourly-2025-12-17-08-00-00-015-KST.sql
      2025. 12. 17. 오전 8:00:00 (143.5 KB)

   0. 취소

복구할 백업 파일 번호를 선택하세요 (1-3): 1
```

**복구 시 처리:**
- 모든 테이블 데이터를 백업 파일로 완전히 교체
- **roles**: 백업 당시의 값 복구 (로그인 시 SSO에서 업데이트됨)
- **isAccessible**: 백업 당시의 값 복구 (SSO 동기화 시 변경되지 않음)

### 3. 테스트용 데이터 전체 삭제 (테스트 시에만 사용)

```bash
npm run db:test:clear
```

**끝!** PostgreSQL 클라이언트 도구 설치 없이 바로 사용 가능합니다.

## 디렉토리 구조

```
scripts/backup/
├── backup-pure.ts           # 백업 스크립트
├── restore-pure.ts          # 복구 스크립트
├── test-clear-all-data.ts   # 테스트용 데이터 삭제 스크립트
├── AUTO-BACKUP-README.md    # 자동 백업 시스템 가이드
├── TEST-RESTORE.md          # 백업/복구 테스트 가이드
└── README.md                # 이 파일
```

## 필수 요구사항

- Node.js (이미 설치됨)
- `pg` 라이브러리 (이미 설치됨)
- **추가 설치 불필요!**

## 환경 변수

다음 환경 변수가 필요합니다 (`.env` 파일에 설정):
- `DATABASE_HOST`: 데이터베이스 호스트
- `DATABASE_PORT`: 데이터베이스 포트 (기본값: 5432)
- `DATABASE_USERNAME`: 데이터베이스 사용자명
- `DATABASE_PASSWORD`: 데이터베이스 비밀번호
- `DATABASE_NAME`: 데이터베이스 이름
- `DATABASE_SSL`: SSL 사용 여부 (true/false)

## 특징

### ✅ 순수 Node.js 방식
- **추가 설치 불필요** - 이미 설치된 pg 라이브러리 사용
- Windows/Mac/Linux 모든 환경에서 작동
- **데이터 중심 백업** - 테이블 구조는 TypeORM이 관리
- **UUID 보존** - 복구 시 백업 당시의 UUID로 완전 복구
- **강제 덮어쓰기** - 기존 데이터를 모두 삭제하고 백업 데이터로 교체
- **KST 타임스탬프** - 파일명에 한국 시간(KST) 명시
- EC2에서도 바로 작동

## 백업 파일 명명 규칙

```
backup-{timestamp}-KST.sql
```

**예시:**
```
backup-2025-12-16-12-00-00-KST.sql
```

파일명에서 바로 한국 시간(KST)을 확인할 수 있습니다.

## EC2 배포 시

**추가 설정 불필요!** 바로 작동합니다.

```bash
npm run db:backup
npm run db:restore
```

## 자동 백업 시스템

백엔드 서버가 실행 중일 때 자동으로 주기적 백업이 수행됩니다.

- **4시간마다**: 00시, 04시, 08시, 12시, 16시, 20시 (KST)
- **매일 자정**: 30일 보관
- **매주 일요일**: 12주 보관
- **매월 1일**: 12개월 보관
- **분기말/연말**: 수동 관리

자세한 내용은 [AUTO-BACKUP-README.md](./AUTO-BACKUP-README.md)를 참고하세요.

## 주의사항

1. **백업 파일은 Git에 커밋되지 않습니다** (.gitignore에 포함)
2. **운영 환경에서는 자동 백업이 실행됩니다** (서버 실행 시 자동 활성화)
3. **복구 시 기존 데이터가 모두 삭제됩니다** - 신중하게 사용하세요
4. **백업 파일은 로컬 파일 시스템에 저장됩니다** (EC2 디스크 또는 /backup 디렉토리)
5. **Vercel 환경에서는 백업 기능이 자동으로 비활성화됩니다**

## 백업 파일 관리

### 자동 백업 파일 위치

```
/backup/
├── hourly/   # 4시간마다, 6개 파일 유지
├── daily/    # 매일, 30개 파일 유지
├── weekly/   # 매주, 12개 파일 유지
├── monthly/  # 매월, 12개 파일 유지
└── yearly/   # 분기말/연말, 수동 관리
```

### 수동 백업 파일 위치

```
scripts/backup/dumps/
```

- 수동 실행 시 백업 파일은 `scripts/backup/dumps/` 디렉토리에 저장됩니다
- 자동 백업 파일은 `/backup/` 디렉토리에 저장됩니다
- 오래된 백업 파일은 자동으로 삭제됩니다 (보관 기간에 따라)
- 중요한 백업은 외부 저장소(S3 등)에 별도 보관을 권장합니다

## 백업/복구 테스트

백업과 복구가 제대로 작동하는지 테스트하려면 [TEST-RESTORE.md](./TEST-RESTORE.md)를 참고하세요.

## 문제 해결

### 연결 오류가 발생하는 경우

`.env` 파일의 데이터베이스 연결 정보를 확인하세요.

```bash
DATABASE_HOST=your-database-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=your-database
DATABASE_SSL=true
```

### 권한 오류가 발생하는 경우

데이터베이스 사용자가 적절한 권한을 가지고 있는지 확인하세요.

### Vercel 환경에서 백업이 필요한 경우

Vercel은 서버리스 환경으로 파일 시스템 제약이 있습니다.
- EC2 별도 백업 서버 운영
- Supabase의 자동 백업 기능 활용
- AWS RDS 자동 백업 사용

## 관련 문서

- [AUTO-BACKUP-README.md](./AUTO-BACKUP-README.md) - 자동 백업 시스템 상세 가이드
- [TEST-RESTORE.md](./TEST-RESTORE.md) - 백업/복구 테스트 방법
- [BACKUP.md](./BACKUP.md) - 전체 백업 전략 문서 (있는 경우)
