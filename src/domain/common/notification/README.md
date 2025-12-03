# Notification Service (알림 서비스)

메일 서버 API와 연동하여 포털 알림을 전송하고 관리하는 서비스입니다.

## 주요 기능

- ✅ 알림 전송 (다중 수신자 지원)
- ✅ 알림 목록 조회 (페이지네이션 지원)
- ✅ 알림 읽음 처리 (개별/전체)
- ✅ Mock 서비스 지원 (개발/테스트 환경)
- ✅ 자동 재시도 및 타임아웃 처리
- ✅ 에러 핸들링 및 로깅

## 빠른 시작

### 1. 환경 변수 설정

`.env` 파일에 다음을 추가하세요:

```env
MAIL_SERVER_URL=http://localhost:3001
```

개발 환경에서는 Mock 서비스를 사용할 수 있습니다:

```env
NOTIFICATION_USE_MOCK=true
```

### 2. 모듈 임포트

```typescript
import { Module } from '@nestjs/common';
import { NotificationModule } from '@domain/common/notification';

@Module({
  imports: [NotificationModule],
})
export class AppModule {}
```

### 3. 서비스 사용

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { INotificationService, NotificationService } from '@domain/common/notification';

@Injectable()
export class YourService {
  constructor(
    @Inject(NotificationService)
    private readonly notificationService: INotificationService,
  ) {}

  async sendNotification() {
    const result = await this.notificationService.알림을전송한다({
      sender: 'user001',
      title: '새로운 공지사항',
      content: '새로운 공지사항이 등록되었습니다.',
      recipients: [
        {
          employeeNumber: 'user1',
          tokens: ['token1', 'token2'],
        },
      ],
      sourceSystem: 'portal',
      linkUrl: '/portal/announcements/123',
      metadata: {
        type: 'announcement',
        priority: 'high',
      },
    });

    console.log('알림 전송 결과:', result);
  }
}
```

## 문서

- [사용법 가이드](./docs/notification-사용법.md) - 상세한 API 사용 방법
- [환경 변수 설정](./docs/환경변수-설정.md) - 환경 변수 설정 가이드

## API 메서드

### `알림을전송한다(params: SendNotificationParams): Promise<SendNotificationResult>`

알림을 전송합니다.

**Parameters:**
- `sender`: 발신자 ID
- `title`: 알림 제목
- `content`: 알림 내용
- `recipients`: 수신자 목록 (사번, FCM 토큰)
- `sourceSystem`: 출처 시스템 (예: 'portal', 'ems')
- `linkUrl`: 링크 URL (선택사항)
- `metadata`: 메타데이터 (선택사항)

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  notificationId?: string;
  error?: string;
}
```

### `알림목록을조회한다(params: GetNotificationsParams): Promise<GetNotificationsResult>`

알림 목록을 조회합니다.

**Parameters:**
- `recipientId`: 수신자 ID
- `isRead`: 읽음 여부 필터 (선택사항)
- `skip`: 건너뛸 개수 (선택사항)
- `take`: 가져올 개수 (선택사항)

**Returns:**
```typescript
{
  notifications: NotificationInfo[];
  total: number;
  unreadCount: number;
}
```

### `알림을읽음처리한다(params: MarkNotificationAsReadParams): Promise<MarkNotificationAsReadResult>`

특정 알림을 읽음 처리합니다.

**Parameters:**
- `notificationId`: 알림 ID

**Returns:**
```typescript
{
  success: boolean;
  message?: string;
}
```

### `전체알림을읽음처리한다(params: MarkAllAsReadParams): Promise<MarkAllAsReadResult>`

수신자의 모든 알림을 읽음 처리합니다.

**Parameters:**
- `recipientId`: 수신자 ID

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  updatedCount: number;
}
```

## 디렉토리 구조

```
notification/
├── docs/                           # 문서
│   ├── notification-사용법.md      # 상세 사용 가이드
│   └── 환경변수-설정.md             # 환경 변수 설정 가이드
├── interfaces/                     # 타입 정의
│   ├── index.ts
│   ├── notification-client.interface.ts
│   ├── notification.interface.ts
│   └── notification-service.interface.ts
├── notification.service.impl.ts    # 실제 구현체
├── notification.service.mock.ts    # Mock 구현체
├── notification.service.factory.ts # 팩토리 패턴
├── notification.module.ts          # NestJS 모듈
├── index.ts                        # 엔트리 포인트
└── README.md                       # 이 파일
```

## 아키텍처

알림 서비스는 SSO 서비스와 동일한 패턴을 따릅니다:

1. **인터페이스**: 타입 안정성을 위한 TypeScript 인터페이스
2. **구현체**: 실제 메일 서버 API와 통신하는 구현
3. **Mock 서비스**: 테스트/개발을 위한 Mock 구현
4. **팩토리 패턴**: 환경에 따라 적절한 구현체 제공
5. **NestJS 모듈**: 의존성 주입 지원

## 메일 서버 API 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST   | `/api/portal/notifications/send` | 알림 전송 |
| GET    | `/api/portal/notifications/{recipientId}` | 알림 목록 조회 |
| PATCH  | `/api/portal/notifications/{notificationId}/read` | 알림 읽음 처리 |
| PATCH  | `/api/portal/notifications/{recipientId}/read-all` | 전체 읽음 처리 |

## 에러 처리

알림 서비스는 에러가 발생해도 예외를 던지지 않고, 결과 객체에 에러 정보를 포함하여 반환합니다:

```typescript
const result = await this.notificationService.알림을전송한다(params);

if (!result.success) {
  // 에러 처리
  console.error('알림 전송 실패:', result.error);
}
```

## 로깅

모든 주요 작업에 대해 로그가 자동으로 기록됩니다:

```
[NotificationServiceFactory] 실제 알림 서비스를 사용합니다 (메일 서버 연동)
[NotificationServiceImpl] 알림 전송 요청: 제목=새로운 공지사항, 수신자 수=3
[NotificationServiceImpl] 알림 전송 성공: notificationId=notification-123
```

## 라이선스

이 프로젝트는 EMS 백엔드의 일부입니다.

