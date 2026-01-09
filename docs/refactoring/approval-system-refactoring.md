# 결재 시스템 연동 리팩토링

## 개요

평가기간 결재 승인 처리 검증 로직을 도메인에서 컨텍스트로 이동하고, 결재 시스템 연동 모듈을 공통 도메인 모듈로 분리하는 리팩토링을 수행했습니다.

## 변경 사항

### 1. 결재 시스템 연동 모듈 생성 (`src/domain/common/approval-system`)

결재 시스템(LIAS)과의 통신을 담당하는 공통 모듈을 생성했습니다.

#### 생성된 파일

- **`approval-system.types.ts`**: 결재 시스템 타입 정의
  - `LiasApprovalDocumentResponse`: LIAS 서버 응답 DTO
  - `ApprovalDocumentStatus`: 결재 문서 상태 타입

- **`approval-system.service.ts`**: 결재 시스템 연동 서비스
  - `결재문서_상태를_조회한다()`: 단일 결재 문서 상태 조회
  - `결재문서_상태를_일괄조회한다()`: 여러 결재 문서 상태 일괄 조회
  - `LIAS서버_상태를_확인한다()`: LIAS 서버 헬스 체크

- **`approval-system.module.ts`**: 결재 시스템 모듈 정의

#### 특징

- HTTP 통신 로직을 캡슐화
- 에러 처리 및 로깅 포함
- 재사용 가능한 공통 서비스

### 2. 평가기간 결재 동기화 서비스 이동

기존 도메인 레이어의 `EvaluationPeriodApprovalSyncService`를 컨텍스트 레이어로 이동했습니다.

#### 이동 경로

```
src/domain/core/evaluation-period/evaluation-period-approval-sync.service.ts
  ↓
src/context/evaluation-period-management-context/services/evaluation-period-approval-sync.service.ts
```

#### 변경 내용

- `ApprovalSystemService`를 주입받아 사용
- HTTP 통신 로직 제거 (ApprovalSystemService로 위임)
- 도메인 로직과 외부 시스템 연동 로직 분리

### 3. 모듈 구조 업데이트

#### `EvaluationPeriodModule` (도메인)

**변경 전:**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([EvaluationPeriod]), HttpModule],
  providers: [
    EvaluationPeriodService,
    EvaluationPeriodValidationService,
    EvaluationPeriodAutoPhaseService,
    EvaluationPeriodApprovalSyncService, // 제거됨
    TransactionManagerService,
    {
      provide: 'IEvaluationPeriodService',
      useClass: EvaluationPeriodService,
    },
  ],
  // ...
})
```

**변경 후:**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([EvaluationPeriod])], // HttpModule 제거
  providers: [
    EvaluationPeriodService,
    EvaluationPeriodValidationService,
    EvaluationPeriodAutoPhaseService,
    // EvaluationPeriodApprovalSyncService 제거
    TransactionManagerService,
    {
      provide: 'IEvaluationPeriodService',
      useClass: EvaluationPeriodService,
    },
  ],
  // ...
})
```

#### `EvaluationPeriodManagementContextModule` (컨텍스트)

**변경 전:**
```typescript
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([/* ... */]),
    EvaluationPeriodModule,
    // ...
  ],
  providers: [
    EvaluationPeriodManagementContextService,
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
  ],
  // ...
})
```

**변경 후:**
```typescript
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([/* ... */]),
    EvaluationPeriodModule,
    ApprovalSystemModule, // 추가
    // ...
  ],
  providers: [
    EvaluationPeriodManagementContextService,
    EvaluationPeriodApprovalSyncService, // 추가
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
  ],
  // ...
})
```

#### `CommonDomainModule`

**변경 후:**
```typescript
@Module({
  imports: [
    EmployeeModule,
    DepartmentModule,
    ProjectModule,
    WbsItemModule,
    SSOModule,
    AuditLogModule,
    SystemSettingModule,
    NotificationModule,
    ApprovalSystemModule, // 추가
  ],
  exports: [
    // ...
    ApprovalSystemModule, // 추가
  ],
})
export class CommonDomainModule {}
```

## 아키텍처 개선

### 레이어 분리

```
┌─────────────────────────────────────────────────────────────┐
│                     Context Layer                            │
│  - EvaluationPeriodManagementContext                        │
│    └─ EvaluationPeriodApprovalSyncService                  │
│       (스케줄러, 비즈니스 로직 조율)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓ uses
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                             │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │ Core Domain          │    │ Common Domain            │  │
│  │ - EvaluationPeriod   │    │ - ApprovalSystemService  │  │
│  │   (엔티티, 도메인 로직)│    │   (외부 시스템 연동)      │  │
│  └──────────────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ communicates with
┌─────────────────────────────────────────────────────────────┐
│                  External System (LIAS)                      │
└─────────────────────────────────────────────────────────────┘
```

### 장점

1. **관심사 분리**
   - 도메인: 순수 비즈니스 로직
   - 공통 도메인: 외부 시스템 연동
   - 컨텍스트: 비즈니스 로직 조율 및 스케줄링

2. **재사용성 향상**
   - `ApprovalSystemService`를 다른 컨텍스트에서도 사용 가능
   - 결재 시스템 연동 로직이 한 곳에 집중

3. **테스트 용이성**
   - 각 레이어를 독립적으로 테스트 가능
   - Mock 객체 사용이 용이

4. **유지보수성 향상**
   - 결재 시스템 API 변경 시 `ApprovalSystemService`만 수정
   - 도메인 로직과 외부 시스템 로직의 명확한 분리

## 테스트 결과

### 빌드 테스트
```bash
npm run build
# ✅ 성공
```

### E2E 테스트
```bash
npm run test:e2e -- evaluation-period-approval
# ✅ 9개 테스트 모두 통과
```

## 마이그레이션 가이드

### 다른 컨텍스트에서 결재 시스템 사용하기

```typescript
import { ApprovalSystemService } from '@domain/common/approval-system';

@Injectable()
export class SomeService {
  constructor(
    private readonly approvalSystemService: ApprovalSystemService,
  ) {}

  async 결재상태_확인() {
    const response = await this.approvalSystemService.결재문서_상태를_조회한다(
      documentId,
    );
    return response.documentStatus;
  }
}
```

### 모듈 임포트

```typescript
import { ApprovalSystemModule } from '@domain/common/approval-system';

@Module({
  imports: [ApprovalSystemModule],
  // ...
})
export class YourModule {}
```

## 향후 개선 사항

1. **결재 시스템 추상화**
   - 인터페이스 정의로 다른 결재 시스템 지원 가능하도록 확장
   - Strategy 패턴 적용 고려

2. **캐싱 전략**
   - 결재 문서 상태 조회 결과 캐싱
   - Redis 등을 활용한 분산 캐시 고려

3. **재시도 로직**
   - 네트워크 오류 시 자동 재시도
   - Exponential backoff 전략 적용

4. **이벤트 기반 동기화**
   - 스케줄러 대신 웹훅 또는 메시지 큐 활용
   - 실시간 상태 동기화

## 참고 문서

- [AGENTS.md](../../src/context/AGENTS.md): 코드 작성 가이드
- [evaluation-context-design-analysis.md](../../src/context/evaluation-context-design-analysis.md): 컨텍스트 설계 분석

---

**작성일**: 2024-12-30  
**작성자**: AI Assistant

