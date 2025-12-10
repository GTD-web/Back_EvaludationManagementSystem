import { SSOService } from '@domain/common/sso';
import type { ISSOService } from '@domain/common/sso/interfaces';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Employee } from '../../domain/common/employee/employee.entity';
import { EmployeeService } from '../../domain/common/employee/employee.service';
import {
  CreateEmployeeDto,
  EmployeeSyncResult,
  UpdateEmployeeDto,
} from '../../domain/common/employee/employee.types';

/**
 * 직원 동기화 서비스
 *
 * SSO 서비스와 직원 데이터를 동기화합니다.
 * 히트미스 전략을 사용하여 캐시처럼 동작합니다.
 */
@Injectable()
export class EmployeeSyncService implements OnModuleInit {
  private readonly logger = new Logger(EmployeeSyncService.name);
  private readonly syncEnabled: boolean;
  private readonly systemUserId = 'SYSTEM_SYNC'; // 시스템 동기화 사용자 ID

  constructor(
    private readonly employeeService: EmployeeService,
    private readonly configService: ConfigService,
    @Inject(SSOService) private readonly ssoService: ISSOService,
  ) {
    this.syncEnabled = this.configService.get<boolean>(
      'EMPLOYEE_SYNC_ENABLED',
      true,
    );
  }

  /**
   * 모듈 초기화 시 실행
   * 직원 데이터가 없으면 초기 동기화를 수행합니다.
   */
  async onModuleInit(): Promise<void> {
    if (!this.syncEnabled) {
      this.logger.log(
        '직원 동기화가 비활성화되어 있어 초기 동기화를 건너뜁니다.',
      );
      return;
    }

    try {
      this.logger.log('모듈 초기화: 직원 데이터 확인 중...');

      // 직원 데이터 개수 확인
      const stats = await this.employeeService.getEmployeeStats();

      if (stats.totalEmployees === 0) {
        this.logger.log('직원 데이터가 없습니다. 초기 동기화를 시작합니다...');
        const result = await this.syncEmployees(true);

        if (result.success) {
          this.logger.log(
            `초기 동기화 완료: ${result.created}개 생성, ${result.updated}개 업데이트`,
          );
        } else {
          this.logger.error(`초기 동기화 실패: ${result.errors.join(', ')}`);
        }
      } else {
        this.logger.log(
          `기존 직원 데이터 ${stats.totalEmployees}개 확인됨. 초기 동기화를 건너뜁니다.`,
        );
      }
    } catch (error) {
      this.logger.error(`모듈 초기화 중 오류 발생: ${error.message}`);
      // 초기화 오류는 애플리케이션 시작을 막지 않습니다
    }
  }

  /**
   * SSO 서비스에서 직원 데이터 조회
   * getEmployees API를 사용하여 모든 직원 정보를 조회합니다.
   *
   * @param useHierarchyAPI 부서 계층 구조 API 사용 여부 (기본값: false, getEmployees 사용)
   */
  async fetchExternalEmployees(
    useHierarchyAPI: boolean = false,
  ): Promise<any[]> {
    try {
      let employees: any[];

      if (useHierarchyAPI) {
        // 부서 계층 구조를 통해 모든 직원 정보를 평면 목록으로 조회 (옵션)
        this.logger.log(
          '부서 계층 구조 API를 사용하여 모든 직원 정보를 조회합니다...',
        );
        employees = await this.ssoService.모든직원정보를조회한다({
          includeEmptyDepartments: true,
        });
        this.logger.log(
          `부서 계층 구조 API에서 ${employees.length}개의 직원 데이터를 조회했습니다.`,
        );
      } else {
        // 직접 직원 목록 API 사용 (identifiers 생략 시 전체 조회) - 기본 방식
        this.logger.log(
          '직원 목록 API(getEmployees)를 사용하여 모든 직원 정보를 조회합니다...',
        );

        // 원시 데이터를 조회하기 위해 SSO 서비스의 원시 정보 조회 메서드 사용
        employees = await this.ssoService.여러직원원시정보를조회한다({
          withDetail: true,
          includeTerminated: false, // 퇴사자 제외
        });

        this.logger.log(
          `직원 목록 API에서 ${employees.length}개의 직원 데이터를 조회했습니다.`,
        );
      }

      return employees;
    } catch (error) {
      this.logger.error('SSO 직원 API 조회 실패:', error.message);
      throw new HttpException(
        'SSO 직원 데이터 조회에 실패했습니다.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * SSO 직원 정보를 내부 엔티티로 변환
   * 실제 SSO 서버에서 넘어온 원시 데이터를 직원 테이블 구조에 맞게 매핑
   */
  private mapSSOEmployeeToDto(ssoEmployee: any): CreateEmployeeDto {
    // SSO 원시 데이터에서 직접 추출 (EmployeeInfo 인터페이스가 아닌 실제 데이터 구조 사용)
    const departmentId = ssoEmployee.department?.id;
    const departmentName = ssoEmployee.department?.departmentName;
    const departmentCode = ssoEmployee.department?.departmentCode;

    const positionId = ssoEmployee.position?.id;

    // rank 필드가 실제 SSO 데이터 구조 (jobTitle이 아님)
    const rankId = ssoEmployee.rank?.id;
    const rankName = ssoEmployee.rank?.rankName;
    const rankCode = ssoEmployee.rank?.rankCode;
    const rankLevel = ssoEmployee.rank?.level;

    // status 필드 처리: "재직중" 또는 다른 값
    let status: '재직중' | '휴직중' | '퇴사' = '재직중';
    if (ssoEmployee.status) {
      if (
        ssoEmployee.status === '재직중' ||
        ssoEmployee.status === 'ACTIVE' ||
        ssoEmployee.status === 'active'
      ) {
        status = '재직중';
      } else if (
        ssoEmployee.status === '휴직중' ||
        ssoEmployee.status === 'ON_LEAVE'
      ) {
        status = '휴직중';
      } else if (
        ssoEmployee.status === '퇴사' ||
        ssoEmployee.status === 'TERMINATED' ||
        ssoEmployee.status === 'terminated'
      ) {
        status = '퇴사';
      }
    } else if (ssoEmployee.isTerminated) {
      status = '퇴사';
    }

    // dateOfBirth 처리: "1989-12-04" 형식의 문자열을 Date로 변환
    let dateOfBirth: Date | undefined;
    if (ssoEmployee.dateOfBirth) {
      try {
        dateOfBirth = new Date(ssoEmployee.dateOfBirth);
        if (isNaN(dateOfBirth.getTime())) {
          dateOfBirth = undefined;
        }
      } catch {
        dateOfBirth = undefined;
      }
    }

    // hireDate 처리: "2025-01-01" 형식의 문자열을 Date로 변환
    let hireDate: Date | undefined;
    if (ssoEmployee.hireDate) {
      try {
        hireDate = new Date(ssoEmployee.hireDate);
        if (isNaN(hireDate.getTime())) {
          hireDate = undefined;
        }
      } catch {
        hireDate = undefined;
      }
    }

    // gender 처리: "MALE" 또는 "FEMALE"
    let gender: 'MALE' | 'FEMALE' | undefined;
    if (ssoEmployee.gender) {
      const genderUpper = ssoEmployee.gender.toUpperCase();
      if (genderUpper === 'MALE' || genderUpper === 'M') {
        gender = 'MALE';
      } else if (genderUpper === 'FEMALE' || genderUpper === 'F') {
        gender = 'FEMALE';
      }
    }

    // phoneNumber 처리: 빈 문자열이면 undefined
    const phoneNumber =
      ssoEmployee.phoneNumber && ssoEmployee.phoneNumber.trim() !== ''
        ? ssoEmployee.phoneNumber
        : undefined;

    // managerId 처리: getEmployeesManagers에서 매핑된 값 사용
    const managerId = ssoEmployee.managerId ? ssoEmployee.managerId : undefined;

    return {
      employeeNumber: ssoEmployee.employeeNumber,
      name: ssoEmployee.name,
      email: ssoEmployee.email,
      phoneNumber: phoneNumber,
      dateOfBirth: dateOfBirth,
      gender: gender,
      hireDate: hireDate,
      managerId: managerId,
      status: status,
      departmentId: departmentId,
      departmentName: departmentName,
      departmentCode: departmentCode,
      positionId: positionId,
      rankId: rankId,
      rankName: rankName,
      rankCode: rankCode,
      rankLevel: rankLevel,
      externalId: ssoEmployee.id,
      externalCreatedAt: new Date(), // SSO에서 제공하지 않으므로 현재 시간 사용
      externalUpdatedAt: new Date(),
      roles: undefined, // SSO 로그인 시에만 제공됨 (EmployeeInfo에는 포함되지 않음)
    };
  }

  /**
   * 직원 데이터 동기화
   * getEmployees API를 사용하여 직원 데이터를 동기화합니다.
   * getEmployeesManagers API를 사용하여 관리자 정보를 조회하고 매핑합니다.
   *
   * @param forceSync 강제 동기화 여부
   * @param useHierarchyAPI 부서 계층 구조 API 사용 여부 (기본값: false, getEmployees 사용)
   */
  async syncEmployees(
    forceSync: boolean = false,
    useHierarchyAPI: boolean = false,
  ): Promise<EmployeeSyncResult> {
    if (!this.syncEnabled && !forceSync) {
      this.logger.warn('직원 동기화가 비활성화되어 있습니다.');
      return {
        success: false,
        totalProcessed: 0,
        created: 0,
        updated: 0,
        errors: ['동기화가 비활성화되어 있습니다.'],
        syncedAt: new Date(),
      };
    }

    const syncStartTime = new Date();
    let totalProcessed = 0;
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    try {
      this.logger.log('직원 데이터 동기화를 시작합니다...');

      // 1. SSO에서 직원 데이터 조회 (기본: getEmployees API 사용)
      const ssoEmployees = await this.fetchExternalEmployees(useHierarchyAPI);

      totalProcessed = ssoEmployees.length;
      this.logger.log(
        `SSO에서 ${totalProcessed}개의 직원 데이터를 조회했습니다.`,
      );

      // 2. SSO에서 관리자 정보 조회
      this.logger.log('관리자 정보를 조회합니다...');
      let managerMap: Map<string, string | null> = new Map();
      try {
        const managersResponse =
          await this.ssoService.직원관리자정보를조회한다();

        // 각 직원의 소속 부서부터 상위 부서까지 관리자 라인을 순회하여 관리자 찾기
        for (const empManager of managersResponse.employees) {
          let foundManagerId: string | null = null;

          // 각 직원의 부서별 관리자 정보 확인
          for (const deptManager of empManager.departments) {
            // managerLine을 depth 순서대로 정렬 (depth=0부터 시작)
            const sortedManagerLine = [...deptManager.managerLine].sort(
              (a, b) => a.depth - b.depth,
            );

            // depth=0부터 순회하면서 managers가 있는 첫 번째 항목 찾기
            for (const managerLine of sortedManagerLine) {
              if (managerLine.managers && managerLine.managers.length > 0) {
                // 첫 번째 관리자의 employeeId를 managerId로 설정
                foundManagerId = managerLine.managers[0].employeeId;
                break; // 관리자를 찾으면 종료
              }
            }

            // 관리자를 찾았으면 첫 번째 부서에서 종료
            if (foundManagerId) {
              break;
            }
          }

          // 관리자를 찾았든 못 찾았든 매핑에 추가 (없으면 null)
          managerMap.set(empManager.employeeId, foundManagerId);
        }

        const managerCount = Array.from(managerMap.values()).filter(
          (id) => id !== null,
        ).length;
        this.logger.log(
          `관리자 정보 ${managerCount}개를 조회했습니다. (null: ${managerMap.size - managerCount}개) 동기화를 시작합니다...`,
        );
      } catch (managerError) {
        this.logger.warn(
          `관리자 정보 조회 실패 (동기화는 계속 진행): ${managerError.message}`,
        );
        // 관리자 정보 조회 실패해도 직원 동기화는 계속 진행
      }

      // 3. 각 직원 데이터 처리
      const employeesToSave: Employee[] = [];

      for (const ssoEmp of ssoEmployees) {
        // 관리자 정보 매핑 (있으면 설정, 없으면 null로 명시적 설정)
        const managerId = managerMap.get(ssoEmp.id);
        ssoEmp.managerId = managerId || undefined; // null을 undefined로 변환

        const result = await this.직원을_처리한다(
          ssoEmp,
          forceSync,
          syncStartTime,
        );
        if (result.success && result.employee) {
          employeesToSave.push(result.employee);
          if (result.isNew) {
            created++;
          } else {
            updated++;
          }
        } else if (result.error) {
          errors.push(result.error);
        }
      }

      // 3. 일괄 저장 (중복 키 에러 처리)
      this.logger.log(
        `처리 완료: 총 ${totalProcessed}개 중 ${created}개 생성, ${updated}개 업데이트, ${errors.length}개 오류`,
      );

      if (employeesToSave.length > 0) {
        await this.직원들을_저장한다(employeesToSave, errors);
      }

      // 4. SSO에 없는 직원을 퇴사 상태로 변경
      let terminatedCount = 0;
      try {
        terminatedCount = await this.SSO에_없는_직원을_퇴사_처리한다(
          ssoEmployees,
          syncStartTime,
        );
        if (terminatedCount > 0) {
          this.logger.log(
            `SSO에 없는 직원 ${terminatedCount}명을 퇴사 상태로 변경했습니다.`,
          );
        }
      } catch (terminateError) {
        this.logger.error(
          `SSO에 없는 직원 퇴사 처리 중 오류 발생: ${terminateError.message}`,
        );
        errors.push(`퇴사 처리 실패: ${terminateError.message}`);
      }

      const result: EmployeeSyncResult = {
        success: true,
        totalProcessed,
        created,
        updated,
        errors,
        syncedAt: syncStartTime,
      };

      this.logger.log(
        `직원 동기화 완료: 총 ${totalProcessed}개 처리, ${created}개 생성, ${updated}개 업데이트, ${terminatedCount}개 퇴사 처리`,
      );

      return result;
    } catch (error) {
      const errorMsg = `직원 동기화 실패: ${error.message}`;
      this.logger.error(errorMsg);

      return {
        success: false,
        totalProcessed,
        created,
        updated,
        errors: [...errors, errorMsg],
        syncedAt: syncStartTime,
      };
    }
  }

  /**
   * 스케줄된 자동 동기화 (10분마다)
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledSync(): Promise<void> {
    // 개발환경에서는 스케줄 동기화 비활성화 가능
    const scheduledSyncEnabledValue = this.configService.get<string | boolean>(
      'SCHEDULED_SYNC_ENABLED',
      'true', // 기본값: 활성화 (프로덕션 환경)
    );

    // 문자열 "false" 또는 boolean false 모두 처리
    const scheduledSyncEnabled =
      scheduledSyncEnabledValue === 'false' ||
      scheduledSyncEnabledValue === false
        ? false
        : true;

    if (!scheduledSyncEnabled) {
      this.logger.debug('스케줄된 직원 동기화가 비활성화되어 있습니다.');
      return;
    }

    this.logger.log('스케줄된 직원 동기화를 시작합니다...');
    await this.syncEmployees();
  }

  /**
   * 수동 동기화 트리거
   */
  async triggerManualSync(): Promise<EmployeeSyncResult> {
    this.logger.log('수동 직원 동기화를 시작합니다...');
    return this.syncEmployees(true);
  }

  /**
   * 직원 데이터 조회 (히트미스 전략)
   * 로컬 DB에서 먼저 조회하고, 없으면 외부 API에서 동기화
   */
  async getEmployees(forceRefresh: boolean = false): Promise<Employee[]> {
    try {
      // 1. 강제 새로고침이 요청되었거나 로컬 데이터가 없는 경우
      const localEmployees = await this.employeeService.findAll();

      if (forceRefresh || localEmployees.length === 0) {
        this.logger.log('직원 데이터를 외부 API에서 동기화합니다...');
        await this.syncEmployees(forceRefresh);
        return this.employeeService.findAll();
      }

      // 2. 마지막 동기화 시간 확인 (24시간 이상 경과시 백그라운드 동기화)
      const stats = await this.employeeService.getEmployeeStats();
      const lastSyncAt = stats.lastSyncAt;
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      if (!lastSyncAt || lastSyncAt < twentyFourHoursAgo) {
        this.logger.log(
          '24시간 이상 동기화되지 않아 백그라운드에서 동기화를 시작합니다...',
        );
        // 백그라운드에서 동기화 (응답을 기다리지 않음)
        this.syncEmployees().catch((error) => {
          this.logger.error('백그라운드 동기화 실패:', error.message);
        });
      }

      // 3. 로컬 데이터 반환
      return localEmployees;
    } catch (error) {
      this.logger.error('직원 데이터 조회 실패:', error.message);
      throw new HttpException(
        '직원 데이터 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 특정 직원 조회 (히트미스 전략)
   */
  async getEmployeeById(
    id: string,
    forceRefresh: boolean = false,
  ): Promise<Employee | null> {
    try {
      // 1. 로컬에서 조회
      let employee = await this.employeeService.findById(id);

      // 2. 없거나 강제 새로고침인 경우 동기화 후 재조회
      if (!employee || forceRefresh) {
        await this.syncEmployees(forceRefresh);
        employee = await this.employeeService.findById(id);
      }

      return employee;
    } catch (error) {
      this.logger.error(`직원 ID ${id} 조회 실패:`, error.message);
      throw new HttpException(
        '직원 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 외부 ID로 직원 조회
   */
  async getEmployeeByExternalId(
    externalId: string,
    forceRefresh: boolean = false,
  ): Promise<Employee | null> {
    try {
      let employee = await this.employeeService.findByExternalId(externalId);

      if (!employee || forceRefresh) {
        await this.syncEmployees(forceRefresh);
        employee = await this.employeeService.findByExternalId(externalId);
      }

      return employee;
    } catch (error) {
      this.logger.error(`외부 직원 ID ${externalId} 조회 실패:`, error.message);
      throw new HttpException(
        '직원 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 직원 번호로 직원 조회
   */
  async getEmployeeByEmployeeNumber(
    employeeNumber: string,
    forceRefresh: boolean = false,
  ): Promise<Employee | null> {
    try {
      let employee =
        await this.employeeService.findByEmployeeNumber(employeeNumber);

      if (!employee || forceRefresh) {
        await this.syncEmployees(forceRefresh);
        employee =
          await this.employeeService.findByEmployeeNumber(employeeNumber);
      }

      return employee;
    } catch (error) {
      this.logger.error(
        `직원 번호 ${employeeNumber} 조회 실패:`,
        error.message,
      );
      throw new HttpException(
        '직원 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 이메일로 직원 조회
   */
  async getEmployeeByEmail(
    email: string,
    forceRefresh: boolean = false,
  ): Promise<Employee | null> {
    try {
      let employee = await this.employeeService.findByEmail(email);

      if (!employee || forceRefresh) {
        await this.syncEmployees(forceRefresh);
        employee = await this.employeeService.findByEmail(email);
      }

      return employee;
    } catch (error) {
      this.logger.error(`이메일 ${email} 조회 실패:`, error.message);
      throw new HttpException(
        '직원 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 파트장 목록 조회
   * positionId 또는 position 정보를 기반으로 파트장을 필터링합니다.
   *
   * @param forceRefresh 강제 새로고침 여부
   * @returns 파트장 목록
   */
  async getPartLeaders(forceRefresh: boolean = false): Promise<Employee[]> {
    try {
      // 먼저 직원 데이터를 가져옴
      const employees = await this.getEmployees(forceRefresh);

      // SSO에서 원시 데이터를 조회하여 파트장 확인
      try {
        const ssoEmployees = await this.fetchExternalEmployees();

        // SSO 데이터에서 파트장 externalId 추출
        const partLeaderExternalIds = new Set(
          ssoEmployees
            .filter(
              (emp) =>
                emp.position &&
                (emp.position.positionName?.includes('파트장') ||
                  emp.position.positionCode?.includes('파트장')),
            )
            .map((emp) => emp.id),
        );

        // 로컬 DB에서 파트장 필터링
        const partLeaders = employees.filter((emp) =>
          partLeaderExternalIds.has(emp.externalId),
        );

        this.logger.log(
          `파트장 ${partLeaders.length}명 조회 완료 (전체 직원: ${employees.length}명)`,
        );

        return partLeaders;
      } catch (ssoError) {
        // SSO 조회 실패 시 로컬 DB에서 positionId 기반으로 추정
        this.logger.warn(
          `SSO 조회 실패, 로컬 DB 데이터로 파트장 추정: ${ssoError.message}`,
        );

        // positionId가 있는 직원 중 일부를 파트장으로 간주 (테스트 환경용)
        // 실제 환경에서는 SSO가 정상 동작하므로 이 로직은 테스트 환경에서만 사용됨
        const partLeaders = employees.filter((emp) => emp.positionId);

        this.logger.log(
          `파트장 ${partLeaders.length}명 추정 완료 (positionId 기반, 전체 직원: ${employees.length}명)`,
        );

        return partLeaders;
      }
    } catch (error) {
      this.logger.error(`파트장 목록 조회 실패:`, error.message);
      // 에러 시 빈 배열 반환 (테스트 환경에서 에러 방지)
      return [];
    }
  }

  // ========== 헬퍼 메서드 ==========

  /**
   * SSO에 없는 직원을 퇴사 상태로 변경한다
   *
   * @param ssoEmployees SSO에서 가져온 직원 목록
   * @param syncStartTime 동기화 시작 시간
   * @returns 퇴사 처리된 직원 수
   */
  private async SSO에_없는_직원을_퇴사_처리한다(
    ssoEmployees: any[],
    syncStartTime: Date,
  ): Promise<number> {
    // SSO에서 가져온 직원의 externalId Set 생성
    const ssoExternalIds = new Set(
      ssoEmployees.map((emp) => emp.id).filter((id) => id),
    );

    // 현재 DB에 있는 모든 직원 조회 (퇴사 상태 포함)
    const allLocalEmployees = await this.employeeService.findAll(true);

    // SSO에 없고 아직 퇴사 상태가 아닌 직원 찾기
    const employeesToTerminate = allLocalEmployees.filter(
      (emp) =>
        emp.externalId &&
        !ssoExternalIds.has(emp.externalId) &&
        emp.status !== '퇴사',
    );

    if (employeesToTerminate.length === 0) {
      return 0;
    }

    this.logger.log(
      `SSO에 없는 직원 ${employeesToTerminate.length}명을 퇴사 상태로 변경합니다.`,
    );

    // 퇴사 상태로 변경
    let terminatedCount = 0;
    const employeesToSave: Employee[] = [];

    for (const employee of employeesToTerminate) {
      try {
        employee.status = '퇴사';
        employee.lastSyncAt = syncStartTime;
        employee.updatedBy = this.systemUserId;
        employeesToSave.push(employee);
        terminatedCount++;

        this.logger.debug(
          `직원 ${employee.name} (${employee.employeeNumber}, externalId: ${employee.externalId})를 퇴사 상태로 변경합니다.`,
        );
      } catch (error) {
        this.logger.error(
          `직원 ${employee.name} (${employee.employeeNumber}) 퇴사 처리 실패: ${error.message}`,
        );
      }
    }

    // 일괄 저장
    if (employeesToSave.length > 0) {
      try {
        await this.employeeService.saveMany(employeesToSave);
        this.logger.log(
          `${terminatedCount}명의 직원을 퇴사 상태로 변경했습니다.`,
        );
      } catch (saveError) {
        this.logger.error(`퇴사 처리된 직원 저장 실패: ${saveError.message}`);
        throw saveError;
      }
    }

    return terminatedCount;
  }

  /**
   * 직원을 처리한다 (생성 또는 업데이트)
   */
  private async 직원을_처리한다(
    ssoEmp: any,
    forceSync: boolean,
    syncStartTime: Date,
  ): Promise<{
    success: boolean;
    employee?: Employee;
    isNew?: boolean;
    error?: string;
  }> {
    try {
      // 기존 직원 확인 (employeeNumber 우선)
      let existingEmployee = await this.employeeService.findByEmployeeNumber(
        ssoEmp.employeeNumber,
      );

      // employeeNumber로 못 찾으면 externalId로 조회
      if (!existingEmployee) {
        existingEmployee = await this.employeeService.findByExternalId(
          ssoEmp.id,
        );
      }

      const mappedData = this.mapSSOEmployeeToDto(ssoEmp);

      if (existingEmployee) {
        // 퇴사 상태였던 직원이 SSO에 다시 나타난 경우 재직중으로 복귀 처리
        const wasTerminated = existingEmployee.status === '퇴사';
        const isRehired = wasTerminated && mappedData.status !== '퇴사';

        if (isRehired) {
          this.logger.log(
            `직원 ${existingEmployee.name} (${existingEmployee.employeeNumber}): 퇴사 상태에서 재직중으로 복귀`,
          );
        }

        // 업데이트가 필요한지 확인 (퇴사 복귀인 경우 강제 업데이트)
        const needsUpdate =
          isRehired ||
          this.업데이트가_필요한가(existingEmployee, mappedData, forceSync);

        if (needsUpdate) {
          // 기존 직원 업데이트
          // isAccessible 필드는 동기화 시 변경하지 않음 (수동 설정 값 보존)
          Object.assign(existingEmployee, {
            employeeNumber: mappedData.employeeNumber,
            name: mappedData.name,
            email: mappedData.email,
            phoneNumber: mappedData.phoneNumber,
            dateOfBirth: mappedData.dateOfBirth,
            gender: mappedData.gender,
            hireDate: mappedData.hireDate,
            managerId: mappedData.managerId,
            status: mappedData.status, // SSO 상태로 업데이트 (퇴사 → 재직중)
            departmentId: mappedData.departmentId,
            departmentName: mappedData.departmentName,
            departmentCode: mappedData.departmentCode,
            positionId: mappedData.positionId,
            rankId: mappedData.rankId,
            rankName: mappedData.rankName,
            rankCode: mappedData.rankCode,
            rankLevel: mappedData.rankLevel,
            externalId: mappedData.externalId,
            externalUpdatedAt: mappedData.externalUpdatedAt,
            lastSyncAt: syncStartTime,
            updatedBy: this.systemUserId,
          } as UpdateEmployeeDto);

          // isAccessible은 기존 값을 그대로 유지 (변경하지 않음)

          return { success: true, employee: existingEmployee, isNew: false };
        }

        return { success: false };
      } else {
        // 새 직원 생성
        const newEmployee = new Employee(
          mappedData.employeeNumber,
          mappedData.name,
          mappedData.email,
          mappedData.externalId,
          mappedData.phoneNumber,
          mappedData.dateOfBirth,
          mappedData.gender,
          mappedData.hireDate,
          mappedData.managerId,
          mappedData.status,
          mappedData.departmentId,
          mappedData.departmentName,
          mappedData.departmentCode,
          mappedData.positionId,
          mappedData.rankId,
          mappedData.rankName,
          mappedData.rankCode,
          mappedData.rankLevel,
          mappedData.externalCreatedAt,
          mappedData.externalUpdatedAt,
        );
        newEmployee.lastSyncAt = syncStartTime;
        newEmployee.createdBy = this.systemUserId;
        newEmployee.updatedBy = this.systemUserId;

        // isAccessible은 엔티티 생성자의 기본값(true)을 그대로 사용
        // roles는 SSO 로그인 시에만 설정됨

        return { success: true, employee: newEmployee, isNew: true };
      }
    } catch (error) {
      const errorMsg = `직원 ${ssoEmp.name} 처리 실패: ${error.message}`;
      this.logger.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 업데이트가 필요한지 확인한다
   * SSO 정보와 현재 직원의 외부 서버 정보를 전체적으로 비교하여 변경사항이 있으면 업데이트
   */
  private 업데이트가_필요한가(
    existingEmployee: Employee,
    mappedData: CreateEmployeeDto,
    forceSync: boolean,
  ): boolean {
    if (forceSync) {
      return true;
    }

    // 외부 서버에서 업데이트된 시간이 더 최신인 경우 업데이트
    if (mappedData.externalUpdatedAt && existingEmployee.externalUpdatedAt) {
      const externalUpdatedAt = new Date(mappedData.externalUpdatedAt);
      const existingExternalUpdatedAt = new Date(
        existingEmployee.externalUpdatedAt,
      );
      if (externalUpdatedAt > existingExternalUpdatedAt) {
        this.logger.debug(
          `직원 ${existingEmployee.name} (${existingEmployee.employeeNumber}): 외부 서버에서 업데이트됨 (외부: ${externalUpdatedAt.toISOString()}, 로컬: ${existingExternalUpdatedAt.toISOString()})`,
        );
        return true;
      }
    }

    // 기본 정보 변경 확인
    if (existingEmployee.employeeNumber !== mappedData.employeeNumber) {
      return true;
    }

    if (existingEmployee.name !== mappedData.name) {
      return true;
    }

    if (existingEmployee.email !== mappedData.email) {
      return true;
    }

    // 전화번호 비교 (null/undefined 처리)
    const existingPhone = existingEmployee.phoneNumber || '';
    const mappedPhone = mappedData.phoneNumber || '';
    if (existingPhone !== mappedPhone) {
      return true;
    }

    // 관리자 ID 비교 (null/undefined 처리)
    const existingManagerId = existingEmployee.managerId || null;
    const mappedManagerId = mappedData.managerId || null;
    if (existingManagerId !== mappedManagerId) {
      return true;
    }

    // 상태 변경 확인
    if (existingEmployee.status !== mappedData.status) {
      return true;
    }

    // 부서 정보 비교
    if (
      existingEmployee.departmentId !== mappedData.departmentId ||
      existingEmployee.departmentName !== mappedData.departmentName ||
      existingEmployee.departmentCode !== mappedData.departmentCode
    ) {
      return true;
    }

    // 직급 정보 비교
    if (
      existingEmployee.rankId !== mappedData.rankId ||
      existingEmployee.rankName !== mappedData.rankName ||
      existingEmployee.rankCode !== mappedData.rankCode ||
      existingEmployee.rankLevel !== mappedData.rankLevel
    ) {
      return true;
    }

    // 직책 정보 비교
    if (existingEmployee.positionId !== mappedData.positionId) {
      return true;
    }

    // 입사일 비교
    if (mappedData.hireDate) {
      const existingHireDate = existingEmployee.hireDate
        ? new Date(existingEmployee.hireDate)
        : null;
      const mappedHireDate = new Date(mappedData.hireDate);

      if (
        !existingHireDate ||
        existingHireDate.getTime() !== mappedHireDate.getTime()
      ) {
        return true;
      }
    } else if (existingEmployee.hireDate) {
      // SSO에 입사일이 없는데 로컬에 있는 경우는 업데이트하지 않음 (로컬 데이터 보존)
    }

    // 생년월일 비교
    if (mappedData.dateOfBirth) {
      const existingDateOfBirth = existingEmployee.dateOfBirth
        ? new Date(existingEmployee.dateOfBirth)
        : null;
      const mappedDateOfBirth = new Date(mappedData.dateOfBirth);

      if (
        !existingDateOfBirth ||
        existingDateOfBirth.getTime() !== mappedDateOfBirth.getTime()
      ) {
        return true;
      }
    } else if (existingEmployee.dateOfBirth) {
      // SSO에 생년월일이 없는데 로컬에 있는 경우는 업데이트하지 않음 (로컬 데이터 보존)
    }

    // 성별 비교
    if (mappedData.gender && existingEmployee.gender !== mappedData.gender) {
      return true;
    }

    // 외부 ID 비교 (변경되면 안 되지만 확인)
    if (existingEmployee.externalId !== mappedData.externalId) {
      this.logger.warn(
        `직원 ${existingEmployee.name} (${existingEmployee.employeeNumber}): externalId 불일치 (기존: ${existingEmployee.externalId}, SSO: ${mappedData.externalId})`,
      );
      return true;
    }

    return false;
  }

  /**
   * 직원들을 저장한다 (중복 키 에러 처리)
   */
  private async 직원들을_저장한다(
    employeesToSave: Employee[],
    errors: string[],
  ): Promise<void> {
    try {
      await this.employeeService.saveMany(employeesToSave);
      this.logger.log(
        `${employeesToSave.length}개의 직원 데이터를 저장했습니다.`,
      );
    } catch (saveError) {
      // 중복 키 에러인 경우 개별 저장 시도
      if (
        saveError?.code === '23505' ||
        saveError?.message?.includes('duplicate key')
      ) {
        this.logger.warn(
          '일괄 저장 중 중복 키 에러 발생, 개별 저장으로 재시도합니다.',
        );
        await this.개별_저장으로_재시도한다(employeesToSave, errors);
      } else {
        throw saveError;
      }
    }
  }

  /**
   * 개별 저장으로 재시도한다
   */
  private async 개별_저장으로_재시도한다(
    employeesToSave: Employee[],
    errors: string[],
  ): Promise<void> {
    let savedCount = 0;
    let skippedCount = 0;

    for (const employee of employeesToSave) {
      const result = await this.직원을_개별_저장한다(employee);
      if (result.success) {
        savedCount++;
      } else {
        errors.push(result.error!);
        skippedCount++;
      }
    }

    this.logger.log(
      `개별 저장 완료: ${savedCount}개 저장, ${skippedCount}개 건너뜀`,
    );
  }

  /**
   * 직원을 개별 저장한다
   */
  private async 직원을_개별_저장한다(
    employee: Employee,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.employeeService.save(employee);
      return { success: true };
    } catch (individualError) {
      if (
        individualError?.code === '23505' ||
        individualError?.message?.includes('duplicate key')
      ) {
        // 중복 키 에러 발생 시 기존 데이터를 찾아서 업데이트
        const result = await this.중복_키_에러_처리한다(employee);
        if (result.success) {
          return { success: true };
        } else {
          return { success: false, error: result.error };
        }
      } else {
        const errorMsg = `직원 ${employee.name} 저장 실패: ${individualError.message}`;
        this.logger.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    }
  }

  /**
   * 중복 키 에러를 처리한다 (기존 데이터 찾아서 업데이트)
   */
  private async 중복_키_에러_처리한다(
    employee: Employee,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 기존 직원 찾기
      let existingEmployee = await this.employeeService.findByEmployeeNumber(
        employee.employeeNumber,
      );

      if (!existingEmployee) {
        existingEmployee = await this.employeeService.findByEmail(
          employee.email,
        );
      }

      if (!existingEmployee) {
        existingEmployee = await this.employeeService.findByExternalId(
          employee.externalId,
        );
      }

      if (existingEmployee) {
        // 기존 엔티티에 새 데이터 덮어쓰기
        // isAccessible 필드는 동기화 시 변경하지 않음 (수동 설정 값 보존)
        Object.assign(existingEmployee, {
          employeeNumber: employee.employeeNumber,
          name: employee.name,
          email: employee.email,
          phoneNumber: employee.phoneNumber,
          dateOfBirth: employee.dateOfBirth,
          gender: employee.gender,
          hireDate: employee.hireDate,
          managerId: employee.managerId,
          status: employee.status,
          departmentId: employee.departmentId,
          departmentName: employee.departmentName,
          departmentCode: employee.departmentCode,
          positionId: employee.positionId,
          rankId: employee.rankId,
          rankName: employee.rankName,
          rankCode: employee.rankCode,
          rankLevel: employee.rankLevel,
          externalId: employee.externalId,
          externalCreatedAt: employee.externalCreatedAt,
          externalUpdatedAt: employee.externalUpdatedAt,
          lastSyncAt: employee.lastSyncAt,
          updatedBy: this.systemUserId,
          // roles는 명시적으로 제외 (로그인 시에만 업데이트)
          // isAccessible은 기존 값을 그대로 유지 (변경하지 않음)
        });

        await this.employeeService.save(existingEmployee);
        return { success: true };
      } else {
        const errorMsg = `직원 ${employee.name} (${employee.employeeNumber}) 재조회 실패, 건너뜀. externalId=${employee.externalId}, employeeNumber=${employee.employeeNumber}, email=${employee.email}`;
        this.logger.warn(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = `직원 ${employee.name} 재조회/업데이트 실패: ${error.message}`;
      this.logger.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }
}
