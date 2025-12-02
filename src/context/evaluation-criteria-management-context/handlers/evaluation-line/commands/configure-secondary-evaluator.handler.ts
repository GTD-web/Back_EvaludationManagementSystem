import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationLineService } from '../../../../../domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { EvaluatorType } from '../../../../../domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluationService } from '../../../../../domain/core/downward-evaluation/downward-evaluation.service';
import { DownwardEvaluationType } from '../../../../../domain/core/downward-evaluation/downward-evaluation.types';

/**
 * 2차 평가자 구성 커맨드
 */
export class ConfigureSecondaryEvaluatorCommand {
  constructor(
    public readonly employeeId: string,
    public readonly wbsItemId: string,
    public readonly periodId: string,
    public readonly evaluatorId: string,
    public readonly createdBy: string,
  ) {}
}

/**
 * 2차 평가자 구성 결과
 */
export interface ConfigureSecondaryEvaluatorResult {
  message: string;
  createdLines: number;
  createdMappings: number;
  mapping: {
    id: string;
    employeeId: string;
    evaluatorId: string;
    wbsItemId: string;
    evaluationLineId: string;
  };
}

/**
 * 2차 평가자 구성 커맨드 핸들러
 *
 * 직원, WBS, 평가기간에 따라 2차 평가자를 지정하여 평가라인을 구성한다
 */
@CommandHandler(ConfigureSecondaryEvaluatorCommand)
export class ConfigureSecondaryEvaluatorHandler
  implements
    ICommandHandler<
      ConfigureSecondaryEvaluatorCommand,
      ConfigureSecondaryEvaluatorResult
    >
{
  private readonly logger = new Logger(ConfigureSecondaryEvaluatorHandler.name);

  constructor(
    private readonly evaluationLineService: EvaluationLineService,
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
    private readonly downwardEvaluationService: DownwardEvaluationService,
  ) {}

  async execute(
    command: ConfigureSecondaryEvaluatorCommand,
  ): Promise<ConfigureSecondaryEvaluatorResult> {
    const { employeeId, wbsItemId, periodId, evaluatorId, createdBy } = command;

    this.logger.log(
      `2차 평가자 구성 시작 - 직원: ${employeeId}, WBS: ${wbsItemId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`,
    );

    try {
      let createdLines = 0;
      let createdMappings = 0;

      // 2차 평가 라인 조회 또는 생성
      const evaluationLines = await this.evaluationLineService.필터_조회한다({
        evaluatorType: EvaluatorType.SECONDARY,
        orderFrom: 2,
        orderTo: 2,
      });

      let secondaryEvaluationLine;
      if (evaluationLines.length > 0) {
        secondaryEvaluationLine = evaluationLines[0];
      } else {
        secondaryEvaluationLine = await this.evaluationLineService.생성한다({
          evaluatorType: EvaluatorType.SECONDARY,
          order: 2,
          isRequired: true,
          isAutoAssigned: false,
        });
        createdLines++;
      }

      const evaluationLineId = secondaryEvaluationLine.DTO로_변환한다().id;

      // WBS별 유일한 2차 평가자 보장을 위해 기존 매핑들 조회
      const existingMappings =
        await this.evaluationLineMappingService.필터_조회한다({
          evaluationPeriodId: periodId,
          employeeId,
          wbsItemId,
          evaluationLineId,
        });

      // 기존 2차 평가자 매핑이 있으면 모두 삭제 (WBS별로 한 명만 허용)
      if (existingMappings.length > 0) {
        for (const existingMapping of existingMappings) {
          const mappingId = existingMapping.DTO로_변환한다().id;
          const previousEvaluatorId = existingMapping.evaluatorId;

          // 평가자가 변경되는 경우, 기존 평가자의 해당 WBS 하향평가 삭제
          if (previousEvaluatorId && previousEvaluatorId !== evaluatorId) {
            this.logger.log(
              `2차 평가자 변경 감지 - WBS: ${wbsItemId}, 기존 평가자: ${previousEvaluatorId}, 새 평가자: ${evaluatorId}`,
            );

            // 기존 평가자가 작성한 해당 WBS의 SECONDARY 하향평가 조회
            const existingDownwardEvaluations =
              await this.downwardEvaluationService.필터_조회한다({
                employeeId,
                evaluatorId: previousEvaluatorId,
                periodId,
                wbsId: wbsItemId,
                evaluationType: DownwardEvaluationType.SECONDARY,
              });

            // 기존 평가자의 하향평가 삭제
            for (const downwardEval of existingDownwardEvaluations) {
              if (!downwardEval.deletedAt) {
                await this.downwardEvaluationService.삭제한다(
                  downwardEval.id,
                  createdBy || evaluatorId,
                );
                this.logger.log(
                  `기존 2차 평가자의 하향평가 삭제 - 하향평가 ID: ${downwardEval.id}, WBS: ${downwardEval.wbsId}`,
                );
              }
            }
          }

          await this.evaluationLineMappingService.삭제한다(
            mappingId,
            createdBy || evaluatorId,
          );
          this.logger.log(
            `기존 2차 평가자 매핑 삭제 - 매핑 ID: ${mappingId}, 기존 평가자: ${existingMapping.evaluatorId}`,
          );
        }
      }

      // 새로운 2차 평가자 매핑 생성
      const mappingEntity = await this.evaluationLineMappingService.생성한다({
        evaluationPeriodId: command.periodId,
        employeeId,
        evaluatorId,
        wbsItemId,
        evaluationLineId,
        createdBy,
      });
      createdMappings++;
      this.logger.log(
        `새 2차 평가자 매핑 생성 - 매핑 ID: ${mappingEntity.DTO로_변환한다().id}, 평가자: ${evaluatorId}`,
      );

      const mappingDto = mappingEntity.DTO로_변환한다();
      const mapping = {
        id: mappingDto.id,
        employeeId: mappingDto.employeeId,
        evaluatorId: mappingDto.evaluatorId,
        wbsItemId: mappingDto.wbsItemId || '',
        evaluationLineId: mappingDto.evaluationLineId,
      };

      this.logger.log(
        `2차 평가자 구성 완료 - 피평가자: ${employeeId}, 평가자: ${evaluatorId}`,
      );

      const result = {
        message: `직원 ${employeeId}의 WBS 항목 ${wbsItemId}에 대한 2차 평가자 구성이 완료되었습니다.`,
        createdLines,
        createdMappings,
        mapping,
      };

      return result;
    } catch (error) {
      this.logger.error(
        `2차 평가자 구성 실패 - 직원: ${employeeId}, WBS: ${wbsItemId}, 평가자: ${evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }
}
