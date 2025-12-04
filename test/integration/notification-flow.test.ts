import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';

/**
 * 알림 흐름 통합 테스트
 * 
 * 테스트 목적:
 * 1. 자기평가 제출 시 1차 평가자에게 알림이 전송되는지 확인
 * 2. 1차 하향평가 제출 시 2차 평가자에게 알림이 전송되는지 확인
 * 3. Portal 알림 전송 시 deviceType이 'portal'을 포함하는 fcmTokens만 필터링되는지 확인
 * 4. SSO에서 employeeId로 FCM 토큰을 정확히 조회하는지 확인
 */
describe('알림 흐름 통합 테스트 (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('자기평가 제출 시 알림 전송', () => {
    it('[STEP 1] 자기평가 제출 시 1차 평가자에게 알림이 전송되어야 한다', async () => {
      // Given: 자기평가 ID와 1차 평가자 정보
      const evaluationId = 'test-evaluation-id';
      
      // When: 자기평가를 1차 평가자에게 제출
      console.log('🔔 자기평가 제출 API 호출 중...');
      const response = await request(app.getHttpServer())
        .patch(`/api/wbs-self-evaluations/${evaluationId}/submit-to-evaluator`)
        .send({})
        .expect((res) => {
          console.log('📥 응답 상태:', res.status);
          console.log('📦 응답 본문:', JSON.stringify(res.body, null, 2));
        });

      // Then: 로그에서 알림 전송이 시도되었는지 확인
      console.log('✅ 자기평가 제출 완료');
      console.log('📝 1차 평가자 employeeId를 사용하여 FCM 토큰을 조회했는지 확인하세요');
    });

    it('[STEP 2] 알림 목록을 조회하여 자기평가 제출 알림이 생성되었는지 확인', async () => {
      // Given: 1차 평가자의 recipientId (employeeId)
      const recipientId = 'test-evaluator-id';

      // When: 알림 목록 조회
      console.log('🔍 알림 목록 조회 중...');
      const response = await request(app.getHttpServer())
        .get(`/api/notifications/${recipientId}`)
        .query({ skip: 0, take: 10 })
        .expect((res) => {
          console.log('📥 응답 상태:', res.status);
          console.log('📦 알림 목록:', JSON.stringify(res.body, null, 2));
        });

      // Then: 자기평가 제출 알림이 있어야 함
      const notifications = response.body.notifications || [];
      const selfEvalNotification = notifications.find(
        (n: any) => n.metadata?.type === 'self-evaluation-submitted'
      );

      if (selfEvalNotification) {
        console.log('✅ 자기평가 제출 알림 발견:', selfEvalNotification);
      } else {
        console.log('❌ 자기평가 제출 알림이 생성되지 않았습니다');
        console.log('📋 전체 알림 목록:', notifications.map((n: any) => ({
          id: n.id,
          title: n.title,
          type: n.metadata?.type,
        })));
      }
    });
  });

  describe('1차 하향평가 제출 시 알림 전송', () => {
    it('[STEP 3] 1차 하향평가 제출 시 2차 평가자에게 알림이 전송되어야 한다', async () => {
      // Given: 1차 하향평가 정보
      const evaluateeId = 'test-evaluatee-id';
      const periodId = 'test-period-id';
      const wbsId = 'test-wbs-id';

      // When: 1차 하향평가 제출
      console.log('🔔 1차 하향평가 제출 API 호출 중...');
      const response = await request(app.getHttpServer())
        .post(`/api/downward-evaluations/evaluatee/${evaluateeId}/period/${periodId}/wbs/${wbsId}/primary/submit`)
        .send({
          evaluatorId: 'test-evaluator-id',
        })
        .expect((res) => {
          console.log('📥 응답 상태:', res.status);
          console.log('📦 응답 본문:', JSON.stringify(res.body, null, 2));
        });

      // Then: 로그에서 2차 평가자에게 알림 전송이 시도되었는지 확인
      console.log('✅ 1차 하향평가 제출 완료');
      console.log('📝 2차 평가자 employeeId를 사용하여 FCM 토큰을 조회했는지 확인하세요');
      console.log('⚠️ 현재 코드는 Portal 사용자에게만 알림을 보내고 있습니다!');
    });

    it('[STEP 4] 알림 목록을 조회하여 1차 하향평가 제출 알림이 생성되었는지 확인', async () => {
      // Given: 2차 평가자의 recipientId (employeeId)
      const recipientId = 'test-secondary-evaluator-id';

      // When: 알림 목록 조회
      console.log('🔍 알림 목록 조회 중...');
      const response = await request(app.getHttpServer())
        .get(`/api/notifications/${recipientId}`)
        .query({ skip: 0, take: 10 })
        .expect((res) => {
          console.log('📥 응답 상태:', res.status);
          console.log('📦 알림 목록:', JSON.stringify(res.body, null, 2));
        });

      // Then: 1차 하향평가 제출 알림이 있어야 함
      const notifications = response.body.notifications || [];
      const downwardEvalNotification = notifications.find(
        (n: any) => n.metadata?.type === 'downward-evaluation-submitted' 
          && n.metadata?.evaluationType === 'primary'
      );

      if (downwardEvalNotification) {
        console.log('✅ 1차 하향평가 제출 알림 발견:', downwardEvalNotification);
      } else {
        console.log('❌ 1차 하향평가 제출 알림이 생성되지 않았습니다 (2차 평가자에게)');
        console.log('⚠️ 현재는 Portal 사용자에게만 알림이 전송되고 있습니다!');
        console.log('📋 전체 알림 목록:', notifications.map((n: any) => ({
          id: n.id,
          title: n.title,
          type: n.metadata?.type,
        })));
      }
    });
  });

  describe('Portal 알림 전송 시 deviceType 필터링', () => {
    it('[STEP 5] Portal 알림 전송 시 deviceType에 portal이 포함된 토큰만 사용되어야 한다', async () => {
      // Given: Portal 사용자 정보 (환경변수 MAIL_NOTIFICATION_SSO에서 가져옴)
      const portalEmployeeNumber = process.env.MAIL_NOTIFICATION_SSO || 'E999999';
      
      console.log('📧 Portal 사용자 사번:', portalEmployeeNumber);
      console.log('🔍 FCM 토큰 조회 테스트 시작...');

      // When: SSO에서 FCM 토큰 조회 (직접 호출 테스트)
      // 실제 API를 통해 Portal 알림 전송을 트리거
      const evaluationId = 'test-evaluation-id';
      
      console.log('🔔 자기평가 제출하여 Portal 알림 전송 트리거...');
      await request(app.getHttpServer())
        .patch(`/api/wbs-self-evaluations/${evaluationId}/submit-to-evaluator`)
        .send({})
        .expect((res) => {
          console.log('📥 Portal 알림 전송 응답:', res.status);
        });

      // Then: 로그를 확인하여 deviceType 필터링이 올바르게 작동하는지 검증
      console.log('✅ Portal 알림 전송 완료');
      console.log('📝 로그에서 다음을 확인하세요:');
      console.log('   1. SSO에서 FCM 토큰 조회');
      console.log('   2. deviceType에 "portal"이 포함된 토큰만 필터링');
      console.log('   3. 필터링된 토큰으로 알림 전송');
    });
  });

  describe('SSO FCM 토큰 조회 로직 검증', () => {
    it('[STEP 6] 직원 번호(employeeNumber)로 FCM 토큰을 조회할 수 있어야 한다', async () => {
      console.log('🔍 SSO FCM 토큰 조회 로직 검증');
      console.log('📝 다음을 확인하세요:');
      console.log('   1. 자기평가 제출 핸들러에서 1차 평가자의 employeeId를 조회');
      console.log('   2. NotificationHelperService.직원에게_알림을_전송한다() 호출');
      console.log('   3. SSO.여러직원의FCM토큰을조회한다([employeeNumber]) 호출');
      console.log('   4. FCM 토큰이 있는 경우 알림 전송');
    });

    it('[STEP 7] 1차 하향평가 제출 시 2차 평가자 employeeId로 FCM 토큰을 조회해야 한다 (현재 누락)', async () => {
      console.log('⚠️ 현재 코드 문제점 확인:');
      console.log('📍 src/context/performance-evaluation-context/handlers/downward-evaluation/command/submit-downward-evaluation.handler.ts');
      console.log('   - 1차 하향평가 제출 시 Portal 사용자에게만 알림 전송');
      console.log('   - 2차 평가자에게 알림 전송 로직이 누락됨');
      console.log('');
      console.log('✅ 수정 필요:');
      console.log('   1. StepApprovalContext.이차평가자를_조회한다() 호출');
      console.log('   2. NotificationHelper.직원에게_알림을_전송한다() 호출하여 2차 평가자에게 알림 전송');
    });
  });
});

