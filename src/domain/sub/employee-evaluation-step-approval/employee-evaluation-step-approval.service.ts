import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EmployeeEvaluationStepApproval } from './employee-evaluation-step-approval.entity';
import {
  EmployeeEvaluationStepApprovalNotFoundException,
  StepApprovalNotFoundByMappingException,
  InvalidStepTypeException,
} from './employee-evaluation-step-approval.exceptions';
import type {
  CreateEmployeeEvaluationStepApprovalData,
  StepType,
  StepApprovalStatus,
} from './employee-evaluation-step-approval.types';
import { StepApprovalStatus as StepApprovalStatusEnum } from './employee-evaluation-step-approval.types';
import type { IEmployeeEvaluationStepApprovalService } from './interfaces/employee-evaluation-step-approval.service.interface';

/**
 * 직원 평가 단계 승인 서비스
 * 평가 단계별 승인 상태 관리 로직을 처리합니다.
 */
@Injectable()
export class EmployeeEvaluationStepApprovalService
  implements IEmployeeEvaluationStepApprovalService
{
  private readonly logger = new Logger(
    EmployeeEvaluationStepApprovalService.name,
  );

  constructor(
    @InjectRepository(EmployeeEvaluationStepApproval)
    private readonly stepApprovalRepository: Repository<EmployeeEvaluationStepApproval>,
  ) {}

  /**
   * ID로 단계 승인을 조회한다
   */
  async ID로_조회한다(
    id: string,
  ): Promise<EmployeeEvaluationStepApproval | null> {
    return await this.stepApprovalRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  /**
   * 맵핑 ID로 단계 승인을 조회한다
   */
  async 맵핑ID로_조회한다(
    mappingId: string,
  ): Promise<EmployeeEvaluationStepApproval | null> {
    return await this.stepApprovalRepository.findOne({
      where: {
        evaluationPeriodEmployeeMappingId: mappingId,
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * 단계 승인을 생성한다
   */
  async 생성한다(
    data: CreateEmployeeEvaluationStepApprovalData,
  ): Promise<EmployeeEvaluationStepApproval> {
    this.logger.log(
      `단계 승인 생성 - 맵핑 ID: ${data.evaluationPeriodEmployeeMappingId}`,
    );

    try {
      const stepApproval = new EmployeeEvaluationStepApproval(data);
      const saved = await this.stepApprovalRepository.save(stepApproval);

      this.logger.log(`단계 승인 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `단계 승인 생성 실패 - 맵핑 ID: ${data.evaluationPeriodEmployeeMappingId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 단계 승인을 저장한다
   */
  async 저장한다(
    stepApproval: EmployeeEvaluationStepApproval,
  ): Promise<EmployeeEvaluationStepApproval> {
    this.logger.log(
      `[DEBUG] 단계 승인 저장 시작 - ID: ${stepApproval.id}, criteriaSettingStatus: ${stepApproval.criteriaSettingStatus}, selfEvaluationStatus: ${stepApproval.selfEvaluationStatus}`,
    );
    const saved = await this.stepApprovalRepository.save(stepApproval);
    this.logger.log(
      `[DEBUG] 단계 승인 저장 완료 - ID: ${saved.id}, criteriaSettingStatus: ${saved.criteriaSettingStatus}, selfEvaluationStatus: ${saved.selfEvaluationStatus}`,
    );
    return saved;
  }

  /**
   * 특정 단계의 상태를 변경한다
   */
  단계_상태를_변경한다(
    stepApproval: EmployeeEvaluationStepApproval,
    step: StepType,
    status: StepApprovalStatus,
    updatedBy: string,
  ): void {
    this.logger.log(
      `단계 상태 변경 시작 - 단계: ${step}, 상태: ${status}, ID: ${stepApproval.id}`,
    );
    this.logger.log(
      `[DEBUG] 변경 전 - criteriaSettingStatus: ${stepApproval.criteriaSettingStatus}, selfEvaluationStatus: ${stepApproval.selfEvaluationStatus}`,
    );

    switch (step) {
      case 'criteria':
        this._평가기준설정_상태변경(stepApproval, status, updatedBy);
        break;
      case 'self':
        this._자기평가_상태변경(stepApproval, status, updatedBy);
        break;
      case 'primary':
        this._일차평가_상태변경(stepApproval, status, updatedBy);
        break;
      case 'secondary':
        this._이차평가_상태변경(stepApproval, status, updatedBy);
        break;
      default:
        throw new InvalidStepTypeException(step);
    }

    this.logger.log(
      `[DEBUG] 변경 후 - criteriaSettingStatus: ${stepApproval.criteriaSettingStatus}, selfEvaluationStatus: ${stepApproval.selfEvaluationStatus}`,
    );
    this.logger.log(`단계 상태 변경 완료 - 단계: ${step}, 새 상태: ${status}`);
  }

  /**
   * 단계 승인을 삭제한다 (소프트 삭제)
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`단계 승인 삭제 - ID: ${id}`);

    const stepApproval = await this.ID로_조회한다(id);
    if (!stepApproval) {
      throw new EmployeeEvaluationStepApprovalNotFoundException(id);
    }

    try {
      stepApproval.deletedAt = new Date();
      stepApproval.메타데이터를_업데이트한다(deletedBy);
      await this.stepApprovalRepository.save(stepApproval);

      this.logger.log(`단계 승인 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`단계 승인 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  // ==================== Private 메서드 ====================

  /**
   * 평가기준 설정 상태를 변경한다
   */
  private _평가기준설정_상태변경(
    stepApproval: EmployeeEvaluationStepApproval,
    status: StepApprovalStatus,
    updatedBy: string,
  ): void {
    switch (status) {
      case StepApprovalStatusEnum.APPROVED:
        stepApproval.평가기준설정_확인한다(updatedBy);
        break;
      case StepApprovalStatusEnum.PENDING:
        stepApproval.평가기준설정_대기로_변경한다(updatedBy);
        break;
      case StepApprovalStatusEnum.REVISION_REQUESTED:
        stepApproval.평가기준설정_재작성요청상태로_변경한다(updatedBy);
        break;
      case StepApprovalStatusEnum.REVISION_COMPLETED:
        stepApproval.평가기준설정_재작성완료상태로_변경한다(updatedBy);
        break;
    }
  }

  /**
   * 자기평가 상태를 변경한다
   */
  private _자기평가_상태변경(
    stepApproval: EmployeeEvaluationStepApproval,
    status: StepApprovalStatus,
    updatedBy: string,
  ): void {
    switch (status) {
      case StepApprovalStatusEnum.APPROVED:
        stepApproval.자기평가_확인한다(updatedBy);
        break;
      case StepApprovalStatusEnum.PENDING:
        stepApproval.자기평가_대기로_변경한다(updatedBy);
        break;
      case StepApprovalStatusEnum.REVISION_REQUESTED:
        stepApproval.자기평가_재작성요청상태로_변경한다(updatedBy);
        break;
      case StepApprovalStatusEnum.REVISION_COMPLETED:
        stepApproval.자기평가_재작성완료상태로_변경한다(updatedBy);
        break;
    }
  }

  /**
   * 1차 평가 상태를 변경한다
   */
  private _일차평가_상태변경(
    stepApproval: EmployeeEvaluationStepApproval,
    status: StepApprovalStatus,
    updatedBy: string,
  ): void {
    switch (status) {
      case StepApprovalStatusEnum.APPROVED:
        stepApproval.일차평가_확인한다(updatedBy);
        break;
      case StepApprovalStatusEnum.PENDING:
        stepApproval.일차평가_대기로_변경한다(updatedBy);
        break;
      case StepApprovalStatusEnum.REVISION_REQUESTED:
        stepApproval.일차평가_재작성요청상태로_변경한다(updatedBy);
        break;
      case StepApprovalStatusEnum.REVISION_COMPLETED:
        stepApproval.일차평가_재작성완료상태로_변경한다(updatedBy);
        break;
    }
  }

  /**
   * 2차 평가 상태를 변경한다
   */
  private _이차평가_상태변경(
    stepApproval: EmployeeEvaluationStepApproval,
    status: StepApprovalStatus,
    updatedBy: string,
  ): void {
    switch (status) {
      case StepApprovalStatusEnum.APPROVED:
        stepApproval.이차평가_확인한다(updatedBy);
        break;
      case StepApprovalStatusEnum.PENDING:
        stepApproval.이차평가_대기로_변경한다(updatedBy);
        break;
      case StepApprovalStatusEnum.REVISION_REQUESTED:
        stepApproval.이차평가_재작성요청상태로_변경한다(updatedBy);
        break;
      case StepApprovalStatusEnum.REVISION_COMPLETED:
        stepApproval.이차평가_재작성완료상태로_변경한다(updatedBy);
        break;
    }
  }
}
