import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Project } from '@domain/common/project/project.entity';
import { ProjectManager } from '@domain/common/project/project-manager.entity';
import { Public } from '@interface/common/decorators/public.decorator';
import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  Body,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import { IsNull, In, Not, Repository } from 'typeorm';
import { EvaluationCriteriaManagementService } from '../../context/evaluation-criteria-management-context/evaluation-criteria-management.service';

/**
 * 평가자 매핑 진단 컨트롤러
 *
 * 2차 평가자 목록에서 누락된 피평가자를 진단하고 리포트를 생성합니다.
 */
@ApiTags('Public - 평가자 매핑 진단')
@Controller('evaluator-mapping-diagnosis')
@Public()
export class EvaluatorMappingDiagnosisController {
  private readonly logger = new Logger(
    EvaluatorMappingDiagnosisController.name,
  );

  constructor(
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly evaluationPeriodEmployeeMappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly evaluationWbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectManager)
    private readonly projectManagerRepository: Repository<ProjectManager>,
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
  ) {}

  /**
   * 특정 평가자의 누락된 피평가자 목록 조회 및 진단
   */
  @Get('missing-targets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '평가자의 누락된 피평가자 목록 조회',
    description: `특정 평가자가 2차 평가자로 지정되어야 하는데 대시보드에 나타나지 않는 피평가자들을 진단합니다.
    
**분석 항목:**
- WBS 할당이 있고 프로젝트 PM이 해당 평가자인데 EvaluationLineMapping이 없는 경우
- EvaluationLineMapping이 삭제된 경우 (deletedAt이 있음)
- EvaluationPeriodEmployeeMapping이 없는 경우
- 평가라인이 없는 경우
- 프로젝트 PM이 설정되지 않은 경우`,
  })
  @ApiResponse({
    status: 200,
    description: '진단 완료',
  })
  async getMissingTargets(
    @Query('evaluatorId') evaluatorId: string,
    @Query('evaluationPeriodId') evaluationPeriodId?: string,
  ) {
    try {
      this.logger.log(
        `=== 평가자 누락 피평가자 진단 시작 - 평가자: ${evaluatorId}, 평가기간: ${evaluationPeriodId || '전체'} ===`,
      );

      if (!evaluatorId) {
        return {
          success: false,
          message: 'evaluatorId는 필수입니다.',
        };
      }

      // 평가자 정보 조회
      const evaluator = await this.employeeRepository.findOne({
        where: { id: evaluatorId, deletedAt: IsNull() },
        select: ['id', 'name', 'employeeNumber', 'email', 'departmentName'],
      });

      if (!evaluator) {
        return {
          success: false,
          message: `평가자를 찾을 수 없습니다. (ID: ${evaluatorId})`,
        };
      }

      // 평가기간 필터링
      const periodFilter = evaluationPeriodId
        ? { id: evaluationPeriodId, deletedAt: IsNull() }
        : { deletedAt: IsNull() };

      const periods = await this.evaluationPeriodRepository.find({
        where: periodFilter,
        select: ['id', 'name', 'startDate', 'status', 'currentPhase'],
      });

      if (periods.length === 0) {
        return {
          success: false,
          message: '평가기간을 찾을 수 없습니다.',
        };
      }

      const periodIds = periods.map((p) => p.id);
      this.logger.log(`분석 대상 평가기간 수: ${periods.length}개`);

      // 2차 평가 라인 조회
      const secondaryEvaluationLines = await this.evaluationLineRepository.find({
        where: {
          evaluatorType: EvaluatorType.SECONDARY,
          deletedAt: IsNull(),
        },
      });

      if (secondaryEvaluationLines.length === 0) {
        return {
          success: false,
          message: '2차 평가 라인을 찾을 수 없습니다.',
        };
      }

      const secondaryEvaluationLineIds = secondaryEvaluationLines.map(
        (line) => line.id,
      );

      // 진단 결과 수집
      const missingTargets: any[] = [];
      const statistics = {
        byReason: {
          WBS할당있음_매핑없음: 0,
          매핑삭제됨: 0,
          평가기간매핑없음: 0,
          평가라인없음: 0,
          PM설정안됨: 0,
        },
        byPeriod: {} as Record<string, number>,
        excluded: {
          수동변경됨: 0,
          활성매핑존재: 0,
        },
      };

      // 전체 프로젝트 정보 조회 (한 번에 조회하여 효율성 향상)
      // Project.managerId는 externalId이므로 Employee와 조인
      const allProjectRows = await this.projectRepository
        .createQueryBuilder('project')
        .leftJoin(
          Employee,
          'pmEmployee',
          'pmEmployee.externalId = project.managerId AND pmEmployee.deletedAt IS NULL',
        )
        .select([
          'project.id AS project_id',
          'project.name AS project_name',
          'project.projectCode AS project_code',
          'project.managerId AS project_manager_id',
          'pmEmployee.id AS pm_employee_internal_id',
        ])
        .where('project.deletedAt IS NULL')
        .getRawMany();

      const globalProjectPmMap = new Map<string, string | null>();
      const globalProjectMap = new Map<string, any>();

      for (const row of allProjectRows) {
        const projectId = row.project_id;
        // PM 정보: 이미 조인된 pmEmployee.id 사용
        const pmEmployeeId = row.pm_employee_internal_id || null;

        globalProjectPmMap.set(projectId, pmEmployeeId);
        globalProjectMap.set(projectId, {
          id: projectId,
          name: row.project_name,
          projectCode: row.project_code,
          managerId: row.project_manager_id,
        });
      }

      // 각 평가기간별로 분석
      for (const period of periods) {
        this.logger.log(
          `평가기간 분석 중: ${period.name} (${period.id})`,
        );

        // 1. 해당 평가자가 2차 평가자로 지정된 매핑 조회 (활성)
        const activeMappings = await this.evaluationLineMappingRepository.find(
          {
            where: {
              evaluatorId,
              evaluationPeriodId: period.id,
              evaluationLineId: In(secondaryEvaluationLineIds),
              deletedAt: IsNull(),
            },
            select: ['id', 'employeeId', 'wbsItemId', 'evaluationLineId'],
          },
        );

        const activeEmployeeIds = new Set(
          activeMappings.map((m) => m.employeeId),
        );

        // 2. 해당 평가자가 2차 평가자로 지정된 매핑 조회 (삭제됨)
        const deletedMappings =
          await this.evaluationLineMappingRepository.find({
            where: {
              evaluatorId,
              evaluationPeriodId: period.id,
              evaluationLineId: In(secondaryEvaluationLineIds),
              deletedAt: Not(IsNull()),
            },
            select: [
              'id',
              'employeeId',
              'wbsItemId',
              'evaluationLineId',
              'deletedAt',
            ],
          });

        // 3. 해당 평가기간의 모든 WBS 할당 조회
        const allWbsAssignments = await this.evaluationWbsAssignmentRepository.find(
          {
            where: {
              periodId: period.id,
              deletedAt: IsNull(),
            },
            select: ['id', 'employeeId', 'projectId', 'wbsItemId'],
          },
        );

        // 4. 프로젝트별로 그룹화하여 PM 확인 (이미 전역 맵에서 조회했으므로 재사용)

        // 5. 해당 WBS에 대한 실제 2차 평가자 매핑 조회 (모든 평가자 포함)
        // 이렇게 하면 PM이 아닌 경우에도 실제 2차 평가자가 누구인지 확인 가능
        const allSecondaryMappingsForPeriod =
          await this.evaluationLineMappingRepository.find({
            where: {
              evaluationPeriodId: period.id,
              evaluationLineId: In(secondaryEvaluationLineIds),
              deletedAt: IsNull(),
            },
            select: ['id', 'employeeId', 'wbsItemId', 'evaluatorId'],
          });

        // WBS별 실제 2차 평가자 맵 생성 (employeeId + wbsItemId -> evaluatorId)
        const actualSecondaryEvaluatorMap = new Map<string, string>();
        for (const mapping of allSecondaryMappingsForPeriod) {
          if (mapping.wbsItemId) {
            const key = `${mapping.employeeId}:${mapping.wbsItemId}`;
            actualSecondaryEvaluatorMap.set(key, mapping.evaluatorId);
          }
        }

        // 6. WBS 할당별로 분석
        const analyzedWbsKeys = new Set<string>();

        for (const wbsAssignment of allWbsAssignments) {
          const employeeId = wbsAssignment.employeeId;
          const projectId = wbsAssignment.projectId;
          const wbsItemId = wbsAssignment.wbsItemId;
          const wbsKey = `${employeeId}:${wbsItemId}`;

          // 이미 분석한 WBS는 스킵
          if (analyzedWbsKeys.has(wbsKey)) {
            continue;
          }

          analyzedWbsKeys.add(wbsKey);

          // 해당 WBS에 대한 실제 2차 평가자 확인
          const actualSecondaryEvaluatorId =
            actualSecondaryEvaluatorMap.get(wbsKey);

          // 실제 2차 평가자가 해당 평가자와 일치하는 경우만 분석
          // (PM이 아니어도 실제 2차 평가자로 설정되어 있으면 분석)
          // 매핑이 없으면 undefined가 되므로, 이 경우도 제외 (해당 평가자와 관련 없음)
          if (actualSecondaryEvaluatorId !== evaluatorId) {
            // 실제 2차 평가자가 다른 사람이거나 매핑이 없는 경우
            // - 매핑이 있고 다른 평가자: 정상 (제외)
            // - 매핑이 없음: 해당 평가자와 관련 없음 (제외)
            continue;
          }

          // 여기서는 actualSecondaryEvaluatorId === evaluatorId가 보장됨

          // 활성 매핑 확인 (WBS별로 확인)
          const activeMappingForWbs = activeMappings.find(
            (m) => m.employeeId === employeeId && m.wbsItemId === wbsItemId,
          );

          // 활성 매핑이 있는 경우 → 정상 상태 → 제외
          if (activeMappingForWbs) {
            this.logger.debug(
              `활성 매핑 존재 - 피평가자: ${employeeId}, WBS: ${wbsItemId}, 평가자: ${evaluatorId}`,
            );
            statistics.excluded.활성매핑존재++;
            continue;
          }

          // 진단 시작
          const projectPmId = globalProjectPmMap.get(projectId);
          const diagnosis: any = {
            periodId: period.id,
            periodName: period.name,
            employeeId,
            projectId,
            wbsItemId,
            projectPmId,
            actualSecondaryEvaluatorId,
            reasons: [],
            case: '',
          };

          // 원인 분석
          // 1. 평가기간 매핑 확인
          const periodMapping =
            await this.evaluationPeriodEmployeeMappingRepository.findOne({
              where: {
                evaluationPeriodId: period.id,
                employeeId,
              },
            });

          if (!periodMapping) {
            diagnosis.reasons.push('평가기간 매핑 없음');
            diagnosis.case = '평가기간매핑없음';
            statistics.byReason.평가기간매핑없음++;
          }

          // 2. 삭제된 매핑 확인
          const deletedMapping = deletedMappings.find(
            (m) => m.employeeId === employeeId && m.wbsItemId === wbsItemId,
          );

          if (deletedMapping) {
            diagnosis.reasons.push('매핑 삭제됨');
            diagnosis.case = '매핑삭제됨';
            diagnosis.deletedMappingId = deletedMapping.id;
            diagnosis.deletedAt = deletedMapping.deletedAt;
            statistics.byReason.매핑삭제됨++;
          }

          // 3. 활성 매핑이 없는 경우 (이미 위에서 확인했지만, 삭제된 매핑과 구분하기 위해 다시 확인)
          // activeMappingForWbs는 이미 위에서 확인했으므로, 여기서는 삭제된 매핑이 아닌 경우만 처리
          if (!activeMappingForWbs && !deletedMapping) {
            diagnosis.reasons.push('WBS 할당 있음, 매핑 없음');
            diagnosis.case = 'WBS할당있음_매핑없음';
            statistics.byReason.WBS할당있음_매핑없음++;
          }

          // 4. 평가라인 확인
          if (secondaryEvaluationLineIds.length === 0) {
            diagnosis.reasons.push('2차 평가라인 없음');
            diagnosis.case = '평가라인없음';
            statistics.byReason.평가라인없음++;
          }

          // 5. PM 설정 확인
          if (!projectPmId) {
            diagnosis.reasons.push('프로젝트 PM 설정 안됨');
            diagnosis.case = 'PM설정안됨';
            statistics.byReason.PM설정안됨++;
          }

          if (diagnosis.reasons.length > 0) {
            missingTargets.push(diagnosis);
            statistics.byPeriod[period.id] =
              (statistics.byPeriod[period.id] || 0) + 1;
          }
        }
      }

      // 직원 정보 조회
      const employeeIds = [
        ...new Set(missingTargets.map((item) => item.employeeId)),
      ];
      const employees = await this.employeeRepository.find({
        where: {
          id: In(employeeIds),
          deletedAt: IsNull(),
        },
        select: ['id', 'name', 'employeeNumber', 'email', 'departmentName'],
      });
      const employeeMap = new Map(employees.map((e) => [e.id, e]));

      // 프로젝트 정보는 이미 위에서 조회했으므로 재사용
      // globalProjectMap은 이미 생성되어 있음

      // 상세 정보 추가
      const detailedList = missingTargets.map((item) => {
        const employee = employeeMap.get(item.employeeId);
        const project = globalProjectMap.get(item.projectId);

        return {
          periodId: item.periodId,
          periodName: item.periodName,
          case: item.case,
          reasons: item.reasons,
          피평가자: {
            id: item.employeeId,
            name: employee?.name || 'N/A',
            employeeNumber: employee?.employeeNumber || 'N/A',
            email: employee?.email || 'N/A',
            departmentName: employee?.departmentName || 'N/A',
          },
          프로젝트: {
            id: item.projectId,
            name: project?.name || 'N/A',
            projectCode: project?.projectCode || 'N/A',
          },
          wbsItemId: item.wbsItemId,
          projectPmId: item.projectPmId,
          actualSecondaryEvaluatorId: item.actualSecondaryEvaluatorId || null,
          deletedMappingId: item.deletedMappingId || null,
          deletedAt: item.deletedAt || null,
        };
      });

      // JSON 파일로 저장
      const outputDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
      const filename = `missing-targets_${evaluatorId}_${timestamp}.json`;
      const filepath = path.join(outputDir, filename);

      const outputData = {
        generatedAt: dayjs().toISOString(),
        evaluator: {
          id: evaluator.id,
          name: evaluator.name,
          employeeNumber: evaluator.employeeNumber,
          email: evaluator.email,
          departmentName: evaluator.departmentName,
        },
        evaluationPeriods: periods.map((p) => ({
          id: p.id,
          name: p.name,
          startDate: p.startDate?.toISOString(),
          status: p.status,
          currentPhase: p.currentPhase,
        })),
        totalCount: detailedList.length,
        summary: {
          byReason: statistics.byReason,
          byPeriod: statistics.byPeriod,
          excluded: statistics.excluded,
          상세설명: {
            WBS할당있음_매핑없음:
              'WBS 할당이 있고 프로젝트 PM이 해당 평가자인데 EvaluationLineMapping이 없는 경우',
            매핑삭제됨:
              'EvaluationLineMapping이 삭제된 경우 (deletedAt이 있음)',
            평가기간매핑없음:
              'EvaluationPeriodEmployeeMapping이 없는 경우',
            평가라인없음: '2차 평가라인이 없는 경우',
            PM설정안됨: '프로젝트 PM이 설정되지 않은 경우',
            수동변경됨:
              '활성 매핑이 있지만 평가자가 프로젝트 PM과 다른 경우 (수동으로 변경된 것으로 간주하여 제외)',
            활성매핑존재:
              '활성 매핑이 있고 평가자가 프로젝트 PM과 일치하는 경우 (정상 상태로 간주하여 제외)',
          },
        },
        missingTargets: detailedList,
      };

      fs.writeFileSync(filepath, JSON.stringify(outputData, null, 2), 'utf-8');
      this.logger.log(
        `누락된 피평가자 목록이 저장되었습니다: ${filepath}`,
      );

      this.logger.log(
        `=== 평가자 누락 피평가자 진단 완료 ===\n` +
          `평가자: ${evaluator.name} (${evaluator.employeeNumber})\n` +
          `누락된 피평가자 수: ${outputData.totalCount}명\n` +
          `원인별:\n` +
          `  - WBS할당있음_매핑없음: ${statistics.byReason.WBS할당있음_매핑없음}개\n` +
          `  - 매핑삭제됨: ${statistics.byReason.매핑삭제됨}개\n` +
          `  - 평가기간매핑없음: ${statistics.byReason.평가기간매핑없음}개\n` +
          `  - 평가라인없음: ${statistics.byReason.평가라인없음}개\n` +
          `  - PM설정안됨: ${statistics.byReason.PM설정안됨}개\n` +
          `제외된 항목:\n` +
          `  - 수동변경됨: ${statistics.excluded.수동변경됨}개\n` +
          `  - 활성매핑존재: ${statistics.excluded.활성매핑존재}개`,
      );

      return {
        success: true,
        message: '누락된 피평가자 목록 조회 및 파일 생성 완료',
        filePath: filepath,
        evaluator: outputData.evaluator,
        totalCount: detailedList.length,
        summary: outputData.summary,
        missingTargets: detailedList,
      };
    } catch (error) {
      this.logger.error('누락된 피평가자 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 누락된 매핑 생성
   * JSON 파일을 읽어서 누락된 2차 평가자 매핑을 일괄 생성합니다.
   */
  @Post('create-missing-mappings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '누락된 매핑 일괄 생성',
    description: `JSON 파일 경로를 받아서 누락된 2차 평가자 매핑을 일괄 생성합니다.
    
**입력:**
- filePath: JSON 파일 경로 (logs 디렉토리 기준)

**처리:**
- JSON 파일의 missingTargets 배열을 순회
- 각 항목에 대해 2차 평가자 매핑 생성
- 결과를 반환`,
  })
  @ApiResponse({
    status: 200,
    description: '매핑 생성 완료',
  })
  async createMissingMappings(
    @Body('filePath') filePath: string,
    @Body('createdBy') createdBy?: string,
  ) {
    try {
      this.logger.log(
        `=== 누락된 매핑 일괄 생성 시작 - 파일: ${filePath} ===`,
      );

      if (!filePath) {
        return {
          success: false,
          message: 'filePath는 필수입니다.',
        };
      }

      // JSON 파일 읽기
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `파일을 찾을 수 없습니다: ${fullPath}`,
        };
      }

      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      const jsonData = JSON.parse(fileContent);

      if (!jsonData.missingTargets || !Array.isArray(jsonData.missingTargets)) {
        return {
          success: false,
          message: 'JSON 파일에 missingTargets 배열이 없습니다.',
        };
      }

      const missingTargets = jsonData.missingTargets;
      this.logger.log(`처리할 매핑 수: ${missingTargets.length}개`);

      // 생성 결과 수집
      const results: any[] = [];
      const statistics = {
        success: 0,
        failed: 0,
        skipped: 0,
      };

      // 기본 createdBy 설정 (없으면 시스템으로 설정)
      const defaultCreatedBy = createdBy || 'system';

      // 각 누락된 매핑에 대해 생성
      for (let i = 0; i < missingTargets.length; i++) {
        const target = missingTargets[i];
        const employeeId = target.피평가자?.id || target.employeeId;
        const wbsItemId = target.wbsItemId;
        const periodId = target.periodId;
        const evaluatorId = target.projectPmId || target.evaluatorId;

        if (!employeeId || !wbsItemId || !periodId || !evaluatorId) {
          this.logger.warn('필수 필드가 누락된 항목 스킵', { target });
          results.push({
            index: i,
            target,
            success: false,
            message: '필수 필드가 누락되었습니다.',
            error: 'Missing required fields',
          });
          statistics.skipped++;
          continue;
        }

        try {
          // 2차 평가자 매핑 생성
          const result =
            await this.evaluationCriteriaManagementService.이차_평가자를_구성한다(
              employeeId,
              wbsItemId,
              periodId,
              evaluatorId,
              defaultCreatedBy,
            );

          this.logger.log(
            `매핑 생성 성공 [${i + 1}/${missingTargets.length}] - 피평가자: ${employeeId}, 평가자: ${evaluatorId}, WBS: ${wbsItemId}`,
          );

          results.push({
            index: i,
            target: {
              periodId,
              periodName: target.periodName,
              employeeId,
              employeeName: target.피평가자?.name || target.employeeName,
              wbsItemId,
              evaluatorId,
              evaluatorName: target.평가자?.name || target.evaluatorName,
            },
            success: true,
            message: '매핑 생성 완료',
            mapping: result.mapping,
          });
          statistics.success++;
        } catch (error) {
          this.logger.error(
            `매핑 생성 실패 [${i + 1}/${missingTargets.length}] - 피평가자: ${employeeId}, 평가자: ${evaluatorId}, WBS: ${wbsItemId}`,
            error.stack,
          );

          results.push({
            index: i,
            target: {
              periodId,
              periodName: target.periodName,
              employeeId,
              employeeName: target.피평가자?.name || target.employeeName,
              wbsItemId,
              evaluatorId,
              evaluatorName: target.평가자?.name || target.evaluatorName,
            },
            success: false,
            message: error.message || '매핑 생성 실패',
            error: error.stack,
          });
          statistics.failed++;
        }

        // 진행 상황 로깅
        if ((i + 1) % 10 === 0) {
          this.logger.log(
            `진행 상황: ${i + 1}/${missingTargets.length} (성공: ${statistics.success}, 실패: ${statistics.failed}, 스킵: ${statistics.skipped})`,
          );
        }
      }

      this.logger.log(
        `=== 누락된 매핑 일괄 생성 완료 ===\n` +
          `전체: ${missingTargets.length}개\n` +
          `성공: ${statistics.success}개\n` +
          `실패: ${statistics.failed}개\n` +
          `스킵: ${statistics.skipped}개`,
      );

      return {
        success: true,
        message: '누락된 매핑 일괄 생성 완료',
        filePath: fullPath,
        totalCount: missingTargets.length,
        statistics,
        results,
      };
    } catch (error) {
      this.logger.error('누락된 매핑 일괄 생성 실패:', error);
      throw error;
    }
  }
}
