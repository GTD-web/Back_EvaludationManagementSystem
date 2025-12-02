import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationLineService } from '../../../../../domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { EvaluatorType } from '../../../../../domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluationService } from '../../../../../domain/core/downward-evaluation/downward-evaluation.service';
import { DownwardEvaluationType } from '../../../../../domain/core/downward-evaluation/downward-evaluation.types';

/**
 * 1차 평가자 구성 커맨드 (직원별 고정 담당자)
 */
export class ConfigurePrimaryEvaluatorCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly evaluatorId: string,
    public readonly createdBy: string,
  ) {}
}

/**
 * 1차 평가자 구성 결과
 */
export interface ConfigurePrimaryEvaluatorResult {
  message: string;
  createdLines: number;
  createdMappings: number;
  mapping: {
    id: string;
    employeeId: string;
    evaluatorId: string;
    wbsItemId: string | null;
    evaluationLineId: string;
  };
}

/**
 * 1차 평가자 구성 커맨드 핸들러
 *
 * 직원별 고정 담당자(1차 평가자)를 설정한다 (WBS와 무관)
 */
@CommandHandler(ConfigurePrimaryEvaluatorCommand)
export class ConfigurePrimaryEvaluatorHandler
  implements
    ICommandHandler<
      ConfigurePrimaryEvaluatorCommand,
      ConfigurePrimaryEvaluatorResult
    >
{
  private readonly logger = new Logger(ConfigurePrimaryEvaluatorHandler.name);

  constructor(
    private readonly evaluationLineService: EvaluationLineService,
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
    private readonly downwardEvaluationService: DownwardEvaluationService,
  ) {}

  async execute(
    command: ConfigurePrimaryEvaluatorCommand,
  ): Promise<ConfigurePrimaryEvaluatorResult> {
    const { employeeId, periodId, evaluatorId, createdBy } = command;

    this.logger.log(
      `1차 평가자 구성 시작 - 직원: ${employeeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`,
    );

    try {
      let createdLines = 0;
      let createdMappings = 0;

      // 1차 평가 라인 조회 또는 생성
      const evaluationLines = await this.evaluationLineService.필터_조회한다({
        evaluatorType: EvaluatorType.PRIMARY,
        orderFrom: 1,
        orderTo: 1,
      });

      let primaryEvaluationLine;
      if (evaluationLines.length > 0) {
        primaryEvaluationLine = evaluationLines[0];
      } else {
        primaryEvaluationLine = await this.evaluationLineService.생성한다({
          evaluatorType: EvaluatorType.PRIMARY,
          order: 1,
          isRequired: true,
          isAutoAssigned: false,
        });
        createdLines++;
      }

      const evaluationLineId = primaryEvaluationLine.DTO로_변환한다().id;

      // 기존 매핑 조회 (evaluationPeriodId, employeeId, evaluationLineId 기준, wbsItemId는 null)
      const existingMappings =
        await this.evaluationLineMappingService.필터_조회한다({
          evaluationPeriodId: periodId,
          employeeId,
          evaluationLineId,
        });

      // wbsItemId가 null인 매핑만 필터링 (직원별 고정 담당자)
      const primaryMappings = existingMappings.filter(
        (mapping) => !mapping.wbsItemId,
      );

      let mappingEntity;
      if (primaryMappings.length > 0) {
        // 기존 매핑이 있으면 업데이트
        const existingMapping = primaryMappings[0];
        const mappingId = existingMapping.DTO로_변환한다().id;
        const previousEvaluatorId = existingMapping.evaluatorId;

        // 평가자가 변경되는 경우, 기존 평가자의 하향평가 삭제
        if (previousEvaluatorId && previousEvaluatorId !== evaluatorId) {
          this.logger.log(
            `1차 평가자 변경 감지 - 기존 평가자: ${previousEvaluatorId}, 새 평가자: ${evaluatorId}`,
          );

          // 기존 평가자가 작성한 PRIMARY 하향평가 조회
          const existingDownwardEvaluations =
            await this.downwardEvaluationService.필터_조회한다({
              employeeId,
              evaluatorId: previousEvaluatorId,
              periodId,
              evaluationType: DownwardEvaluationType.PRIMARY,
            });

          // 기존 평가자의 하향평가 삭제
          for (const downwardEval of existingDownwardEvaluations) {
            if (!downwardEval.deletedAt) {
              await this.downwardEvaluationService.삭제한다(
                downwardEval.id,
                createdBy || evaluatorId,
              );
              this.logger.log(
                `기존 1차 평가자의 하향평가 삭제 - 하향평가 ID: ${downwardEval.id}, WBS: ${downwardEval.wbsId}`,
              );
            }
          }
        }

        // 업데이트 메서드 사용
        mappingEntity = await this.evaluationLineMappingService.업데이트한다(
          mappingId,
          { 
            evaluatorId,
            updatedBy: createdBy || evaluatorId,
          },
          createdBy || evaluatorId,
        );
        this.logger.log(
          `기존 1차 평가자 매핑 업데이트 - 매핑 ID: ${mappingId}, 새 평가자: ${evaluatorId}`,
        );
      } else {
        // 새로 생성 (wbsItemId는 undefined로 설정)
        mappingEntity = await this.evaluationLineMappingService.생성한다({
          evaluationPeriodId: command.periodId,
          employeeId,
          evaluatorId,
          wbsItemId: undefined, // 직원별 고정 담당자이므로 WBS와 무관
          evaluationLineId,
          createdBy,
        });
        createdMappings++;
        this.logger.log(
          `새 1차 평가자 매핑 생성 - 매핑 ID: ${mappingEntity.DTO로_변환한다().id}`,
        );
      }

      const mappingDto = mappingEntity.DTO로_변환한다();
      const mapping = {
        id: mappingDto.id,
        employeeId: mappingDto.employeeId,
        evaluatorId: mappingDto.evaluatorId,
        wbsItemId: mappingDto.wbsItemId || null,
        evaluationLineId: mappingDto.evaluationLineId,
      };

      this.logger.log(
        `1차 평가자 구성 완료 - 피평가자: ${employeeId}, 평가자: ${evaluatorId}`,
      );

      const result = {
        message: `직원 ${employeeId}의 1차 평가자(고정 담당자) 구성이 완료되었습니다.`,
        createdLines,
        createdMappings,
        mapping,
      };

      return result;
    } catch (error) {
      this.logger.error(
        `1차 평가자 구성 실패 - 직원: ${employeeId}, 평가자: ${evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }
}
