# 평가기간 결재 시스템 연동 가이드

## 개요

평가기간 관리에 LIAS 결재관리시스템 연동 기능이 추가되었습니다. 프론트엔드에서 LIAS 서버로 결재 요청을 보낸 후, 백엔드 서버에 결재문서ID를 저장하면 자동으로 결재 상태가 동기화됩니다.

## 기능 설명

### 1. 결재 상태 (ApprovalStatus)

평가기간은 다음 6가지 결재 상태를 가질 수 있습니다:

- `none`: 결재 요청 전 (기본값)
- `pending`: 결재 대기 중
- `approved`: 결재 승인됨
- `rejected`: 결재 거부됨
- `cancelled`: 결재 취소됨
- `implemented`: 결재 완료 후 실행됨

### 2. 워크플로우

```
1. [프론트엔드] → [LIAS 서버]
   - 결재 요청 전송
   - documentId 받음

2. [프론트엔드] → [EMS 백엔드]
   - PATCH /admin/evaluation-periods/:id/approval-document
   - approvalDocumentId 저장
   - approvalStatus가 'none' → 'pending'으로 변경

3. [EMS 백엔드 스케줄러] (10초마다 자동 실행)
   - LIAS 서버에 결재 상태 확인 요청
   - GET {LIAS_URL}/api/approval-process/document/{documentId}/steps
   - documentStatus 기반으로 approvalStatus 업데이트
```

### 3. LIAS와 EMS 상태 매핑

| LIAS documentStatus | EMS approvalStatus |
|---------------------|-------------------|
| DRAFT               | none              |
| PENDING             | pending           |
| APPROVED            | approved          |
| REJECTED            | rejected          |
| CANCELLED           | cancelled         |
| IMPLEMENTED         | implemented       |

## API 사용 방법

### 결재 문서 ID 설정

**엔드포인트**: `PATCH /admin/evaluation-periods/:id/approval-document`

**요청 본문**:
```json
{
  "approvalDocumentId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**응답**:
```json
{
  "id": "eval-period-id",
  "name": "2024년 상반기 평가",
  "approvalDocumentId": "123e4567-e89b-12d3-a456-426614174000",
  "approvalStatus": "pending",
  ...
}
```

### 평가기간 목록 조회 (approvalStatus 포함)

**엔드포인트**: `GET /admin/evaluation-periods`

**응답**:
```json
{
  "items": [
    {
      "id": "eval-period-id",
      "name": "2024년 상반기 평가",
      "approvalDocumentId": "123e4567-e89b-12d3-a456-426614174000",
      "approvalStatus": "approved",
      ...
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

## 환경 설정

### .env 파일에 LIAS 서버 URL 추가

```env
# LIAS 결재관리시스템 URL
LIAS_URL=http://localhost:3001
```

### 기본값

설정하지 않으면 기본값 `http://localhost:3001`이 사용됩니다.

## 마이그레이션 실행

데이터베이스 스키마에 결재 관련 필드를 추가하려면 마이그레이션을 실행하세요:

```bash
npm run migration:run
```

## 스케줄러 동작 확인

스케줄러는 애플리케이션 시작 시 자동으로 실행되며, 10초마다 다음 로그를 출력합니다:

```
[EvaluationPeriodApprovalSyncService] LIAS 서버 URL: http://localhost:3001
[EvaluationPeriodApprovalSyncService] 결재 대기 중인 평가기간 2개 발견, 동기화를 시작합니다.
[EvaluationPeriodApprovalSyncService] 평가기간 12345678... (2024년 상반기 평가) - LIAS 결재 상태: APPROVED
[EvaluationPeriodApprovalSyncService] 평가기간 12345678... (2024년 상반기 평가) - 결재 상태 변경: pending → approved
[EvaluationPeriodApprovalSyncService] 결재 상태 동기화 완료
```

## LIAS API 응답 형식

스케줄러가 호출하는 LIAS API는 다음과 같은 응답을 반환합니다:

```json
{
  "documentId": "uuid",
  "documentStatus": "APPROVED",
  "steps": [
    {
      "id": "uuid",
      "documentId": "uuid",
      "stepOrder": 1,
      "stepType": "APPROVAL",
      "approverId": "uuid",
      "approverSnapshot": {
        "departmentId": "uuid",
        "departmentName": "개발팀",
        "positionId": "uuid",
        "positionTitle": "팀장",
        "rankId": "uuid",
        "rankTitle": "과장",
        "employeeName": "홍길동",
        "employeeNumber": "EMP001"
      },
      "status": "APPROVED",
      "comment": "승인합니다.",
      "approvedAt": "2025-11-11T00:00:00.000Z",
      "createdAt": "2025-11-11T00:00:00.000Z",
      "updatedAt": "2025-11-11T00:00:00.000Z"
    }
  ]
}
```

## 에러 처리

### LIAS 서버 연결 실패

LIAS 서버가 실행 중이지 않거나 접근할 수 없는 경우, 스케줄러는 경고 로그를 출력하고 다음 주기에 재시도합니다:

```
[EvaluationPeriodApprovalSyncService] LIAS 서버 연결 실패 (평가기간: 12345678...). 서버가 실행 중인지 확인하세요.
```

### 결재 문서를 찾을 수 없음

LIAS 서버에서 해당 documentId를 찾을 수 없는 경우 (404 에러):

```
[EvaluationPeriodApprovalSyncService] 결재 문서를 찾을 수 없음 (documentId: xxx). 평가기간: 12345678...
```

## 테스트

### 1. 수동으로 결재 상태 동기화 트리거

스케줄러는 10초마다 자동으로 실행되지만, 테스트를 위해 `@Cron` 데코레이터를 다음과 같이 변경할 수 있습니다:

```typescript
@Cron(CronExpression.EVERY_5_SECONDS) // 5초마다 실행
// 또는
@Cron('*/30 * * * * *') // 30초마다 실행
```

### 2. LIAS Mock 서버 설정

테스트 환경에서는 실제 LIAS 서버 대신 Mock 서버를 사용할 수 있습니다:

```typescript
// test/mocks/lias-mock-server.ts
import express from 'express';

const app = express();

app.get('/api/approval-process/document/:documentId/steps', (req, res) => {
  res.json({
    documentId: req.params.documentId,
    documentStatus: 'APPROVED', // 테스트하려는 상태로 변경
    steps: [],
  });
});

app.listen(3001, () => {
  console.log('LIAS Mock Server running on port 3001');
});
```

## 주의사항

1. **결재문서ID가 없는 경우**: `approvalStatus`가 'pending'이더라도 `approvalDocumentId`가 없으면 스케줄러가 해당 평가기간을 스킵합니다.

2. **상태 변경 로그**: 결재 상태가 변경될 때만 로그가 출력되며, 변경이 없으면 debug 레벨 로그만 출력됩니다.

3. **시스템이 변경 주체**: 스케줄러가 자동으로 상태를 업데이트할 때는 `updatedBy` 필드가 'system'으로 설정됩니다.

4. **타임아웃**: LIAS 서버 요청은 5초 타임아웃이 설정되어 있습니다. 응답이 5초 이내에 오지 않으면 요청이 취소됩니다.

## 향후 개선 사항

- [ ] 결재 단계(steps) 정보도 함께 저장하여 진행 상황 추적
- [ ] 결재 이력 로그 테이블 추가
- [ ] 결재 상태 변경 시 알림 기능
- [ ] 결재 승인 시 자동으로 평가기간 시작

