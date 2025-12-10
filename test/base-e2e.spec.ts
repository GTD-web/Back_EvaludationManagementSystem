import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { SSOService } from '../src/domain/common/sso';
import type { ISSOService } from '../src/domain/common/sso/interfaces';
import { AuthService } from '../src/context/auth-context/auth.service';
import { OrganizationManagementService } from '../src/context/organization-management-context/organization-management.service';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { EmployeeService } from '../src/domain/common/employee/employee.service';
import request from 'supertest';

/**
 * E2E 테스트 베이스 클래스
 * 모든 E2E 테스트에서 상속받아 사용
 */
export class BaseE2ETest {
  public app: INestApplication;
  protected dataSource: DataSource;
  private mockAuthService: any;

  /**
   * 모든 E2E 테스트에서 사용할 수 있는 테스트용 인증 토큰
   * 사용법: .set('Authorization', testSuite.TEST_TOKEN)
   */
  public readonly TEST_TOKEN = 'Bearer test-token';

  /**
   * 인증 토큰이 자동으로 포함된 supertest request 반환
   * 사용법: testSuite.request().get('/api/endpoint')
   */
  request() {
    return {
      get: (url: string) =>
        request(this.app.getHttpServer())
          .get(url)
          .set('Authorization', this.TEST_TOKEN),
      post: (url: string) =>
        request(this.app.getHttpServer())
          .post(url)
          .set('Authorization', this.TEST_TOKEN),
      put: (url: string) =>
        request(this.app.getHttpServer())
          .put(url)
          .set('Authorization', this.TEST_TOKEN),
      patch: (url: string) =>
        request(this.app.getHttpServer())
          .patch(url)
          .set('Authorization', this.TEST_TOKEN),
      delete: (url: string) =>
        request(this.app.getHttpServer())
          .delete(url)
          .set('Authorization', this.TEST_TOKEN),
    };
  }

  /**
   * Repository 접근을 위한 public 메서드
   */
  getRepository(entityName: string) {
    return this.dataSource.getRepository(entityName);
  }

  /**
   * OrganizationManagementService 접근을 위한 public 메서드
   */
  getOrganizationManagementService(): OrganizationManagementService {
    return this.app.get(OrganizationManagementService);
  }

  /**
   * 액세스 토큰 반환 (하위 호환성)
   */
  getAccessToken(): string {
    return this.TEST_TOKEN.replace('Bearer ', '');
  }

  /**
   * 테스트 애플리케이션 초기화
   */
  async initializeApp(): Promise<void> {
    // AuthService 모킹 객체 생성 (나중에 동적으로 변경 가능)
    this.mockAuthService = {
      토큰검증및사용자동기화: jest.fn().mockResolvedValue({
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'test@example.com',
          name: '테스트 사용자',
          employeeNumber: 'TEST001',
          roles: ['admin', 'user'],
        },
        isSynced: false,
      }),
      토큰검증및사용자조회: jest.fn().mockResolvedValue({
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'test@example.com',
          name: '테스트 사용자',
          employeeNumber: 'TEST001',
          roles: ['admin', 'user'],
        },
      }),
      역할포함사용자조회: jest.fn().mockResolvedValue({
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'test@example.com',
          name: '테스트 사용자',
          employeeNumber: 'TEST001',
          roles: ['admin', 'user'],
        },
      }),
      로그인한다: jest.fn().mockResolvedValue({
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          externalId: 'external-001',
          email: 'test@example.com',
          name: '테스트 사용자',
          employeeNumber: 'TEST001',
          roles: ['admin', 'user'],
          status: '재직중',
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // AuthService를 mock으로 대체 - 항상 성공하는 인증 반환
      .overrideProvider(AuthService)
      .useValue(this.mockAuthService)
      // OrganizationManagementService를 부분 모킹 - 사번으로_관리자권한있는가만 모킹
      .overrideProvider(OrganizationManagementService)
      .useFactory({
        factory: (
          queryBus: QueryBus,
          commandBus: CommandBus,
          ssoService: ISSOService,
          employeeService: EmployeeService,
        ) => {
          const service = new OrganizationManagementService(
            queryBus,
            commandBus,
            ssoService,
            employeeService,
          );
          // 사번으로_관리자권한있는가만 모킹
          service.사번으로_관리자권한있는가 = jest.fn().mockResolvedValue(true);
          return service;
        },
        inject: [QueryBus, CommandBus, SSOService, EmployeeService],
      })
      .overrideProvider('SSO_CONFIG')
      .useValue({
        baseUrl: 'http://localhost:3000',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      })
      .overrideProvider('SSO_CLIENT')
      .useValue({
        auth: {
          로그인한다: jest.fn(),
          토큰을검증한다: jest.fn(),
          토큰을갱신한다: jest.fn(),
        },
        organization: {
          직원정보를조회한다: jest.fn(),
          직원목록을조회한다: jest.fn(),
          여러직원정보를조회한다: jest.fn().mockResolvedValue([
            {
              id: 'emp-001',
              employeeNumber: 'EMP001',
              name: '김철수',
              email: 'kim@company.com',
              departmentId: 'dept-001',
              status: '재직중',
            },
            {
              id: 'emp-002',
              employeeNumber: 'EMP002',
              name: '이영희',
              email: 'lee@company.com',
              departmentId: 'dept-001',
              status: '재직중',
            },
            {
              id: 'emp-003',
              employeeNumber: 'EMP003',
              name: '박민수',
              email: 'park@company.com',
              departmentId: 'dept-002',
              status: '재직중',
            },
          ]),
          부서정보를조회한다: jest.fn(),
          부서목록을조회한다: jest.fn().mockResolvedValue([
            {
              id: 'dept-001',
              name: '개발팀',
              code: 'DEV',
              parentDepartmentId: null,
            },
            {
              id: 'dept-002',
              name: '기획팀',
              code: 'PLAN',
              parentDepartmentId: null,
            },
          ]),
          부서트리를조회한다: jest.fn(),
        },
        fcm: {
          FCM토큰을등록한다: jest.fn(),
          FCM알림을전송한다: jest.fn(),
        },
      })
      .overrideProvider(SSOService)
      .useValue({
        초기화한다: jest.fn().mockResolvedValue(undefined),
        로그인한다: jest.fn(),
        토큰을검증한다: jest.fn(),
        토큰을갱신한다: jest.fn(),
        비밀번호를확인한다: jest.fn(),
        비밀번호를변경한다: jest.fn(),
        직원정보를조회한다: jest.fn(),
        여러직원정보를조회한다: jest.fn().mockResolvedValue([
          {
            id: 'emp-001',
            employeeNumber: 'EMP001',
            name: '김철수',
            email: 'kim@company.com',
            departmentId: 'dept-001',
            status: '재직중',
          },
          {
            id: 'emp-002',
            employeeNumber: 'EMP002',
            name: '이영희',
            email: 'lee@company.com',
            departmentId: 'dept-001',
            status: '재직중',
          },
          {
            id: 'emp-003',
            employeeNumber: 'EMP003',
            name: '박민수',
            email: 'park@company.com',
            departmentId: 'dept-002',
            status: '재직중',
          },
        ]),
        여러직원원시정보를조회한다: jest.fn().mockResolvedValue([
          {
            id: 'emp-001',
            employeeNumber: 'EMP001',
            name: '김철수',
            email: 'kim@company.com',
            departmentId: 'dept-001',
            status: '재직중',
          },
          {
            id: 'emp-002',
            employeeNumber: 'EMP002',
            name: '이영희',
            email: 'lee@company.com',
            departmentId: 'dept-001',
            status: '재직중',
          },
          {
            id: 'emp-003',
            employeeNumber: 'EMP003',
            name: '박민수',
            email: 'park@company.com',
            departmentId: 'dept-002',
            status: '재직중',
          },
        ]),
        부서계층구조를조회한다: jest.fn(),
        직원관리자정보를조회한다: jest.fn(),
        모든부서정보를조회한다: jest.fn().mockResolvedValue([
          {
            id: 'dept-001',
            name: '개발팀',
            code: 'DEV',
            parentDepartmentId: null,
          },
          {
            id: 'dept-002',
            name: '기획팀',
            code: 'PLAN',
            parentDepartmentId: null,
          },
        ]),
        모든직원정보를조회한다: jest.fn().mockResolvedValue([
          {
            id: 'emp-001',
            employeeNumber: 'EMP001',
            name: '김철수',
            email: 'kim@company.com',
            departmentId: 'dept-001',
            status: '재직중',
          },
          {
            id: 'emp-002',
            employeeNumber: 'EMP002',
            name: '이영희',
            email: 'lee@company.com',
            departmentId: 'dept-001',
            status: '재직중',
          },
          {
            id: 'emp-003',
            employeeNumber: 'EMP003',
            name: '박민수',
            email: 'park@company.com',
            departmentId: 'dept-002',
            status: '재직중',
          },
        ]),
        사번으로직원을조회한다: jest.fn(),
        이메일로직원을조회한다: jest.fn(),
        FCM토큰을구독한다: jest.fn(),
        FCM토큰을구독해지한다: jest.fn(),
        FCM토큰을조회한다: jest.fn(),
        여러직원의FCM토큰을조회한다: jest.fn(),
      } as ISSOService)
      .compile();

    this.app = moduleFixture.createNestApplication();

    // ValidationPipe 설정 (실제 애플리케이션과 동일하게)
    this.app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    this.dataSource = moduleFixture.get<DataSource>(DataSource);

    // 테스트 환경에서 데이터베이스 스키마 동기화
    await this.dataSource.synchronize(true);

    await this.app.init();
  }

  /**
   * 테스트 애플리케이션 종료
   */
  async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  /**
   * 모든 테이블 데이터 초기화 (TRUNCATE)
   */
  private async cleanDatabase(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      return;
    }

    const entities = this.dataSource.entityMetadatas;

    // PostgreSQL의 경우 CASCADE를 사용하여 외래키 제약조건 무시
    try {
      // 모든 테이블 TRUNCATE
      for (const entity of entities) {
        const tableName = entity.tableName;
        await this.dataSource.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`,
        );
      }
    } catch (error) {
      console.warn('테이블 정리 중 오류 발생:', error);
      // 실패 시 개별 테이블 삭제 시도
      for (const entity of entities) {
        try {
          const repository = this.dataSource.getRepository(entity.name);
          await repository.clear();
        } catch (e) {
          console.warn(`테이블 ${entity.name} 정리 실패:`, e);
        }
      }
    }
  }

  /**
   * 특정 테이블들만 초기화
   */
  private async cleanTables(tableNames: string[]): Promise<void> {
    if (!this.dataSource.isInitialized) {
      return;
    }

    try {
      for (const tableName of tableNames) {
        await this.dataSource.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`,
        );
      }
    } catch (error) {
      console.warn('특정 테이블 정리 중 오류 발생:', error);
    }
  }

  /**
   * 트랜잭션 시작
   */
  private async startTransaction(): Promise<void> {
    await this.dataSource.query('START TRANSACTION');
  }

  /**
   * 트랜잭션 롤백
   */
  private async rollbackTransaction(): Promise<void> {
    await this.dataSource.query('ROLLBACK');
  }

  /**
   * 시퀀스 초기화 (PostgreSQL)
   */
  private async resetSequences(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;

    for (const entity of entities) {
      const tableName = entity.tableName;
      try {
        // PostgreSQL의 경우 시퀀스 초기화
        await this.dataSource.query(
          `ALTER SEQUENCE IF EXISTS "${tableName}_id_seq" RESTART WITH 1`,
        );
      } catch (error) {
        // 시퀀스가 없는 테이블은 무시
        console.warn(`시퀀스 초기화 실패 (${tableName}):`, error.message);
      }
    }
  }

  /**
   * 각 테스트 전 데이터베이스 정리
   */
  async cleanupBeforeTest(): Promise<void> {
    await this.cleanDatabase();
  }

  /**
   * 각 테스트 후 데이터베이스 정리
   */
  async cleanupAfterTest(): Promise<void> {
    await this.cleanDatabase();
  }

  /**
   * 트랜잭션 기반 테스트 시작
   */
  async startTransactionTest(): Promise<void> {
    await this.startTransaction();
  }

  /**
   * 트랜잭션 기반 테스트 종료 (롤백)
   */
  async rollbackTransactionTest(): Promise<void> {
    await this.rollbackTransaction();
  }

  /**
   * 특정 테이블들만 정리
   */
  async cleanupSpecificTables(tableNames: string[]): Promise<void> {
    await this.cleanTables(tableNames);
  }

  /**
   * 시퀀스 초기화
   */
  async resetDatabaseSequences(): Promise<void> {
    await this.resetSequences();
  }

  /**
   * 테스트 데이터 시드
   */
  async seedTestData(): Promise<any> {
    // 필요한 경우 기본 테스트 데이터 삽입
    // 예: 기본 사용자, 기본 설정 등
    return {};
  }

  /**
   * 테스트 스위트 시작 전 초기화
   */
  async beforeAll(): Promise<void> {
    await this.initializeApp();
  }

  /**
   * 테스트 스위트 종료 후 정리
   */
  async afterAll(): Promise<void> {
    await this.closeApp();
  }

  /**
   * 현재 로그인한 사용자 정보를 동적으로 설정
   * JWT 인증 시 반환될 사용자 정보를 변경합니다.
   *
   * @param user 설정할 사용자 정보
   *
   * @example
   * ```typescript
   * testSuite.setCurrentUser({
   *   id: employee.id,
   *   email: employee.email,
   *   name: employee.name,
   *   employeeNumber: employee.employeeNumber,
   * });
   * ```
   */
  setCurrentUser(user: {
    id: string;
    email: string;
    name: string;
    employeeNumber: string;
    externalId?: string;
    roles?: string[];
    status?: string;
  }): void {
    const defaultUser = {
      externalId: user.externalId || 'test-external-id',
      roles: user.roles || ['admin', 'user'],
      status: user.status || '재직중',
    };

    // 토큰검증및사용자동기화 모킹 업데이트
    this.mockAuthService.토큰검증및사용자동기화 = jest.fn().mockResolvedValue({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        employeeNumber: user.employeeNumber,
        roles: defaultUser.roles,
      },
      isSynced: false,
    });

    // 토큰검증및사용자조회 모킹 업데이트 (JwtAuthGuard가 사용)
    this.mockAuthService.토큰검증및사용자조회 = jest.fn().mockResolvedValue({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        employeeNumber: user.employeeNumber,
        roles: defaultUser.roles,
      },
      isSynced: false,
    });

    // 역할포함사용자조회 모킹 업데이트
    this.mockAuthService.역할포함사용자조회 = jest.fn().mockResolvedValue({
      user: {
        id: user.id,
        externalId: defaultUser.externalId,
        email: user.email,
        name: user.name,
        employeeNumber: user.employeeNumber,
        roles: defaultUser.roles,
        status: defaultUser.status,
      },
    });

    // 로그인한다 모킹 업데이트
    this.mockAuthService.로그인한다 = jest.fn().mockResolvedValue({
      user: {
        id: user.id,
        externalId: defaultUser.externalId,
        email: user.email,
        name: user.name,
        employeeNumber: user.employeeNumber,
        roles: defaultUser.roles,
        status: defaultUser.status,
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
  }
}
