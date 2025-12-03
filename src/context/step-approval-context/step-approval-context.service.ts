import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  EmployeeEvaluationStepApprovalService,
  StepApprovalStatus,
} from '@domain/sub/employee-evaluation-step-approval';
import {
  SecondaryEvaluationStepApprovalService,
  SecondaryEvaluationStepApproval,
} from '@domain/sub/secondary-evaluation-step-approval';
import {
  EvaluationRevisionRequestService,
  EvaluationRevisionRequest,
  EvaluationRevisionRequestRecipient,
  RevisionRequestStepType,
  RecipientType,
} from '@domain/sub/evaluation-revision-request';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import type {
  IStepApprovalContext,
  UpdateStepApprovalRequest,
  UpdateStepApprovalByStepRequest,
  UpdateSecondaryStepApprovalRequest,
} from './interfaces/step-approval-context.interface';

/**
 * 단계 승인 컨텍스트 서비스
 * 평가 단계별 확인 상태 변경 및 재작성 요청 생성을 담당합니다.
 */
@Injectable()
export class StepApprovalContextService implements IStepApprovalContext {
  private readonly logger = new Logger(StepApprovalContextService.name);

  constructor(
    private readonly stepApprovalService: EmployeeEvaluationStepApprovalService,
    private readonly secondaryStepApprovalService: SecondaryEvaluationStepApprovalService,
    private readonly revisionRequestService: EvaluationRevisionRequestService,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 단계별 확인 상태를 변경한다
   */
  async 단계별_확인상태를_변경한다(
    request: UpdateStepApprovalRequest,
  ): Promise<void> {
    this.logger.log(
      `단계별 확인 상태 변경 시작 - 평가기간: ${request.evaluationPeriodId}, 직원: ${request.employeeId}, 단계: ${request.step}, 상태: ${request.status}`,
    );

    // 1. 맵핑 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId: request.evaluationPeriodId,
        employeeId: request.employeeId,
        deletedAt: null as any,
      },
    });

    if (!mapping) {
      throw new NotFoundException(
        `평가기간-직원 맵핑을 찾을 수 없습니다. (평가기간 ID: ${request.evaluationPeriodId}, 직원 ID: ${request.employeeId})`,
      );
    }

    // 2. 단계 승인 정보 조회 또는 생성
    let stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(
      mapping.id,
    );

    if (!stepApproval) {
      this.logger.log(
        `단계 승인 정보가 없어 새로 생성합니다. - 맵핑 ID: ${mapping.id}`,
      );
      stepApproval = await this.stepApprovalService.생성한다({
        evaluationPeriodEmployeeMappingId: mapping.id,
        createdBy: request.updatedBy,
      });
    }

    // 3. 단계 상태 변경
    this.stepApprovalService.단계_상태를_변경한다(
      stepApproval,
      request.step,
      request.status,
      request.updatedBy,
    );

    // 4. 저장
    await this.stepApprovalService.저장한다(stepApproval);

    // 5. revision_requested인 경우 재작성 요청 생성
    if (request.status === StepApprovalStatus.REVISION_REQUESTED) {
      if (!request.revisionComment || request.revisionComment.trim() === '') {
        throw new NotFoundException('재작성 요청 코멘트는 필수입니다.');
      }

      await this.재작성요청을_생성한다(
        request.evaluationPeriodId,
        request.employeeId,
        request.step,
        request.revisionComment,
        request.updatedBy,
      );
    }

    this.logger.log(
      `단계별 확인 상태 변경 완료 - 직원: ${request.employeeId}, 단계: ${request.step}`,
    );
  }

  /**
   * 재작성 요청을 생성한다 (private)
   * 각 수신자별로 별도 트랜잭션을 사용하여 동시성 문제를 방지합니다.
   */
  private async 재작성요청을_생성한다(
    evaluationPeriodId: string,
    employeeId: string,
    step: RevisionRequestStepType,
    comment: string,
    requestedBy: string,
  ): Promise<void> {
    this.logger.log(
      `재작성 요청 생성 시작 - 직원: ${employeeId}, 단계: ${step}`,
    );

    // 수신자 목록 결정 (트랜잭션 밖에서 조회)
    const recipients = await this.재작성요청_수신자를_조회한다(
      evaluationPeriodId,
      employeeId,
      step,
    );

    if (recipients.length === 0) {
      throw new NotFoundException(
        `재작성 요청 수신자를 찾을 수 없습니다. 평가라인 설정을 확인해주세요. (직원 ID: ${employeeId}, 단계: ${step})`,
      );
    }

    // 각 수신자별로 별도의 재작성 요청 생성
    // criteria와 self 단계의 경우 피평가자와 1차평가자에게 각각 별도 요청 생성
    // 각 수신자별로 별도 트랜잭션을 사용하여 동시성 문제 방지
    for (const recipient of recipients) {
      await this.dataSource.transaction(async (manager) => {
        // 기존 미완료 재작성 요청 확인 (수신자별로)
        // 먼저 request만 조회 (FOR UPDATE와 호환)
        const existingRequests = await manager
          .createQueryBuilder(EvaluationRevisionRequest, 'request')
          .where('request.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
          })
          .andWhere('request.employeeId = :employeeId', { employeeId })
          .andWhere('request.step = :step', { step })
          .andWhere('request.deletedAt IS NULL')
          .setLock('pessimistic_write')
          .getMany();

        // 각 요청의 recipients를 조회하여 해당 수신자에게 보낸 미완료 요청 찾기
        let existingRequestForRecipient: EvaluationRevisionRequest | null =
          null;
        for (const request of existingRequests) {
          const requestRecipients = await manager
            .createQueryBuilder(EvaluationRevisionRequestRecipient, 'recipient')
            .where('recipient.revisionRequestId = :requestId', {
              requestId: request.id,
            })
            .andWhere('recipient.deletedAt IS NULL')
            .getMany();

          // 해당 수신자에게 보낸 미완료 요청인지 확인
          const matchingRecipient = requestRecipients.find(
            (r) =>
              r.recipientId === recipient.recipientId &&
              r.recipientType === recipient.recipientType &&
              !r.isCompleted,
          );

          if (matchingRecipient) {
            existingRequestForRecipient = request;
            break;
          }
        }

        // 기존 미완료 요청이 있으면 삭제
        if (existingRequestForRecipient) {
          this.logger.log(
            `기존 미완료 재작성 요청 삭제 (수신자별) - 요청 ID: ${existingRequestForRecipient.id}, 수신자: ${recipient.recipientId}`,
          );
          existingRequestForRecipient.deletedAt = new Date();
          existingRequestForRecipient.메타데이터를_업데이트한다(requestedBy);
          await manager.save(
            EvaluationRevisionRequest,
            existingRequestForRecipient,
          );
        }

        // 수신자별로 별도의 재작성 요청 생성
        const newRequest = new EvaluationRevisionRequest({
          evaluationPeriodId,
          employeeId,
          step,
          comment,
          requestedBy,
          recipients: [recipient], // 각 수신자별로 별도 요청
          createdBy: requestedBy,
        });
        await manager.save(EvaluationRevisionRequest, newRequest);
      });
    }

    this.logger.log(
      `재작성 요청 생성 완료 - 직원: ${employeeId}, 단계: ${step}`,
    );
  }

  /**
   * 재작성 요청 수신자를 조회한다
   *
   * 단계별 수신자 규칙:
   * - criteria (평가기준): 피평가자 + 1차평가자
   * - self (자기평가): 피평가자 + 1차평가자
   * - primary (1차평가): 1차평가자만
   * - secondary (2차평가): 2차평가자들만
   */
  private async 재작성요청_수신자를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
    step: RevisionRequestStepType,
  ): Promise<Array<{ recipientId: string; recipientType: RecipientType }>> {
    const recipients: Array<{
      recipientId: string;
      recipientType: RecipientType;
    }> = [];

    switch (step) {
      case 'criteria':
      case 'self':
        // 피평가자 추가
        recipients.push({
          recipientId: employeeId,
          recipientType: RecipientType.EVALUATEE,
        });

        // 1차평가자 추가 (피평가자와 다른 경우만)
        const primaryEvaluator = await this.일차평가자를_조회한다(
          evaluationPeriodId,
          employeeId,
        );
        if (primaryEvaluator && primaryEvaluator !== employeeId) {
          recipients.push({
            recipientId: primaryEvaluator,
            recipientType: RecipientType.PRIMARY_EVALUATOR,
          });
        }
        break;

      case 'primary':
        // 1차평가자만 추가
        const primaryOnly = await this.일차평가자를_조회한다(
          evaluationPeriodId,
          employeeId,
        );
        if (primaryOnly) {
          recipients.push({
            recipientId: primaryOnly,
            recipientType: RecipientType.PRIMARY_EVALUATOR,
          });
        }
        break;

      case 'secondary':
        // 2차평가자들 추가
        const secondaryEvaluators = await this.이차평가자들을_조회한다(
          evaluationPeriodId,
          employeeId,
        );
        secondaryEvaluators.forEach((evaluatorId) => {
          recipients.push({
            recipientId: evaluatorId,
            recipientType: RecipientType.SECONDARY_EVALUATOR,
          });
        });
        break;
    }

    return recipients;
  }

  /**
   * 1차평가자를 조회한다
   */
  async 일차평가자를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<string | null> {
    // EvaluationLineMapping을 사용하여 평가자 조회
    // mapping.evaluatorId가 externalId로 저장되어 있을 수 있으므로, Employee 테이블과 조인하여 실제 Employee.id를 반환합니다.
    
    // 먼저 평가기간-직원 맵핑 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
        deletedAt: null as any,
      },
    });

    if (!mapping) {
      return null;
    }

    // PRIMARY 타입의 평가라인을 통해 평가자 조회
    // Employee와 조인하여 실제 Employee.id를 반환
    const lineMapping = await this.evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .leftJoin(
        'evaluation_lines',
        'line',
        'line.id = mapping.evaluationLineId',
      )
      .leftJoin(
        'employee',
        'evaluator',
        '(evaluator.id = "mapping"."evaluatorId" OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL',
      )
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: 'primary',
      })
      .andWhere('line.deletedAt IS NULL')
      .select('evaluator.id', 'evaluatorId')
      .getRawOne();

    return lineMapping?.evaluatorId || null;
  }

  /**
   * 2차평가자를 조회한다 (WBS별)
   * mapping.evaluatorId가 externalId로 저장되어 있을 수 있으므로, Employee 테이블과 조인하여 실제 Employee.id를 반환합니다.
   */
  async 이차평가자를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
    wbsItemId: string,
  ): Promise<string | null> {
    // EvaluationLineMapping을 사용하여 평가자 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
        deletedAt: null as any,
      },
    });

    if (!mapping) {
      return null;
    }

    // SECONDARY 타입의 평가라인을 통해 특정 WBS의 평가자 조회
    // Employee와 조인하여 실제 Employee.id를 반환
    const lineMapping = await this.evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .leftJoin(
        'evaluation_lines',
        'line',
        'line.id = mapping.evaluationLineId',
      )
      .leftJoin(
        'employee',
        'evaluator',
        '(evaluator.id = "mapping"."evaluatorId" OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL',
      )
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.wbsItemId = :wbsItemId', { wbsItemId })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: 'secondary',
      })
      .andWhere('line.deletedAt IS NULL')
      .select('evaluator.id', 'evaluatorId')
      .getRawOne();

    return lineMapping?.evaluatorId || null;
  }

  /**
   * 2차평가자들을 조회한다 (전체)
   * mapping.evaluatorId가 externalId로 저장되어 있을 수 있으므로, Employee 테이블과 조인하여 실제 Employee.id를 반환합니다.
   */
  async 이차평가자들을_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<string[]> {
    // EvaluationLineMapping을 사용하여 평가자 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
        deletedAt: null as any,
      },
    });

    if (!mapping) {
      return [];
    }

    // SECONDARY 타입의 평가라인을 통해 평가자들 조회
    // Employee와 조인하여 실제 Employee.id를 반환
    const lineMappings = await this.evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .leftJoin(
        'evaluation_lines',
        'line',
        'line.id = mapping.evaluationLineId',
      )
      .leftJoin(
        'employee',
        'evaluator',
        '(evaluator.id = "mapping"."evaluatorId" OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL',
      )
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: 'secondary',
      })
      .andWhere('line.deletedAt IS NULL')
      .select('evaluator.id', 'evaluatorId')
      .getRawMany();

    // Employee.id를 찾지 못한 경우를 위해 null 체크
    return lineMappings
      .map((mapping) => mapping.evaluatorId)
      .filter((id) => id !== null && id !== undefined);
  }

  /**
   * 평가기준 설정 단계 승인 상태를 변경한다
   */
  async 평가기준설정_확인상태를_변경한다(
    request: UpdateStepApprovalByStepRequest,
  ): Promise<void> {
    await this.단계별_확인상태를_변경한다({
      evaluationPeriodId: request.evaluationPeriodId,
      employeeId: request.employeeId,
      step: 'criteria',
      status: request.status,
      revisionComment: request.revisionComment,
      updatedBy: request.updatedBy,
    });
  }

  /**
   * 자기평가 단계 승인 상태를 변경한다
   * 재작성 요청 생성 시 비즈니스 서비스를 통해 제출 상태 초기화를 함께 처리합니다.
   */
  async 자기평가_확인상태를_변경한다(
    request: UpdateStepApprovalByStepRequest,
  ): Promise<void> {
    // 재작성 요청 생성 시 비즈니스 서비스를 통해 제출 상태 초기화를 함께 처리
    // 비즈니스 서비스는 step-approval-context를 의존하므로 순환 의존성을 피하기 위해
    // 여기서는 직접 처리하지 않고, 컨트롤러에서 비즈니스 서비스를 호출하도록 합니다.
    await this.단계별_확인상태를_변경한다({
      evaluationPeriodId: request.evaluationPeriodId,
      employeeId: request.employeeId,
      step: 'self',
      status: request.status,
      revisionComment: request.revisionComment,
      updatedBy: request.updatedBy,
    });
  }

  /**
   * 1차 하향평가 단계 승인 상태를 변경한다
   */
  async 일차하향평가_확인상태를_변경한다(
    request: UpdateStepApprovalByStepRequest,
  ): Promise<void> {
    await this.단계별_확인상태를_변경한다({
      evaluationPeriodId: request.evaluationPeriodId,
      employeeId: request.employeeId,
      step: 'primary',
      status: request.status,
      revisionComment: request.revisionComment,
      updatedBy: request.updatedBy,
    });
  }

  /**
   * 2차 하향평가 단계 승인 상태를 평가자별로 변경한다
   */
  async 이차하향평가_확인상태를_변경한다(
    request: UpdateSecondaryStepApprovalRequest,
  ): Promise<SecondaryEvaluationStepApproval> {
    this.logger.log(
      `2차 하향평가 확인 상태 변경 시작 - 평가기간: ${request.evaluationPeriodId}, 직원: ${request.employeeId}, 평가자: ${request.evaluatorId}, 상태: ${request.status}`,
    );

    // 1. 맵핑 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId: request.evaluationPeriodId,
        employeeId: request.employeeId,
        deletedAt: null as any,
      },
    });

    if (!mapping) {
      throw new NotFoundException(
        `평가기간-직원 맵핑을 찾을 수 없습니다. (평가기간 ID: ${request.evaluationPeriodId}, 직원 ID: ${request.employeeId})`,
      );
    }

    // 2. 평가자 검증 - 해당 평가자가 실제로 2차 평가자인지 확인
    const isSecondaryEvaluator = await this.평가자가_2차평가자인지_확인한다(
      request.evaluationPeriodId,
      request.employeeId,
      request.evaluatorId,
    );

    if (!isSecondaryEvaluator) {
      throw new NotFoundException(
        `해당 평가자는 2차 평가자가 아닙니다. (평가기간 ID: ${request.evaluationPeriodId}, 직원 ID: ${request.employeeId}, 평가자 ID: ${request.evaluatorId})`,
      );
    }

    // 3. 2차 평가자별 단계 승인 정보 조회 또는 생성
    let secondaryApproval =
      await this.secondaryStepApprovalService.맵핑ID와_평가자ID로_조회한다(
        mapping.id,
        request.evaluatorId,
      );

    if (!secondaryApproval) {
      this.logger.log(
        `2차 평가자별 단계 승인 정보가 없어 새로 생성합니다. - 맵핑 ID: ${mapping.id}, 평가자 ID: ${request.evaluatorId}`,
      );
      secondaryApproval = await this.secondaryStepApprovalService.생성한다({
        evaluationPeriodEmployeeMappingId: mapping.id,
        evaluatorId: request.evaluatorId,
        status: request.status,
        createdBy: request.updatedBy,
      });
    }

    // 4. 재작성 요청 ID 조회 (revision_requested인 경우)
    let revisionRequestId: string | null = null;
    if (request.status === StepApprovalStatus.REVISION_REQUESTED) {
      if (!request.revisionComment || request.revisionComment.trim() === '') {
        throw new NotFoundException('재작성 요청 코멘트는 필수입니다.');
      }

      // 재작성 요청 생성
      const revisionRequest = await this.재작성요청을_평가자별로_생성한다(
        request.evaluationPeriodId,
        request.employeeId,
        request.evaluatorId,
        request.revisionComment,
        request.updatedBy,
      );
      revisionRequestId = revisionRequest.id;
    }

    // 5. 2차 평가자별 단계 승인 상태 변경
    this.secondaryStepApprovalService.상태를_변경한다(
      secondaryApproval,
      request.status,
      request.updatedBy,
      revisionRequestId,
    );

    // 6. 저장
    const savedApproval =
      await this.secondaryStepApprovalService.저장한다(secondaryApproval);

    this.logger.log(
      `2차 하향평가 확인 상태 변경 완료 - 직원: ${request.employeeId}, 평가자: ${request.evaluatorId}`,
    );

    return savedApproval;
  }

  /**
   * 평가자가 2차 평가자인지 확인한다
   */
  private async 평가자가_2차평가자인지_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
  ): Promise<boolean> {
    // evaluatorId는 Employee.id 또는 externalId일 수 있으므로, Employee 테이블과 조인하여 확인
    const lineMapping = await this.evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .leftJoin(
        'evaluation_lines',
        'line',
        'line.id = mapping.evaluationLineId',
      )
      .leftJoin(
        'employee',
        'evaluator',
        '(evaluator.id = "mapping"."evaluatorId" OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL',
      )
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('(evaluator.id::text = :evaluatorId OR evaluator.externalId = :evaluatorId)', { evaluatorId })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: 'secondary',
      })
      .andWhere('line.deletedAt IS NULL')
      .getOne();

    return !!lineMapping;
  }

  /**
   * 재작성 요청을 특정 평가자에게만 생성한다 (평가자별 부분 처리)
   * 트랜잭션으로 처리하여 동시성 문제를 방지합니다.
   */
  private async 재작성요청을_평가자별로_생성한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    comment: string,
    requestedBy: string,
  ): Promise<EvaluationRevisionRequest> {
    this.logger.log(
      `재작성 요청 생성 시작 (평가자별) - 직원: ${employeeId}, 평가자: ${evaluatorId}`,
    );

    // 트랜잭션으로 처리하여 동시성 문제 방지
    const newRequest = await this.dataSource.transaction(async (manager) => {
      // SELECT FOR UPDATE를 사용하여 락을 걸고 기존 미완료 재작성 요청 확인
      // leftJoinAndSelect는 FOR UPDATE와 호환되지 않으므로 먼저 request만 조회
      const existingRequests = await manager
        .createQueryBuilder(EvaluationRevisionRequest, 'request')
        .where('request.evaluationPeriodId = :evaluationPeriodId', {
          evaluationPeriodId,
        })
        .andWhere('request.employeeId = :employeeId', { employeeId })
        .andWhere('request.step = :step', { step: 'secondary' })
        .andWhere('request.deletedAt IS NULL')
        .setLock('pessimistic_write') // SELECT FOR UPDATE
        .getMany();

      // recipients는 별도로 조회
      for (const request of existingRequests) {
        request.recipients = await manager
          .createQueryBuilder(EvaluationRevisionRequestRecipient, 'recipient')
          .where('recipient.revisionRequestId = :requestId', {
            requestId: request.id,
          })
          .andWhere('recipient.deletedAt IS NULL')
          .getMany();
      }

      // 해당 평가자에게 전송된 미완료 요청이 있으면 삭제
      for (const existingRequest of existingRequests) {
        if (
          !existingRequest.recipients ||
          existingRequest.recipients.length === 0
        ) {
          continue;
        }

        // 해당 평가자에게 전송된 수신자 찾기
        const recipient = existingRequest.recipients.find(
          (r) =>
            !r.deletedAt &&
            r.recipientId === evaluatorId &&
            r.recipientType === RecipientType.SECONDARY_EVALUATOR,
        );

        if (recipient && !recipient.isCompleted) {
          this.logger.log(
            `기존 미완료 재작성 요청 삭제 (평가자별) - 요청 ID: ${existingRequest.id}, 평가자: ${evaluatorId}`,
          );
          // 트랜잭션 내에서 직접 삭제 처리
          existingRequest.deletedAt = new Date();
          existingRequest.메타데이터를_업데이트한다(requestedBy);
          await manager.save(EvaluationRevisionRequest, existingRequest);
          break; // 하나만 삭제하면 됨
        }
      }

      // 특정 평가자에게만 재작성 요청 전송
      const recipients = [
        {
          recipientId: evaluatorId,
          recipientType: RecipientType.SECONDARY_EVALUATOR,
        },
      ];

      // 재작성 요청 생성 (트랜잭션 내에서)
      const request = new EvaluationRevisionRequest({
        evaluationPeriodId,
        employeeId,
        step: 'secondary',
        comment,
        requestedBy,
        recipients,
        createdBy: requestedBy,
      });
      return await manager.save(EvaluationRevisionRequest, request);
    });

    this.logger.log(
      `재작성 요청 생성 완료 (평가자별) - 직원: ${employeeId}, 평가자: ${evaluatorId}`,
    );

    return newRequest;
  }
}
