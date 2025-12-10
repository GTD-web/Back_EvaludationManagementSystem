import { BaseE2ETest } from '../base-e2e.spec';

/**
 * 역할 기반 접근 제어(RBAC) E2E 테스트
 *
 * 각 역할(admin, evaluator, user)이 자신의 엔드포인트에만 접근할 수 있고
 * 다른 역할의 엔드포인트에는 접근할 수 없는지 검증합니다.
 */
describe('역할 기반 접근 제어(RBAC) E2E 테스트', () => {
  let testSuite: BaseE2ETest;

  // 테스트용 사용자 정보
  const adminUser = {
    id: 'admin-id-001',
    email: 'admin@test.com',
    name: 'Admin User',
    employeeNumber: 'ADMIN001',
    externalId: 'admin-external-001',
    roles: ['admin'],
  };

  const evaluatorUser = {
    id: 'evaluator-id-001',
    email: 'evaluator@test.com',
    name: 'Evaluator User',
    employeeNumber: 'EVAL001',
    externalId: 'evaluator-external-001',
    roles: ['evaluator'],
  };

  const regularUser = {
    id: 'user-id-001',
    email: 'user@test.com',
    name: 'Regular User',
    employeeNumber: 'USER001',
    externalId: 'user-external-001',
    roles: ['user'],
  };

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.beforeAll();

    // OrganizationManagementService 모킹 - 기본적으로 접근 가능하도록 설정
    const orgService = testSuite.getOrganizationManagementService();
    orgService.사번으로_관리자권한있는가 = jest.fn().mockResolvedValue(true);
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  describe('Admin 역할 접근 제어', () => {
    beforeEach(() => {
      // Admin 역할 설정
      testSuite.setCurrentUser(adminUser);
    });

    describe('✅ Admin 역할이 자신의 엔드포인트에 접근', () => {
      it('GET /admin/auth/me - Admin만 접근 가능', async () => {
        const response = await testSuite
          .request()
          .get('/admin/auth/me')
          .expect(200);

        expect(response.body).toHaveProperty('email', adminUser.email);
        expect(response.body).toHaveProperty('roles');
        expect(response.body.roles).toContain('admin');
      });
    });

    describe('❌ Admin 역할이 다른 역할의 엔드포인트에 접근 차단', () => {
      it('GET /evaluator/auth/me - Evaluator 엔드포인트 접근 차단 (403)', async () => {
        const response = await testSuite
          .request()
          .get('/evaluator/auth/me')
          .expect(403);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('evaluator');
      });

      it('GET /user/auth/me - User 엔드포인트 접근 차단 (403)', async () => {
        const response = await testSuite
          .request()
          .get('/user/auth/me')
          .expect(403);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('user');
      });

      it('GET /evaluator/employees - Evaluator 직원 조회 접근 차단 (403)', async () => {
        await testSuite.request().get('/evaluator/employees').expect(403);
      });
    });
  });

  describe('Evaluator 역할 접근 제어', () => {
    beforeEach(() => {
      // Evaluator 역할 설정
      testSuite.setCurrentUser(evaluatorUser);
    });

    describe('✅ Evaluator 역할이 자신의 엔드포인트에 접근', () => {
      it('GET /evaluator/auth/me - Evaluator만 접근 가능', async () => {
        const response = await testSuite
          .request()
          .get('/evaluator/auth/me')
          .expect(200);

        expect(response.body).toHaveProperty('email', evaluatorUser.email);
        expect(response.body).toHaveProperty('roles');
        expect(response.body.roles).toContain('evaluator');
      });

      it('GET /evaluator/employees - Evaluator 직원 조회 접근 가능', async () => {
        await testSuite.request().get('/evaluator/employees').expect(200);
      });
    });

    describe('❌ Evaluator 역할이 다른 역할의 엔드포인트에 접근 차단', () => {
      it('GET /admin/auth/me - Admin 엔드포인트 접근 차단 (403)', async () => {
        const response = await testSuite
          .request()
          .get('/admin/auth/me')
          .expect(403);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('admin');
      });

      it('GET /user/auth/me - User 엔드포인트 접근 차단 (403)', async () => {
        const response = await testSuite
          .request()
          .get('/user/auth/me')
          .expect(403);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('user');
      });

      it('GET /admin/employees - Admin 직원 관리 접근 차단 (403)', async () => {
        await testSuite.request().get('/admin/employees').expect(403);
      });
    });
  });

  describe('User 역할 접근 제어', () => {
    beforeEach(() => {
      // User 역할 설정
      testSuite.setCurrentUser(regularUser);
    });

    describe('✅ User 역할이 자신의 엔드포인트에 접근', () => {
      it('GET /user/auth/me - User만 접근 가능', async () => {
        const response = await testSuite
          .request()
          .get('/user/auth/me')
          .expect(200);

        expect(response.body).toHaveProperty('email', regularUser.email);
        expect(response.body).toHaveProperty('roles');
        expect(response.body.roles).toContain('user');
      });
    });

    describe('❌ User 역할이 다른 역할의 엔드포인트에 접근 차단', () => {
      it('GET /admin/auth/me - Admin 엔드포인트 접근 차단 (403)', async () => {
        const response = await testSuite
          .request()
          .get('/admin/auth/me')
          .expect(403);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('admin');
      });

      it('GET /evaluator/auth/me - Evaluator 엔드포인트 접근 차단 (403)', async () => {
        const response = await testSuite
          .request()
          .get('/evaluator/auth/me')
          .expect(403);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('evaluator');
      });

      it('GET /admin/employees - Admin 직원 관리 접근 차단 (403)', async () => {
        await testSuite.request().get('/admin/employees').expect(403);
      });

      it('GET /evaluator/employees - Evaluator 직원 조회 접근 차단 (403)', async () => {
        await testSuite.request().get('/evaluator/employees').expect(403);
      });
    });
  });

  describe('복합 역할(Multiple Roles) 접근 제어', () => {
    it('admin + user 역할: admin과 user 엔드포인트 모두 접근 가능', async () => {
      testSuite.setCurrentUser({
        ...adminUser,
        roles: ['admin', 'user'],
      });

      // admin 엔드포인트 접근 가능
      await testSuite.request().get('/admin/auth/me').expect(200);

      // user 엔드포인트 접근 가능
      await testSuite.request().get('/user/auth/me').expect(200);

      // evaluator 엔드포인트는 접근 차단
      await testSuite.request().get('/evaluator/auth/me').expect(403);
    });

    it('evaluator + user 역할: evaluator와 user 엔드포인트 모두 접근 가능', async () => {
      testSuite.setCurrentUser({
        ...evaluatorUser,
        roles: ['evaluator', 'user'],
      });

      // evaluator 엔드포인트 접근 가능
      await testSuite.request().get('/evaluator/auth/me').expect(200);

      // user 엔드포인트 접근 가능
      await testSuite.request().get('/user/auth/me').expect(200);

      // admin 엔드포인트는 접근 차단
      await testSuite.request().get('/admin/auth/me').expect(403);
    });

    it('admin + evaluator + user 역할: 모든 엔드포인트 접근 가능', async () => {
      testSuite.setCurrentUser({
        ...adminUser,
        roles: ['admin', 'evaluator', 'user'],
      });

      // 모든 엔드포인트 접근 가능
      await testSuite.request().get('/admin/auth/me').expect(200);

      await testSuite.request().get('/evaluator/auth/me').expect(200);

      await testSuite.request().get('/user/auth/me').expect(200);
    });
  });

  describe('접근 권한 체크 (isAccessible)', () => {
    it('admin 역할이 있어도 isAccessible=false면 admin 엔드포인트 접근 차단', async () => {
      testSuite.setCurrentUser(adminUser);

      // OrganizationManagementService의 사번으로_관리자권한있는가 모킹을 false로 변경
      const orgService = testSuite.getOrganizationManagementService();
      orgService.사번으로_관리자권한있는가 = jest.fn().mockResolvedValue(false);

      const response = await testSuite
        .request()
        .get('/admin/auth/me')
        .expect(403);

      expect(response.body.message).toContain('관리자');

      // 원복
      orgService.사번으로_관리자권한있는가 = jest.fn().mockResolvedValue(true);
    });

    it('evaluator 역할은 isAccessible 체크하므로 false면 접근 차단', async () => {
      testSuite.setCurrentUser(evaluatorUser);

      // OrganizationManagementService의 사번으로_관리자권한있는가 모킹을 false로 변경
      const orgService = testSuite.getOrganizationManagementService();
      orgService.사번으로_관리자권한있는가 = jest.fn().mockResolvedValue(false);

      const response = await testSuite
        .request()
        .get('/evaluator/auth/me')
        .expect(403);

      expect(response.body.message).toContain('평가자');

      // 원복
      orgService.사번으로_관리자권한있는가 = jest.fn().mockResolvedValue(true);
    });

    it('user 역할은 isAccessible 체크하므로 false면 접근 차단', async () => {
      testSuite.setCurrentUser(regularUser);

      // OrganizationManagementService의 사번으로_관리자권한있는가 모킹을 false로 변경
      const orgService = testSuite.getOrganizationManagementService();
      orgService.사번으로_관리자권한있는가 = jest.fn().mockResolvedValue(false);

      const response = await testSuite
        .request()
        .get('/user/auth/me')
        .expect(403);

      expect(response.body.message).toContain('유저');

      // 원복
      orgService.사번으로_관리자권한있는가 = jest.fn().mockResolvedValue(true);
    });
  });

  describe('역할 없음 (빈 배열) 접근 제어', () => {
    it('역할이 없으면 모든 보호된 엔드포인트 접근 차단', async () => {
      testSuite.setCurrentUser({
        ...regularUser,
        roles: [], // 역할 없음
      });

      // 모든 엔드포인트 접근 차단
      await testSuite.request().get('/admin/auth/me').expect(403);

      await testSuite.request().get('/evaluator/auth/me').expect(403);

      await testSuite.request().get('/user/auth/me').expect(403);
    });
  });
});
