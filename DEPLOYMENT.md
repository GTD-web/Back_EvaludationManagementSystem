# GitHub Actions 자동 배포 설정 가이드

## 📋 전체 흐름

1. GitHub에 코드가 `master` 브랜치로 merge됨
2. GitHub Actions가 자동으로 실행됨
3. Actions가 EC2로 SSH 접속해서 다음을 수행:
   - `git fetch` 및 `git reset --hard origin/master`
   - `npm ci` (의존성 설치)
   - `npm run build` (빌드)
   - `pm2 restart lumir-evaluation-system` (서버 재시작)
4. 배포 완료 ✅

## 🔧 1. GitHub Secrets 설정

GitHub 저장소에서 다음 Secrets를 설정해야 합니다:

**경로**: GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

### 필요한 Secrets:

1. **EC2_HOST**
   - 값: EC2 서버의 공인 IP 주소 또는 도메인
   - 예시: `3.35.89.212` 또는 `ec2-xxx-xxx-xxx-xxx.compute-1.amazonaws.com`
   - 현재 서버 내부 IP: `172.31.43.228` (공인 IP는 AWS 콘솔에서 확인)

2. **EC2_USER**
   - 값: `ubuntu`
   - EC2 서버의 사용자명

3. **EC2_SSH_KEY**
   - 값: EC2 접속용 SSH Private Key (PEM 파일 전체 내용)
   - 로컬에서 사용 중인 PEM 파일을 열어서 **전체 내용**을 복사하여 붙여넣기
   - 예시:
     ```
     -----BEGIN RSA PRIVATE KEY-----
     MIIEpAIBAAKCAQEA...
     (전체 키 내용)
     -----END RSA PRIVATE KEY-----
     ```

### Secrets 설정 방법:

1. GitHub 저장소 페이지로 이동
2. Settings → Secrets and variables → Actions 클릭
3. "New repository secret" 버튼 클릭
4. 위의 3개 Secrets를 각각 추가

## 📁 2. 생성된 파일 확인

다음 파일들이 생성되었습니다:

- `.github/workflows/deploy-ec2.yml` - GitHub Actions 워크플로우 파일
- `.github/workflows/README.md` - 상세 설정 가이드

## 🚀 3. 배포 테스트

### 첫 배포 전 확인사항:

1. **EC2 서버 상태 확인**
   ```bash
   cd /home/ubuntu/services/Back_EvaludationManagementSystem
   pm2 list  # 서비스가 실행 중인지 확인
   ```

2. **Git 저장소 확인**
   ```bash
   git remote -v  # 원격 저장소가 올바르게 설정되어 있는지 확인
   git branch     # 현재 브랜치 확인
   ```

3. **워크플로우 파일 커밋 및 푸시**
   ```bash
   git add .github/workflows/deploy-ec2.yml
   git commit -m "Add GitHub Actions deployment workflow"
   git push origin master
   ```

### 배포 실행:

1. `master` 브랜치에 코드를 푸시하거나 PR을 merge하면 자동으로 배포가 시작됩니다
2. GitHub 저장소의 **Actions** 탭에서 배포 진행 상황을 확인할 수 있습니다

## ✅ 4. 배포 확인

배포가 완료되면 다음을 확인하세요:

### GitHub Actions에서 확인:
- Actions 탭에서 워크플로우 실행 상태 확인
- 초록색 체크 표시가 나타나면 성공

### EC2 서버에서 확인:
```bash
# 최신 커밋 확인
cd /home/ubuntu/services/Back_EvaludationManagementSystem
git log -1

# PM2 서비스 상태 확인
pm2 list

# 서비스 로그 확인
pm2 logs lumir-evaluation-system --lines 50

# 서비스 재시작 횟수 확인
pm2 info lumir-evaluation-system
```

### 브라우저에서 확인:
- `https://lkms.lumir.space` 접속하여 서비스가 정상 동작하는지 확인
- API 문서: `https://lkms.lumir.space/admin/api-docs`

## 🔍 5. 문제 해결

### 배포가 실패하는 경우:

1. **SSH 연결 실패**
   - EC2_HOST, EC2_USER, EC2_SSH_KEY가 올바르게 설정되었는지 확인
   - EC2 보안 그룹에서 SSH(22번 포트) 접근이 허용되어 있는지 확인
   - SSH 키 권한 확인 (로컬에서 `chmod 400 your-key.pem`)

2. **빌드 실패**
   - GitHub Actions 로그에서 에러 메시지 확인
   - EC2 서버에서 수동으로 빌드 테스트:
     ```bash
     cd /home/ubuntu/services/Back_EvaludationManagementSystem
     npm ci
     npm run build
     ```

3. **PM2 재시작 실패**
   - PM2가 설치되어 있는지 확인: `which pm2`
   - PM2 서비스 이름 확인: `pm2 list`
   - 수동으로 재시작 테스트:
     ```bash
     pm2 restart lumir-evaluation-system
     ```

### 수동 배포 (긴급 시):

배포가 계속 실패하는 경우, 수동으로 배포할 수 있습니다:

```bash
cd /home/ubuntu/services/Back_EvaludationManagementSystem
git pull origin master
npm ci
npm run build
pm2 restart lumir-evaluation-system
pm2 save
```

## 📝 6. 워크플로우 커스터마이징

필요에 따라 `.github/workflows/deploy-ec2.yml` 파일을 수정할 수 있습니다:

- **다른 브랜치로 배포**: `branches` 섹션 수정
- **배포 전 테스트 실행**: `npm test` 추가
- **환경 변수 설정**: `.env` 파일 처리 로직 추가
- **배포 알림**: Slack, Discord 등으로 알림 추가

## 🔐 보안 주의사항

- **절대로** SSH 키를 코드 저장소에 커밋하지 마세요
- GitHub Secrets만 사용하여 민감한 정보를 관리하세요
- EC2 보안 그룹에서 불필요한 포트는 닫아두세요
- 정기적으로 SSH 키를 갱신하는 것을 권장합니다

## 📚 참고 자료

- [GitHub Actions 공식 문서](https://docs.github.com/en/actions)
- [appleboy/ssh-action 문서](https://github.com/appleboy/ssh-action)
- [PM2 공식 문서](https://pm2.keymetrics.io/docs/usage/quick-start/)

