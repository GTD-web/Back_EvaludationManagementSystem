import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EvaluationRevisionRequestService,
  EvaluationRevisionRequest,
  EvaluationRevisionRequestRecipient,
  type RevisionRequestStepType,
  RecipientType,
} from '@domain/sub/evaluation-revision-request';
import {
  EmployeeEvaluationStepApprovalService,
  StepApprovalStatus,
} from '@domain/sub/employee-evaluation-step-approval';
import { SecondaryEvaluationStepApprovalService } from '@domain/sub/secondary-evaluation-step-approval';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import type {
  IRevisionRequestContext,
  RevisionRequestWithDetailsDto,
  GetRevisionRequestsFilter,
} from './interfaces/revision-request-context.interface';

/**
 * 재작성 요청 컨텍스트 서비스
 * 재작성 요청 조회, 읽음 처리, 재작성 완료 응답을 담당합니다.
 */
@Injectable()
export class RevisionRequestContextService implements IRevisionRequestContext {
  // 임시로 로거 비활성화 (디버깅용)
  // private readonly logger = new Logger(RevisionRequestContextService.name);
  private readonly logger = { log: () => {}, warn: () => {}, error: () => {}, debug: () => {} } as any;

  constructor(
    private readonly revisionRequestService: EvaluationRevisionRequestService,
    private readonly stepApprovalService: EmployeeEvaluationStepApprovalService,
    private readonly secondaryStepApprovalService: SecondaryEvaluationStepApprovalService,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
  ) {}

  /**
   * 전체 재작성 요청 목록을 조회한다 (관리자용)
   */
  async 전체_재작성요청목록을_조회한다(
    filter?: GetRevisionRequestsFilter,
  ): Promise<RevisionRequestWithDetailsDto[]> {
    this.logger.log('전체 재작성 요청 목록 조회');

    // 재작성 요청 목록 조회 (수신자 정보 포함)
    const requests = await this.revisionRequestService.필터로_조회한다({
      evaluationPeriodId: filter?.evaluationPeriodId,
      employeeId: filter?.employeeId,
      step: filter?.step,
      requestedBy: filter?.requestedBy,
    });

    // 각 요청의 모든 수신자에 대해 상세 정보 조회
    const result: RevisionRequestWithDetailsDto[] = [];

    for (const request of requests) {
      // 피평가자 정보 조회
      const employee = await this.employeeRepository.findOne({
        where: { id: request.employeeId, deletedAt: null as any },
      });

      if (!employee) {
        this.logger.warn(
          `피평가자를 찾을 수 없습니다. - 직원 ID: ${request.employeeId}`,
        );
        continue;
      }

      // 평가기간 정보 조회
      const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
        where: { id: request.evaluationPeriodId, deletedAt: null as any },
      });

      if (!evaluationPeriod) {
        this.logger.warn(
          `평가기간을 찾을 수 없습니다. - 평가기간 ID: ${request.evaluationPeriodId}`,
        );
        continue;
      }

      // 각 수신자별로 필터링 및 항목 생성
      for (const recipient of request.recipients || []) {
        // 삭제된 수신자는 제외
        if (recipient.deletedAt) {
          continue;
        }

        // 필터 적용
        if (
          filter?.isRead !== undefined &&
          recipient.isRead !== filter.isRead
        ) {
          continue;
        }

        if (
          filter?.isCompleted !== undefined &&
          recipient.isCompleted !== filter.isCompleted
        ) {
          continue;
        }

        // 단계 승인 상태 조회
        const approvalStatus = await this.단계_승인_상태를_조회한다(
          request.evaluationPeriodId,
          request.employeeId,
          request.step,
          recipient.recipientId,
        );

        result.push({
          request: request.DTO로_변환한다(),
          recipientInfo: recipient.DTO로_변환한다(),
          employee: {
            id: employee.id,
            name: employee.name,
            employeeNumber: employee.employeeNumber,
            email: employee.email,
            departmentName: employee.departmentName,
            rankName: employee.rankName,
          },
          evaluationPeriod: {
            id: evaluationPeriod.id,
            name: evaluationPeriod.name,
          },
          approvalStatus,
        });
      }
    }

    this.logger.log(
      `전체 재작성 요청 목록 조회 완료 - 요청 수: ${result.length}`,
    );

    return result;
  }

  /**
   * 내 재작성 요청 목록을 조회한다
   */
  async 내_재작성요청목록을_조회한다(
    recipientId: string,
    filter?: GetRevisionRequestsFilter,
  ): Promise<RevisionRequestWithDetailsDto[]> {
    this.logger.log(`내 재작성 요청 목록 조회 - 수신자 ID: ${recipientId}`);

    // 수신자의 재작성 요청 목록 조회
    const recipients =
      await this.revisionRequestService.수신자의_요청목록을_조회한다(
        recipientId,
        {
          isRead: filter?.isRead,
          isCompleted: filter?.isCompleted,
          evaluationPeriodId: filter?.evaluationPeriodId,
          employeeId: filter?.employeeId,
          step: filter?.step,
        },
      );

    // 각 요청에 대한 상세 정보 조회
    const result: RevisionRequestWithDetailsDto[] = [];

    for (const recipient of recipients) {
      const request = recipient.revisionRequest;

      // revisionRequest가 null인 경우 건너뛰기
      if (!request) {
        this.logger.warn(
          `재작성 요청을 찾을 수 없습니다. - 수신자 ID: ${recipient.recipientId}, 요청 ID: ${recipient.revisionRequestId}`,
        );
        continue;
      }

      // 피평가자 정보 조회
      const employee = await this.employeeRepository.findOne({
        where: { id: request.employeeId, deletedAt: null as any },
      });

      if (!employee) {
        this.logger.warn(
          `피평가자를 찾을 수 없습니다. - 직원 ID: ${request.employeeId}`,
        );
        continue;
      }

      // 평가기간 정보 조회
      const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
        where: { id: request.evaluationPeriodId, deletedAt: null as any },
      });

      if (!evaluationPeriod) {
        this.logger.warn(
          `평가기간을 찾을 수 없습니다. - 평가기간 ID: ${request.evaluationPeriodId}`,
        );
        continue;
      }

      // 단계 승인 상태 조회
      const approvalStatus = await this.단계_승인_상태를_조회한다(
        request.evaluationPeriodId,
        request.employeeId,
        request.step,
        recipient.recipientId,
      );

      result.push({
        request: request.DTO로_변환한다(),
        recipientInfo: recipient.DTO로_변환한다(),
        employee: {
          id: employee.id,
          name: employee.name,
          employeeNumber: employee.employeeNumber,
          email: employee.email,
          departmentName: employee.departmentName,
          rankName: employee.rankName,
        },
        evaluationPeriod: {
          id: evaluationPeriod.id,
          name: evaluationPeriod.name,
        },
        approvalStatus,
      });
    }

    this.logger.log(
      `내 재작성 요청 목록 조회 완료 - 수신자 ID: ${recipientId}, 요청 수: ${result.length}`,
    );

    return result;
  }

  /**
   * 읽지 않은 재작성 요청 수를 조회한다
   */
  async 읽지않은_재작성요청수를_조회한다(recipientId: string): Promise<number> {
    this.logger.log(
      `읽지 않은 재작성 요청 수 조회 - 수신자 ID: ${recipientId}`,
    );

    const count =
      await this.revisionRequestService.읽지않은_요청수를_조회한다(recipientId);

    this.logger.log(
      `읽지 않은 재작성 요청 수 조회 완료 - 수신자 ID: ${recipientId}, 수: ${count}`,
    );

    return count;
  }

  /**
   * 재작성 요청을 읽음 처리한다
   */
  async 재작성요청을_읽음처리한다(
    requestId: string,
    recipientId: string,
  ): Promise<void> {
    this.logger.log(
      `재작성 요청 읽음 처리 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`,
    );

    // 수신자 조회
    const recipient = await this.revisionRequestService.수신자를_조회한다(
      requestId,
      recipientId,
    );

    if (!recipient) {
      throw new NotFoundException(
        `재작성 요청 수신자를 찾을 수 없습니다. (요청 ID: ${requestId}, 수신자 ID: ${recipientId})`,
      );
    }

    // 권한 확인
    if (!recipient.특정수신자의_요청인가(recipientId)) {
      throw new ForbiddenException(
        `해당 재작성 요청에 접근할 권한이 없습니다. (요청 ID: ${requestId})`,
      );
    }

    // 읽음 처리
    recipient.읽음처리한다();

    // 저장
    await this.revisionRequestService.수신자를_저장한다(recipient);

    this.logger.log(
      `재작성 요청 읽음 처리 완료 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`,
    );
  }

  /**
   * 재작성 완료 응답을 제출한다 (내부 메서드 - 비즈니스 서비스에서 호출)
   * 활동 내역 기록은 비즈니스 서비스에서 처리합니다.
   */
  async 재작성완료_응답을_제출한다_내부(
    requestId: string,
    recipientId: string,
    responseComment: string,
  ): Promise<EvaluationRevisionRequest> {
    this.logger.log(
      `재작성 완료 응답 제출 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`,
    );

    // 재작성 요청 조회
    const request = await this.revisionRequestService.ID로_조회한다(requestId);

    if (!request) {
      throw new NotFoundException(
        `재작성 요청을 찾을 수 없습니다. (요청 ID: ${requestId})`,
      );
    }

    // 수신자 조회
    const recipient = await this.revisionRequestService.수신자를_조회한다(
      requestId,
      recipientId,
    );

    if (!recipient) {
      throw new NotFoundException(
        `재작성 요청 수신자를 찾을 수 없습니다. (요청 ID: ${requestId}, 수신자 ID: ${recipientId})`,
      );
    }

    // 권한 확인
    if (!recipient.특정수신자의_요청인가(recipientId)) {
      throw new ForbiddenException(
        `해당 재작성 요청에 접근할 권한이 없습니다. (요청 ID: ${requestId})`,
      );
    }

    // 읽음 처리 (아직 읽지 않은 경우)
    if (!recipient.isRead) {
      recipient.읽음처리한다();
    }

    // 재작성 완료 응답
    recipient.재작성완료_응답한다(responseComment);

    // 저장
    await this.revisionRequestService.수신자를_저장한다(recipient);

    // 2차 평가자인 경우, 개별 승인 상태를 REVISION_COMPLETED로 변경
    if (
      request.step === 'secondary' &&
      recipient.recipientType === RecipientType.SECONDARY_EVALUATOR
    ) {
      await this.이차평가자_개별_승인상태를_재작성완료로_변경한다(
        request.evaluationPeriodId,
        request.employeeId,
        recipientId,
        request.id,
      );
    }

    // 평가기준(criteria)과 자기평가(self) 단계의 경우,
    // 각 수신자별로 별도의 재작성 요청이 생성되므로,
    // 다른 수신자에게 보낸 별도의 재작성 요청도 함께 완료 처리
    if (request.step === 'criteria' || request.step === 'self') {
      // 현재 수신자의 타입 확인
      const currentRecipientType = recipient.recipientType;

      // 다른 수신자 타입 결정 (피평가자면 1차평가자, 1차평가자면 피평가자)
      const otherRecipientType =
        currentRecipientType === RecipientType.EVALUATEE
          ? RecipientType.PRIMARY_EVALUATOR
          : RecipientType.EVALUATEE;

      // 같은 평가기간, 직원, 단계의 다른 재작성 요청 조회
      const otherRequests = await this.revisionRequestService.필터로_조회한다({
        evaluationPeriodId: request.evaluationPeriodId,
        employeeId: request.employeeId,
        step: request.step,
      });

      // 다른 수신자에게 보낸 재작성 요청 찾기
      for (const otherRequest of otherRequests) {
        // 현재 요청이 아닌 경우
        if (otherRequest.id === requestId) {
          continue;
        }

        if (!otherRequest.recipients || otherRequest.recipients.length === 0) {
          continue;
        }

        // 다른 수신자 타입의 미완료 요청 찾기
        const otherRecipient = otherRequest.recipients.find(
          (r) =>
            !r.deletedAt &&
            r.recipientType === otherRecipientType &&
            !r.isCompleted,
        );

        if (otherRecipient) {
          this.logger.log(
            `다른 수신자에게 보낸 재작성 요청도 함께 완료 처리 - 요청 ID: ${otherRequest.id}, 수신자 ID: ${otherRecipient.recipientId}`,
          );

          // 읽음 처리 (아직 읽지 않은 경우)
          if (!otherRecipient.isRead) {
            otherRecipient.읽음처리한다();
          }

          // 재작성 완료 응답
          otherRecipient.재작성완료_응답한다(
            `연계된 수신자의 재작성 완료로 인한 자동 완료 처리`,
          );

          // 저장
          await this.revisionRequestService.수신자를_저장한다(otherRecipient);
        }
      }
    }

    // 모든 수신자가 완료했는지 확인
    // 2차 평가의 경우, 모든 평가자에게 전송된 모든 재작성 요청이 완료되었는지 확인
    let allCompleted: boolean;
    if (request.step === 'secondary') {
      allCompleted = await this.모든_2차평가자의_재작성요청이_완료했는가(
        request.evaluationPeriodId,
        request.employeeId,
      );
    } else {
      allCompleted = await this.모든_수신자가_완료했는가(requestId);
    }

    if (allCompleted) {
      // 단계 승인 상태를 REVISION_COMPLETED로 변경
      await this.단계_승인_상태를_재작성완료로_변경한다(
        request.evaluationPeriodId,
        request.employeeId,
        request.step,
        recipientId,
      );
    }

    this.logger.log(
      `재작성 완료 응답 제출 완료 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`,
    );

    // 재작성 요청 반환 (비즈니스 서비스에서 활동 내역 기록에 사용)
    return request;
  }

  /**
   * 재작성 완료 응답을 제출한다 (기존 메서드 - 하위 호환성 유지)
   * @deprecated 비즈니스 서비스를 사용하세요
   */
  async 재작성완료_응답을_제출한다(
    requestId: string,
    recipientId: string,
    responseComment: string,
  ): Promise<void> {
    await this.재작성완료_응답을_제출한다_내부(
      requestId,
      recipientId,
      responseComment,
    );
  }

  /**
   * 평가기간, 직원, 평가자 기반으로 재작성 완료 응답을 제출한다 (내부 메서드 - 비즈니스 서비스에서 호출)
   * 활동 내역 기록은 비즈니스 서비스에서 처리합니다.
   */
  async 평가기간_직원_평가자로_재작성완료_응답을_제출한다_내부(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    step: RevisionRequestStepType,
    responseComment: string,
  ): Promise<EvaluationRevisionRequest> {
    this.logger.log(
      `재작성 완료 응답 제출 (관리자용) - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}, 단계: ${step}`,
    );

    // 해당 평가기간, 직원, 단계에 대한 재작성 요청 조회
    const requests = await this.revisionRequestService.필터로_조회한다({
      evaluationPeriodId,
      employeeId,
      step,
    });

    if (requests.length === 0) {
      throw new NotFoundException(
        `재작성 요청을 찾을 수 없습니다. (평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 단계: ${step})`,
      );
    }

    // 해당 평가자에게 전송된 재작성 요청 찾기
    let targetRequest: EvaluationRevisionRequest | null = null;
    let targetRecipient: EvaluationRevisionRequestRecipient | null = null;

    for (const request of requests) {
      if (!request.recipients || request.recipients.length === 0) {
        continue;
      }

      // 해당 평가자에게 전송된 수신자 찾기
      const recipient = request.recipients.find(
        (r) =>
          !r.deletedAt &&
          r.recipientId === evaluatorId &&
          (step === 'secondary'
            ? r.recipientType === RecipientType.SECONDARY_EVALUATOR
            : step === 'primary'
              ? r.recipientType === RecipientType.PRIMARY_EVALUATOR
              : true),
      );

      if (recipient) {
        targetRequest = request;
        targetRecipient = recipient;
        break;
      }
    }

    if (!targetRequest || !targetRecipient) {
      throw new NotFoundException(
        `재작성 요청 수신자를 찾을 수 없습니다. (평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}, 단계: ${step})`,
      );
    }

    // 읽음 처리 (아직 읽지 않은 경우)
    if (!targetRecipient.isRead) {
      targetRecipient.읽음처리한다();
    }

    // 재작성 완료 응답
    targetRecipient.재작성완료_응답한다(responseComment);

    // 저장
    await this.revisionRequestService.수신자를_저장한다(targetRecipient);

    // 2차 평가자인 경우, 개별 승인 상태를 REVISION_COMPLETED로 변경
    if (
      targetRequest.step === 'secondary' &&
      targetRecipient.recipientType === RecipientType.SECONDARY_EVALUATOR
    ) {
      await this.이차평가자_개별_승인상태를_재작성완료로_변경한다(
        targetRequest.evaluationPeriodId,
        targetRequest.employeeId,
        evaluatorId,
        targetRequest.id,
      );
    }

    // 평가기준(criteria)과 자기평가(self) 단계의 경우,
    // 각 수신자별로 별도의 재작성 요청이 생성되므로,
    // 다른 수신자에게 보낸 별도의 재작성 요청도 함께 완료 처리
    if (targetRequest.step === 'criteria' || targetRequest.step === 'self') {
      // 현재 수신자의 타입 확인
      const currentRecipientType = targetRecipient.recipientType;

      // 다른 수신자 타입 결정 (피평가자면 1차평가자, 1차평가자면 피평가자)
      const otherRecipientType =
        currentRecipientType === RecipientType.EVALUATEE
          ? RecipientType.PRIMARY_EVALUATOR
          : RecipientType.EVALUATEE;

      // 다른 수신자에게 보낸 재작성 요청 찾기
      for (const otherRequest of requests) {
        // 현재 요청이 아닌 경우
        if (otherRequest.id === targetRequest.id) {
          continue;
        }

        if (!otherRequest.recipients || otherRequest.recipients.length === 0) {
          continue;
        }

        // 다른 수신자 타입의 미완료 요청 찾기
        const otherRecipient = otherRequest.recipients.find(
          (r) =>
            !r.deletedAt &&
            r.recipientType === otherRecipientType &&
            !r.isCompleted,
        );

        if (otherRecipient) {
          this.logger.log(
            `다른 수신자에게 보낸 재작성 요청도 함께 완료 처리 - 요청 ID: ${otherRequest.id}, 수신자 ID: ${otherRecipient.recipientId}`,
          );

          // 읽음 처리 (아직 읽지 않은 경우)
          if (!otherRecipient.isRead) {
            otherRecipient.읽음처리한다();
          }

          // 재작성 완료 응답
          otherRecipient.재작성완료_응답한다(
            `연계된 수신자의 재작성 완료로 인한 자동 완료 처리`,
          );

          // 저장
          await this.revisionRequestService.수신자를_저장한다(otherRecipient);
        }
      }
    }

    // 모든 수신자가 완료했는지 확인
    // 2차 평가의 경우, 모든 평가자에게 전송된 모든 재작성 요청이 완료되었는지 확인
    let allCompleted: boolean;
    if (targetRequest.step === 'secondary') {
      allCompleted = await this.모든_2차평가자의_재작성요청이_완료했는가(
        targetRequest.evaluationPeriodId,
        targetRequest.employeeId,
      );
    } else {
      allCompleted = await this.모든_수신자가_완료했는가(targetRequest.id);
    }

    if (allCompleted) {
      // 단계 승인 상태를 REVISION_COMPLETED로 변경
      await this.단계_승인_상태를_재작성완료로_변경한다(
        targetRequest.evaluationPeriodId,
        targetRequest.employeeId,
        targetRequest.step,
        evaluatorId,
      );
    }

    this.logger.log(
      `재작성 완료 응답 제출 완료 (관리자용) - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}`,
    );

    // 재작성 요청 반환 (비즈니스 서비스에서 활동 내역 기록에 사용)
    return targetRequest;
  }

  /**
   * 평가기간, 직원, 평가자 기반으로 재작성 완료 응답을 제출한다 (기존 메서드 - 하위 호환성 유지)
   * @deprecated 비즈니스 서비스를 사용하세요
   */
  async 평가기간_직원_평가자로_재작성완료_응답을_제출한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    step: RevisionRequestStepType,
    responseComment: string,
  ): Promise<void> {
    await this.평가기간_직원_평가자로_재작성완료_응답을_제출한다_내부(
      evaluationPeriodId,
      employeeId,
      evaluatorId,
      step,
      responseComment,
    );
  }

  /**
   * 제출자에게 요청된 재작성 요청을 자동 완료 처리한다
   *
   * 평가 제출 시 해당 제출자에게 전송된 재작성 요청이 존재하면 자동으로 완료 처리합니다.
   * 비즈니스 서비스에서 선언적으로 사용할 수 있도록 제공되는 함수입니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param step 재작성 요청 단계
   * @param recipientId 제출자 ID (재작성 요청 수신자 ID)
   * @param recipientType 제출자 타입
   * @param responseComment 완료 처리 응답 코멘트
   */
  async 제출자에게_요청된_재작성요청을_완료처리한다(
    evaluationPeriodId: string,
    employeeId: string,
    step: RevisionRequestStepType,
    recipientId: string,
    recipientType: RecipientType,
    responseComment: string,
  ): Promise<void> {
    this.logger.log(
      `제출자에게 요청된 재작성 요청 자동 완료 처리 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 단계: ${step}, 제출자: ${recipientId}, 타입: ${recipientType}`,
    );

    // 해당 조건에 맞는 재작성 요청 조회
    const revisionRequests = await this.revisionRequestService.필터로_조회한다({
      evaluationPeriodId,
      employeeId,
      step,
    });

    if (revisionRequests.length === 0) {
      this.logger.log(
        `제출자에게 요청된 재작성 요청 없음 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 단계: ${step}, 제출자: ${recipientId}`,
      );
      return;
    }

    this.logger.log(
      `제출자에게 요청된 재작성 요청 발견 - 요청 수: ${revisionRequests.length}`,
    );

    // 각 재작성 요청에 대해 제출자에게 전송된 미완료 요청을 찾아서 완료 처리
    for (const request of revisionRequests) {
      if (!request.recipients || request.recipients.length === 0) {
        continue;
      }

      // 제출자에게 전송된 재작성 요청 찾기
      const recipient = request.recipients.find(
        (r) =>
          !r.deletedAt &&
          r.recipientId === recipientId &&
          r.recipientType === recipientType &&
          !r.isCompleted,
      );

      if (recipient) {
        try {
          // 재작성 완료 응답 제출
          await this.재작성완료_응답을_제출한다(
            request.id,
            recipientId,
            responseComment,
          );

          this.logger.log(
            `제출자에게 요청된 재작성 요청 완료 처리 성공 - 요청 ID: ${request.id}, 수신자 ID: ${recipientId}`,
          );
        } catch (error) {
          this.logger.error(
            `제출자에게 요청된 재작성 요청 완료 처리 실패 - 요청 ID: ${request.id}, 수신자 ID: ${recipientId}`,
            error,
          );
          // 재작성 요청 완료 처리 실패는 로그만 남기고 계속 진행
        }
      }
    }

    // criteria와 self 단계의 경우, 1차평가자에게 보낸 재작성 요청도 함께 완료 처리
    // (각 수신자별로 별도의 재작성 요청이 생성되므로, 1차평가자 요청도 별도로 완료 처리해야 함)
    if (
      (step === 'criteria' || step === 'self') &&
      recipientType === RecipientType.EVALUATEE
    ) {
      // 1차평가자에게 보낸 재작성 요청 찾기
      for (const request of revisionRequests) {
        if (!request.recipients || request.recipients.length === 0) {
          continue;
        }

        // 1차평가자에게 보낸 재작성 요청 찾기
        const primaryEvaluatorRecipient = request.recipients.find(
          (r) =>
            !r.deletedAt &&
            r.recipientType === RecipientType.PRIMARY_EVALUATOR &&
            !r.isCompleted,
        );

        if (primaryEvaluatorRecipient) {
          try {
            // 1차평가자 재작성 요청도 완료 처리
            await this.재작성완료_응답을_제출한다(
              request.id,
              primaryEvaluatorRecipient.recipientId,
              responseComment,
            );

            this.logger.log(
              `1차평가자에게 요청된 재작성 요청 완료 처리 성공 - 요청 ID: ${request.id}, 수신자 ID: ${primaryEvaluatorRecipient.recipientId}`,
            );
          } catch (error) {
            this.logger.error(
              `1차평가자에게 요청된 재작성 요청 완료 처리 실패 - 요청 ID: ${request.id}, 수신자 ID: ${primaryEvaluatorRecipient.recipientId}`,
              error,
            );
            // 재작성 요청 완료 처리 실패는 로그만 남기고 계속 진행
          }
        }
      }
    }

    this.logger.log(
      `제출자에게 요청된 재작성 요청 자동 완료 처리 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 단계: ${step}, 제출자: ${recipientId}`,
    );
  }

  /**
   * 모든 수신자가 완료했는지 확인한다 (내부 메서드 - 비즈니스 서비스에서 호출)
   */
  async 모든_수신자가_완료했는가_내부(requestId: string): Promise<boolean> {
    return await this.모든_수신자가_완료했는가(requestId);
  }

  /**
   * 모든 수신자가 완료했는지 확인한다
   */
  private async 모든_수신자가_완료했는가(requestId: string): Promise<boolean> {
    const request = await this.revisionRequestService.ID로_조회한다(requestId);

    if (!request || !request.recipients) {
      return false;
    }

    // 삭제되지 않은 수신자들만 확인
    const activeRecipients = request.recipients.filter((r) => !r.deletedAt);

    if (activeRecipients.length === 0) {
      return false;
    }

    // 모든 수신자가 완료했는지 확인
    return activeRecipients.every((r) => r.isCompleted);
  }

  /**
   * 모든 2차 평가자의 재작성 요청이 완료했는지 확인한다 (내부 메서드 - 비즈니스 서비스에서 호출)
   */
  async 모든_2차평가자의_재작성요청이_완료했는가_내부(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<boolean> {
    return await this.모든_2차평가자의_재작성요청이_완료했는가(
      evaluationPeriodId,
      employeeId,
    );
  }

  /**
   * 모든 2차 평가자의 재작성 요청이 완료했는지 확인한다
   *
   * 2차 평가의 경우, 각 평가자별로 개별 재작성 요청이 생성되므로
   * 해당 평가기간과 직원에 대한 모든 2차 평가 재작성 요청의 모든 수신자가 완료되었는지 확인합니다.
   */
  private async 모든_2차평가자의_재작성요청이_완료했는가(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<boolean> {
    // 해당 평가기간과 직원에 대한 모든 2차 평가 재작성 요청 조회
    const requests = await this.revisionRequestService.필터로_조회한다({
      evaluationPeriodId,
      employeeId,
      step: 'secondary',
    });

    if (requests.length === 0) {
      return false;
    }

    // 모든 재작성 요청의 모든 수신자(2차 평가자)가 완료했는지 확인
    for (const request of requests) {
      if (!request.recipients || request.recipients.length === 0) {
        return false;
      }

      // 삭제되지 않은 수신자들만 확인
      const activeRecipients = request.recipients.filter(
        (r) =>
          !r.deletedAt && r.recipientType === RecipientType.SECONDARY_EVALUATOR,
      );

      if (activeRecipients.length === 0) {
        return false;
      }

      // 모든 수신자가 완료했는지 확인
      const allRecipientsCompleted = activeRecipients.every(
        (r) => r.isCompleted,
      );

      if (!allRecipientsCompleted) {
        return false;
      }
    }

    return true;
  }

  /**
   * 단계 승인 상태를 조회한다
   */
  private async 단계_승인_상태를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
    step: RevisionRequestStepType,
    recipientId: string,
  ): Promise<StepApprovalStatus> {
    // 맵핑 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
        deletedAt: null as any,
      },
    });

    if (!mapping) {
      // 맵핑이 없으면 기본 상태 반환
      return StepApprovalStatus.PENDING;
    }

    // 단계 승인 정보 조회
    const stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(
      mapping.id,
    );

    if (!stepApproval) {
      // 단계 승인 정보가 없으면 기본 상태 반환
      return StepApprovalStatus.PENDING;
    }

    // 2차 하향평가의 경우, 평가자별 상태 조회
    if (step === 'secondary') {
      // 재작성 요청이 있는지 확인
      const revisionRequests =
        await this.revisionRequestService.필터로_조회한다({
          evaluationPeriodId,
          employeeId,
          step: 'secondary',
        });

      // 해당 평가자에게 전송된 재작성 요청 찾기
      for (const revisionRequest of revisionRequests) {
        if (
          !revisionRequest.recipients ||
          revisionRequest.recipients.length === 0
        ) {
          continue;
        }

        const recipient = revisionRequest.recipients.find(
          (r) =>
            !r.deletedAt &&
            r.recipientId === recipientId &&
            r.recipientType === RecipientType.SECONDARY_EVALUATOR,
        );

        if (recipient) {
          // 재작성 요청이 있으면 완료 여부에 따라 상태 결정
          if (recipient.isCompleted) {
            return StepApprovalStatus.REVISION_COMPLETED;
          } else {
            return StepApprovalStatus.REVISION_REQUESTED;
          }
        }
      }

      // 재작성 요청이 없으면 단계 승인 엔티티의 상태 확인
      // 2차 하향평가는 단계 승인 엔티티에 하나의 상태만 있으므로
      // 재작성 요청이 없으면 단계 승인 엔티티의 상태를 반환
      return stepApproval.secondaryEvaluationStatus;
    }

    // 평가기준, 자기평가, 1차 하향평가의 경우 단계 승인 엔티티에서 직접 조회
    switch (step) {
      case 'criteria':
        return stepApproval.criteriaSettingStatus;
      case 'self':
        return stepApproval.selfEvaluationStatus;
      case 'primary':
        return stepApproval.primaryEvaluationStatus;
      default:
        return StepApprovalStatus.PENDING;
    }
  }

  /**
   * 단계 승인 상태를 재작성 완료로 변경한다
   */
  private async 단계_승인_상태를_재작성완료로_변경한다(
    evaluationPeriodId: string,
    employeeId: string,
    step: string,
    updatedBy: string,
  ): Promise<void> {
    this.logger.log(
      `단계 승인 상태를 재작성 완료로 변경 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 단계: ${step}`,
    );

    // 맵핑 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
        deletedAt: null as any,
      },
    });

    if (!mapping) {
      this.logger.warn(
        `평가기간-직원 맵핑을 찾을 수 없습니다. - 평가기간 ID: ${evaluationPeriodId}, 직원 ID: ${employeeId}`,
      );
      return;
    }

    // 단계 승인 정보 조회
    const stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(
      mapping.id,
    );

    if (!stepApproval) {
      this.logger.warn(
        `단계 승인 정보를 찾을 수 없습니다. - 맵핑 ID: ${mapping.id}`,
      );
      return;
    }

    // 단계 타입 변환 (RevisionRequestStepType -> StepType)
    const stepType = step as 'criteria' | 'self' | 'primary' | 'secondary';

    // 단계 상태 변경
    this.stepApprovalService.단계_상태를_변경한다(
      stepApproval,
      stepType,
      StepApprovalStatus.REVISION_COMPLETED,
      updatedBy,
    );

    // 저장
    await this.stepApprovalService.저장한다(stepApproval);

    this.logger.log(
      `단계 승인 상태를 재작성 완료로 변경 완료 - 직원: ${employeeId}, 단계: ${step}`,
    );
  }

  /**
   * 2차 평가자 개별 승인 상태를 재작성 완료로 변경한다
   * 2차 평가자가 재작성 완료 응답을 제출할 때 호출됩니다.
   */
  private async 이차평가자_개별_승인상태를_재작성완료로_변경한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    revisionRequestId: string,
  ): Promise<void> {
    this.logger.log(
      `2차 평가자 개별 승인 상태를 재작성 완료로 변경 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}`,
    );

    // 맵핑 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
        deletedAt: null as any,
      },
    });

    if (!mapping) {
      this.logger.warn(
        `평가기간-직원 맵핑을 찾을 수 없습니다. - 평가기간 ID: ${evaluationPeriodId}, 직원 ID: ${employeeId}`,
      );
      return;
    }

    // 2차 평가자별 단계 승인 정보 조회 또는 생성
    let secondaryApproval =
      await this.secondaryStepApprovalService.맵핑ID와_평가자ID로_조회한다(
        mapping.id,
        evaluatorId,
      );

    if (!secondaryApproval) {
      this.logger.log(
        `2차 평가자별 단계 승인 정보가 없어 새로 생성합니다. - 맵핑 ID: ${mapping.id}, 평가자 ID: ${evaluatorId}`,
      );
      secondaryApproval = await this.secondaryStepApprovalService.생성한다({
        evaluationPeriodEmployeeMappingId: mapping.id,
        evaluatorId: evaluatorId,
        status: StepApprovalStatus.REVISION_COMPLETED,
        createdBy: evaluatorId, // 재작성 완료한 평가자가 생성자
      });
    }

    // 재작성 완료 상태로 변경
    this.secondaryStepApprovalService.상태를_변경한다(
      secondaryApproval,
      StepApprovalStatus.REVISION_COMPLETED,
      evaluatorId,
      revisionRequestId,
    );

    // 저장
    await this.secondaryStepApprovalService.저장한다(secondaryApproval);

    this.logger.log(
      `2차 평가자 개별 승인 상태를 재작성 완료로 변경 완료 - 직원: ${employeeId}, 평가자: ${evaluatorId}`,
    );
  }
}
