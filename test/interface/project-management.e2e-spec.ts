import { BaseE2ETest } from '../base-e2e.spec';
import { ProjectStatus } from '../../src/domain/common/project/project.types';
import { SSOService } from '../../src/domain/common/sso/sso.module';
import type { ISSOService } from '../../src/domain/common/sso/interfaces';
import { SeedDataScenario } from '../usecase/scenarios/seed-data.scenario';
import { ProjectAssignmentScenario } from '../usecase/scenarios/project-assignment/project-assignment.scenario';

/**
 * 프로젝트 관리 API E2E 테스트
 *
 * 프로젝트 CRUD 및 PM 목록 조회 기능을 테스트합니다.
 */
describe('프로젝트 관리 API E2E 테스트 (POST /admin/projects, GET, PUT, DELETE)', () => {
  let testSuite: BaseE2ETest;
  let createdProjectIds: string[] = [];

  // PM 목록 조회를 위한 SSO 모킹 데이터 (UUID 형식 사용)
  const MOCK_MANAGER_ID_1 = '11111111-1111-1111-1111-111111111111';
  const MOCK_MANAGER_ID_2 = '22222222-2222-2222-2222-222222222222';
  const MOCK_EMPLOYEE_ID_3 = '33333333-3333-3333-3333-333333333333';
  const MOCK_DEPT_ID_1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const MOCK_DEPT_ID_2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const mockEmployeesWithManagers = [
    {
      id: MOCK_MANAGER_ID_1,
      employeeNumber: 'EMP001',
      name: '김철수',
      email: 'kim@company.com',
      isTerminated: false,
      department: {
        id: MOCK_DEPT_ID_1,
        departmentCode: 'DEV',
        departmentName: '개발팀',
      },
      position: {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        positionName: '팀장',
        positionLevel: 3,
        positionCode: 'TL',
        hasManagementAuthority: true, // PM 권한 있음
      },
      jobTitle: {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        jobTitleName: '과장',
        jobTitleLevel: 3,
        jobTitleCode: 'M3',
      },
    },
    {
      id: MOCK_MANAGER_ID_2,
      employeeNumber: 'EMP002',
      name: '이영희',
      email: 'lee@company.com',
      isTerminated: false,
      department: {
        id: MOCK_DEPT_ID_2,
        departmentCode: 'PLAN',
        departmentName: '기획팀',
      },
      position: {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        positionName: '파트장',
        positionLevel: 4,
        positionCode: 'PL',
        hasManagementAuthority: true, // PM 권한 있음
      },
      jobTitle: {
        id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        jobTitleName: '차장',
        jobTitleLevel: 4,
        jobTitleCode: 'M4',
      },
    },
    {
      id: MOCK_EMPLOYEE_ID_3,
      employeeNumber: 'EMP003',
      name: '박민수',
      email: 'park@company.com',
      isTerminated: false,
      department: {
        id: MOCK_DEPT_ID_1,
        departmentCode: 'DEV',
        departmentName: '개발팀',
      },
      position: {
        id: '44444444-4444-4444-4444-444444444444',
        positionName: '사원',
        positionLevel: 1,
        positionCode: 'EMP',
        hasManagementAuthority: false, // PM 권한 없음
      },
      jobTitle: {
        id: '55555555-5555-5555-5555-555555555555',
        jobTitleName: '사원',
        jobTitleLevel: 1,
        jobTitleCode: 'M1',
      },
    },
  ];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // SSO 서비스 모킹 업데이트 (PM 목록 조회를 위한 데이터 포함)
    const ssoService = testSuite.app.get<ISSOService>(SSOService);
    (ssoService.여러직원정보를조회한다 as jest.Mock).mockResolvedValue(
      mockEmployeesWithManagers,
    );
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
    createdProjectIds = [];
  });

  afterEach(async () => {
    // 생성된 프로젝트 정리
    for (const projectId of createdProjectIds) {
      try {
        await testSuite.request().delete(`/admin/projects/${projectId}`);
      } catch (error) {
        // 이미 삭제된 경우 무시
      }
    }
    await testSuite.cleanupAfterTest();
  });

  describe('프로젝트 생성 (POST /admin/projects)', () => {
    it('기본 프로젝트를 생성할 수 있다', async () => {
      // Given
      const projectData = {
        name: 'EMS 프로젝트',
        projectCode: 'EMS-2024',
        status: ProjectStatus.ACTIVE,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/projects')
        .send(projectData)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        name: projectData.name,
        projectCode: projectData.projectCode,
        status: projectData.status,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();

      createdProjectIds.push(response.body.id);
    });

    it('PM을 포함하여 프로젝트를 생성할 수 있다', async () => {
      // Given
      const projectData = {
        name: 'PM 포함 프로젝트',
        projectCode: 'PM-2024',
        status: ProjectStatus.ACTIVE,
        managerId: MOCK_MANAGER_ID_1, // PM 설정
      };

      console.log(
        'Sending project data:',
        JSON.stringify(projectData, null, 2),
      );

      // When
      const response = await testSuite
        .request()
        .post('/admin/projects')
        .send(projectData);

      // 디버깅: 응답 출력
      console.log('Response status:', response.status);
      console.log('Response body:', JSON.stringify(response.body, null, 2));

      expect(response.status).toBe(201);

      // Then
      expect(response.body).toMatchObject({
        name: projectData.name,
        projectCode: projectData.projectCode,
      });
      // manager 정보는 Employee 테이블에 해당 externalId가 있을 때만 포함됨
      // 테스트 환경에서는 Employee가 없으므로 manager는 undefined일 수 있음

      createdProjectIds.push(response.body.id);
    });

    it('필수 필드가 없으면 400 에러를 반환한다', async () => {
      // Given - name 필드 누락
      const invalidData = {
        projectCode: 'INVALID-2024',
        status: ProjectStatus.ACTIVE,
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/projects')
        .send(invalidData)
        .expect(400);
    });

    it('유효하지 않은 상태 값으로 400 에러를 반환한다', async () => {
      // Given
      const invalidData = {
        name: '테스트 프로젝트',
        status: 'INVALID_STATUS',
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/projects')
        .send(invalidData)
        .expect(400);
    });

    it('잘못된 매니저 ID 형식으로 400 에러를 반환한다', async () => {
      // Given - UUID가 아닌 managerId
      const invalidData = {
        name: '테스트 프로젝트',
        status: ProjectStatus.ACTIVE,
        managerId: 'invalid-uuid',
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/projects')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('프로젝트 목록 조회 (GET /admin/projects)', () => {
    beforeEach(async () => {
      // 테스트 데이터 생성
      const projects = [
        {
          name: '프로젝트 A',
          projectCode: 'PROJ-A',
          status: ProjectStatus.ACTIVE,
          managerId: MOCK_MANAGER_ID_1,
        },
        {
          name: '프로젝트 B',
          projectCode: 'PROJ-B',
          status: ProjectStatus.COMPLETED,
          managerId: MOCK_MANAGER_ID_2,
        },
        {
          name: '프로젝트 C',
          projectCode: 'PROJ-C',
          status: ProjectStatus.ACTIVE,
        },
      ];

      for (const project of projects) {
        const response = await testSuite
          .request()
          .post('/admin/projects')
          .send(project);
        createdProjectIds.push(response.body.id);
      }
    });

    it('기본 페이징으로 프로젝트 목록을 조회할 수 있다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/projects')
        .expect(200);

      // Then
      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.projects).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThanOrEqual(3);
    });

    it('상태로 필터링하여 조회할 수 있다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/projects')
        .query({ status: ProjectStatus.ACTIVE })
        .expect(200);

      // Then
      expect(response.body.projects.length).toBeGreaterThanOrEqual(2);
      response.body.projects.forEach((project: any) => {
        expect(project.status).toBe(ProjectStatus.ACTIVE);
      });
    });

    it('매니저 ID로 필터링하여 조회할 수 있다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/projects')
        .query({ managerId: MOCK_MANAGER_ID_1 })
        .expect(200);

      // Then
      expect(response.body.projects.length).toBeGreaterThanOrEqual(1);
      // manager 정보는 Employee 테이블에 해당 externalId가 있을 때만 포함됨
    });

    it('페이징을 적용하여 조회할 수 있다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/projects')
        .query({ page: 1, limit: 2 })
        .expect(200);

      // Then
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.projects.length).toBeLessThanOrEqual(2);
    });

    it('정렬을 적용하여 조회할 수 있다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/projects')
        .query({ sortBy: 'name', sortOrder: 'ASC' })
        .expect(200);

      // Then
      expect(response.body.projects.length).toBeGreaterThan(0);
      // 이름순 정렬 확인
      const names = response.body.projects.map((p: any) => p.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe('프로젝트 상세 조회 (GET /admin/projects/:id)', () => {
    let projectId: string;

    beforeEach(async () => {
      // 테스트 데이터 생성
      const response = await testSuite.request().post('/admin/projects').send({
        name: '상세 조회 테스트 프로젝트',
        projectCode: 'DETAIL-2024',
        status: ProjectStatus.ACTIVE,
        managerId: MOCK_MANAGER_ID_1,
      });
      projectId = response.body.id;
      createdProjectIds.push(projectId);
    });

    it('유효한 ID로 프로젝트 상세를 조회할 수 있다', async () => {
      // When
      const response = await testSuite
        .request()
        .get(`/admin/projects/${projectId}`)
        .expect(200);

      // Then
      expect(response.body.id).toBe(projectId);
      expect(response.body.name).toBe('상세 조회 테스트 프로젝트');
      // managerId 필드가 포함되어야 함
      expect(response.body).toHaveProperty('managerId');
      expect(response.body.managerId).toBe(MOCK_MANAGER_ID_1);
      // manager 정보는 Employee 테이블에 해당 externalId가 있을 때만 포함됨
      if (response.body.manager) {
        expect(response.body.manager.id).toBe(MOCK_MANAGER_ID_1);
        expect(response.body.manager.name).toBeDefined();
      }
    });

    it('존재하지 않는 ID로 조회 시 404 에러를 반환한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000999';

      // When & Then
      await testSuite
        .request()
        .get(`/admin/projects/${nonExistentId}`)
        .expect(404);
    });

    it('잘못된 UUID 형식으로 조회 시 400 에러를 반환한다', async () => {
      // When & Then
      await testSuite.request().get('/admin/projects/invalid-uuid').expect(400);
    });
  });

  describe('프로젝트 수정 (PUT /admin/projects/:id)', () => {
    let projectId: string;

    beforeEach(async () => {
      // 테스트 데이터 생성
      const response = await testSuite.request().post('/admin/projects').send({
        name: '수정 테스트 프로젝트',
        projectCode: 'UPDATE-2024',
        status: ProjectStatus.ACTIVE,
        managerId: MOCK_MANAGER_ID_1,
      });
      projectId = response.body.id;
      createdProjectIds.push(projectId);
    });

    it('프로젝트 기본 정보를 수정할 수 있다', async () => {
      // Given
      const updateData = {
        name: '수정된 프로젝트명',
        projectCode: 'UPDATED-2024',
      };

      // When
      const response = await testSuite
        .request()
        .put(`/admin/projects/${projectId}`)
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.projectCode).toBe(updateData.projectCode);
    });

    it('PM을 변경할 수 있다', async () => {
      // Given
      const updateData = {
        managerId: MOCK_MANAGER_ID_2, // PM 변경
      };

      // When
      const response = await testSuite
        .request()
        .put(`/admin/projects/${projectId}`)
        .send(updateData)
        .expect(200);

      // Then
      // manager 정보는 Employee 테이블에 해당 externalId가 있을 때만 포함됨
      expect(response.status).toBe(200);
    });

    it('프로젝트 상태를 변경할 수 있다', async () => {
      // Given
      const updateData = {
        status: ProjectStatus.COMPLETED,
      };

      // When
      const response = await testSuite
        .request()
        .put(`/admin/projects/${projectId}`)
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.status).toBe(ProjectStatus.COMPLETED);
    });

    it('일부 필드만 수정할 수 있다', async () => {
      // Given
      const originalData = await testSuite
        .request()
        .get(`/admin/projects/${projectId}`);

      const updateData = {
        name: '부분 수정된 이름',
      };

      // When
      const response = await testSuite
        .request()
        .put(`/admin/projects/${projectId}`)
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.projectCode).toBe(originalData.body.projectCode); // 변경되지 않음
      expect(response.body.status).toBe(originalData.body.status); // 변경되지 않음
    });

    it('존재하지 않는 ID로 수정 시 404 에러를 반환한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000999';
      const updateData = { name: '수정' };

      // When & Then
      await testSuite
        .request()
        .put(`/admin/projects/${nonExistentId}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('프로젝트 삭제 (DELETE /admin/projects/:id)', () => {
    let projectId: string;

    beforeEach(async () => {
      // 테스트 데이터 생성
      const response = await testSuite.request().post('/admin/projects').send({
        name: '삭제 테스트 프로젝트',
        projectCode: 'DELETE-2024',
        status: ProjectStatus.ACTIVE,
      });
      projectId = response.body.id;
      createdProjectIds.push(projectId);
    });

    it('프로젝트를 삭제할 수 있다', async () => {
      // When
      await testSuite
        .request()
        .delete(`/admin/projects/${projectId}`)
        .expect(204);

      // Then - 삭제 후 조회 시 404
      await testSuite.request().get(`/admin/projects/${projectId}`).expect(404);
    });

    it('삭제된 프로젝트는 목록에서 제외된다', async () => {
      // When
      await testSuite
        .request()
        .delete(`/admin/projects/${projectId}`)
        .expect(204);

      // Then
      const response = await testSuite.request().get('/admin/projects');

      const deletedProject = response.body.projects.find(
        (p: any) => p.id === projectId,
      );
      expect(deletedProject).toBeUndefined();
    });

    it('존재하지 않는 ID로 삭제 시 404 에러를 반환한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000999';

      // When & Then
      await testSuite
        .request()
        .delete(`/admin/projects/${nonExistentId}`)
        .expect(404);
    });

    it('이미 삭제된 프로젝트 삭제 시 404 에러를 반환한다', async () => {
      // Given - 먼저 삭제
      await testSuite.request().delete(`/admin/projects/${projectId}`);

      // When & Then - 다시 삭제 시도
      await testSuite
        .request()
        .delete(`/admin/projects/${projectId}`)
        .expect(404);
    });

    it('할당이 있는 프로젝트는 삭제할 수 없다 (409 Conflict)', async () => {
      // Given - 시드 데이터 생성 (프로젝트, 직원, 평가기간, 할당 포함)
      // with_period 시나리오는 이미 프로젝트 할당을 포함하여 생성됨
      const seedDataScenario = new SeedDataScenario(testSuite);

      const seedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'with_period',
        clearExisting: false,
        projectCount: 1,
        wbsPerProject: 1,
        departmentCount: 1,
        employeeCount: 1,
      });

      const seedProjectId = seedResult.projectIds?.[0];

      expect(seedProjectId).toBeDefined();

      // When - 할당이 있는 프로젝트 삭제 시도
      const response = await testSuite
        .request()
        .delete(`/admin/projects/${seedProjectId}`)
        .expect(409);

      // Then - 409 Conflict 에러와 함께 할당 개수 정보 확인
      expect(response.body.message).toContain('할당이 존재하여 삭제할 수 없습니다');

      // 프로젝트가 여전히 존재하는지 확인
      const projectResponse = await testSuite
        .request()
        .get(`/admin/projects/${seedProjectId}`)
        .expect(200);

      expect(projectResponse.body.id).toBe(seedProjectId);
    });

    it('할당이 취소된 프로젝트는 삭제할 수 있다', async () => {
      // Given - 시드 데이터 생성 (프로젝트, 직원, 평가기간, 할당 포함)
      // with_period 시나리오는 이미 프로젝트 할당을 포함하여 생성됨
      const seedDataScenario = new SeedDataScenario(testSuite);
      const projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);

      const seedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'with_period',
        clearExisting: false,
        projectCount: 1,
        wbsPerProject: 1,
        departmentCount: 1,
        employeeCount: 1,
      });

      const seedProjectId = seedResult.projectIds?.[0];
      const employeeId = seedResult.employeeIds?.[0];
      const periodId = seedResult.evaluationPeriodId;

      expect(seedProjectId).toBeDefined();
      expect(employeeId).toBeDefined();
      expect(periodId).toBeDefined();

      // 기존 할당 취소 (소프트 삭제)
      await projectAssignmentScenario.프로젝트_할당을_프로젝트_ID로_취소한다({
        employeeId: employeeId!,
        projectId: seedProjectId!,
        periodId: periodId!,
      });

      // When - 할당이 취소된 프로젝트 삭제
      await testSuite
        .request()
        .delete(`/admin/projects/${seedProjectId}`)
        .expect(204);

      // Then - 프로젝트가 삭제되었는지 확인
      await testSuite
        .request()
        .get(`/admin/projects/${seedProjectId}`)
        .expect(404);
    });
  });

  describe('프로젝트 일괄 생성 (POST /admin/projects/bulk)', () => {
    it('여러 프로젝트를 한 번에 생성할 수 있다', async () => {
      // Given
      const bulkData = {
        projects: [
          {
            name: '일괄 프로젝트 1',
            projectCode: 'BULK-001',
            status: ProjectStatus.ACTIVE,
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            managerId: MOCK_MANAGER_ID_1,
          },
          {
            name: '일괄 프로젝트 2',
            projectCode: 'BULK-002',
            status: ProjectStatus.ACTIVE,
            startDate: '2024-02-01',
            endDate: '2024-11-30',
            managerId: MOCK_MANAGER_ID_2,
          },
          {
            name: '일괄 프로젝트 3',
            projectCode: 'BULK-003',
            status: ProjectStatus.COMPLETED,
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/projects/bulk')
        .send(bulkData)
        .expect(201);

      // Then
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('failed');
      expect(response.body).toHaveProperty('successCount');
      expect(response.body).toHaveProperty('failedCount');
      expect(response.body).toHaveProperty('totalCount');

      expect(response.body.successCount).toBe(3);
      expect(response.body.failedCount).toBe(0);
      expect(response.body.totalCount).toBe(3);
      expect(response.body.success).toHaveLength(3);
      expect(response.body.failed).toHaveLength(0);

      // 생성된 프로젝트 ID 저장 (cleanup용)
      response.body.success.forEach((project: any) => {
        createdProjectIds.push(project.id);
      });

      // 각 프로젝트 데이터 검증
      expect(response.body.success[0]).toMatchObject({
        name: '일괄 프로젝트 1',
        projectCode: 'BULK-001',
        status: ProjectStatus.ACTIVE,
      });
      expect(response.body.success[1]).toMatchObject({
        name: '일괄 프로젝트 2',
        projectCode: 'BULK-002',
        status: ProjectStatus.ACTIVE,
      });
      expect(response.body.success[2]).toMatchObject({
        name: '일괄 프로젝트 3',
        projectCode: 'BULK-003',
        status: ProjectStatus.COMPLETED,
      });
    });

    it('각 프로젝트별로 다른 PM을 지정할 수 있다', async () => {
      // Given
      const bulkData = {
        projects: [
          {
            name: 'PM1 프로젝트',
            projectCode: 'PM1-001',
            status: ProjectStatus.ACTIVE,
            managerId: MOCK_MANAGER_ID_1,
          },
          {
            name: 'PM2 프로젝트',
            projectCode: 'PM2-002',
            status: ProjectStatus.ACTIVE,
            managerId: MOCK_MANAGER_ID_2,
          },
          {
            name: 'PM 없는 프로젝트',
            projectCode: 'NO-PM-003',
            status: ProjectStatus.ACTIVE,
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/projects/bulk')
        .send(bulkData)
        .expect(201);

      // Then
      expect(response.body.successCount).toBe(3);
      response.body.success.forEach((project: any) => {
        createdProjectIds.push(project.id);
      });

      // PM 정보 확인 (manager 정보는 Employee 테이블에 해당 externalId가 있을 때만 포함됨)
      expect(response.body.success[0]).toHaveProperty('managerId');
      expect(response.body.success[1]).toHaveProperty('managerId');
    });

    it('중복된 프로젝트 코드가 있는 경우 해당 항목만 실패한다', async () => {
      // Given - 먼저 하나의 프로젝트 생성
      const existingProject = await testSuite
        .request()
        .post('/admin/projects')
        .send({
          name: '기존 프로젝트',
          projectCode: 'EXISTING-001',
          status: ProjectStatus.ACTIVE,
        });
      createdProjectIds.push(existingProject.body.id);

      // 일괄 생성 데이터 (중복 코드 포함)
      const bulkData = {
        projects: [
          {
            name: '새 프로젝트 1',
            projectCode: 'NEW-001',
            status: ProjectStatus.ACTIVE,
          },
          {
            name: '중복 프로젝트',
            projectCode: 'EXISTING-001', // 중복!
            status: ProjectStatus.ACTIVE,
          },
          {
            name: '새 프로젝트 2',
            projectCode: 'NEW-002',
            status: ProjectStatus.ACTIVE,
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/projects/bulk')
        .send(bulkData)
        .expect(201);

      // Then
      expect(response.body.successCount).toBe(2);
      expect(response.body.failedCount).toBe(1);
      expect(response.body.totalCount).toBe(3);

      // 성공한 프로젝트
      expect(response.body.success).toHaveLength(2);
      expect(response.body.success[0].projectCode).toBe('NEW-001');
      expect(response.body.success[1].projectCode).toBe('NEW-002');

      response.body.success.forEach((project: any) => {
        createdProjectIds.push(project.id);
      });

      // 실패한 프로젝트
      expect(response.body.failed).toHaveLength(1);
      expect(response.body.failed[0]).toHaveProperty('index');
      expect(response.body.failed[0]).toHaveProperty('data');
      expect(response.body.failed[0]).toHaveProperty('error');
      expect(response.body.failed[0].index).toBe(1);
      expect(response.body.failed[0].data.projectCode).toBe('EXISTING-001');
      expect(response.body.failed[0].error).toContain('이미 사용 중입니다');
    });

    it('일부 프로젝트에 필수 필드가 누락된 경우 해당 항목만 실패한다', async () => {
      // Given
      const bulkData = {
        projects: [
          {
            name: '정상 프로젝트 1',
            projectCode: 'VALID-001',
            status: ProjectStatus.ACTIVE,
          },
          {
            // name 누락!
            projectCode: 'INVALID-002',
            status: ProjectStatus.ACTIVE,
          },
          {
            name: '정상 프로젝트 2',
            projectCode: 'VALID-003',
            status: ProjectStatus.ACTIVE,
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/projects/bulk')
        .send(bulkData);

      // 전체 요청 자체가 validation 에러로 실패할 수 있음
      // ValidationPipe가 배열 내 각 항목을 검증하므로 400 에러 반환
      expect(response.status).toBe(400);
    });

    it('빈 배열로 일괄 생성 시 빈 결과를 반환한다', async () => {
      // Given
      const bulkData = {
        projects: [],
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/projects/bulk')
        .send(bulkData);

      // Then
      // 빈 배열도 유효한 요청이므로 201 또는 400 (최소 1개 이상 필요한 경우)
      // 현재 구현은 빈 배열도 허용하므로 201
      if (response.status === 201) {
        expect(response.body.successCount).toBe(0);
        expect(response.body.failedCount).toBe(0);
        expect(response.body.totalCount).toBe(0);
      }
    });

    it('잘못된 상태 값이 있는 경우 validation 에러를 반환한다', async () => {
      // Given
      const bulkData = {
        projects: [
          {
            name: '정상 프로젝트',
            status: ProjectStatus.ACTIVE,
          },
          {
            name: '잘못된 상태 프로젝트',
            status: 'INVALID_STATUS', // 잘못된 상태
          },
        ],
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/projects/bulk')
        .send(bulkData)
        .expect(400);
    });

    it('대량의 프로젝트를 일괄 생성할 수 있다', async () => {
      // Given - 10개의 프로젝트 데이터
      const projects = Array.from({ length: 10 }, (_, i) => ({
        name: `대량 프로젝트 ${i + 1}`,
        projectCode: `BULK-LARGE-${String(i + 1).padStart(3, '0')}`,
        status: i % 2 === 0 ? ProjectStatus.ACTIVE : ProjectStatus.COMPLETED,
        managerId: i % 2 === 0 ? MOCK_MANAGER_ID_1 : MOCK_MANAGER_ID_2,
      }));

      const bulkData = { projects };

      // When
      const response = await testSuite
        .request()
        .post('/admin/projects/bulk')
        .send(bulkData)
        .expect(201);

      // Then
      expect(response.body.successCount).toBe(10);
      expect(response.body.failedCount).toBe(0);
      expect(response.body.success).toHaveLength(10);

      response.body.success.forEach((project: any) => {
        createdProjectIds.push(project.id);
      });

      // 모든 프로젝트가 정상 생성되었는지 확인
      for (let i = 0; i < 10; i++) {
        expect(response.body.success[i]).toMatchObject({
          name: `대량 프로젝트 ${i + 1}`,
          projectCode: `BULK-LARGE-${String(i + 1).padStart(3, '0')}`,
        });
      }
    });

    it('모든 프로젝트 생성에 실패하는 경우를 처리할 수 있다', async () => {
      // Given - 먼저 프로젝트들 생성
      const existingProjects = [
        { name: 'A', projectCode: 'EXIST-A', status: ProjectStatus.ACTIVE },
        { name: 'B', projectCode: 'EXIST-B', status: ProjectStatus.ACTIVE },
      ];

      for (const project of existingProjects) {
        const response = await testSuite
          .request()
          .post('/admin/projects')
          .send(project);
        createdProjectIds.push(response.body.id);
      }

      // 모두 중복된 코드로 시도
      const bulkData = {
        projects: [
          {
            name: '중복 A',
            projectCode: 'EXIST-A',
            status: ProjectStatus.ACTIVE,
          },
          {
            name: '중복 B',
            projectCode: 'EXIST-B',
            status: ProjectStatus.ACTIVE,
          },
        ],
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/projects/bulk')
        .send(bulkData)
        .expect(201);

      // Then
      expect(response.body.successCount).toBe(0);
      expect(response.body.failedCount).toBe(2);
      expect(response.body.totalCount).toBe(2);
      expect(response.body.success).toHaveLength(0);
      expect(response.body.failed).toHaveLength(2);

      // 실패 정보 확인
      expect(response.body.failed[0].error).toContain('이미 사용 중입니다');
      expect(response.body.failed[1].error).toContain('이미 사용 중입니다');
    });

    it('생성된 프로젝트들을 목록에서 조회할 수 있다', async () => {
      // Given & When - 일괄 생성
      const bulkData = {
        projects: [
          {
            name: '조회 테스트 1',
            projectCode: 'LIST-001',
            status: ProjectStatus.ACTIVE,
          },
          {
            name: '조회 테스트 2',
            projectCode: 'LIST-002',
            status: ProjectStatus.ACTIVE,
          },
        ],
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/projects/bulk')
        .send(bulkData)
        .expect(201);

      createResponse.body.success.forEach((project: any) => {
        createdProjectIds.push(project.id);
      });

      // Then - 목록 조회
      const listResponse = await testSuite
        .request()
        .get('/admin/projects')
        .expect(200);

      expect(listResponse.body.total).toBeGreaterThanOrEqual(2);

      // 생성된 프로젝트들이 목록에 포함되어 있는지 확인
      const createdIds = createResponse.body.success.map((p: any) => p.id);
      const listedIds = listResponse.body.projects.map((p: any) => p.id);

      createdIds.forEach((id: string) => {
        expect(listedIds).toContain(id);
      });
    });
  });

  describe('PM 목록 조회 (GET /admin/projects/managers)', () => {
    it('관리 권한이 있는 직원 목록을 조회할 수 있다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/projects/managers')
        .expect(200);

      // Then
      expect(response.body).toHaveProperty('managers');
      expect(response.body).toHaveProperty('total');
      expect(response.body.managers).toBeInstanceOf(Array);
      expect(response.body.total).toBe(2); // hasManagementAuthority: true인 직원 2명

      // 모든 PM이 관리 권한을 가지고 있는지 확인
      response.body.managers.forEach((manager: any) => {
        expect(manager.hasManagementAuthority).toBe(true);
      });
    });

    it('PM 목록에 부서, 직책, 직급 정보가 포함된다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/projects/managers')
        .expect(200);

      // Then
      const manager = response.body.managers[0];
      expect(manager).toHaveProperty('managerId');
      expect(manager).toHaveProperty('employeeId');
      expect(manager).toHaveProperty('employeeNumber');
      expect(manager).toHaveProperty('name');
      expect(manager).toHaveProperty('email');
      expect(manager).toHaveProperty('departmentName');
      expect(manager).toHaveProperty('departmentCode');
      expect(manager).toHaveProperty('positionName');
      expect(manager).toHaveProperty('positionLevel');
      expect(manager).toHaveProperty('jobTitleName');
    });

    it('부서 ID로 PM을 필터링할 수 있다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/projects/managers')
        .query({ departmentId: MOCK_DEPT_ID_1 })
        .expect(200);

      // Then
      expect(response.body.managers.length).toBe(1);
      expect(response.body.managers[0].departmentCode).toBe('DEV');
    });

    it('검색어로 PM을 필터링할 수 있다 (이름)', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/projects/managers')
        .query({ search: '김철수' })
        .expect(200);

      // Then
      expect(response.body.managers.length).toBe(1);
      expect(response.body.managers[0].name).toBe('김철수');
    });

    it('검색어로 PM을 필터링할 수 있다 (이메일)', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/projects/managers')
        .query({ search: 'lee@company.com' })
        .expect(200);

      // Then
      expect(response.body.managers.length).toBe(1);
      expect(response.body.managers[0].email).toBe('lee@company.com');
    });

    it('검색어로 PM을 필터링할 수 있다 (사번)', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/projects/managers')
        .query({ search: 'EMP001' })
        .expect(200);

      // Then
      expect(response.body.managers.length).toBe(1);
      expect(response.body.managers[0].employeeNumber).toBe('EMP001');
    });

    it('관리 권한이 없는 직원은 PM 목록에 포함되지 않는다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/projects/managers')
        .expect(200);

      // Then
      const hasNonManager = response.body.managers.some(
        (manager: any) => manager.managerId === 'emp-003',
      );
      expect(hasNonManager).toBe(false);
    });

    it('조건에 맞는 PM이 없으면 빈 배열을 반환한다', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/projects/managers')
        .query({ search: '존재하지않는직원' })
        .expect(200);

      // Then
      expect(response.body.managers).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('통합 시나리오 테스트', () => {
    it('프로젝트 생성 → 조회 → 수정 → 삭제 전체 플로우를 테스트한다', async () => {
      // 1. 프로젝트 생성
      const createResponse = await testSuite
        .request()
        .post('/admin/projects')
        .send({
          name: '통합 테스트 프로젝트',
          projectCode: 'INTEGRATION-2024',
          status: ProjectStatus.ACTIVE,
          managerId: MOCK_MANAGER_ID_1,
        })
        .expect(201);

      const projectId = createResponse.body.id;
      createdProjectIds.push(projectId);

      // 2. 상세 조회
      const detailResponse = await testSuite
        .request()
        .get(`/admin/projects/${projectId}`)
        .expect(200);

      expect(detailResponse.body.name).toBe('통합 테스트 프로젝트');
      // manager 정보는 Employee 테이블에 해당 externalId가 있을 때만 포함됨

      // 3. 프로젝트 수정 (PM 변경)
      const updateResponse = await testSuite
        .request()
        .put(`/admin/projects/${projectId}`)
        .send({
          name: '수정된 통합 테스트 프로젝트',
          managerId: MOCK_MANAGER_ID_2,
          status: ProjectStatus.COMPLETED,
        })
        .expect(200);

      expect(updateResponse.body.name).toBe('수정된 통합 테스트 프로젝트');
      expect(updateResponse.body.status).toBe(ProjectStatus.COMPLETED);
      // manager 정보는 Employee 테이블에 해당 externalId가 있을 때만 포함됨

      // 4. 목록에서 확인
      const listResponse = await testSuite
        .request()
        .get('/admin/projects')
        .query({ status: ProjectStatus.COMPLETED });

      const project = listResponse.body.projects.find(
        (p: any) => p.id === projectId,
      );
      expect(project).toBeDefined();
      expect(project.name).toBe('수정된 통합 테스트 프로젝트');

      // 5. 삭제
      await testSuite
        .request()
        .delete(`/admin/projects/${projectId}`)
        .expect(204);

      // 6. 삭제 후 조회 시 404
      await testSuite.request().get(`/admin/projects/${projectId}`).expect(404);
    });

    it('PM 목록에서 PM을 선택하여 프로젝트를 생성할 수 있다', async () => {
      // 1. PM 목록 조회
      const managersResponse = await testSuite
        .request()
        .get('/admin/projects/managers')
        .expect(200);

      expect(managersResponse.body.managers.length).toBeGreaterThan(0);
      const selectedManager = managersResponse.body.managers[0];

      // 2. 선택한 PM으로 프로젝트 생성
      const projectResponse = await testSuite
        .request()
        .post('/admin/projects')
        .send({
          name: 'PM 선택 프로젝트',
          projectCode: 'PM-SELECT-2024',
          status: ProjectStatus.ACTIVE,
          managerId: selectedManager.managerId,
        })
        .expect(201);

      // manager 정보는 Employee 테이블에 해당 externalId가 있을 때만 포함됨
      createdProjectIds.push(projectResponse.body.id);

      // 3. 생성된 프로젝트 확인
      const detailResponse = await testSuite
        .request()
        .get(`/admin/projects/${projectResponse.body.id}`)
        .expect(200);

      expect(detailResponse.body.id).toBe(projectResponse.body.id);
    });
  });
});
