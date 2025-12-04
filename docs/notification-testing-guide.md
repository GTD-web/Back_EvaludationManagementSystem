# 알림 전송 테스트 가이드

## 📋 테스트 목적

자기평가 제출과 1차 하향평가 제출 시 알림이 올바르게 생성되는지 검증합니다.

## 🔧 사전 준비

### 1. 환경변수 확인
```bash
# .env 파일에서 확인
MAIL_NOTIFICATION_SSO=E999999  # Portal 사용자 사번
```

### 2. 테스트 데이터 준비
- 평가기간 생성 및 활성화
- 직원 등록 (피평가자, 1차 평가자, 2차 평가자)
- 평가라인 매핑 설정
- WBS 항목 생성 및 할당

### 3. FCM 토큰 등록 확인
```bash
# SSO에 FCM 토큰이 등록되어 있는지 확인
curl -X GET "https://lsso.vercel.app/api/fcm/tokens?employeeNumber=E999999" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🧪 테스트 시나리오

### 시나리오 1: 자기평가 제출 (피평가자 → 1차 평가자)

#### 1.1. 자기평가 작성
```bash
POST /api/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId}
Content-Type: application/json

{
  "selfEvaluationContent": "테스트 자기평가 내용",
  "selfEvaluationScore": 100,
  "performanceResult": "테스트 성과 실적"
}
```

**기대 결과**: 
- HTTP 200 OK
- 자기평가 ID 반환

#### 1.2. 자기평가 제출 (1차 평가자에게)
```bash
PATCH /api/wbs-self-evaluations/{evaluationId}/submit-to-evaluator
```

**기대 결과**:
- HTTP 200 OK
- `submittedToEvaluator: true`
- `submittedToEvaluatorAt`: 제출 일시

**서버 로그 확인**:
```
[SubmitWbsSelfEvaluationToEvaluatorHandler] WBS 자기평가 제출 핸들러 실행 (피평가자 → 1차 평가자)
[NotificationHelperService] 알림 전송 시작: 제목="WBS 자기평가 제출 알림", 수신자 수=1
[NotificationHelperService] FCM 토큰 조회 중: [evaluatorId]
[NotificationHelperService] FCM 토큰 조회 완료: 1명의 수신자, 총 N개 토큰
[NotificationHelperService] 알림 전송 성공: notificationId=xxx, 수신자=1명
[SubmitWbsSelfEvaluationToEvaluatorHandler] WBS 자기평가 제출 알림 전송 완료: 평가자=[evaluatorId]
```

#### 1.3. 1차 평가자 알림 확인
```bash
GET /api/notifications/{evaluatorId}?skip=0&take=10
```

**기대 결과**:
```json
{
  "notifications": [
    {
      "id": "notification-id",
      "title": "WBS 자기평가 제출 알림",
      "content": "[평가기간명] 평가기간의 WBS 자기평가가 제출되었습니다.",
      "isRead": false,
      "recipientId": "evaluator-id",
      "metadata": {
        "type": "self-evaluation-submitted",
        "priority": "medium",
        "employeeId": "employee-id",
        "periodId": "period-id"
      },
      "createdAt": "2024-12-04T..."
    }
  ],
  "total": 1,
  "unreadCount": 1
}
```

### 시나리오 2: 1차 하향평가 제출 (1차 평가자 → 2차 평가자)

#### 2.1. 1차 하향평가 작성
```bash
POST /api/downward-evaluations/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId}/primary
Content-Type: application/json

{
  "evaluatorId": "primary-evaluator-id",
  "downwardEvaluationContent": "테스트 1차 하향평가 내용",
  "downwardEvaluationScore": 90
}
```

**기대 결과**:
- HTTP 200 OK
- 1차 하향평가 ID 반환

#### 2.2. 1차 하향평가 제출
```bash
POST /api/downward-evaluations/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId}/primary/submit
Content-Type: application/json

{
  "evaluatorId": "primary-evaluator-id"
}
```

**기대 결과**:
- HTTP 200 OK
- 제출 성공 메시지

**서버 로그 확인** (수정 후):
```
[SubmitDownwardEvaluationHandler] 하향평가 제출 핸들러 실행
[SubmitDownwardEvaluationHandler] 2차 평가자 조회 중...
[NotificationHelperService] 알림 전송 시작: 제목="1차 하향평가 제출 알림", 수신자 수=1
[NotificationHelperService] FCM 토큰 조회 중: [secondaryEvaluatorId]
[NotificationHelperService] FCM 토큰 조회 완료: 1명의 수신자, 총 N개 토큰
[NotificationHelperService] 알림 전송 성공: notificationId=xxx, 수신자=1명
[SubmitDownwardEvaluationHandler] 2차 평가자에게 1차 하향평가 제출 알림 전송 완료: 평가자=[secondaryEvaluatorId]
[NotificationHelperService] Portal 알림 전송 시작: 제목="1차 하향평가 제출 알림"
[NotificationHelperService] Portal 알림 전송 성공: notificationId=xxx, 토큰=N개
[SubmitDownwardEvaluationHandler] Portal 사용자에게 1차 하향평가 제출 알림 전송 완료
```

#### 2.3. 2차 평가자 알림 확인
```bash
GET /api/notifications/{secondaryEvaluatorId}?skip=0&take=10
```

**기대 결과**:
```json
{
  "notifications": [
    {
      "id": "notification-id",
      "title": "1차 하향평가 제출 알림",
      "content": "[평가기간명] 평가기간의 1차 하향평가가 제출되었습니다.",
      "isRead": false,
      "recipientId": "secondary-evaluator-id",
      "metadata": {
        "type": "downward-evaluation-submitted",
        "evaluationType": "primary",
        "priority": "medium",
        "employeeId": "employee-id",
        "periodId": "period-id",
        "wbsId": "wbs-id"
      },
      "createdAt": "2024-12-04T..."
    }
  ],
  "total": 1,
  "unreadCount": 1
}
```

#### 2.4. Portal 사용자 알림 확인
```bash
GET /api/notifications/{MAIL_NOTIFICATION_SSO}?skip=0&take=10
```

**기대 결과**:
```json
{
  "notifications": [
    {
      "id": "notification-id",
      "title": "1차 하향평가 제출 알림",
      "content": "[평가기간명] 평가기간의 1차 하향평가가 제출되었습니다.",
      "isRead": false,
      "recipientId": "portal-user-id",
      "metadata": {
        "type": "downward-evaluation-submitted",
        "evaluationType": "primary",
        "priority": "medium",
        "employeeId": "employee-id",
        "periodId": "period-id",
        "wbsId": "wbs-id"
      },
      "createdAt": "2024-12-04T..."
    }
  ],
  "total": 1,
  "unreadCount": 1
}
```

## 🔍 디버깅 가이드

### 알림이 생성되지 않는 경우

#### 1. 평가자 조회 실패
**로그 확인**:
```
[SubmitWbsSelfEvaluationToEvaluatorHandler] 1차 평가자를 찾을 수 없어 알림을 전송하지 않습니다. employeeId=xxx, periodId=xxx
```

**원인**:
- 평가라인 매핑이 설정되지 않음
- 평가기간-직원 매핑이 없음

**해결 방법**:
```sql
-- 평가라인 매핑 확인
SELECT * FROM evaluation_line_mapping 
WHERE evaluation_period_id = 'period-id' 
  AND employee_id = 'employee-id';

-- 평가라인 확인
SELECT * FROM evaluation_lines 
WHERE id IN (SELECT evaluation_line_id FROM evaluation_line_mapping WHERE ...);
```

#### 2. FCM 토큰 없음
**로그 확인**:
```
[NotificationHelperService] FCM 토큰이 있는 수신자가 없습니다. 요청된 직원: [employeeId]
```

**원인**:
- SSO에 FCM 토큰이 등록되지 않음

**해결 방법**:
```bash
# FCM 토큰 등록
POST https://lsso.vercel.app/api/fcm/subscribe
Content-Type: application/json

{
  "employeeNumber": "E999999",
  "fcmToken": "fcm-token-from-firebase",
  "deviceType": "android" # or "ios", "portal-prod", etc.
}
```

#### 3. Portal deviceType 필터링
**로그 확인**:
```
[NotificationHelperService] Portal FCM 토큰이 없습니다. 직원번호: [employeeNumber]
```

**원인**:
- deviceType에 'portal'이 포함되지 않음

**해결 방법**:
- deviceType을 "portal-prod", "portal-dev" 등으로 설정
- 또는 기존 토큰의 deviceType 업데이트

#### 4. SSO 서비스 오류
**로그 확인**:
```
[NotificationHelperService] 알림 전송 중 오류 발생: ...
[SSOServiceImpl] FCM 토큰 조회 실패
```

**원인**:
- SSO 서버 연결 실패
- SSO 인증 실패
- 네트워크 오류

**해결 방법**:
```bash
# SSO 서버 상태 확인
curl https://lsso.vercel.app/health

# SSO 클라이언트 재초기화
# 서버 재시작 또는 환경변수 확인
```

## 📊 테스트 체크리스트

### 자기평가 제출
- [ ] 자기평가 작성 성공
- [ ] 자기평가 제출 성공
- [ ] 1차 평가자 employeeId 조회 성공
- [ ] SSO에서 FCM 토큰 조회 성공
- [ ] 알림 전송 성공
- [ ] 1차 평가자 알림 목록에서 확인 가능
- [ ] Portal 사용자 알림 목록에서 확인 가능

### 1차 하향평가 제출
- [ ] 1차 하향평가 작성 성공
- [ ] 1차 하향평가 제출 성공
- [ ] 2차 평가자 employeeId 조회 성공 (수정 후)
- [ ] SSO에서 2차 평가자 FCM 토큰 조회 성공 (수정 후)
- [ ] 2차 평가자에게 알림 전송 성공 (수정 후)
- [ ] 2차 평가자 알림 목록에서 확인 가능 (수정 후)
- [ ] Portal 사용자에게도 알림 전송 성공
- [ ] Portal 사용자 알림 목록에서 확인 가능

### Portal deviceType 필터링
- [ ] Portal 사용자의 FCM 토큰 조회 성공
- [ ] deviceType에 'portal'이 포함된 토큰만 필터링
- [ ] 필터링된 토큰으로 알림 전송 성공

## 🚀 자동화 테스트 실행

### E2E 테스트 실행
```bash
# 알림 흐름 테스트
npm test -- test/integration/notification-flow.e2e-spec.ts

# 상세 로그 테스트
npm test -- test/integration/notification-detailed-log.e2e-spec.ts

# 전체 알림 관련 테스트
npm test -- --testPathPattern=notification
```

### 테스트 커버리지 확인
```bash
npm test -- --coverage --testPathPattern=notification
```

## 📝 참고 사항

1. **비동기 처리**: 알림 전송은 비동기로 처리되므로, 평가 제출이 성공해도 알림 전송이 실패할 수 있습니다.
2. **로그 레벨**: 디버깅 시 `LOG_LEVEL=debug`로 설정하면 더 상세한 로그를 확인할 수 있습니다.
3. **FCM 토큰 갱신**: FCM 토큰은 주기적으로 갱신되므로, 테스트 전에 최신 토큰인지 확인하세요.
4. **환경 구분**: 개발/운영 환경에 따라 SSO 서버 URL과 deviceType이 다를 수 있습니다.

## 🔗 관련 문서

- [알림 전송 문제 수정 요약](./notification-fix-summary.md)
- [Interface 레이어 코딩 규칙](../src/interface/AGENTS.md)
- [SSO 사용법](../src/domain/common/sso/sso-사용법.md)

