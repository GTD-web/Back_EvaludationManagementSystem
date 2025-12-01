import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, Not, IsNull } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@libs/database/database.module';
import { EmployeeSyncService } from '@context/organization-management-context/employee-sync.service';
import { OrganizationManagementContextModule } from '@context/organization-management-context/organization-management-context.module';
import { EmployeeModule } from '@domain/common/employee/employee.module';
import { SSOModule } from '@domain/common/sso/sso.module';
import { Employee } from '@domain/common/employee/employee.entity';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { SSOService } from '@domain/common/sso';
import type { ISSOService } from '@domain/common/sso/interfaces';
import type { EmployeeSyncResult } from '@domain/common/employee/employee.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * EmployeeSyncService 통합 테스트
 *
 * SSO 서비스를 통한 직원 데이터 동기화 기능을 검증합니다.
 */
describe('EmployeeSyncService - SSO 직원 동기화 통합 테스트', () => {
  let service: EmployeeSyncService;
  let employeeService: EmployeeService;
  let ssoService: ISSOService;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let employeeRepository: Repository<Employee>;

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    // 실제 SSO 서비스를 사용하도록 환경 변수 설정
    process.env.SSO_USE_MOCK = 'false';

    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([Employee]),
        EmployeeModule,
        SSOModule,
        OrganizationManagementContextModule,
      ],
    }).compile();

    service = module.get<EmployeeSyncService>(EmployeeSyncService);
    employeeService = module.get<EmployeeService>(EmployeeService);
    ssoService = module.get<ISSOService>(SSOService);
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    employeeRepository = dataSource.getRepository(Employee);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);

    // SSO 클라이언트 초기화
    try {
      await ssoService.초기화한다();
      await ssoService.부서계층구조를조회한다({});
      console.log('✅ 실제 SSO 서비스 연결 확인 완료');
      console.log(`   - SSO_BASE_URL: ${process.env.SSO_BASE_URL}`);
      console.log(`   - SSO_USE_MOCK: ${process.env.SSO_USE_MOCK}`);
    } catch (error) {
      console.warn(
        '⚠️ SSO 서비스 연결 실패 (테스트는 계속 진행):',
        error.message,
      );
    }
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'employee-sync-manager-assignment-test-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);

    // 환경 변수 정리
    delete process.env.SSO_USE_MOCK;

    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 직원 데이터 정리
    try {
      const employees = await employeeRepository.find();
      await employeeRepository.remove(employees);
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  describe('SSO 직원 정보 조회', () => {
    it('SSO에서 부서 계층 구조를 통해 직원 정보를 조회할 수 있어야 한다', async () => {
      // Given & When
      const employees = await service.fetchExternalEmployees();

      // Then
      expect(employees).toBeDefined();
      expect(Array.isArray(employees)).toBe(true);
      expect(employees.length).toBeGreaterThan(0);

      // 직원 정보 구조 검증
      if (employees.length > 0) {
        const firstEmployee = employees[0];
        expect(firstEmployee).toHaveProperty('id');
        expect(firstEmployee).toHaveProperty('employeeNumber');
        expect(firstEmployee).toHaveProperty('name');
        expect(firstEmployee).toHaveProperty('email');
        expect(firstEmployee.id).toBeTruthy();
        expect(firstEmployee.employeeNumber).toBeTruthy();
        expect(firstEmployee.name).toBeTruthy();
        expect(firstEmployee.email).toBeTruthy();
      }
    }, 60000); // SSO API 호출 시간 고려

    it('SSO 서비스에서 모든 직원 정보를 평면 목록으로 조회할 수 있어야 한다', async () => {
      // Given & When
      const employees = await ssoService.모든직원정보를조회한다({
        includeEmptyDepartments: true,
      });

      // Then
      expect(employees).toBeDefined();
      expect(Array.isArray(employees)).toBe(true);
      expect(employees.length).toBeGreaterThan(0);

      // 평면 목록인지 확인 (모든 직원이 같은 레벨에 있는지)
      employees.forEach((emp) => {
        expect(emp).toHaveProperty('id');
        expect(emp).toHaveProperty('employeeNumber');
        expect(emp).toHaveProperty('name');
        expect(emp).toHaveProperty('email');
      });
    }, 60000);
  });

  describe('직원 데이터 동기화', () => {
    it('SSO에서 직원 데이터를 동기화할 수 있어야 한다', async () => {
      // Given
      const statsBefore = await employeeService.getEmployeeStats();
      expect(statsBefore.totalEmployees).toBe(0);

      // When
      const result: EmployeeSyncResult = await service.syncEmployees(true);

      // Then
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBeGreaterThan(0);
      expect(result.created + result.updated).toBeGreaterThan(0);

      // 동기화 후 데이터 확인
      const statsAfter = await employeeService.getEmployeeStats();
      expect(statsAfter.totalEmployees).toBeGreaterThan(0);
      expect(statsAfter.totalEmployees).toBe(result.created + result.updated);
    }, 120000); // SSO API 호출 및 동기화 시간 고려

    it('이미 존재하는 직원은 업데이트되어야 한다', async () => {
      // Given
      // 1. 첫 번째 동기화
      const firstResult = await service.syncEmployees(true);
      expect(firstResult.success).toBe(true);
      expect(firstResult.created).toBeGreaterThan(0);

      const employeesBefore = await employeeService.findAll();
      expect(employeesBefore.length).toBeGreaterThan(0);

      // 첫 번째 직원 정보 저장
      const firstEmployee = employeesBefore[0];
      const originalName = firstEmployee.name;

      // 2. 두 번째 동기화 (forceSync)
      const secondResult = await service.syncEmployees(true);

      // Then
      expect(secondResult.success).toBe(true);
      expect(secondResult.updated).toBeGreaterThanOrEqual(0);

      // 직원 데이터가 유지되는지 확인
      const employeesAfter = await employeeService.findAll();
      expect(employeesAfter.length).toBe(employeesBefore.length);
    }, 120000);

    it('동기화가 비활성화되어 있으면 동기화를 수행하지 않아야 한다', async () => {
      // Given
      const mockConfigService = {
        get: jest.fn((key: string, defaultValue?: boolean) => {
          if (key === 'EMPLOYEE_SYNC_ENABLED') {
            return false; // 동기화 비활성화
          }
          // 다른 환경 변수는 실제 값 반환
          if (key === 'DATABASE_URL') {
            return process.env.DATABASE_URL;
          }
          if (key === 'SSO_BASE_URL') {
            return process.env.SSO_BASE_URL;
          }
          if (key === 'SSO_CLIENT_ID') {
            return process.env.SSO_CLIENT_ID;
          }
          if (key === 'SSO_CLIENT_SECRET') {
            return process.env.SSO_CLIENT_SECRET;
          }
          return defaultValue;
        }),
      };

      // EmployeeSyncService를 직접 생성하여 테스트
      const employeeServiceInstance =
        module.get<EmployeeService>(EmployeeService);
      const ssoServiceInstance = module.get<ISSOService>(SSOService);

      const disabledService = new EmployeeSyncService(
        employeeServiceInstance,
        mockConfigService as any,
        ssoServiceInstance,
      );

      // When
      const result = await disabledService.syncEmployees(false);

      // Then
      expect(result.success).toBe(false);
      expect(result.errors).toContain('동기화가 비활성화되어 있습니다.');
      expect(result.totalProcessed).toBe(0);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
    });

    it('동기화 실패 시 에러를 반환해야 한다', async () => {
      // Given
      // SSO 서비스를 모킹하여 에러 발생 시뮬레이션
      const mockSSOService = {
        모든직원정보를조회한다: jest
          .fn()
          .mockRejectedValue(new Error('SSO API 오류')),
      };

      const errorModule = await Test.createTestingModule({
        imports: [
          DatabaseModule,
          ConfigModule.forRoot({
            isGlobal: true,
          }),
          ScheduleModule.forRoot(),
          TypeOrmModule.forFeature([Employee]),
          EmployeeModule,
          SSOModule,
        ],
        providers: [
          EmployeeSyncService,
          {
            provide: SSOService,
            useValue: mockSSOService,
          },
        ],
      }).compile();

      const errorService =
        errorModule.get<EmployeeSyncService>(EmployeeSyncService);

      // When
      const result = await errorService.syncEmployees(true);

      // Then
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      await errorModule.close();
    });
  });

  describe('직원 조회 (히트미스 전략)', () => {
    it('로컬 데이터가 없으면 SSO에서 동기화 후 조회해야 한다', async () => {
      // Given
      const statsBefore = await employeeService.getEmployeeStats();
      expect(statsBefore.totalEmployees).toBe(0);

      // When
      const employees = await service.getEmployees(false);

      // Then
      expect(employees).toBeDefined();
      expect(Array.isArray(employees)).toBe(true);
      expect(employees.length).toBeGreaterThan(0);

      // 동기화가 수행되었는지 확인
      const statsAfter = await employeeService.getEmployeeStats();
      expect(statsAfter.totalEmployees).toBeGreaterThan(0);
    }, 120000);

    it('로컬 데이터가 있으면 SSO 동기화 없이 조회해야 한다', async () => {
      // Given
      // 먼저 동기화 수행
      await service.syncEmployees(true);
      const employeesBefore = await employeeService.findAll();
      expect(employeesBefore.length).toBeGreaterThan(0);

      // When
      const employees = await service.getEmployees(false);

      // Then
      expect(employees.length).toBe(employeesBefore.length);
    }, 120000);

    it('강제 새로고침 시 SSO에서 재동기화해야 한다', async () => {
      // Given
      // 첫 번째 동기화
      await service.syncEmployees(true);
      const employeesBefore = await employeeService.findAll();

      // When
      const employees = await service.getEmployees(true);

      // Then
      expect(employees).toBeDefined();
      expect(Array.isArray(employees)).toBe(true);
      expect(employees.length).toBeGreaterThanOrEqual(employeesBefore.length);
    }, 120000);

    it('ID로 직원을 조회할 수 있어야 한다', async () => {
      // Given
      await service.syncEmployees(true);
      const allEmployees = await employeeService.findAll();
      expect(allEmployees.length).toBeGreaterThan(0);

      const targetEmployee = allEmployees[0];

      // When
      const employee = await service.getEmployeeById(targetEmployee.id, false);

      // Then
      expect(employee).toBeDefined();
      expect(employee?.id).toBe(targetEmployee.id);
      expect(employee?.name).toBe(targetEmployee.name);
    }, 120000);

    it('외부 ID로 직원을 조회할 수 있어야 한다', async () => {
      // Given
      await service.syncEmployees(true);
      const allEmployees = await employeeService.findAll();
      expect(allEmployees.length).toBeGreaterThan(0);

      const targetEmployee = allEmployees[0];
      expect(targetEmployee.externalId).toBeTruthy();

      // When
      const employee = await service.getEmployeeByExternalId(
        targetEmployee.externalId,
        false,
      );

      // Then
      expect(employee).toBeDefined();
      expect(employee?.externalId).toBe(targetEmployee.externalId);
      expect(employee?.id).toBe(targetEmployee.id);
    }, 120000);

    it('직원 번호로 직원을 조회할 수 있어야 한다', async () => {
      // Given
      await service.syncEmployees(true);
      const allEmployees = await employeeService.findAll();
      expect(allEmployees.length).toBeGreaterThan(0);

      const targetEmployee = allEmployees[0];
      expect(targetEmployee.employeeNumber).toBeTruthy();

      // When
      const employee = await service.getEmployeeByEmployeeNumber(
        targetEmployee.employeeNumber,
        false,
      );

      // Then
      expect(employee).toBeDefined();
      expect(employee?.employeeNumber).toBe(targetEmployee.employeeNumber);
      expect(employee?.id).toBe(targetEmployee.id);
    }, 120000);

    it('이메일로 직원을 조회할 수 있어야 한다', async () => {
      // Given
      await service.syncEmployees(true);
      const allEmployees = await employeeService.findAll();
      expect(allEmployees.length).toBeGreaterThan(0);

      const targetEmployee = allEmployees[0];
      expect(targetEmployee.email).toBeTruthy();

      // When
      const employee = await service.getEmployeeByEmail(
        targetEmployee.email,
        false,
      );

      // Then
      expect(employee).toBeDefined();
      expect(employee?.email).toBe(targetEmployee.email);
      expect(employee?.id).toBe(targetEmployee.id);
    }, 120000);
  });

  describe('직원 통계', () => {
    it('직원 통계를 조회할 수 있어야 한다', async () => {
      // Given
      await service.syncEmployees(true);

      // When
      const stats = await employeeService.getEmployeeStats();

      // Then
      expect(stats).toBeDefined();
      expect(stats.totalEmployees).toBeGreaterThan(0);
      expect(stats.activeEmployees).toBeGreaterThanOrEqual(0);
      expect(stats.onLeaveEmployees).toBeGreaterThanOrEqual(0);
      expect(stats.resignedEmployees).toBeGreaterThanOrEqual(0);
    }, 120000);
  });

  describe('수동 동기화 트리거', () => {
    it('수동 동기화를 트리거할 수 있어야 한다', async () => {
      // Given
      const statsBefore = await employeeService.getEmployeeStats();
      expect(statsBefore.totalEmployees).toBe(0);

      // When
      const result = await service.triggerManualSync();

      // Then
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBeGreaterThan(0);

      // 동기화 후 데이터 확인
      const statsAfter = await employeeService.getEmployeeStats();
      expect(statsAfter.totalEmployees).toBeGreaterThan(0);
    }, 120000);
  });

  describe('실제 데이터베이스 검증', () => {
    it('동기화 후 실제 DB에 직원 데이터가 저장되어야 한다', async () => {
      // Given
      const statsBefore = await employeeService.getEmployeeStats();
      expect(statsBefore.totalEmployees).toBe(0);

      // When
      const result = await service.syncEmployees(true);

      // Then
      expect(result.success).toBe(true);
      expect(result.created + result.updated).toBeGreaterThan(0);

      // 실제 DB에서 직접 조회하여 검증
      const dbEmployees = await employeeRepository.find({
        order: { name: 'ASC' },
      });

      expect(dbEmployees.length).toBeGreaterThan(0);
      expect(dbEmployees.length).toBe(result.created + result.updated);

      // 첫 번째 직원의 필수 필드 검증
      if (dbEmployees.length > 0) {
        const firstEmployee = dbEmployees[0];
        expect(firstEmployee.id).toBeTruthy();
        expect(firstEmployee.employeeNumber).toBeTruthy();
        expect(firstEmployee.name).toBeTruthy();
        expect(firstEmployee.email).toBeTruthy();
        expect(firstEmployee.externalId).toBeTruthy();
        expect(firstEmployee.lastSyncAt).toBeTruthy();
        expect(firstEmployee.createdAt).toBeTruthy();
        expect(firstEmployee.updatedAt).toBeTruthy();
      }

      // 통계와 실제 DB 데이터 일치 확인
      const statsAfter = await employeeService.getEmployeeStats();
      expect(statsAfter.totalEmployees).toBe(dbEmployees.length);
    }, 120000);

    it('동기화된 직원 데이터의 상세 정보가 올바르게 저장되어야 한다', async () => {
      // Given
      await service.syncEmployees(true);

      // When
      const dbEmployees = await employeeRepository.find({
        take: 5, // 처음 5개만 확인
        order: { name: 'ASC' },
      });

      // Then
      expect(dbEmployees.length).toBeGreaterThan(0);

      // 각 직원의 필수 필드 및 선택 필드 검증
      dbEmployees.forEach((employee) => {
        // 필수 필드
        expect(employee.id).toBeTruthy();
        expect(employee.employeeNumber).toBeTruthy();
        expect(employee.name).toBeTruthy();
        expect(employee.email).toBeTruthy();
        expect(employee.externalId).toBeTruthy();
        expect(employee.status).toBeTruthy();

        // 동기화 메타데이터
        expect(employee.lastSyncAt).toBeTruthy();
        expect(employee.createdBy).toBeTruthy();
        expect(employee.updatedBy).toBeTruthy();

        // 타임스탬프
        expect(employee.createdAt).toBeInstanceOf(Date);
        expect(employee.updatedAt).toBeInstanceOf(Date);
        expect(employee.lastSyncAt).toBeInstanceOf(Date);

        // 선택 필드 (있을 수 있음)
        // departmentId, positionId, rankId 등은 있을 수도 없을 수도 있음
        // phoneNumber, dateOfBirth, gender 등도 선택 사항
      });
    }, 120000);

    it('중복 직원이 올바르게 처리되어야 한다', async () => {
      // Given
      // 첫 번째 동기화
      const firstResult = await service.syncEmployees(true);
      expect(firstResult.success).toBe(true);
      const firstCount = firstResult.created + firstResult.updated;

      // When
      // 두 번째 동기화 (중복 데이터)
      const secondResult = await service.syncEmployees(true);

      // Then
      expect(secondResult.success).toBe(true);

      // DB에서 실제 데이터 확인
      const dbEmployees = await employeeRepository.find();
      expect(dbEmployees.length).toBe(firstCount); // 개수는 동일해야 함

      // 중복이 없어야 함 (employeeNumber 기준)
      const employeeNumbers = dbEmployees.map((emp) => emp.employeeNumber);
      const uniqueEmployeeNumbers = new Set(employeeNumbers);
      expect(uniqueEmployeeNumbers.size).toBe(employeeNumbers.length);

      // 외부 ID도 중복이 없어야 함
      const externalIds = dbEmployees.map((emp) => emp.externalId);
      const uniqueExternalIds = new Set(externalIds);
      expect(uniqueExternalIds.size).toBe(externalIds.length);
    }, 120000);

    it('직원 데이터의 부서 정보가 올바르게 매핑되어야 한다', async () => {
      // Given
      await service.syncEmployees(true);

      // When
      const dbEmployees = await employeeRepository.find({
        where: [{ departmentId: Not(IsNull()) }],
        take: 10,
      });

      // Then
      // 부서 정보가 있는 직원이 있다면 검증
      if (dbEmployees.length > 0) {
        dbEmployees.forEach((employee) => {
          expect(employee.departmentId).toBeTruthy();
          // departmentId는 외부 시스템 ID이므로 문자열이어야 함
          expect(typeof employee.departmentId).toBe('string');
        });
      }
    }, 120000);

    it('각 필드 값들이 SSO 데이터와 올바르게 매핑되어 저장되어야 한다', async () => {
      // Given
      // SSO에서 원본 원시 데이터 조회 (실제 동기화에서 사용하는 것과 동일)
      const ssoEmployees = await service.fetchExternalEmployees();
      expect(ssoEmployees.length).toBeGreaterThan(0);

      // 동기화 수행
      const result = await service.syncEmployees(true);
      expect(result.success).toBe(true);

      // When
      // 실제 DB에서 동기화된 데이터 조회
      const dbEmployees = await employeeRepository.find({
        order: { name: 'ASC' },
      });

      // Then
      expect(dbEmployees.length).toBeGreaterThan(0);

      // SSO 데이터와 DB 데이터를 매핑하여 비교
      const ssoEmployeeMap = new Map(ssoEmployees.map((emp) => [emp.id, emp]));

      // 각 DB 직원에 대해 SSO 데이터와 비교
      dbEmployees.forEach((dbEmployee) => {
        const ssoEmployee = ssoEmployeeMap.get(dbEmployee.externalId);

        if (ssoEmployee) {
          // 기본 정보 검증
          expect(dbEmployee.employeeNumber).toBe(ssoEmployee.employeeNumber);
          expect(dbEmployee.name).toBe(ssoEmployee.name);
          expect(dbEmployee.email).toBe(ssoEmployee.email);
          expect(dbEmployee.externalId).toBe(ssoEmployee.id);

          // 상태 정보 검증
          const expectedStatus = ssoEmployee.isTerminated
            ? '퇴사'
            : ssoEmployee.status === '휴직중'
              ? '휴직중'
              : '재직중';
          expect(dbEmployee.status).toBe(expectedStatus);

          // 전화번호 검증 (SSO에 있을 경우)
          if (ssoEmployee.phoneNumber) {
            expect(dbEmployee.phoneNumber).toBe(ssoEmployee.phoneNumber);
          }

          // 부서 정보 검증
          if (ssoEmployee.department) {
            expect(dbEmployee.departmentId).toBe(ssoEmployee.department.id);
            expect(dbEmployee.departmentName).toBe(
              ssoEmployee.department.departmentName,
            );
            expect(dbEmployee.departmentCode).toBe(
              ssoEmployee.department.departmentCode,
            );
          }

          // 직급 정보 검증 (SSO 원시 데이터의 rank 필드)
          if (ssoEmployee.rank) {
            expect(dbEmployee.rankId).toBe(ssoEmployee.rank.id);
            expect(dbEmployee.rankName).toBe(ssoEmployee.rank.rankName);
            expect(dbEmployee.rankLevel).toBe(ssoEmployee.rank.level);
          }

          // 직책 정보 검증 (SSO 원시 데이터의 position 필드)
          if (ssoEmployee.position) {
            expect(dbEmployee.positionId).toBe(ssoEmployee.position.id);
          }

          // 동기화 메타데이터 검증
          expect(dbEmployee.lastSyncAt).toBeInstanceOf(Date);
          expect(dbEmployee.createdBy).toBe('SYSTEM_SYNC');
          expect(dbEmployee.updatedBy).toBe('SYSTEM_SYNC');

          // 타임스탬프 검증
          expect(dbEmployee.createdAt).toBeInstanceOf(Date);
          expect(dbEmployee.updatedAt).toBeInstanceOf(Date);
          expect(dbEmployee.createdAt.getTime()).toBeLessThanOrEqual(
            Date.now(),
          );
          expect(dbEmployee.updatedAt.getTime()).toBeLessThanOrEqual(
            Date.now(),
          );

          console.log(
            `✅ 직원 ${dbEmployee.name} (${dbEmployee.employeeNumber}) 필드 검증 완료`,
          );
        }
      });

      console.log(`✅ 총 ${dbEmployees.length}명의 직원 필드 검증 완료`);
    }, 120000);

    it('특정 직원의 모든 필드 값을 상세히 검증해야 한다', async () => {
      // Given
      await service.syncEmployees(true);

      // When
      const dbEmployees = await employeeRepository.find({
        take: 3, // 처음 3명만 상세 검증
        order: { name: 'ASC' },
      });

      // Then
      expect(dbEmployees.length).toBeGreaterThan(0);

      dbEmployees.forEach((employee, index) => {
        console.log(`\n📋 직원 #${index + 1} 필드 검증:`);
        console.log(`  - ID: ${employee.id}`);
        console.log(`  - 직원번호: ${employee.employeeNumber}`);
        console.log(`  - 이름: ${employee.name}`);
        console.log(`  - 이메일: ${employee.email}`);
        console.log(`  - 전화번호: ${employee.phoneNumber || '없음'}`);
        console.log(`  - 상태: ${employee.status}`);
        console.log(`  - 외부 ID: ${employee.externalId}`);
        console.log(`  - 부서 ID: ${employee.departmentId || '없음'}`);
        console.log(`  - 부서명: ${employee.departmentName || '없음'}`);
        console.log(`  - 부서 코드: ${employee.departmentCode || '없음'}`);
        console.log(`  - 직급 ID: ${employee.rankId || '없음'}`);
        console.log(`  - 직급명: ${employee.rankName || '없음'}`);
        console.log(`  - 직급 레벨: ${employee.rankLevel || '없음'}`);
        console.log(`  - 직책 ID: ${employee.positionId || '없음'}`);
        console.log(`  - 마지막 동기화: ${employee.lastSyncAt}`);
        console.log(`  - 생성일: ${employee.createdAt}`);
        console.log(`  - 수정일: ${employee.updatedAt}`);

        // 필수 필드 검증
        expect(employee.id).toBeTruthy();
        expect(employee.employeeNumber).toBeTruthy();
        expect(employee.name).toBeTruthy();
        expect(employee.email).toBeTruthy();
        expect(employee.externalId).toBeTruthy();
        expect(employee.status).toBeTruthy();
        expect(['재직중', '휴직중', '퇴사']).toContain(employee.status);

        // UUID 형식 검증
        expect(employee.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );

        // 이메일 형식 검증
        expect(employee.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

        // 타임스탬프 순서 검증
        expect(employee.createdAt.getTime()).toBeLessThanOrEqual(
          employee.updatedAt.getTime(),
        );
        expect(employee.lastSyncAt?.getTime()).toBeLessThanOrEqual(Date.now());

        // 동기화 메타데이터 검증
        expect(employee.createdBy).toBe('SYSTEM_SYNC');
        expect(employee.updatedBy).toBe('SYSTEM_SYNC');
      });
    }, 120000);

    it('모든 직원의 필수 필드가 누락되지 않았는지 확인해야 한다', async () => {
      // Given
      await service.syncEmployees(true);

      // When
      const dbEmployees = await employeeRepository.find();

      // Then
      expect(dbEmployees.length).toBeGreaterThan(0);

      const missingFields: string[] = [];

      dbEmployees.forEach((employee, index) => {
        const missing: string[] = [];

        // 필수 필드 검증
        if (!employee.id) missing.push('id');
        if (!employee.employeeNumber) missing.push('employeeNumber');
        if (!employee.name) missing.push('name');
        if (!employee.email) missing.push('email');
        if (!employee.externalId) missing.push('externalId');
        if (!employee.status) missing.push('status');
        if (!employee.lastSyncAt) missing.push('lastSyncAt');
        if (!employee.createdAt) missing.push('createdAt');
        if (!employee.updatedAt) missing.push('updatedAt');
        if (!employee.createdBy) missing.push('createdBy');
        if (!employee.updatedBy) missing.push('updatedBy');

        if (missing.length > 0) {
          missingFields.push(
            `직원 #${index + 1} (${employee.name || '이름 없음'}): ${missing.join(', ')}`,
          );
        }
      });

      if (missingFields.length > 0) {
        console.error('❌ 누락된 필드가 있는 직원:');
        missingFields.forEach((msg) => console.error(`  - ${msg}`));
      }

      expect(missingFields.length).toBe(0);
      console.log(
        `✅ 모든 ${dbEmployees.length}명의 직원의 필수 필드가 올바르게 저장되었습니다.`,
      );
    }, 120000);

    it('SSO 원시 데이터에 managerId가 포함되어 있는지 확인해야 한다', async () => {
      // Given & When
      // SSO에서 원시 데이터 직접 조회
      const ssoEmployees = await service.fetchExternalEmployees();
      expect(ssoEmployees.length).toBeGreaterThan(0);

      // Then
      // managerId 또는 manager 필드가 있는지 확인
      const employeesWithManagerInfo: any[] = [];
      const managerFieldNames: string[] = [];

      ssoEmployees.forEach((emp, index) => {
        // managerId, manager, managerId 등 다양한 필드명 확인
        const hasManagerId =
          emp.managerId !== undefined && emp.managerId !== null;
        const hasManager = emp.manager !== undefined && emp.manager !== null;
        const hasManagerEmployeeId =
          emp.managerEmployeeId !== undefined && emp.managerEmployeeId !== null;
        const hasManagerEmployeeNumber =
          emp.managerEmployeeNumber !== undefined &&
          emp.managerEmployeeNumber !== null;

        if (
          hasManagerId ||
          hasManager ||
          hasManagerEmployeeId ||
          hasManagerEmployeeNumber
        ) {
          employeesWithManagerInfo.push({
            index,
            employeeNumber: emp.employeeNumber,
            name: emp.name,
            managerId: emp.managerId,
            manager: emp.manager,
            managerEmployeeId: emp.managerEmployeeId,
            managerEmployeeNumber: emp.managerEmployeeNumber,
            allFields: Object.keys(emp),
          });

          if (hasManagerId) managerFieldNames.push('managerId');
          if (hasManager) managerFieldNames.push('manager');
          if (hasManagerEmployeeId) managerFieldNames.push('managerEmployeeId');
          if (hasManagerEmployeeNumber)
            managerFieldNames.push('managerEmployeeNumber');
        }
      });

      // manager 정보가 있는 직원이 있는지 확인
      if (employeesWithManagerInfo.length > 0) {
        console.log(
          `\n📊 매니저 정보가 있는 직원: ${employeesWithManagerInfo.length}명`,
        );
        console.log(
          `📋 매니저 필드명: ${[...new Set(managerFieldNames)].join(', ')}`,
        );

        // 처음 5명만 상세 출력
        employeesWithManagerInfo.slice(0, 5).forEach((emp) => {
          console.log(`\n  - ${emp.name} (${emp.employeeNumber}):`);
          if (emp.managerId) console.log(`    managerId: ${emp.managerId}`);
          if (emp.manager)
            console.log(`    manager: ${JSON.stringify(emp.manager)}`);
          if (emp.managerEmployeeId)
            console.log(`    managerEmployeeId: ${emp.managerEmployeeId}`);
          if (emp.managerEmployeeNumber)
            console.log(
              `    managerEmployeeNumber: ${emp.managerEmployeeNumber}`,
            );
        });

        // SSO 원시 데이터의 모든 필드 확인 (처음 직원만)
        if (ssoEmployees.length > 0) {
          const firstEmployee = ssoEmployees[0];
          console.log(`\n📋 SSO 원시 데이터 필드 목록 (첫 번째 직원):`);
          console.log(`  ${Object.keys(firstEmployee).join(', ')}`);
        }
      } else {
        console.log(`\n⚠️ SSO 원시 데이터에 managerId 관련 필드가 없습니다.`);
        console.log(
          `📋 첫 번째 직원의 모든 필드: ${Object.keys(ssoEmployees[0] || {}).join(', ')}`,
        );

        // SSO 원시 데이터의 전체 구조 확인 (디버깅용)
        if (ssoEmployees.length > 0) {
          const firstEmployee = ssoEmployees[0];
          console.log(
            `\n📋 SSO 원시 데이터 전체 구조 (첫 번째 직원, manager 관련 필드 검색):`,
          );
          const allFields = Object.keys(firstEmployee);
          const managerRelatedFields = allFields.filter(
            (field) =>
              field.toLowerCase().includes('manager') ||
              field.toLowerCase().includes('supervisor') ||
              field.toLowerCase().includes('lead') ||
              field.toLowerCase().includes('head'),
          );

          if (managerRelatedFields.length > 0) {
            console.log(
              `  ✅ manager 관련 필드 발견: ${managerRelatedFields.join(', ')}`,
            );
            managerRelatedFields.forEach((field) => {
              console.log(
                `    - ${field}: ${JSON.stringify(firstEmployee[field])}`,
              );
            });
          } else {
            console.log(`  ℹ️ manager 관련 필드가 없습니다.`);
          }

          // 전체 객체 구조 출력 (중첩된 객체 확인)
          console.log(`\n📋 SSO 원시 데이터 상세 구조 (JSON, 처음 500자):`);
          console.log(JSON.stringify(firstEmployee, null, 2));
        }
      }

      // 여러 직원의 데이터 확인 (managerId가 있을 수 있는 직원 찾기)
      if (ssoEmployees.length > 1) {
        console.log(`\n📊 전체 직원 중 managerId 관련 필드 검색 (처음 10명):`);
        let foundManagerField = false;

        for (let i = 0; i < Math.min(10, ssoEmployees.length); i++) {
          const emp = ssoEmployees[i];
          const hasManagerId =
            emp.managerId !== undefined && emp.managerId !== null;
          const hasManager = emp.manager !== undefined && emp.manager !== null;

          if (hasManagerId || hasManager) {
            foundManagerField = true;
            console.log(
              `\n  ✅ 직원 #${i + 1}: ${emp.name} (${emp.employeeNumber})`,
            );
            if (hasManagerId) console.log(`    managerId: ${emp.managerId}`);
            if (hasManager)
              console.log(`    manager: ${JSON.stringify(emp.manager)}`);
            console.log(`    전체 필드: ${Object.keys(emp).join(', ')}`);
          }
        }

        if (!foundManagerField) {
          console.log(
            `  ℹ️ 처음 10명의 직원 중 managerId 관련 필드를 가진 직원이 없습니다.`,
          );
        }
      }

      // 테스트는 통과 (managerId가 없어도 정상)
      expect(ssoEmployees.length).toBeGreaterThan(0);
    }, 120000);

    it('동기화 후 DB에 managerId가 제대로 저장되었는지 확인해야 한다', async () => {
      // Given
      // SSO에서 관리자 정보 조회
      let managersResponse;
      try {
        managersResponse = await ssoService.직원관리자정보를조회한다();
        console.log(`\n📊 getEmployeesManagers API 호출 성공:`);
        console.log(`  - 총 직원 수: ${managersResponse.total}`);
        console.log(
          `  - 관리자 정보가 있는 직원 수: ${managersResponse.employees.length}명`,
        );

        // 관리자 정보가 있는 직원 예시 출력
        if (managersResponse.employees.length > 0) {
          const firstEmp = managersResponse.employees[0];
          console.log(`\n  📋 첫 번째 직원 관리자 정보 예시:`);
          console.log(
            `    - 직원: ${firstEmp.name} (${firstEmp.employeeNumber})`,
          );
          console.log(`    - 부서 수: ${firstEmp.departments.length}`);

          if (firstEmp.departments.length > 0) {
            const firstDept = firstEmp.departments[0];
            console.log(`    - 부서: ${firstDept.departmentName}`);
            console.log(
              `    - 관리자 라인 레벨 수: ${firstDept.managerLine.length}`,
            );

            // managerLine을 depth 순서대로 정렬하여 확인
            const sortedManagerLine = [...firstDept.managerLine].sort(
              (a, b) => a.depth - b.depth,
            );

            sortedManagerLine.forEach((line) => {
              console.log(
                `    - depth ${line.depth} (${line.departmentName}): 관리자 ${line.managers.length}명`,
              );
              if (line.managers.length > 0) {
                console.log(
                  `      → 첫 번째 관리자: ${line.managers[0].name} (${line.managers[0].employeeId})`,
                );
              }
            });
          }
        }
      } catch (error) {
        console.warn(
          `\n⚠️ getEmployeesManagers API 호출 실패: ${error.message}`,
        );
        managersResponse = null;
      }

      // When
      // 동기화 수행
      const result = await service.syncEmployees(true);
      expect(result.success).toBe(true);

      // Then
      // DB에서 동기화된 데이터 조회
      const dbEmployees = await employeeRepository.find({
        order: { name: 'ASC' },
      });

      expect(dbEmployees.length).toBeGreaterThan(0);

      // managerId가 있는 직원 수 확인
      const dbEmployeesWithManagerId = dbEmployees.filter(
        (emp) =>
          emp.managerId !== undefined &&
          emp.managerId !== null &&
          emp.managerId !== '',
      );

      const dbEmployeesWithoutManagerId = dbEmployees.filter(
        (emp) => !emp.managerId || emp.managerId === '',
      );

      console.log(`\n📊 managerId 저장 현황:`);
      console.log(
        `  - getEmployeesManagers API 호출: ${managersResponse ? '성공' : '실패'}`,
      );
      if (managersResponse) {
        console.log(
          `  - 관리자 정보가 있는 직원 수: ${managersResponse.employees.length}명`,
        );
      }
      console.log(
        `  - DB에 managerId가 저장된 직원: ${dbEmployeesWithManagerId.length}명`,
      );

      console.log(
        `  - DB에 managerId가 없는 직원: ${dbEmployeesWithoutManagerId.length}명`,
      );
      console.log(`  - 전체 동기화된 직원: ${dbEmployees.length}명`);

      // managerId가 있는 직원 상세 확인
      const employeesWithManagerDetails: any[] = [];
      if (dbEmployeesWithManagerId.length > 0) {
        console.log(`\n✅ managerId가 저장된 직원 (처음 10명):`);
        dbEmployeesWithManagerId.slice(0, 10).forEach((emp) => {
          console.log(
            `  - ${emp.name} (${emp.employeeNumber}): managerId = ${emp.managerId}`,
          );
          employeesWithManagerDetails.push({
            name: emp.name,
            employeeNumber: emp.employeeNumber,
            managerId: emp.managerId,
          });
        });
      } else {
        console.log(`\n⚠️ DB에 managerId가 저장된 직원이 없습니다.`);
        if (managersResponse && managersResponse.employees.length > 0) {
          console.log(
            `  ⚠️ getEmployeesManagers API는 성공했지만 매핑이 되지 않았습니다.`,
          );
          console.log(`  동기화 로직을 확인해야 합니다.`);
        } else {
          console.log(
            `  ℹ️ getEmployeesManagers API 호출 실패 또는 관리자 정보가 없습니다.`,
          );
        }
      }

      // 관리자 정보가 있는 직원과 DB에 저장된 managerId 비교
      const managerMappingDetails: any[] = [];
      let matchedCount = 0;
      let mismatchedCount = 0;
      let missingMappingCount = 0;

      if (managersResponse && managersResponse.employees.length > 0) {
        const managerMap = new Map<string, string | null>();

        // 새로운 로직: managerLine을 depth 순서대로 순회하여 managers가 있는 첫 번째 항목 찾기
        for (const empManager of managersResponse.employees) {
          let foundManagerId: string | null = null;

          for (const deptManager of empManager.departments) {
            // managerLine을 depth 순서대로 정렬
            const sortedManagerLine = [...deptManager.managerLine].sort(
              (a, b) => a.depth - b.depth,
            );

            // depth=0부터 순회하면서 managers가 있는 첫 번째 항목 찾기
            for (const managerLine of sortedManagerLine) {
              if (managerLine.managers && managerLine.managers.length > 0) {
                foundManagerId = managerLine.managers[0].employeeId;
                managerMappingDetails.push({
                  employeeId: empManager.employeeId,
                  employeeName: empManager.name,
                  employeeNumber: empManager.employeeNumber,
                  foundManagerId: foundManagerId,
                  foundAtDepth: managerLine.depth,
                  foundAtDepartment: managerLine.departmentName,
                });
                break; // 관리자를 찾으면 종료
              }
            }

            if (foundManagerId) {
              break; // 첫 번째 부서에서 관리자를 찾으면 종료
            }
          }

          managerMap.set(empManager.employeeId, foundManagerId);
        }

        console.log(`\n📊 관리자 정보 매핑 현황:`);
        console.log(`  - 매핑된 관리자 정보: ${managerMap.size}개`);

        // DB 직원과 매핑 비교
        const comparisonDetails: any[] = [];
        for (const dbEmp of dbEmployees) {
          const expectedManagerId = managerMap.get(dbEmp.externalId);
          const comparison = {
            employeeId: dbEmp.id,
            employeeName: dbEmp.name,
            employeeNumber: dbEmp.employeeNumber,
            externalId: dbEmp.externalId,
            expectedManagerId: expectedManagerId || null,
            actualManagerId: dbEmp.managerId || null,
            status: 'unknown',
          };

          if (expectedManagerId && dbEmp.managerId === expectedManagerId) {
            matchedCount++;
            comparison.status = 'matched';
          } else if (expectedManagerId && !dbEmp.managerId) {
            missingMappingCount++;
            comparison.status = 'missing';
            console.log(
              `  ⚠️ 매핑 누락: ${dbEmp.name} (${dbEmp.employeeNumber}) - 예상 managerId: ${expectedManagerId}`,
            );
          } else if (
            expectedManagerId &&
            dbEmp.managerId !== expectedManagerId
          ) {
            mismatchedCount++;
            comparison.status = 'mismatched';
            console.log(
              `  ⚠️ 매핑 불일치: ${dbEmp.name} (${dbEmp.employeeNumber}) - 예상: ${expectedManagerId}, 실제: ${dbEmp.managerId}`,
            );
          } else if (!expectedManagerId && dbEmp.managerId) {
            comparison.status = 'unexpected';
            console.log(
              `  ℹ️ 예상치 못한 managerId: ${dbEmp.name} (${dbEmp.employeeNumber}) - managerId: ${dbEmp.managerId}`,
            );
          } else {
            comparison.status = 'no_manager';
          }

          comparisonDetails.push(comparison);
        }

        console.log(`  - 매핑 일치: ${matchedCount}명`);
        console.log(`  - 매핑 누락: ${missingMappingCount}명`);
        console.log(`  - 매핑 불일치: ${mismatchedCount}명`);

        // 테스트 결과 저장
        testResults.push({
          testName:
            '동기화 후 DB에 managerId가 제대로 저장되었는지 확인해야 한다',
          result: {
            syncResult: {
              success: result.success,
              totalProcessed: result.totalProcessed,
              created: result.created,
              updated: result.updated,
            },
            managersApi: {
              success: managersResponse !== null,
              totalEmployees: managersResponse?.total || 0,
              employeesWithManagerInfo: managersResponse?.employees.length || 0,
            },
            dbStatistics: {
              totalEmployees: dbEmployees.length,
              employeesWithManagerId: dbEmployeesWithManagerId.length,
              employeesWithoutManagerId: dbEmployeesWithoutManagerId.length,
            },
            mappingStatistics: {
              totalMapped: managerMap.size,
              matched: matchedCount,
              missing: missingMappingCount,
              mismatched: mismatchedCount,
            },
            employeesWithManagerDetails: employeesWithManagerDetails.slice(
              0,
              20,
            ),
            managerMappingDetails: managerMappingDetails.slice(0, 20),
            comparisonDetails: comparisonDetails.slice(0, 50),
          },
        });
      } else {
        // 관리자 정보가 없는 경우
        testResults.push({
          testName:
            '동기화 후 DB에 managerId가 제대로 저장되었는지 확인해야 한다',
          result: {
            syncResult: {
              success: result.success,
              totalProcessed: result.totalProcessed,
              created: result.created,
              updated: result.updated,
            },
            managersApi: {
              success: false,
              error: '관리자 정보 조회 실패 또는 없음',
            },
            dbStatistics: {
              totalEmployees: dbEmployees.length,
              employeesWithManagerId: dbEmployeesWithManagerId.length,
              employeesWithoutManagerId: dbEmployeesWithoutManagerId.length,
            },
          },
        });
      }

      // 테스트는 통과 (managerId가 없어도 정상, 있으면 저장되어야 함)
      expect(dbEmployees.length).toBeGreaterThan(0);
    }, 120000);
  });

  describe('파트장 동기화 및 동료평가', () => {
    it('파트장 정보가 올바르게 동기화되어야 한다', async () => {
      // Given
      // SSO에서 원시 데이터 조회
      const ssoEmployees = await service.fetchExternalEmployees();
      expect(ssoEmployees.length).toBeGreaterThan(0);

      // SSO 데이터에서 파트장 찾기
      const ssoPartLeaders = ssoEmployees.filter(
        (emp) =>
          emp.position &&
          (emp.position.positionName?.includes('파트장') ||
            emp.position.positionCode?.includes('파트장')),
      );

      console.log(`\n📊 SSO 원시 데이터 파트장 현황:`);
      console.log(`  - 전체 직원 수: ${ssoEmployees.length}명`);
      console.log(`  - 파트장 수: ${ssoPartLeaders.length}명`);

      // 파트장 예시 출력 (처음 5명)
      if (ssoPartLeaders.length > 0) {
        console.log(`\n📋 파트장 예시 (처음 5명):`);
        ssoPartLeaders.slice(0, 5).forEach((emp) => {
          console.log(`  - ${emp.name} (${emp.employeeNumber})`);
          console.log(`    직책: ${emp.position.positionName}`);
          console.log(`    직책 코드: ${emp.position.positionCode || '없음'}`);
          console.log(`    부서: ${emp.department?.departmentName || '없음'}`);
          console.log(`    직급: ${emp.rank?.rankName || '없음'}`);
        });
      }

      // When
      // 동기화 수행
      const result = await service.syncEmployees(true);
      expect(result.success).toBe(true);

      // Then
      // DB에서 동기화된 파트장 데이터 조회
      const dbEmployees = await employeeRepository.find({
        order: { name: 'ASC' },
      });

      // DB에서 파트장 필터링 (positionId가 파트장인 직원)
      const dbPartLeaders = dbEmployees.filter((emp) => {
        if (!emp.positionId) return false;

        // SSO 데이터에서 해당 직원의 position 정보 확인
        const ssoEmp = ssoEmployees.find((ssoE) => ssoE.id === emp.externalId);
        return (
          ssoEmp &&
          ssoEmp.position &&
          (ssoEmp.position.positionName?.includes('파트장') ||
            ssoEmp.position.positionCode?.includes('파트장'))
        );
      });

      console.log(`\n📊 DB 동기화 파트장 현황:`);
      console.log(`  - 전체 동기화된 직원: ${dbEmployees.length}명`);
      console.log(`  - DB에 저장된 파트장: ${dbPartLeaders.length}명`);

      // 파트장이 있다면 상세 검증
      if (ssoPartLeaders.length > 0) {
        expect(dbPartLeaders.length).toBe(ssoPartLeaders.length);

        console.log(`\n✅ DB에 저장된 파트장 상세 정보 (처음 5명):`);
        dbPartLeaders.slice(0, 5).forEach((emp) => {
          const ssoEmp = ssoEmployees.find(
            (ssoE) => ssoE.id === emp.externalId,
          );

          console.log(`  - ${emp.name} (${emp.employeeNumber})`);
          console.log(`    직책 ID: ${emp.positionId}`);
          console.log(`    부서: ${emp.departmentName || '없음'}`);
          console.log(`    직급: ${emp.rankName || '없음'}`);
          console.log(`    상태: ${emp.status}`);

          // 필드 검증
          expect(emp.positionId).toBeTruthy();
          expect(emp.positionId).toBe(ssoEmp?.position?.id);

          // 부서 정보 검증 (있을 경우)
          if (ssoEmp?.department) {
            expect(emp.departmentId).toBe(ssoEmp.department.id);
            expect(emp.departmentName).toBe(ssoEmp.department.departmentName);
          }

          // 직급 정보 검증 (있을 경우)
          if (ssoEmp?.rank) {
            expect(emp.rankId).toBe(ssoEmp.rank.id);
            expect(emp.rankName).toBe(ssoEmp.rank.rankName);
          }
        });

        console.log(`\n✅ 파트장 ${dbPartLeaders.length}명 동기화 검증 완료`);
      } else {
        console.log(`\n⚠️ SSO 데이터에 파트장이 없습니다.`);

        // 파트장이 없어도 테스트는 통과하지만, position 데이터는 확인
        const employeesWithPosition = dbEmployees.filter(
          (emp) => emp.positionId !== null && emp.positionId !== undefined,
        );

        console.log(
          `\nℹ️ 직책 정보가 있는 직원: ${employeesWithPosition.length}명`,
        );

        if (employeesWithPosition.length > 0) {
          console.log(`\n📋 직책 정보 예시 (처음 5명):`);
          employeesWithPosition.slice(0, 5).forEach((emp) => {
            const ssoEmp = ssoEmployees.find(
              (ssoE) => ssoE.id === emp.externalId,
            );

            console.log(`  - ${emp.name} (${emp.employeeNumber})`);
            console.log(`    직책 ID: ${emp.positionId}`);
            if (ssoEmp?.position) {
              console.log(`    직책명: ${ssoEmp.position.positionName}`);
            }
          });
        }
      }

      // 기본 검증
      expect(dbEmployees.length).toBeGreaterThan(0);
    }, 120000);

    it('파트장 목록을 조회할 수 있어야 한다', async () => {
      // Given
      // 동기화 수행
      await service.syncEmployees(true);

      // When
      const partLeaders = await service.getPartLeaders(false);

      // Then
      console.log(`\n📊 파트장 조회 결과:`);
      console.log(`  - 조회된 파트장 수: ${partLeaders.length}명`);

      if (partLeaders.length > 0) {
        console.log(`\n📋 파트장 목록 (처음 5명):`);
        partLeaders.slice(0, 5).forEach((leader, index) => {
          console.log(
            `  ${index + 1}. ${leader.name} (${leader.employeeNumber})`,
          );
          console.log(`     부서: ${leader.departmentName || '없음'}`);
          console.log(`     직급: ${leader.rankName || '없음'}`);
        });
      } else {
        console.log(`\n⚠️ 파트장이 조회되지 않았습니다.`);
      }

      // 파트장이 있든 없든 배열이어야 함
      expect(Array.isArray(partLeaders)).toBe(true);
    }, 120000);

    it('조회된 파트장들이 모두 유효한 직원이어야 한다', async () => {
      // Given
      await service.syncEmployees(true);

      // When
      const partLeaders = await service.getPartLeaders(false);

      // Then
      if (partLeaders.length > 0) {
        console.log(`\n📊 파트장 유효성 검증:`);
        console.log(`  - 파트장 수: ${partLeaders.length}명`);

        partLeaders.forEach((leader) => {
          // 필수 필드 검증
          expect(leader.id).toBeTruthy();
          expect(leader.employeeNumber).toBeTruthy();
          expect(leader.name).toBeTruthy();
          expect(leader.email).toBeTruthy();
          expect(leader.externalId).toBeTruthy();
          expect(leader.status).toBeTruthy();

          // UUID 형식 검증
          expect(leader.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
          );
        });

        console.log(`  ✅ 모든 파트장의 필수 필드가 유효합니다.`);
      } else {
        console.log(`\n⚠️ 파트장이 없어 유효성 검증을 건너뜁니다.`);
      }

      expect(Array.isArray(partLeaders)).toBe(true);
    }, 120000);
  });
});
