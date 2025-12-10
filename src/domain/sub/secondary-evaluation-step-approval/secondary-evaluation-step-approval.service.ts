import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SecondaryEvaluationStepApproval } from './secondary-evaluation-step-approval.entity';
import {
  SecondaryEvaluationStepApprovalNotFoundException,
  SecondaryStepApprovalNotFoundByMappingAndEvaluatorException,
} from './secondary-evaluation-step-approval.exceptions';
import type {
  CreateSecondaryEvaluationStepApprovalData,
  StepApprovalStatus,
} from './secondary-evaluation-step-approval.types';
import { StepApprovalStatus as StepApprovalStatusEnum } from '../employee-evaluation-step-approval/employee-evaluation-step-approval.types';
import type { ISecondaryEvaluationStepApprovalService } from './interfaces/secondary-evaluation-step-approval.service.interface';

/**
 * 2차 평가자별 단계 승인 서비스
 * 2차 평가자별 개별 승인 상태 관리 로직을 처리합니다.
 */
@Injectable()
export class SecondaryEvaluationStepApprovalService
  implements ISecondaryEvaluationStepApprovalService
{
  private readonly logger = new Logger(
    SecondaryEvaluationStepApprovalService.name,
  );

  constructor(
    @InjectRepository(SecondaryEvaluationStepApproval)
    private readonly secondaryStepApprovalRepository: Repository<SecondaryEvaluationStepApproval>,
  ) {}

  /**
   * ID로 2차 평가자별 단계 승인을 조회한다
   */
  async ID로_조회한다(
    id: string,
  ): Promise<SecondaryEvaluationStepApproval | null> {
    return await this.secondaryStepApprovalRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  /**
   * 맵핑 ID와 평가자 ID로 단계 승인을 조회한다
   */
  async 맵핑ID와_평가자ID로_조회한다(
    mappingId: string,
    evaluatorId: string,
  ): Promise<SecondaryEvaluationStepApproval | null> {
    return await this.secondaryStepApprovalRepository.findOne({
      where: {
        evaluationPeriodEmployeeMappingId: mappingId,
        evaluatorId: evaluatorId,
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * 맵핑 ID로 모든 2차 평가자별 단계 승인을 조회한다
   */
  async 맵핑ID로_모두_조회한다(
    mappingId: string,
  ): Promise<SecondaryEvaluationStepApproval[]> {
    this.logger.log(`2차 평가자별 단계 승인 전체 조회 - 맵핑 ID: ${mappingId}`);
    return await this.secondaryStepApprovalRepository.find({
      where: {
        evaluationPeriodEmployeeMappingId: mappingId,
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * 평가자 ID로 모든 단계 승인을 조회한다
   */
  async 평가자ID로_조회한다(
    evaluatorId: string,
  ): Promise<SecondaryEvaluationStepApproval[]> {
    return await this.secondaryStepApprovalRepository.find({
      where: {
        evaluatorId: evaluatorId,
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * 2차 평가자별 단계 승인을 생성한다
   */
  async 생성한다(
    data: CreateSecondaryEvaluationStepApprovalData,
  ): Promise<SecondaryEvaluationStepApproval> {
    this.logger.log(
      `2차 평가자별 단계 승인 생성 - 맵핑 ID: ${data.evaluationPeriodEmployeeMappingId}, 평가자 ID: ${data.evaluatorId}`,
    );

    try {
      const approval = new SecondaryEvaluationStepApproval(data);
      const saved = await this.secondaryStepApprovalRepository.save(approval);

      this.logger.log(`2차 평가자별 단계 승인 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `2차 평가자별 단계 승인 생성 실패 - 맵핑 ID: ${data.evaluationPeriodEmployeeMappingId}, 평가자 ID: ${data.evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 2차 평가자별 단계 승인을 저장한다
   */
  async 저장한다(
    approval: SecondaryEvaluationStepApproval,
  ): Promise<SecondaryEvaluationStepApproval> {
    this.logger.log(`2차 평가자별 단계 승인 저장 - ID: ${approval.id}`);
    return await this.secondaryStepApprovalRepository.save(approval);
  }

  /**
   * 승인 상태를 변경한다
   */
  상태를_변경한다(
    approval: SecondaryEvaluationStepApproval,
    status: StepApprovalStatus,
    updatedBy: string,
    revisionRequestId?: string | null,
  ): void {
    this.logger.log(
      `2차 평가자별 단계 승인 상태 변경 - ID: ${approval.id}, 상태: ${status}`,
    );

    switch (status) {
      case StepApprovalStatusEnum.APPROVED:
        approval.승인한다(updatedBy);
        break;
      case StepApprovalStatusEnum.PENDING:
        approval.대기로_변경한다(updatedBy);
        break;
      case StepApprovalStatusEnum.REVISION_REQUESTED:
        if (!revisionRequestId) {
          throw new Error(
            '재작성 요청 상태로 변경 시 revisionRequestId가 필요합니다.',
          );
        }
        approval.재작성요청상태로_변경한다(updatedBy, revisionRequestId);
        break;
      case StepApprovalStatusEnum.REVISION_COMPLETED:
        approval.재작성완료상태로_변경한다(updatedBy, revisionRequestId);
        break;
    }
  }

  /**
   * 2차 평가자별 단계 승인을 삭제한다 (소프트 삭제)
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`2차 평가자별 단계 승인 삭제 - ID: ${id}`);

    const approval = await this.ID로_조회한다(id);
    if (!approval) {
      throw new SecondaryEvaluationStepApprovalNotFoundException(id);
    }

    try {
      approval.deletedAt = new Date();
      approval.메타데이터를_업데이트한다(deletedBy);
      await this.secondaryStepApprovalRepository.save(approval);

      this.logger.log(`2차 평가자별 단계 승인 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(
        `2차 평가자별 단계 승인 삭제 실패 - ID: ${id}`,
        error.stack,
      );
      throw error;
    }
  }
}
