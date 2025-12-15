import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@interface/common/decorators';
import { SeedDataService } from '@context/seed-data-context/seed-data.service';
import {
  SeedDataConfigDto,
  RealDataSeedConfigDto,
  AddNewEmployeesDto,
  AddNewEmployeesResultDto,
  RemoveAllNewEmployeesResultDto,
} from '@interface/common/dto/seed-data';
import { SeedDataResultDto } from '@interface/common/dto/seed-data/seed-data-result.dto';
import { GetSeedDataStatusDto } from '@interface/common/dto/seed-data/get-seed-data-status.dto';
import { ApiClearSeedData } from '@interface/common/decorators/seed-data/clear-seed-data.decorator';
import { ApiGenerateSeedData } from '@interface/common/decorators/seed-data/generate-seed-data.decorator';
import { ApiGenerateSeedDataWithRealData } from '@interface/common/decorators/seed-data/generate-seed-data-with-real-data.decorator';
import { ApiGetSeedDataStatus } from '@interface/common/decorators/seed-data/get-seed-data-status.decorator';
import { ApiAddNewEmployees } from '@interface/common/decorators/seed-data/add-new-employees.decorator';
import { ApiRemoveAllNewEmployees } from '@interface/common/decorators/seed-data/remove-all-new-employees.decorator';
import { SeedScenario } from '@context/seed-data-context/types';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { DepartmentService } from '@domain/common/department/department.service';
import { Employee } from '@domain/common/employee/employee.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker/locale/ko';

@ApiTags('A-0-1. Seed Data')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/seed')
export class SeedDataController {
  private readonly logger = new Logger(SeedDataController.name);

  constructor(
    private readonly seedDataService: SeedDataService,
    private readonly employeeService: EmployeeService,
    private readonly departmentService: DepartmentService,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiGenerateSeedData()
  async generateSeedData(
    @Body() config: SeedDataConfigDto,
    @Request() req: any,
  ): Promise<SeedDataResultDto> {
    const startTime = Date.now();

    // 현재 사용자 정보를 설정에 추가
    const configWithUser = {
      ...config,
      currentUserId: config.includeCurrentUserAsEvaluator
        ? req.user?.id
        : undefined,
    };

    const results =
      await this.seedDataService.시드_데이터를_생성한다(configWithUser);

    const totalDuration = Date.now() - startTime;

    return {
      success: true,
      message: '시드 데이터가 성공적으로 생성되었습니다.',
      results,
      totalDuration,
    };
  }

  @Post('generate-with-real-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiGenerateSeedDataWithRealData()
  async generateSeedDataWithRealData(
    @Body() config: RealDataSeedConfigDto,
    @Request() req: any,
  ): Promise<SeedDataResultDto> {
    const startTime = Date.now();

    // RealDataSeedConfigDto를 SeedDataConfig로 변환 (useRealX를 true로 설정)
    const seedConfig = {
      scenario: config.scenario as SeedScenario,
      clearExisting: config.clearExisting ?? false,
      dataScale: {
        departmentCount: 0, // 사용하지 않음 (실제 데이터 사용)
        employeeCount: 0, // 사용하지 않음 (실제 데이터 사용)
        projectCount: config.projectCount ?? 5,
        wbsPerProject: config.wbsPerProject ?? 10,
      },
      evaluationConfig: {
        periodCount: config.evaluationConfig?.periodCount ?? 1,
      },
      stateDistribution: config.stateDistribution, // 상태 분포 설정 전달
      useRealDepartments: true, // 항상 true
      useRealEmployees: true, // 항상 true
      currentUserId: config.includeCurrentUserAsEvaluator
        ? req.user?.id
        : undefined,
    };

    // 디버그: 설정 로깅
    if (config.stateDistribution) {
      console.log(
        '[Controller] stateDistribution.selfEvaluationProgress:',
        JSON.stringify(config.stateDistribution.selfEvaluationProgress),
      );
    }

    if (config.includeCurrentUserAsEvaluator) {
      console.log('[Controller] 현재 사용자를 평가자로 등록:', req.user?.id);
    }

    const results =
      await this.seedDataService.시드_데이터를_생성한다(seedConfig);

    const totalDuration = Date.now() - startTime;

    return {
      success: true,
      message: '실제 데이터 기반 시드 데이터가 성공적으로 생성되었습니다.',
      results,
      totalDuration,
    };
  }

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiClearSeedData()
  async clearSeedData(): Promise<{ message: string }> {
    await this.seedDataService.시드_데이터를_삭제한다(true);

    return {
      message: '시드 데이터가 성공적으로 삭제되었습니다.',
    };
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiGetSeedDataStatus()
  async getSeedDataStatus(): Promise<GetSeedDataStatusDto> {
    const status = await this.seedDataService.시드_데이터_상태를_조회한다();

    return status;
  }

  @Post('employees')
  @HttpCode(HttpStatus.CREATED)
  @ApiAddNewEmployees()
  async addNewEmployees(
    @Body() dto: AddNewEmployeesDto,
  ): Promise<AddNewEmployeesResultDto> {
    this.logger.log(`신규 입사자 자동 생성 요청 - 직원 수: ${dto.count}명`);

    const addedEmployeeIds: string[] = [];
    const errors: string[] = [];
    const timestamp = Date.now();

    // 부서 목록 (실제 시스템의 실무 부서)
    const departmentNames = [
      '경영지원본부',
      '경영지원실',
      '사업개발실',
      '기반기술사업부',
      '제조파트',
      'QA파트',
      '루미르 주식회사',
      '시스템파트',
      'EC파트',
      'EP파트',
      'ES파트',
      'IP파트',
      'ME파트',
      'PM실',
      'RF파트',
      'SO파트',
      'Web파트',
    ];

    // 직급 목록 (실제 시스템 데이터)
    const ranks = [
      { name: '제조원', code: '제조원', level: 9 },
      { name: '연구원', code: '연구원', level: 9 },
      { name: '매니저', code: '매니저', level: 9 },
      { name: '선임매니저', code: '선임매니저', level: 8 },
      { name: '선임제조원', code: '선임제조원', level: 8 },
      { name: '선임연구원', code: '선임연구원', level: 8 },
      { name: '책임연구원', code: '책임연구원', level: 7 },
      { name: '책임매니저', code: '책임매니저', level: 7 },
      { name: '책임제조원', code: '책임제조원', level: 7 },
      { name: '전문위원', code: '전문위원', level: 6 },
      { name: '이사', code: '이사', level: 5 },
      { name: '상무이사', code: '상무이사', level: 4 },
      { name: '전무이사', code: '전무이사', level: 3 },
      { name: '부사장', code: '부사장', level: 2 },
      { name: '사장', code: '사장', level: 1 },
    ];

    // 직책 목록 (실제 시스템 데이터)
    const positions = [
      { title: '임원', code: '임원', level: 1 },
      { title: '실장', code: '실장', level: 2 },
      { title: 'PM', code: 'PM', level: 3 },
      { title: '팀장', code: '팀장', level: 4 },
      { title: '파트장', code: '파트장', level: 5 },
      { title: '직원', code: '직원', level: 6 },
    ];

    for (let i = 0; i < dto.count; i++) {
      try {
        // 고유한 직원 번호 생성 (타임스탬프 + 순번)
        const employeeNumber = `NEW${timestamp}${String(i + 1).padStart(3, '0')}`;

        // Faker로 한글 더미 데이터 생성
        const lastName = faker.person.lastName(); // 한글 성
        const firstName = faker.person.firstName(); // 한글 이름
        const name = `${lastName}${firstName}`;

        // 이메일: 고유한 이메일 생성 (직원 번호 기반)
        const email = `emp${timestamp}${String(i + 1).padStart(3, '0')}@company.com`;

        const phoneNumber =
          '010' + '-' + faker.string.numeric(4) + '-' + faker.string.numeric(4);
        const dateOfBirth = faker.date.birthdate({
          min: 25,
          max: 55,
          mode: 'age',
        });
        const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
        const hireDate = new Date();
        hireDate.setDate(hireDate.getDate() - Math.floor(Math.random() * 365)); // 최근 1년 내 입사

        // 랜덤하게 부서 선택 및 실제 부서 정보 조회
        const selectedDepartmentName =
          departmentNames[Math.floor(Math.random() * departmentNames.length)];

        // 부서 이름으로 실제 부서 정보 조회 (실패 시 null)
        let department: any = null;
        try {
          department = await this.departmentService.부서명으로_조회한다(
            selectedDepartmentName,
          );
        } catch (error) {
          this.logger.warn(
            `부서 조회 실패 (${selectedDepartmentName}): ${error.message}`,
          );
        }

        // 랜덤하게 직급 선택 (80%는 하위 직급, 20%는 상위 직급)
        const isHighRank = Math.random() > 0.8;
        const rank = isHighRank
          ? ranks[Math.floor(Math.random() * Math.min(5, ranks.length))] // 이사 이상
          : ranks[Math.floor(Math.random() * 9) + 6]; // 전문위원 이하

        // 외부 시스템 ID 생성
        const externalId = uuidv4();
        const now = new Date();

        // CreateEmployeeDto에 맞게 직원 생성
        const newEmployee = await this.employeeService.create({
          employeeNumber,
          name,
          email,
          phoneNumber,
          dateOfBirth,
          gender,
          hireDate,
          status: '재직중',
          // 부서 정보 (실제 부서에서 조회한 정보 사용, 실패 시 이름만이라도 저장)
          departmentId: department?.id ?? undefined,
          departmentName: department?.name || selectedDepartmentName, // || 연산자로 확실하게 fallback
          departmentCode: department?.code ?? undefined,
          // 직급 정보 (이름, 코드, 레벨만 저장 - ID 없음)
          rankName: rank.name,
          rankCode: rank.code,
          rankLevel: rank.level,
          // 직책 정보 (이름만 저장 - ID 없음)
          positionId: undefined,
          // External 정보
          externalId,
          externalCreatedAt: now,
          externalUpdatedAt: now,
          // Employee 엔티티 추가 필드
          lastSyncAt: now,
          isExcludedFromList: false,
          createdBy: 'system',
          // isAccessible은 엔티티 생성자의 기본값(true)을 사용
        });

        addedEmployeeIds.push(newEmployee.id);

        this.logger.log(
          `신규 입사자 추가 완료 [${i + 1}/${dto.count}] - ${newEmployee.name} (${newEmployee.employeeNumber})`,
        );
      } catch (error) {
        const errorMsg = `직원 추가 실패 [${i + 1}/${dto.count}]: ${error.message}`;
        this.logger.error(errorMsg, error.stack);
        errors.push(errorMsg);
      }
    }

    const addedCount = addedEmployeeIds.length;
    const failedCount = errors.length;

    // 모든 직원 추가가 실패한 경우 예외 발생
    if (addedCount === 0 && failedCount > 0) {
      throw new InternalServerErrorException({
        success: false,
        message: '모든 신규 입사자 추가에 실패했습니다.',
        addedCount: 0,
        failedCount,
        errors,
        addedEmployeeIds: [],
      });
    }

    const message =
      failedCount > 0
        ? `신규 입사자 ${addedCount}명이 추가되었습니다. (실패: ${failedCount}명)`
        : `신규 입사자 ${addedCount}명이 성공적으로 추가되었습니다.`;

    this.logger.log(
      `신규 입사자 추가 완료 - 성공: ${addedCount}명, 실패: ${failedCount}명`,
    );

    return {
      success: true,
      message,
      addedCount,
      failedCount,
      batchNumber: `NEW${timestamp}`,
      errors: errors.length > 0 ? errors : undefined,
      addedEmployeeIds,
    };
  }

  @Delete('employees/all')
  @HttpCode(HttpStatus.OK)
  @ApiRemoveAllNewEmployees()
  async removeAllNewEmployees(): Promise<RemoveAllNewEmployeesResultDto> {
    this.logger.log('모든 배치 신규 입사자 삭제 요청');

    // employeeNumber가 "NEW"로 시작하는 모든 직원 조회
    const targetEmployees = await this.employeeRepository
      .createQueryBuilder('employee')
      .where('employee.employeeNumber LIKE :pattern', {
        pattern: 'NEW%',
      })
      .getMany();

    if (targetEmployees.length === 0) {
      throw new NotFoundException('삭제할 신규 입사자를 찾을 수 없습니다.');
    }

    this.logger.log(`삭제 대상 직원: ${targetEmployees.length}명`);

    // 직원 삭제 (hard delete - DB에서 실제로 삭제)
    const removedEmployees: string[] = [];
    const employeeIds = targetEmployees.map((emp) => emp.id);

    try {
      // TypeORM의 delete 메서드로 한번에 실제 삭제
      await this.employeeRepository.delete(employeeIds);

      for (const emp of targetEmployees) {
        removedEmployees.push(`${emp.name} (${emp.employeeNumber})`);
        this.logger.log(`직원 삭제 완료 - ${emp.name} (${emp.employeeNumber})`);
      }
    } catch (error) {
      this.logger.error(`직원 삭제 실패: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `직원 삭제 중 오류가 발생했습니다: ${error.message}`,
      );
    }

    const message = `모든 신규 입사자 ${removedEmployees.length}명이 성공적으로 삭제되었습니다.`;
    this.logger.log(
      `모든 신규 입사자 삭제 완료 - 삭제: ${removedEmployees.length}명`,
    );

    return {
      success: true,
      message,
      removedCount: removedEmployees.length,
      removedEmployees,
    };
  }
}
