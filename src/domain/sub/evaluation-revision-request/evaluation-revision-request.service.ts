import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationRevisionRequest } from './evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from './evaluation-revision-request-recipient.entity';
import {
  EvaluationRevisionRequestNotFoundException,
  RevisionRequestRecipientNotFoundException,
  UnauthorizedRevisionRequestAccessException,
} from './evaluation-revision-request.exceptions';
import type {
  CreateRevisionRequestData,
  RevisionRequestFilter,
  RevisionRequestRecipientFilter,
} from './evaluation-revision-request.types';
import type { IEvaluationRevisionRequestService } from './interfaces/evaluation-revision-request.service.interface';

/**
 * 재작성 요청 서비스
 * 재작성 요청 및 수신자 관련 로직을 처리합니다.
 */
@Injectable()
export class EvaluationRevisionRequestService
  implements IEvaluationRevisionRequestService
{
  // 임시로 로거 비활성화 (디버깅용)
  // private readonly logger = new Logger(EvaluationRevisionRequestService.name);
  private readonly logger = { log: () => {}, warn: () => {}, error: () => {}, debug: () => {} } as any;

  constructor(
    @InjectRepository(EvaluationRevisionRequest)
    private readonly revisionRequestRepository: Repository<EvaluationRevisionRequest>,
    @InjectRepository(EvaluationRevisionRequestRecipient)
    private readonly recipientRepository: Repository<EvaluationRevisionRequestRecipient>,
  ) {}

  /**
   * ID로 재작성 요청을 조회한다
   */
  async ID로_조회한다(id: string): Promise<EvaluationRevisionRequest | null> {
    this.logger.log(`재작성 요청 조회 - ID: ${id}`);
    return await this.revisionRequestRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['recipients'],
    });
  }

  /**
   * 필터로 재작성 요청 목록을 조회한다
   */
  async 필터로_조회한다(
    filter: RevisionRequestFilter,
  ): Promise<EvaluationRevisionRequest[]> {
    this.logger.log('필터로 재작성 요청 조회', filter);

    const queryBuilder = this.revisionRequestRepository
      .createQueryBuilder('request')
      .where('request.deletedAt IS NULL');

    if (filter.evaluationPeriodId) {
      queryBuilder.andWhere(
        'request.evaluationPeriodId = :evaluationPeriodId',
        {
          evaluationPeriodId: filter.evaluationPeriodId,
        },
      );
    }

    if (filter.employeeId) {
      queryBuilder.andWhere('request.employeeId = :employeeId', {
        employeeId: filter.employeeId,
      });
    }

    if (filter.step) {
      queryBuilder.andWhere('request.step = :step', { step: filter.step });
    }

    if (filter.requestedBy) {
      queryBuilder.andWhere('request.requestedBy = :requestedBy', {
        requestedBy: filter.requestedBy,
      });
    }

    queryBuilder
      .leftJoinAndSelect(
        'request.recipients',
        'recipients',
        'recipients.deletedAt IS NULL',
      )
      .orderBy('request.requestedAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * 재작성 요청을 생성한다
   */
  async 생성한다(
    data: CreateRevisionRequestData,
  ): Promise<EvaluationRevisionRequest> {
    this.logger.log(
      `재작성 요청 생성 - 평가기간: ${data.evaluationPeriodId}, 직원: ${data.employeeId}, 단계: ${data.step}`,
    );

    try {
      const request = new EvaluationRevisionRequest(data);
      const saved = await this.revisionRequestRepository.save(request);

      this.logger.log(`재작성 요청 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `재작성 요청 생성 실패 - 평가기간: ${data.evaluationPeriodId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 재작성 요청을 저장한다
   */
  async 저장한다(
    request: EvaluationRevisionRequest,
  ): Promise<EvaluationRevisionRequest> {
    this.logger.log(`재작성 요청 저장 - ID: ${request.id}`);
    return await this.revisionRequestRepository.save(request);
  }

  /**
   * 재작성 요청을 삭제한다 (소프트 삭제)
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`재작성 요청 삭제 - ID: ${id}`);

    const request = await this.ID로_조회한다(id);
    if (!request) {
      throw new EvaluationRevisionRequestNotFoundException(id);
    }

    try {
      request.deletedAt = new Date();
      request.메타데이터를_업데이트한다(deletedBy);
      await this.revisionRequestRepository.save(request);

      this.logger.log(`재작성 요청 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`재작성 요청 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 수신자 ID로 재작성 요청 수신자 목록을 조회한다
   */
  async 수신자의_요청목록을_조회한다(
    recipientId: string,
    filter?: RevisionRequestRecipientFilter,
  ): Promise<EvaluationRevisionRequestRecipient[]> {
    this.logger.log(
      `수신자의 재작성 요청 목록 조회 - 수신자 ID: ${recipientId}`,
    );

    const queryBuilder = this.recipientRepository
      .createQueryBuilder('recipient')
      .leftJoinAndSelect(
        'recipient.revisionRequest',
        'request',
        'request.deletedAt IS NULL',
      )
      .where('recipient.deletedAt IS NULL')
      .andWhere('recipient.recipientId = :recipientId', { recipientId });

    if (filter?.isRead !== undefined) {
      queryBuilder.andWhere('recipient.isRead = :isRead', {
        isRead: filter.isRead,
      });
    }

    if (filter?.isCompleted !== undefined) {
      queryBuilder.andWhere('recipient.isCompleted = :isCompleted', {
        isCompleted: filter.isCompleted,
      });
    }

    if (filter?.evaluationPeriodId) {
      queryBuilder.andWhere(
        '(request.id IS NULL OR request.evaluationPeriodId = :evaluationPeriodId)',
        {
          evaluationPeriodId: filter.evaluationPeriodId,
        },
      );
    }

    if (filter?.employeeId) {
      queryBuilder.andWhere(
        '(request.id IS NULL OR request.employeeId = :employeeId)',
        {
          employeeId: filter.employeeId,
        },
      );
    }

    if (filter?.step) {
      queryBuilder.andWhere('(request.id IS NULL OR request.step = :step)', {
        step: filter.step,
      });
    }

    queryBuilder.orderBy(
      'COALESCE(request.requestedAt, recipient.createdAt)',
      'DESC',
    );

    return await queryBuilder.getMany();
  }

  /**
   * 재작성 요청 수신자를 조회한다
   */
  async 수신자를_조회한다(
    requestId: string,
    recipientId: string,
  ): Promise<EvaluationRevisionRequestRecipient | null> {
    this.logger.log(
      `재작성 요청 수신자 조회 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`,
    );

    return await this.recipientRepository.findOne({
      where: {
        revisionRequestId: requestId,
        recipientId: recipientId,
        deletedAt: IsNull(),
      },
      relations: ['revisionRequest'],
    });
  }

  /**
   * 재작성 요청 수신자를 저장한다
   */
  async 수신자를_저장한다(
    recipient: EvaluationRevisionRequestRecipient,
  ): Promise<EvaluationRevisionRequestRecipient> {
    this.logger.log(
      `재작성 요청 수신자 저장 - ID: ${recipient.id}, 수신자 ID: ${recipient.recipientId}`,
    );
    return await this.recipientRepository.save(recipient);
  }

  /**
   * 읽지 않은 재작성 요청 수를 조회한다
   */
  async 읽지않은_요청수를_조회한다(recipientId: string): Promise<number> {
    this.logger.log(
      `읽지 않은 재작성 요청 수 조회 - 수신자 ID: ${recipientId}`,
    );

    return await this.recipientRepository
      .createQueryBuilder('recipient')
      .leftJoin('recipient.revisionRequest', 'request')
      .where('recipient.deletedAt IS NULL')
      .andWhere('recipient.recipientId = :recipientId', { recipientId })
      .andWhere('recipient.isRead = :isRead', { isRead: false })
      .andWhere('request.deletedAt IS NULL')
      .getCount();
  }
}
