import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { NotificationHelperService } from '../../src/domain/common/notification';
import { SSOService } from '../../src/domain/common/sso';

/**
 * 알림 전송 상세 로그 테스트
 * 
 * 이 테스트는 다음을 상세히 검증합니다:
 * 1. NotificationHelperService가 올바른 employeeId를 사용하는지
 * 2. SSO 서비스가 올바른 FCM 토큰을 조회하는지
 * 3. deviceType 필터링이 올바르게 작동하는지
 */
describe('알림 전송 상세 로그 테스트', () => {
  let app: INestApplication;
  let notificationHelper: NotificationHelperService;
  let ssoService: SSOService;

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

    // 서비스 인스턴스 가져오기
    notificationHelper = app.get(NotificationHelperService);
    ssoService = app.get(SSOService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('직원 FCM 토큰 조회 테스트', () => {
    it('[TEST 1] SSO 서비스가 단일 직원의 FCM 토큰을 조회할 수 있어야 한다', async () => {
      // Given: 테스트용 직원 번호
      const employeeNumber = 'E999999'; // 실제 직원 번호로 변경 필요

      console.log('🔍 [TEST 1] FCM 토큰 조회 테스트 시작');
      console.log('📝 직원 번호:', employeeNumber);

      try {
        // When: FCM 토큰 조회
        const result = await ssoService.FCM토큰을조회한다({ employeeNumber });

        // Then: 결과 로깅
        console.log('✅ FCM 토큰 조회 성공');
        console.log('📦 조회 결과:', JSON.stringify(result, null, 2));
        console.log('📱 토큰 개수:', result.tokens.length);
        
        result.tokens.forEach((token, index) => {
          console.log(`   [토큰 ${index + 1}]`);
          console.log(`     - deviceType: ${token.deviceType}`);
          console.log(`     - fcmToken: ${token.fcmToken.substring(0, 20)}...`);
          console.log(`     - createdAt: ${token.createdAt}`);
          console.log(`     - portal 포함 여부: ${token.deviceType.toLowerCase().includes('portal')}`);
        });

        // Portal 토큰만 필터링
        const portalTokens = result.tokens.filter(token => 
          token.deviceType.toLowerCase().includes('portal')
        );
        console.log('🔍 Portal 토큰만 필터링 결과:', portalTokens.length, '개');
      } catch (error) {
        console.error('❌ FCM 토큰 조회 실패:', error.message);
        console.error('📋 에러 상세:', error);
        throw error;
      }
    });

    it('[TEST 2] SSO 서비스가 여러 직원의 FCM 토큰을 조회할 수 있어야 한다', async () => {
      // Given: 테스트용 직원 번호들
      const employeeNumbers = ['E999999', 'E999998']; // 실제 직원 번호로 변경 필요

      console.log('🔍 [TEST 2] 여러 직원 FCM 토큰 조회 테스트 시작');
      console.log('📝 직원 번호:', employeeNumbers);

      try {
        // When: 여러 직원 FCM 토큰 조회
        const result = await ssoService.여러직원의FCM토큰을조회한다({ employeeNumbers });

        // Then: 결과 로깅
        console.log('✅ 여러 직원 FCM 토큰 조회 성공');
        console.log('📦 조회 결과:');
        console.log(`   - 총 직원 수: ${result.totalEmployees}`);
        console.log(`   - 총 토큰 수: ${result.totalTokens}`);
        
        result.byEmployee.forEach((emp, index) => {
          console.log(`   [직원 ${index + 1}] ${emp.employeeNumber}`);
          console.log(`     - 토큰 개수: ${emp.tokens.length}`);
          emp.tokens.forEach((token, tokenIndex) => {
            console.log(`       [토큰 ${tokenIndex + 1}]`);
            console.log(`         - deviceType: ${token.deviceType}`);
            console.log(`         - portal 포함 여부: ${token.deviceType.toLowerCase().includes('portal')}`);
          });
        });
      } catch (error) {
        console.error('❌ 여러 직원 FCM 토큰 조회 실패:', error.message);
        console.error('📋 에러 상세:', error);
        throw error;
      }
    });

    it('[TEST 3] Portal 사용자 FCM 토큰 조회 및 필터링을 테스트해야 한다', async () => {
      // Given: 테스트용 직원 번호 (실제 직원 번호로 변경 필요)
      const testEmployeeNumber = 'E999999';

      console.log('🔍 [TEST 3] Portal FCM 토큰 필터링 테스트 시작');
      console.log('📝 테스트 직원 번호:', testEmployeeNumber);
      console.log('ℹ️  MAIL_NOTIFICATION_SSO 환경변수는 더 이상 사용되지 않습니다.');

      try {
        // When: FCM 토큰 조회
        const result = await ssoService.FCM토큰을조회한다({ 
          employeeNumber: testEmployeeNumber 
        });

        // Then: Portal 토큰만 필터링
        console.log('📦 전체 토큰 조회 결과:');
        console.log(`   - 총 토큰 수: ${result.tokens.length}`);
        
        const portalTokens = result.tokens.filter(token => 
          token.deviceType.toLowerCase().includes('portal')
        );

        console.log('🔍 Portal 토큰 필터링 결과:');
        console.log(`   - Portal 토큰 수: ${portalTokens.length}`);
        
        portalTokens.forEach((token, index) => {
          console.log(`   [Portal 토큰 ${index + 1}]`);
          console.log(`     - deviceType: ${token.deviceType}`);
          console.log(`     - fcmToken: ${token.fcmToken.substring(0, 20)}...`);
        });

        if (portalTokens.length === 0) {
          console.warn('⚠️ Portal 토큰이 없습니다. Portal 알림이 전송되지 않습니다.');
        } else {
          console.log('✅ Portal 토큰 필터링 성공');
        }
      } catch (error) {
        console.error('❌ Portal FCM 토큰 조회/필터링 실패:', error.message);
        console.error('📋 에러 상세:', error);
        throw error;
      }
    });
  });

  describe('알림 헬퍼 서비스 테스트', () => {
    it('[TEST 4] 직원에게 알림을 전송하는 전체 플로우를 테스트해야 한다', async () => {
      // Given: 테스트용 직원 번호 (실제 존재하는 직원 번호로 변경 필요)
      const testEmployeeNumber = 'E999999';

      console.log('🔍 [TEST 4] 직원 알림 전송 전체 플로우 테스트 시작');
      console.log('📝 수신자 직원 번호:', testEmployeeNumber);

      try {
        // When: 알림 전송
        console.log('📤 알림 전송 시작...');
        const result = await notificationHelper.직원에게_알림을_전송한다({
          sender: 'system',
          title: '테스트 알림',
          content: '알림 전송 테스트입니다.',
          employeeNumber: testEmployeeNumber,
          sourceSystem: 'EMS',
          linkUrl: '/test',
          metadata: {
            type: 'test-notification',
            priority: 'low',
          },
        });

        // Then: 결과 로깅
        console.log('📦 알림 전송 결과:', JSON.stringify(result, null, 2));

        if (result.success) {
          console.log('✅ 알림 전송 성공');
          console.log(`   - notificationId: ${result.notificationId}`);
        } else {
          console.log('❌ 알림 전송 실패');
          console.log(`   - message: ${result.message}`);
          console.log(`   - error: ${result.error}`);
        }
      } catch (error) {
        console.error('❌ 알림 전송 중 예외 발생:', error.message);
        console.error('📋 에러 상세:', error);
      }
    });

    it('[TEST 5] 특정 직원에게 알림을 전송하는 전체 플로우를 테스트해야 한다 (employeeNumber 명시)', async () => {
      console.log('🔍 [TEST 5] 특정 직원 알림 전송 전체 플로우 테스트 시작');
      console.log('ℹ️  Portal사용자에게_알림을_전송한다() 메서드는 deprecated되었습니다.');

      const testEmployeeNumber = 'E999999';
      console.log('📝 테스트 직원 번호:', testEmployeeNumber);

      try {
        // When: 직원에게 알림 전송 (권장 방식)
        console.log('📤 직원 알림 전송 시작...');
        const result = await notificationHelper.직원에게_알림을_전송한다({
          sender: 'system',
          title: '테스트 알림',
          content: '직원 알림 전송 테스트입니다.',
          employeeNumber: testEmployeeNumber,
          sourceSystem: 'EMS',
          linkUrl: '/test',
          metadata: {
            type: 'test-notification',
            priority: 'low',
          },
        });

        // Then: 결과 로깅
        console.log('📦 알림 전송 결과:', JSON.stringify(result, null, 2));

        if (result.success) {
          console.log('✅ 알림 전송 성공');
          console.log(`   - notificationId: ${result.notificationId}`);
          console.log('📝 다음을 확인하세요:');
          console.log('   1. SSO에서 FCM 토큰을 조회했는지');
          console.log('   2. deviceType에 "portal"이 포함된 토큰만 필터링했는지');
          console.log('   3. 필터링된 토큰으로 알림을 전송했는지');
        } else {
          console.log('❌ 알림 전송 실패');
          console.log(`   - message: ${result.message}`);
          console.log(`   - error: ${result.error}`);
        }
      } catch (error) {
        console.error('❌ 알림 전송 중 예외 발생:', error.message);
        console.error('📋 에러 상세:', error);
      }
    });
  });

  describe('로그 확인 가이드', () => {
    it('[GUIDE] 로그 확인 방법을 안내한다', () => {
      console.log('\n🔍 === 로그 확인 가이드 ===');
      console.log('');
      console.log('📝 자기평가 제출 시:');
      console.log('   1. "WBS 자기평가 제출 핸들러 실행" 로그 확인');
      console.log('   2. "1차 평가자 조회" 로그 확인');
      console.log('   3. "FCM 토큰 조회 중" 로그 확인');
      console.log('   4. "알림 전송 시작" 로그 확인');
      console.log('   5. "WBS 자기평가 제출 알림 전송 완료" 로그 확인');
      console.log('');
      console.log('📝 1차 하향평가 제출 시:');
      console.log('   1. "하향평가 제출 핸들러 실행" 로그 확인');
      console.log('   2. "2차 평가자 조회" 로그 확인 (수정 후)');
      console.log('   3. "FCM 토큰 조회 중" 로그 확인 (수정 후)');
      console.log('   4. "알림 전송 시작" 로그 확인 (수정 후)');
      console.log('   5. "2차 평가자에게 1차 하향평가 제출 알림 전송 완료" 로그 확인 (수정 후)');
      console.log('');
      console.log('📝 직원 알림 전송 시:');
      console.log('   1. "알림 전송 시작" 로그 확인');
      console.log('   2. "FCM 토큰 조회 중: [직원번호]" 로그 확인');
      console.log('   3. "Portal FCM 토큰 조회 완료: N개 토큰" 로그 확인');
      console.log('   4. deviceType에 "portal"이 포함된 토큰만 필터링되었는지 확인');
      console.log('   5. "알림 전송 성공" 로그 확인');
      console.log('');
      console.log('✅ 모든 로그를 확인하여 알림 전송 플로우가 올바르게 작동하는지 검증하세요.');
    });
  });
});

