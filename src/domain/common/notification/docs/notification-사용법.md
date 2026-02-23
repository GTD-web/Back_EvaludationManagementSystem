# 알림 서비스 사용법

## 개요

알림 서비스는 메일 서버 API와 연동하여 포털 알림을 전송하고 관리하는 기능을 제공합니다.

## 환경 설정

### 필수 환경 변수

`.env` 파일에 다음 환경 변수를 설정해야 합니다:

```env
# 메일 서버 URL (필수)
MAIL_SERVER_URL=http://localhost:3001

# Mock 서비스 사용 여부 (선택사항, 기본값: false)
# 개발 또는 테스트 환경에서 true로 설정하면 실제 API 대신 Mock 데이터 사용
NOTIFICATION_USE_MOCK=false

# 타임아웃 설정 (선택사항, 기본값: 30000ms)
NOTIFICATION_TIMEOUT_MS=30000

# 재시도 설정 (선택사항, 기본값: 2)
NOTIFICATION_RETRIES=2

# 재시도 지연 시간 (선택사항, 기본값: 1000ms)
NOTIFICATION_RETRY_DELAY=1000
```

## 모듈 임포트

`NotificationModule`을 사용하려는 모듈에서 임포트합니다:

```typescript
import { Module } from '@nestjs/common';
import { NotificationModule } from '@domain/common/notification';

@Module({
  imports: [NotificationModule],
  // ...
})
export class YourModule {}
```

## 서비스 사용

### 의존성 주입

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { INotificationService, NotificationService } from '@domain/common/notification';

@Injectable()
export class YourService {
  constructor(
    @Inject(NotificationService)
    private readonly notificationService: INotificationService,
  ) {}

  // 서비스 메서드에서 사용
}
```

## API 사용 예시

### 1. 알림 전송

```typescript
async sendNotification() {
  const result = await this.notificationService.알림을전송한다({
    sender: 'user001',
    title: '새로운 공지사항이 등록되었습니다',
    content: '인사팀에서 새로운 공지사항을 등록했습니다.',
    recipients: [
      {
        employeeNumber: 'user1',
        tokens: ['token1', 'token2'],
      },
      {
        employeeNumber: 'user2',
        tokens: ['token3'],
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
  // {
  //   success: true,
  //   message: '포털 알림 전송 완료',
  //   notificationId: 'notification-123'
  // }
}
```

### 2. 알림 목록 조회

```typescript
async getNotifications(recipientId: string) {
  const result = await this.notificationService.알림목록을조회한다({
    recipientId,
    isRead: false, // 읽지 않은 알림만 조회 (선택사항)
    skip: 0,       // 페이지네이션: 건너뛸 개수 (선택사항)
    take: 20,      // 페이지네이션: 가져올 개수 (선택사항)
  });

  console.log('알림 목록:', result);
  // {
  //   notifications: [...],
  //   total: 100,
  //   unreadCount: 15
  // }
}
```

### 3. 알림 읽음 처리

```typescript
async markAsRead(notificationId: string) {
  const result = await this.notificationService.알림을읽음처리한다({
    notificationId,
  });

  console.log('읽음 처리 결과:', result);
  // {
  //   success: true,
  //   message: '알림이 읽음 처리되었습니다.'
  // }
}
```

### 4. 전체 알림 읽음 처리

```typescript
async markAllAsRead(recipientId: string) {
  const result = await this.notificationService.전체알림을읽음처리한다({
    recipientId,
  });

  console.log('전체 읽음 처리 결과:', result);
  // {
  //   success: true,
  //   message: '3건의 알림이 읽음 처리되었습니다.',
  //   updatedCount: 3
  // }
}
```

## 데이터 타입

### NotificationRecipient

```typescript
interface NotificationRecipient {
  employeeNumber: string;  // 직원 번호 (사번)
  tokens: string[];        // FCM 토큰 목록
}
```

### SendNotificationParams

```typescript
interface SendNotificationParams {
  sender: string;                      // 발신자 ID
  title: string;                       // 알림 제목
  content: string;                     // 알림 내용
  recipients: NotificationRecipient[]; // 수신자 목록
  sourceSystem: string;                // 출처 시스템 (예: 'portal', 'ems')
  linkUrl?: string;                    // 링크 URL (선택사항)
  metadata?: NotificationMetadata;     // 메타데이터 (선택사항)
}
```

### NotificationInfo

```typescript
interface NotificationInfo {
  id: string;                    // 알림 ID
  sender: string;                // 발신자 ID
  recipientId: string;           // 수신자 ID
  title: string;                 // 제목
  content: string;               // 내용
  isRead: boolean;               // 읽음 여부
  sourceSystem: string;          // 출처 시스템
  linkUrl?: string;              // 링크 URL
  metadata?: NotificationMetadata; // 메타데이터
  createdAt: Date;               // 생성일시
  readAt?: Date;                 // 읽은 일시
}
```

## Mock 서비스

개발 또는 테스트 환경에서 실제 메일 서버 없이 테스트할 수 있습니다.

### Mock 서비스 활성화

```env
NOTIFICATION_USE_MOCK=true
```

또는 테스트 환경에서는 자동으로 Mock 서비스가 활성화됩니다:

```env
NODE_ENV=test
```

### Mock 서비스 특징

- 실제 API 호출 없이 메모리에서 알림 관리
- 기본적으로 샘플 알림 데이터 제공
- 모든 API가 정상적으로 작동

## 에러 처리

알림 서비스는 에러가 발생해도 예외를 던지지 않고, 결과 객체에 에러 정보를 포함하여 반환합니다:

```typescript
const result = await this.notificationService.알림을전송한다(params);

if (!result.success) {
  console.error('알림 전송 실패:', result.error);
  // 에러 처리 로직
}
```

## API 엔드포인트

알림 서비스가 사용하는 메일 서버 API 엔드포인트:

1. **POST** `/api/portal/notifications/send` - 알림 전송
2. **GET** `/api/portal/notifications/{recipientId}` - 알림 목록 조회
   - Query Parameters: `isRead`, `skip`, `take`
3. **PATCH** `/api/portal/notifications/{notificationId}/read` - 알림 읽음 처리
4. **PATCH** `/api/portal/notifications/{recipientId}/read-all` - 전체 읽음 처리

## 주의사항

1. `MAIL_SERVER_URL` 환경 변수는 필수입니다 (Mock 서비스 사용 시 제외)
2. 알림 전송 시 수신자의 FCM 토큰이 필요합니다
3. 페이지네이션을 활용하여 대량의 알림을 효율적으로 조회하세요
4. 에러 처리를 반드시 구현하세요

## 로깅

알림 서비스는 모든 주요 작업에 대해 로그를 남깁니다:

```
[NotificationServiceImpl] 알림 전송 요청: 제목=새로운 공지사항, 수신자 수=3
[NotificationServiceImpl] 알림 전송 성공: notificationId=notification-123
```

로그 레벨을 조정하여 필요한 정보만 확인할 수 있습니다.
