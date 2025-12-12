# 데이터베이스 백업 및 복구 가이드

## 개요

평가관리시스템의 전체 데이터베이스를 백업하고 복구하는 스크립트입니다.

**✨ 추가 설치 불필요!** 이미 설치된 `pg` 라이브러리만으로 작동합니다.

## 사용 방법 (권장)

### 1. 백업

```bash
npm run db:backup
```

### 2. 복구

```bash
npm run db:restore
```

**끝!** PostgreSQL 클라이언트 도구 설치 없이 바로 사용 가능합니다.

## 디렉토리 구조

```
scripts/backup/
├── dumps/              # 백업 파일 저장 (gitignore)
├── backup-pure.ts      # 백업 스크립트 (순수 Node.js) ⭐ 기본
├── restore-pure.ts     # 복구 스크립트 (순수 Node.js) ⭐ 기본
├── backup.ts           # 백업 스크립트 (pg_dump 필요)
├── restore.ts          # 복구 스크립트 (psql 필요)
├── backup.sh           # Shell 스크립트
├── backup.bat          # Windows Batch 스크립트
├── restore.sh          # Shell 스크립트
├── restore.bat         # Windows Batch 스크립트
└── README.md
```

## 필수 요구사항

### ✅ 기본 방식 (권장)
- Node.js (이미 설치됨)
- `pg` 라이브러리 (이미 설치됨)
- **추가 설치 불필요!**

### 📌 대체 방식 (선택사항)
PostgreSQL 클라이언트 도구를 설치하면 더 빠른 백업이 가능합니다:
```bash
# pg_dump/psql 방식 사용
npm run db:backup:pgdump
npm run db:restore:psql
```

```bash
# Linux/Mac
./scripts/backup/restore.sh scripts/backup/dumps/backup-20241212-143000.sql

# Windows
scripts\backup\restore.bat scripts\backup\dumps\backup-20241212-143000.sql
```

## 환경 변수

다음 환경 변수가 필요합니다 (`.env` 파일에 설정):
- `DATABASE_HOST`: 데이터베이스 호스트
- `DATABASE_PORT`: 데이터베이스 포트 (기본값: 5432)
- `DATABASE_USERNAME`: 데이터베이스 사용자명
- `DATABASE_PASSWORD`: 데이터베이스 비밀번호
- `DATABASE_NAME`: 데이터베이스 이름
- `DATABASE_SSL`: SSL 사용 여부 (true/false)

## 특징

### ✅ 순수 Node.js 방식 (기본)
- **추가 설치 불필요** - 이미 설치된 pg 라이브러리 사용
- Windows/Mac/Linux 모든 환경에서 작동
- 스키마 + 데이터 + 제약조건 완전 백업
- EC2에서도 바로 작동

### ⚡ pg_dump 방식 (선택사항)
- PostgreSQL 공식 백업 도구 사용
- 더 빠르고 안정적
- 대용량 데이터베이스에 적합
- PostgreSQL 클라이언트 도구 설치 필요

## EC2 배포 시

### 순수 Node.js 방식 (기본)
**추가 설정 불필요!** 바로 작동합니다.

```bash
npm run db:backup
npm run db:restore
```

### pg_dump 방식 사용 시
PostgreSQL 클라이언트만 설치하면 됩니다:

```bash
# Amazon Linux 2
sudo amazon-linux-extras install postgresql14

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

그 다음:
```bash
npm run db:backup:pgdump
npm run db:restore:psql
```

## 주의사항

1. **백업 파일은 Git에 커밋되지 않습니다** (.gitignore에 포함)
2. **운영 환경에서는 정기적으로 백업 실행을 권장합니다**
3. **복구 시 기존 데이터가 모두 삭제됩니다** - 신중하게 사용하세요
4. **백업 파일은 로컬 파일 시스템에 저장됩니다** (EC2 디스크)

## 자동 백업 설정 (선택사항)

EC2에서 cron을 사용하여 자동 백업을 설정할 수 있습니다:

```bash
# crontab 편집
crontab -e

# 매일 새벽 3시에 백업 실행
0 3 * * * cd /path/to/ems-backend && npm run db:backup
```

## 백업 파일 관리

- 백업 파일은 자동으로 날짜별로 생성됩니다
- 오래된 백업 파일은 수동으로 삭제하거나 별도 스크립트로 관리하세요
- 중요한 백업은 외부 저장소(S3 등)에 별도 보관을 권장합니다

## 사용 가능한 스크립트

### Node.js 버전 (기본, 추천)
```bash
npm run db:backup     # Node.js 기반 백업
npm run db:restore    # Node.js 기반 복구
```

### Shell 스크립트 버전
```bash
npm run db:backup:shell     # Shell 스크립트 백업 (Linux/Mac)
npm run db:restore:shell    # Shell 스크립트 복구 (Linux/Mac)
```

## 문제 해결

### pg_dump 또는 psql 명령을 찾을 수 없는 경우

PostgreSQL 클라이언트 도구가 설치되어 있고 PATH에 등록되어 있는지 확인하세요.

**Windows:**
1. [PostgreSQL 다운로드](https://www.postgresql.org/download/windows/)
2. 설치 시 "Command Line Tools" 선택
3. 설치 후 터미널 재시작

**Linux:**
```bash
sudo apt-get install postgresql-client
```

**Mac:**
```bash
brew install postgresql
```

### 권한 오류가 발생하는 경우

데이터베이스 사용자가 적절한 권한을 가지고 있는지 확인하세요.

