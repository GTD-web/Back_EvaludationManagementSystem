import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { ProjectService } from '@domain/common/project/project.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { EvaluationLineMappingService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { InjectRepository } from '@nestjs/typeorm';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { Repository, EntityManager, IsNull } from 'typeorm';

/**
 * 프로젝트 할당 취소 커맨드
 */
export class CancelProjectAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly cancelledBy: string,
  ) {}
}

/**
 * 프로젝트 할당 취소 커맨드 핸들러
 */
@CommandHandler(CancelProjectAssignmentCommand)
@Injectable()
export class CancelProjectAssignmentHandler
  implements ICommandHandler<CancelProjectAssignmentCommand>
{
  private readonly logger = new Logger(CancelProjectAssignmentHandler.name);

  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
    private readonly projectService: ProjectService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly lineMappingService: EvaluationLineMappingService,
    private readonly transactionManager: TransactionManagerService,
    @InjectRepository(EvaluationLineMapping)
    private readonly lineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationLine)
    private readonly lineRepository: Repository<EvaluationLine>,
  ) {}

  async execute(command: CancelProjectAssignmentCommand): Promise<void> {
    const { id, cancelledBy } = command;

    return await this.transactionManager.executeTransaction(async (manager) => {
      // 할당 존재 여부 확인 (도메인 서비스 사용)
      const assignment = await this.projectAssignmentService.ID로_조회한다(
        id,
        manager,
      );
      if (!assignment) {
        throw new NotFoundException(
          `프로젝트 할당 ID ${id}에 해당하는 할당을 찾을 수 없습니다.`,
        );
      }

      // 프로젝트 존재 여부 확인
      const assignmentDto = assignment.DTO로_변환한다();
      const project = await this.projectService.ID로_조회한다(
        assignmentDto.projectId,
      );
      if (!project) {
        throw new NotFoundException(
          `프로젝트 ID ${assignmentDto.projectId}에 해당하는 프로젝트를 찾을 수 없습니다.`,
        );
      }

      // 평가기간 존재 여부 및 상태 검증 (Context 레벨)
      const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(
        assignment.periodId,
        manager,
      );
      if (!evaluationPeriod) {
        throw new NotFoundException(
          `평가기간 ID ${assignment.periodId}에 해당하는 평가기간을 찾을 수 없습니다.`,
        );
      }

      // 완료된 평가기간에는 할당 취소 불가
      if (evaluationPeriod.완료된_상태인가()) {
        throw new UnprocessableEntityException(
          '완료된 평가기간에는 프로젝트 할당을 취소할 수 없습니다.',
        );
      }

      // 1. 해당 프로젝트와 직원의 WBS 할당 조회
      const wbsAssignments = await this.wbsAssignmentService.필터_조회한다(
        {
          periodId: assignment.periodId,
          employeeId: assignment.employeeId,
          projectId: assignmentDto.projectId,
        },
        manager,
      );

      this.logger.log(
        `프로젝트 배정 삭제 전 관련 데이터 정리: WBS 할당 ${wbsAssignments.length}개`,
        {
          projectAssignmentId: id,
          projectId: assignmentDto.projectId,
          employeeId: assignment.employeeId,
          periodId: assignment.periodId,
        },
      );

      // 2. WBS 할당별로 관련 데이터 삭제
      for (const wbsAssignment of wbsAssignments) {
        // 2-1. 해당 WBS 항목의 자기평가 조회
        const selfEvaluations =
          await this.wbsSelfEvaluationService.필터_조회한다(
            {
              employeeId: assignment.employeeId,
              periodId: assignment.periodId,
              wbsItemId: wbsAssignment.wbsItemId,
            },
            manager,
          );

        // 2-2. 자기평가 삭제
        for (const evaluation of selfEvaluations) {
          await this.wbsSelfEvaluationService.삭제한다(
            evaluation.id,
            cancelledBy,
            manager,
          );
          this.logger.debug(
            `자기평가 삭제: ${evaluation.id} (WBS: ${wbsAssignment.wbsItemId})`,
          );
        }

        // 2-3. 해당 WBS 항목의 2차 하향평가만 조회 및 삭제
        const downwardEvaluations =
          await this.downwardEvaluationService.필터_조회한다({
            periodId: assignment.periodId,
            employeeId: assignment.employeeId,
            wbsId: wbsAssignment.wbsItemId,
            evaluationType: DownwardEvaluationType.SECONDARY, // 2차 평가만 삭제
          });

        for (const evaluation of downwardEvaluations) {
          await this.downwardEvaluationService.삭제한다(
            evaluation.id,
            cancelledBy,
          );
          this.logger.debug(
            `2차 하향평가 삭제: ${evaluation.id} (WBS: ${wbsAssignment.wbsItemId}, 평가자: ${evaluation.evaluatorId})`,
          );
        }

        // 2-4. 해당 WBS 항목의 2차 평가자 매핑만 삭제
        await this.이차평가자_매핑만_삭제한다(
          wbsAssignment.wbsItemId,
          assignment.periodId,
          assignment.employeeId,
          cancelledBy,
          manager,
        );
        this.logger.debug(
          `2차 평가자 매핑 삭제: WBS ${wbsAssignment.wbsItemId}`,
        );

        // 2-5. WBS 할당 삭제
        await this.wbsAssignmentService.삭제한다(
          wbsAssignment.id,
          cancelledBy,
          manager,
        );
        this.logger.debug(`WBS 할당 삭제: ${wbsAssignment.id}`);
      }

      // 2-6. 모든 WBS가 삭제되었는지 확인 후, 직원-평가자 레벨의 2차 평가자 매핑만 삭제
      const remainingWbsList = await this.wbsAssignmentService.필터_조회한다(
        {
          periodId: assignment.periodId,
          employeeId: assignment.employeeId,
        },
        manager,
      );

      if (remainingWbsList.length === 0) {
        // 해당 직원의 모든 WBS가 삭제되었으므로, 2차 평가자 매핑만 삭제
        await this.이차평가자_매핑만_삭제한다(
          null, // wbsItemId = null인 직원 레벨 매핑
          assignment.periodId,
          assignment.employeeId,
          cancelledBy,
          manager,
        );

        this.logger.log(
          `직원의 모든 WBS가 삭제되어 2차 평가자 매핑 삭제 - 직원: ${assignment.employeeId}`,
        );
      }

      // 3. 프로젝트 배정 삭제
      await this.projectAssignmentService.삭제한다(id, cancelledBy, manager);

      this.logger.log(
        `프로젝트 배정 삭제 완료: ${id} (관련 WBS 할당 ${wbsAssignments.length}개 삭제)`,
      );
    });
  }

  /**
   * 2차 평가자 매핑만 삭제한다
   *
   * @param wbsItemId WBS 항목 ID (null인 경우 직원 레벨 매핑)
   * @param periodId 평가기간 ID
   * @param employeeId 직원 ID
   * @param deletedBy 삭제자 ID
   * @param manager 트랜잭션 매니저
   */
  private async 이차평가자_매핑만_삭제한다(
    wbsItemId: string | null,
    periodId: string,
    employeeId: string,
    deletedBy: string,
    manager: EntityManager,
  ): Promise<void> {
    // 1. 해당 조건의 평가라인 매핑 조회 (평가라인 정보 조인)
    const queryBuilder = manager
      .getRepository(EvaluationLineMapping)
      .createQueryBuilder('mapping')
      .leftJoin(
        EvaluationLine,
        'line',
        'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
      )
      .where('mapping.evaluationPeriodId = :periodId', { periodId })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: EvaluatorType.SECONDARY,
      });

    // wbsItemId 조건 추가
    if (wbsItemId === null) {
      queryBuilder.andWhere('mapping.wbsItemId IS NULL');
    } else {
      queryBuilder.andWhere('mapping.wbsItemId = :wbsItemId', { wbsItemId });
    }

    const secondaryMappings = await queryBuilder.getMany();

    // 2. 2차 평가자 매핑 삭제
    for (const mapping of secondaryMappings) {
      await this.lineMappingService.삭제한다(mapping.id, deletedBy, manager);
      this.logger.debug(
        `2차 평가자 매핑 삭제: ${mapping.id} (평가자: ${mapping.evaluatorId}, WBS: ${wbsItemId ?? 'null'})`,
      );
    }

    if (secondaryMappings.length > 0) {
      this.logger.log(
        `2차 평가자 매핑 ${secondaryMappings.length}개 삭제 완료 - 직원: ${employeeId}, WBS: ${wbsItemId ?? 'null'}`,
      );
    }
  }
}
