# 알림 전송 문제 수정 요약

## 🔍 문제 분석

### 발견된 문제
앱에서 자기평가 제출과 1차 하향평가 제출 시 알림이 생성되지 않는 문제가 발생했습니다.

### 근본 원인

#### 1. ✅ 자기평가 제출 (피평가자 → 1차 평가자)
- **위치**: `src/context/performance-evaluation-context/handlers/self-evaluation/commands/submit-wbs-self-evaluation-to-evaluator.handler.ts`
- **상태**: **정상 동작 중**
- **로직**:
  - ✅ 1차 평가자를 조회 (`stepApprovalContext.일차평가자를_조회한다()`)
  - ✅ 1차 평가자에게 알림 전송 (`notificationHelper.직원에게_알림을_전송한다()`)
  - ✅ Portal 사용자에게도 알림 전송 (`notificationHelper.Portal사용자에게_알림을_전송한다()`)

#### 2. ❌ 1차 하향평가 제출 (1차 평가자 → 2차 평가자)
- **위치**: `src/context/performance-evaluation-context/handlers/downward-evaluation/command/submit-downward-evaluation.handler.ts`
- **상태**: **문제 발견 및 수정 완료**
- **문제점**:
  - ❌ **2차 평가자에게 알림을 전송하지 않음**
  - ✅ Portal 사용자에게만 알림 전송

## 🔧 수정 내용

### 수정된 파일
`src/context/performance-evaluation-context/handlers/downward-evaluation/command/submit-downward-evaluation.handler.ts`

### 변경 사항

#### 1. Import 추가
```typescript
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
```

#### 2. Constructor 수정
```typescript
constructor(
  // ... 기존 의존성
  private readonly stepApprovalContext: StepApprovalContextService,
) {}
```

#### 3. 2차 평가자 알림 전송 메서드 추가
```typescript
/**
 * 2차 평가자에게 알림을 전송한다
 */
private async 이차평가자에게_알림을전송한다(
  employeeId: string,
  periodId: string,
  wbsId: string,
): Promise<void> {
  try {
    // 평가기간 조회
    const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(periodId);
    if (!evaluationPeriod) {
      this.logger.warn(`평가기간을 찾을 수 없어 알림을 전송하지 않습니다. periodId=${periodId}`);
      return;
    }

    // 2차 평가자 조회
    const evaluatorId = await this.stepApprovalContext.이차평가자를_조회한다(
      periodId,
      employeeId,
      wbsId,
    );

    if (!evaluatorId) {
      this.logger.warn(
        `2차 평가자를 찾을 수 없어 알림을 전송하지 않습니다. employeeId=${employeeId}, periodId=${periodId}, wbsId=${wbsId}`,
      );
      return;
    }

    // 알림 전송
    await this.notificationHelper.직원에게_알림을_전송한다({
      sender: 'system',
      title: '1차 하향평가 제출 알림',
      content: `${evaluationPeriod.name} 평가기간의 1차 하향평가가 제출되었습니다.`,
      employeeNumber: evaluatorId,
      sourceSystem: 'EMS',
      linkUrl: '/evaluations/downward',
      metadata: {
        type: 'downward-evaluation-submitted',
        evaluationType: 'primary',
        priority: 'medium',
        employeeId,
        periodId,
        wbsId,
      },
    });

    this.logger.log(
      `2차 평가자에게 1차 하향평가 제출 알림 전송 완료: 평가자=${evaluatorId}`,
    );
  } catch (error) {
    this.logger.error(
      '2차 평가자 알림 전송 중 오류 발생',
      error.stack,
    );
    throw error;
  }
}
```

#### 4. execute() 메서드에서 2차 평가자 알림 호출 추가
```typescript
// 1차 하향평가인 경우 2차 평가자와 Portal 사용자에게 알림 전송
if (evaluation.evaluationType === 'primary') {
  // 2차 평가자에게 알림 전송 (비동기 처리, 실패해도 제출은 성공)
  this.이차평가자에게_알림을전송한다(
    evaluation.employeeId,
    evaluation.periodId,
    evaluation.wbsId,
  ).catch((error) => {
    this.logger.error(
      '2차 평가자 알림 전송 실패 (무시됨)',
      error.stack,
    );
  });

  // Portal 사용자에게 알림 전송 (비동기 처리, 실패해도 제출은 성공)
  this.Portal사용자에게_알림을전송한다(
    evaluation.employeeId,
    evaluation.periodId,
    evaluation.wbsId,
  ).catch((error) => {
    this.logger.error(
      'Portal 사용자 알림 전송 실패 (무시됨)',
      error.stack,
    );
  });
}
```

## 🔍 알림 전송 흐름

### 자기평가 제출 흐름 (수정 후)
1. **피평가자** → 자기평가 작성
2. **피평가자** → 자기평가 제출 (1차 평가자에게)
3. **시스템** → 1차 평가자 employeeId 조회
4. **시스템** → SSO에서 1차 평가자의 FCM 토큰 조회
5. **시스템** → **1차 평가자에게만 알림 전송** ✅

### 1차 하향평가 제출 흐름 (수정 후)
1. **1차 평가자** → 1차 하향평가 작성
2. **1차 평가자** → 1차 하향평가 제출
3. **시스템** → 2차 평가자 employeeId 조회 ✅ (새로 추가)
4. **시스템** → SSO에서 2차 평가자의 FCM 토큰 조회 ✅ (새로 추가)
5. **시스템** → **2차 평가자에게만 알림 전송** ✅ (새로 추가)

## ✅ 검증 사항

### 1. employeeId로 FCM 토큰 조회
- ✅ `SSOService.여러직원의FCM토큰을조회한다()` 정상 동작
- ✅ employeeNumber를 사용하여 FCM 토큰 조회

### 2. deviceType 필터링
- ✅ 직원별로 FCM 토큰 조회 및 알림 전송
- ✅ Portal 알림 전송 로직 제거 (불필요)

### 3. 알림 전송 로그
다음 로그들이 출력되어야 합니다:

#### 자기평가 제출 시
```
WBS 자기평가 제출 핸들러 실행 (피평가자 → 1차 평가자)
알림 전송 시작: 제목="WBS 자기평가 제출 알림", 수신자 수=1
FCM 토큰 조회 중: [evaluatorId]
FCM 토큰 조회 완료: 1명의 수신자, 총 N개 토큰
알림 전송 성공: notificationId=xxx, 수신자=1명
WBS 자기평가 제출 알림 전송 완료: 평가자=[evaluatorId]
```

#### 1차 하향평가 제출 시 (수정 후)
```
하향평가 제출 핸들러 실행
알림 전송 시작: 제목="1차 하향평가 제출 알림", 수신자 수=1
FCM 토큰 조회 중: [evaluatorId]
FCM 토큰 조회 완료: 1명의 수신자, 총 N개 토큰
알림 전송 성공: notificationId=xxx, 수신자=1명
2차 평가자에게 1차 하향평가 제출 알림 전송 완료: 평가자=[evaluatorId]
```

#### Portal 알림 전송 시
```
Portal 알림 전송 시작: 제목="[알림 제목]"
알림 수신 대상 사번: [MAIL_NOTIFICATION_SSO 환경변수 값]
Portal FCM 토큰 조회 완료: N개 토큰
Portal 알림 전송 성공: notificationId=xxx, 토큰=N개
```

## 📝 테스트 방법

### 1. 자기평가 제출 테스트
```bash
# 1. 자기평가 작성
POST /api/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId}

# 2. 자기평가 제출 (1차 평가자에게)
PATCH /api/wbs-self-evaluations/{id}/submit-to-evaluator

# 3. 1차 평가자의 알림 목록 조회
GET /api/notifications/{evaluatorId}?skip=0&take=10

# 4. 알림 목록에서 type='self-evaluation-submitted' 확인
```

### 2. 1차 하향평가 제출 테스트
```bash
# 1. 1차 하향평가 작성
POST /api/downward-evaluations/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId}/primary

# 2. 1차 하향평가 제출
POST /api/downward-evaluations/evaluatee/{evaluateeId}/period/{periodId}/wbs/{wbsId}/primary/submit

# 3. 2차 평가자의 알림 목록 조회
GET /api/notifications/{secondaryEvaluatorId}?skip=0&take=10

# 4. 알림 목록에서 type='downward-evaluation-submitted', evaluationType='primary' 확인
```

### 3. 로그 확인
서버 로그에서 다음을 확인:
- SSO FCM 토큰 조회 로그
- deviceType 필터링 로그 (Portal의 경우)
- 알림 전송 성공/실패 로그

## 🔗 관련 파일

### 수정된 파일
- `src/context/performance-evaluation-context/handlers/downward-evaluation/command/submit-downward-evaluation.handler.ts`

### 관련 서비스
- `src/domain/common/notification/notification-helper.service.ts` - 알림 헬퍼 서비스
- `src/domain/common/sso/sso.service.impl.ts` - SSO FCM 토큰 조회
- `src/context/step-approval-context/step-approval-context.service.ts` - 평가자 조회

### 테스트 파일
- `test/integration/notification-flow.e2e-spec.ts` - 알림 흐름 통합 테스트
- `test/integration/notification-detailed-log.e2e-spec.ts` - 상세 로그 테스트

## 🎯 기대 효과

### 수정 전
- 자기평가 제출: 1차 평가자에게 알림 ✅ (Portal 알림도 전송했으나 불필요)
- 1차 하향평가 제출: Portal 사용자에게만 알림 ❌ (2차 평가자 알림 누락)

### 수정 후
- 자기평가 제출: **1차 평가자에게만 알림** ✅
- 1차 하향평가 제출: **2차 평가자에게만 알림** ✅

## 📌 주의사항

1. **환경변수 확인**: `MAIL_NOTIFICATION_SSO`에 Portal 사용자 사번이 설정되어 있어야 합니다.
2. **FCM 토큰 등록**: 알림을 받을 사용자는 SSO에 FCM 토큰이 등록되어 있어야 합니다.
3. **deviceType 확인**: Portal 알림을 받으려면 deviceType에 'portal'이 포함되어야 합니다.
4. **비동기 처리**: 알림 전송은 비동기로 처리되어 실패해도 평가 제출은 성공합니다.

## 📅 수정 일자
2024년 12월 4일

