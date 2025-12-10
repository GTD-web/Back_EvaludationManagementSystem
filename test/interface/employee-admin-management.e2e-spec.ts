import { BaseE2ETest } from '../base-e2e.spec';
import { SeedDataScenario } from '../usecase/scenarios/seed-data.scenario';

/**
 * 직원 관리자 권한 관리 API E2E 테스트
 *
 * 직원의 관리자 권한 변경 및 일괄 변경 기능을 테스트합니다.
 * 참고: API에서는 isAdmin을 사용하지만, DB/엔티티는 isAccessible 필드를 사용합니다.
 */
describe('직원 관리자 권한 관리 API E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let createdEmployeeIds: string[] = [];
  let scenario: SeedDataScenario;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.beforeAll();

    scenario = new SeedDataScenario(testSuite);
    await scenario.부서를_생성한다();
    await scenario.직원을_생성한다();

    // 생성된 직원 ID들 저장 (최소 3명)
    createdEmployeeIds = [
      scenario.getPeriodIdByCode('DEFAULT'),
      scenario.getEmployeeIdByEmail('user1@company.com'),
      scenario.getEmployeeIdByEmail('user2@company.com'),
    ].filter(Boolean);
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  describe('PATCH /admin/employees/:id/admin - 단일 직원 관리자 권한 변경', () => {
    describe('성공 케이스', () => {
      it('관리자 권한 부여: isAdmin=false인 직원을 true로 변경', async () => {
        const employeeId = createdEmployeeIds[0];
        
        // 먼저 false로 설정
        await testSuite.request
          .patch(`/admin/employees/${employeeId}/admin?isAdmin=false`)
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .expect(200);

        // true로 변경
        const response = await testSuite.request
          .patch(`/admin/employees/${employeeId}/admin?isAdmin=true`)
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .expect(200);

        expect(response.body).toHaveProperty('isAccessible', true);
      });

      it('관리자 권한 제거: isAdmin=true인 직원을 false로 변경', async () => {
        const employeeId = createdEmployeeIds[0];

        // 먼저 true로 설정
        await testSuite.request
          .patch(`/admin/employees/${employeeId}/admin?isAdmin=true`)
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .expect(200);

        // false로 변경
        const response = await testSuite.request
          .patch(`/admin/employees/${employeeId}/admin?isAdmin=false`)
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .expect(200);

        expect(response.body).toHaveProperty('isAccessible', false);
      });

      it('관리자 권한 반영 확인: 변경 후 응답에 isAccessible 필드가 변경된 값으로 반환됨', async () => {
        const employeeId = createdEmployeeIds[0];

        const response = await testSuite.request
          .patch(`/admin/employees/${employeeId}/admin?isAdmin=true`)
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', employeeId);
        expect(response.body).toHaveProperty('isAccessible', true);
        expect(response.body).toHaveProperty('updatedAt');
      });

      it('이미 같은 값으로 변경: 이미 해당 상태인 직원도 정상 처리', async () => {
        const employeeId = createdEmployeeIds[0];

        // true로 두 번 설정
        await testSuite.request
          .patch(`/admin/employees/${employeeId}/admin?isAdmin=true`)
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .expect(200);

        const response = await testSuite.request
          .patch(`/admin/employees/${employeeId}/admin?isAdmin=true`)
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .expect(200);

        expect(response.body).toHaveProperty('isAccessible', true);
      });

      it('멱등성 보장: 동일한 값으로 여러 번 요청해도 에러 없이 정상 동작', async () => {
        const employeeId = createdEmployeeIds[0];

        // false로 3번 연속 설정
        for (let i = 0; i < 3; i++) {
          const response = await testSuite.request
            .patch(`/admin/employees/${employeeId}/admin?isAdmin=false`)
            .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
            .expect(200);

          expect(response.body).toHaveProperty('isAccessible', false);
        }
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 직원 ID: 유효한 UUID이지만 존재하지 않는 ID로 요청 시 404 에러', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        await testSuite.request
          .patch(`/admin/employees/${nonExistentId}/admin?isAdmin=true`)
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .expect(404);
      });

      it('잘못된 UUID 형식: 잘못된 UUID 형식의 직원 ID로 요청 시 400 에러', async () => {
        await testSuite.request
          .patch(`/admin/employees/invalid-uuid/admin?isAdmin=true`)
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .expect(400);
      });

      it('isAdmin 쿼리 파라미터 누락: isAdmin 쿼리 파라미터가 없을 때 기본값(false) 적용', async () => {
        const employeeId = createdEmployeeIds[0];

        // isAdmin 파라미터 없이 요청 시 기본값 false 적용
        const response = await testSuite.request
          .patch(`/admin/employees/${employeeId}/admin`)
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .expect(200);

        expect(response.body).toHaveProperty('isAccessible', false);
      });

      it('잘못된 값: isAdmin이 "true", "false", "1", "0" 외의 값일 때 400 에러', async () => {
        const employeeId = createdEmployeeIds[0];

        await testSuite.request
          .patch(`/admin/employees/${employeeId}/admin?isAdmin=invalid`)
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .expect(400);
      });
    });
  });

  describe('PATCH /admin/employees/bulk/admin - 여러 직원 관리자 권한 일괄 변경', () => {
    describe('성공 케이스', () => {
      it('기본 일괄 변경: 3명의 직원 ID를 전달하여 모두 isAdmin=false로 변경', async () => {
        const employeeIds = createdEmployeeIds.slice(0, 3);

        const response = await testSuite.request
          .patch('/admin/employees/bulk/admin?isAdmin=false')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({ employeeIds })
          .expect(200);

        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('totalProcessed', employeeIds.length);
        expect(response.body).toHaveProperty('succeeded');
        expect(response.body).toHaveProperty('failed');
        expect(response.body).toHaveProperty('failedIds');
        expect(response.body).toHaveProperty('errors');
        expect(response.body).toHaveProperty('processedAt');
      });

      it('성공 건수 확인: totalProcessed=3, succeeded=3, failed=0', async () => {
        const employeeIds = createdEmployeeIds.slice(0, 3);

        const response = await testSuite.request
          .patch('/admin/employees/bulk/admin?isAdmin=false')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({ employeeIds })
          .expect(200);

        expect(response.body.totalProcessed).toBe(employeeIds.length);
        expect(response.body.succeeded).toBe(employeeIds.length);
        expect(response.body.failed).toBe(0);
        expect(response.body.failedIds).toEqual([]);
        expect(response.body.errors).toEqual([]);
      });

      it('일괄 권한 부여: 여러 직원에게 동시에 관리자 권한 부여 (isAdmin=true)', async () => {
        const employeeIds = createdEmployeeIds.slice(0, 3);

        const response = await testSuite.request
          .patch('/admin/employees/bulk/admin?isAdmin=true')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({ employeeIds })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.succeeded).toBe(employeeIds.length);
      });

      it('일괄 권한 제거: 여러 직원의 관리자 권한 제거 (isAdmin=false)', async () => {
        const employeeIds = createdEmployeeIds.slice(0, 3);

        // 먼저 권한 부여
        await testSuite.request
          .patch('/admin/employees/bulk/admin?isAdmin=true')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({ employeeIds })
          .expect(200);

        // 권한 제거
        const response = await testSuite.request
          .patch('/admin/employees/bulk/admin?isAdmin=false')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({ employeeIds })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.succeeded).toBe(employeeIds.length);
      });

      it('부분 실패 처리: 일부 직원 ID가 잘못되었을 때 나머지는 정상 처리', async () => {
        const validIds = createdEmployeeIds.slice(0, 2);
        const invalidId = '00000000-0000-0000-0000-000000000000';
        const employeeIds = [...validIds, invalidId];

        const response = await testSuite.request
          .patch('/admin/employees/bulk/admin?isAdmin=false')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({ employeeIds })
          .expect(200);

        expect(response.body.totalProcessed).toBe(3);
        expect(response.body.succeeded).toBe(2);
        expect(response.body.failed).toBe(1);
        expect(response.body.failedIds).toContain(invalidId);
        expect(response.body.errors.length).toBeGreaterThan(0);
      });

      it('실패 정보 포함: failed 개수와 failedIds 배열에 실패한 직원 ID 포함', async () => {
        const validId = createdEmployeeIds[0];
        const invalidId = '00000000-0000-0000-0000-000000000000';
        const employeeIds = [validId, invalidId];

        const response = await testSuite.request
          .patch('/admin/employees/bulk/admin?isAdmin=false')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({ employeeIds })
          .expect(200);

        expect(response.body.failed).toBe(1);
        expect(response.body.failedIds).toEqual([invalidId]);
      });

      it('에러 메시지 포함: errors 배열에 실패 사유 포함', async () => {
        const validId = createdEmployeeIds[0];
        const invalidId = '00000000-0000-0000-0000-000000000000';
        const employeeIds = [validId, invalidId];

        const response = await testSuite.request
          .patch('/admin/employees/bulk/admin?isAdmin=false')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({ employeeIds })
          .expect(200);

        expect(response.body.errors).toBeInstanceOf(Array);
        expect(response.body.errors.length).toBeGreaterThan(0);
        expect(response.body.errors[0]).toContain(invalidId);
      });

      it('단일 직원도 처리 가능: 1명만 포함된 배열로도 정상 처리', async () => {
        const employeeIds = [createdEmployeeIds[0]];

        const response = await testSuite.request
          .patch('/admin/employees/bulk/admin?isAdmin=false')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({ employeeIds })
          .expect(200);

        expect(response.body.totalProcessed).toBe(1);
        expect(response.body.succeeded).toBe(1);
        expect(response.body.failed).toBe(0);
      });

      it('응답 구조 검증: success, totalProcessed, succeeded, failed, failedIds, errors, processedAt 필드 모두 포함', async () => {
        const employeeIds = createdEmployeeIds.slice(0, 2);

        const response = await testSuite.request
          .patch('/admin/employees/bulk/admin?isAdmin=false')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({ employeeIds })
          .expect(200);

        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('totalProcessed');
        expect(response.body).toHaveProperty('succeeded');
        expect(response.body).toHaveProperty('failed');
        expect(response.body).toHaveProperty('failedIds');
        expect(response.body).toHaveProperty('errors');
        expect(response.body).toHaveProperty('processedAt');
        
        // processedAt이 유효한 날짜 형식인지 확인
        expect(new Date(response.body.processedAt).toString()).not.toBe('Invalid Date');
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID 형식: 배열에 잘못된 UUID 포함 시 400 에러', async () => {
        const employeeIds = ['invalid-uuid'];

        await testSuite.request
          .patch('/admin/employees/bulk/admin?isAdmin=false')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({ employeeIds })
          .expect(400);
      });

      it('employeeIds 빈 배열: 빈 배열 전달 시 400 에러', async () => {
        await testSuite.request
          .patch('/admin/employees/bulk/admin?isAdmin=false')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({ employeeIds: [] })
          .expect(400);
      });

      it('employeeIds 누락: body에 employeeIds 필드 없을 때 400 에러', async () => {
        await testSuite.request
          .patch('/admin/employees/bulk/admin?isAdmin=false')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({})
          .expect(400);
      });

      it('isAdmin 쿼리 파라미터 누락: isAdmin 쿼리 파라미터가 없을 때 기본값(false) 적용', async () => {
        const employeeIds = createdEmployeeIds.slice(0, 2);

        // isAdmin 파라미터 없이 요청 시 기본값 false 적용
        const response = await testSuite.request
          .patch('/admin/employees/bulk/admin')
          .set('Authorization', `Bearer ${testSuite.getAccessToken()}`)
          .send({ employeeIds })
          .expect(200);

        expect(response.body.succeeded).toBe(employeeIds.length);
      });
    });
  });
});

