# GitHub Actions 자동 배포 설정 가이드

## 개요
이 워크플로우는 `master` 브랜치에 코드가 푸시되면 자동으로 EC2 서버에 배포합니다.

## 사전 준비 사항

### 1. EC2 서버 준비
- Git, Node.js, PM2가 설치되어 있어야 합니다
- 프로젝트가 `/home/ubuntu/services/Back_EvaludationManagementSystem` 경로에 클론되어 있어야 합니다
- PM2로 `lumir-evaluation-system` 이름으로 서비스가 실행 중이어야 합니다

### 2. GitHub Secrets 설정
GitHub 저장소의 Settings → Secrets and variables → Actions에서 다음 Secrets를 추가하세요:

- **EC2_HOST**: EC2 서버의 IP 주소 또는 도메인 (예: `3.35.89.212`)
- **EC2_USER**: EC2 서버의 사용자명 (예: `ubuntu`)
- **EC2_SSH_KEY**: EC2 서버 접속용 SSH Private Key (PEM 파일 전체 내용)

#### SSH Key 설정 방법:
1. 로컬에서 사용 중인 PEM 파일을 열어서 전체 내용을 복사
2. GitHub Secrets에 `EC2_SSH_KEY`로 저장 (전체 내용을 그대로 붙여넣기)

### 3. EC2 보안 그룹 설정
- SSH(22번 포트) 접근이 허용되어 있어야 합니다
- GitHub Actions IP 대역을 허용하거나, SSH 키 인증만으로 충분합니다

## 배포 프로세스

1. **코드 푸시**: `master` 브랜치에 코드가 푸시되면 자동으로 트리거됩니다
2. **코드 체크아웃**: GitHub Actions가 최신 코드를 체크아웃합니다
3. **SSH 접속**: EC2 서버로 SSH 접속합니다
4. **코드 업데이트**: `git fetch` 및 `git reset --hard origin/master`로 최신 코드로 업데이트
5. **의존성 설치**: `npm ci`로 패키지 설치
6. **빌드**: `npm run build`로 프로젝트 빌드
7. **서버 재시작**: PM2로 `lumir-evaluation-system` 서비스 재시작

## 배포 확인

배포가 완료되면:
1. GitHub Actions 탭에서 워크플로우 실행 상태 확인
2. EC2 서버에서 다음 명령어로 확인:
   ```bash
   cd /home/ubuntu/services/Back_EvaludationManagementSystem
   git log -1  # 최신 커밋 확인
   pm2 list    # PM2 서비스 상태 확인
   pm2 logs lumir-evaluation-system --lines 50  # 로그 확인
   ```
3. 브라우저에서 `https://lkms.lumir.space` 접속하여 서비스 동작 확인

## 문제 해결

### 배포 실패 시
1. GitHub Actions 로그 확인
2. EC2 서버에서 수동으로 다음 명령어 실행하여 문제 확인:
   ```bash
   cd /home/ubuntu/services/Back_EvaludationManagementSystem
   git pull origin master
   npm ci
   npm run build
   pm2 restart lumir-evaluation-system
   ```

### SSH 연결 실패 시
- EC2_HOST, EC2_USER, EC2_SSH_KEY가 올바르게 설정되었는지 확인
- EC2 보안 그룹에서 SSH 접근이 허용되어 있는지 확인
- SSH 키 권한이 올바른지 확인 (400 또는 600)

### 빌드 실패 시
- `package.json`의 빌드 스크립트 확인
- Node.js 버전이 호환되는지 확인
- 의존성 설치 오류가 없는지 확인

