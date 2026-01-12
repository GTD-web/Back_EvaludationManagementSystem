import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLineMappingService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { Public } from '@interface/common/decorators/public.decorator';
import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  Body,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { IsNull, Repository } from 'typeorm';

/**
 * 매핑 충돌 수정 컨트롤러
 *
 * JSON 파일에서 매핑 충돌을 읽어서 자동으로 수정합니다.
 * - 매핑이 없는 경우: 프로젝트 PM을 평가자로 하는 매핑 생성
 * - 활성 매핑이 여러 개인 경우: 최신 매핑만 남기고 나머지 삭제
 */
@ApiTags('Public - 매핑 충돌 수정')
@Controller('mapping-conflict-fix')
@Public()
export class MappingConflictFixController {
  private readonly logger = new Logger(MappingConflictFixController.name);

  constructor(
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly evaluationWbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
  ) {}

  /**
   * JSON 파일에서 매핑 충돌을 읽어서 자동 수정
   */
  @Post('fix-from-json')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'JSON 파일에서 매핑 충돌 자동 수정',
    description: `JSON 파일에서 매핑 충돌을 읽어서 자동으로 수정합니다.
    
**수정 항목:**
1. 매핑이 없는 경우 (noMapping): 프로젝트 PM을 평가자로 하는 매핑 생성
2. 활성 매핑이 여러 개인 경우 (multipleActiveMappings): 최신 매핑만 남기고 나머지 하드 삭제 (물리적 삭제)`,
  })
  @ApiResponse({
    status: 200,
    description: '수정 완료',
  })
  async fixFromJson(
    @Query('filename') filename?: string,
    @Body('dryRun') dryRun?: boolean,
  ) {
    try {
      const isDryRun = dryRun === true;
      this.logger.log(
        `=== 매핑 충돌 수정 시작 (${isDryRun ? 'DRY RUN' : '실제 수정'}) ===`,
      );

      // JSON 파일 경로
      const jsonFilePath = filename
        ? path.join(process.cwd(), 'logs', filename)
        : path.join(
            process.cwd(),
            'logs',
            'mapping-conflicts_2026-01-11_18-46-27.json',
          );

      if (!fs.existsSync(jsonFilePath)) {
        return {
          success: false,
          message: `JSON 파일을 찾을 수 없습니다: ${jsonFilePath}`,
        };
      }

      // JSON 파일 읽기
      const jsonContent = fs.readFileSync(jsonFilePath, 'utf-8');
      const data = JSON.parse(jsonContent);

      if (!data.conflicts || !Array.isArray(data.conflicts)) {
        return {
          success: false,
          message: 'JSON 파일 형식이 올바르지 않습니다.',
        };
      }

      // 2차 평가 라인 조회
      const secondaryEvaluationLine = await this.evaluationLineRepository.findOne(
        {
          where: {
            evaluatorType: EvaluatorType.SECONDARY,
            deletedAt: IsNull(),
          },
        },
      );

      if (!secondaryEvaluationLine) {
        return {
          success: false,
          message: '2차 평가 라인을 찾을 수 없습니다.',
        };
      }

      const results = {
        created: [] as any[],
        deleted: [] as any[],
        errors: [] as any[],
      };

      // 각 충돌 처리
      for (const conflict of data.conflicts) {
        try {
          if (conflict.conflictType === 'noMapping') {
            // 매핑이 없는 경우: 프로젝트 PM을 평가자로 하는 매핑 생성
            const result = await this.fixNoMapping(
              conflict,
              secondaryEvaluationLine.id,
              isDryRun,
            );
            if (result.success) {
              results.created.push(result);
            } else {
              results.errors.push({
                conflict,
                error: result.error,
              });
            }
          } else if (conflict.conflictType === 'multipleActiveMappings') {
            // 활성 매핑이 여러 개인 경우: 최신 매핑만 남기고 나머지 삭제
            const result = await this.fixMultipleActiveMappings(
              conflict,
              isDryRun,
            );
            if (result.success) {
              results.deleted.push(...result.deleted);
            } else {
              results.errors.push({
                conflict,
                error: result.error,
              });
            }
          }
        } catch (error) {
          this.logger.error(
            `충돌 처리 중 오류 발생: ${conflict.conflictType}`,
            error.stack,
          );
          results.errors.push({
            conflict,
            error: error.message,
          });
        }
      }

      this.logger.log(
        `=== 매핑 충돌 수정 완료 ===\n` +
          `생성된 매핑: ${results.created.length}개\n` +
          `삭제된 매핑: ${results.deleted.length}개\n` +
          `오류: ${results.errors.length}개`,
      );

      return {
        success: true,
        message: isDryRun
          ? 'DRY RUN 모드로 실행되었습니다. 실제 수정은 수행되지 않았습니다.'
          : '매핑 충돌 수정이 완료되었습니다.',
        isDryRun,
        results: {
          created: results.created.length,
          deleted: results.deleted.length,
          errors: results.errors.length,
          details: {
            created: results.created,
            deleted: results.deleted,
            errors: results.errors,
          },
        },
      };
    } catch (error) {
      this.logger.error('매핑 충돌 수정 실패', error.stack);
      return {
        success: false,
        message: '매핑 충돌 수정 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  /**
   * 매핑이 없는 경우 수정
   */
  private async fixNoMapping(
    conflict: any,
    secondaryEvaluationLineId: string,
    isDryRun: boolean,
  ): Promise<any> {
    const periodId = conflict.periodId;
    const employeeId = conflict.피평가자.id;
    const wbsItemId = conflict.WBS.id;
    const projectPmId = conflict.프로젝트PM.id;

    if (!periodId || !employeeId || !wbsItemId || !projectPmId) {
      return {
        success: false,
        error: '필수 정보가 누락되었습니다.',
      };
    }

    // 이미 매핑이 존재하는지 확인
    const existingMapping = await this.evaluationLineMappingRepository.findOne({
      where: {
        evaluationPeriodId: periodId,
        employeeId: employeeId,
        wbsItemId: wbsItemId,
        evaluationLineId: secondaryEvaluationLineId,
        deletedAt: IsNull(),
      },
    });

    if (existingMapping) {
      return {
        success: false,
        error: '이미 매핑이 존재합니다.',
        existingMappingId: existingMapping.id,
      };
    }

    if (isDryRun) {
      return {
        success: true,
        message: '매핑 생성 예정',
        data: {
          evaluationPeriodId: periodId,
          employeeId: employeeId,
          evaluatorId: projectPmId,
          wbsItemId: wbsItemId,
          evaluationLineId: secondaryEvaluationLineId,
        },
      };
    }

    // 매핑 생성
    const mapping = await this.evaluationLineMappingService.생성한다({
      evaluationPeriodId: periodId,
      employeeId: employeeId,
      evaluatorId: projectPmId,
      wbsItemId: wbsItemId,
      evaluationLineId: secondaryEvaluationLineId,
      createdBy: 'system',
    });

    this.logger.log(
      `매핑 생성 완료 - ID: ${mapping.id}, 피평가자: ${employeeId}, 평가자: ${projectPmId}, WBS: ${wbsItemId}`,
    );

    return {
      success: true,
      message: '매핑이 생성되었습니다.',
      mappingId: mapping.id,
      data: {
        evaluationPeriodId: periodId,
        employeeId: employeeId,
        evaluatorId: projectPmId,
        wbsItemId: wbsItemId,
        evaluationLineId: secondaryEvaluationLineId,
      },
    };
  }

  /**
   * 활성 매핑이 여러 개인 경우 수정
   */
  private async fixMultipleActiveMappings(
    conflict: any,
    isDryRun: boolean,
  ): Promise<any> {
    const periodId = conflict.periodId;
    const employeeId = conflict.피평가자.id;
    const wbsItemId = conflict.WBS.id;
    const allMappings = conflict.매핑정보.allMappings || [];

    if (!periodId || !employeeId || !wbsItemId || allMappings.length === 0) {
      return {
        success: false,
        error: '필수 정보가 누락되었습니다.',
      };
    }

    // 활성 매핑만 필터링
    const activeMappings = allMappings.filter(
      (m: any) => m.deletedAt === null,
    );

    if (activeMappings.length <= 1) {
      return {
        success: false,
        error: '활성 매핑이 1개 이하입니다.',
      };
    }

    // updatedAt 기준으로 정렬하여 가장 최신 매핑 찾기
    const sortedMappings = [...activeMappings].sort(
      (a: any, b: any) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    const latestMapping = sortedMappings[0];
    const oldMappings = sortedMappings.slice(1);

      if (isDryRun) {
        return {
          success: true,
          message: '매핑 하드 삭제 예정',
          latestMappingId: latestMapping.id,
          deletedMappingIds: oldMappings.map((m: any) => m.id),
          data: {
            periodId,
            employeeId,
            wbsItemId,
            latestMapping,
            oldMappings,
          },
          deleted: oldMappings.map((m: any) => ({
            mappingId: m.id,
            evaluatorId: m.evaluatorId,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
          })),
        };
      }

    // 오래된 매핑들 하드 삭제 (물리적 삭제)
    const deleted: Array<{
      mappingId: string;
      evaluatorId: string;
      createdAt: any;
      updatedAt: any;
    }> = [];
    for (const oldMapping of oldMappings) {
      try {
        // 하드 삭제 수행 (repository.delete 사용)
        await this.evaluationLineMappingService.삭제한다(
          oldMapping.id,
          'system',
        );
        deleted.push({
          mappingId: oldMapping.id,
          evaluatorId: oldMapping.evaluatorId,
          createdAt: oldMapping.createdAt,
          updatedAt: oldMapping.updatedAt,
        });
        this.logger.log(
          `오래된 매핑 하드 삭제 완료 - ID: ${oldMapping.id}, 평가자: ${oldMapping.evaluatorId}`,
        );
      } catch (error) {
        this.logger.error(
          `매핑 하드 삭제 실패 - ID: ${oldMapping.id}`,
          error.stack,
        );
        throw error;
      }
    }

    return {
      success: true,
      message: '오래된 매핑이 하드 삭제되었습니다.',
      latestMappingId: latestMapping.id,
      deletedMappingIds: oldMappings.map((m: any) => m.id),
      deleted,
    };
  }
}
