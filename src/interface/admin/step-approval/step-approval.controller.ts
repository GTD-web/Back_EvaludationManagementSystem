import {
  Controller,
  Body,
  Param,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StepApprovalContextService } from '@context/step-approval-context';
import { WbsSelfEvaluationBusinessService } from '@business/wbs-self-evaluation/wbs-self-evaluation-business.service';
import { DownwardEvaluationBusinessService } from '@business/downward-evaluation/downward-evaluation-business.service';
import { StepApprovalBusinessService } from '@business/step-approval/step-approval-business.service';
import { UpdateStepApprovalDto } from '@interface/common/dto/step-approval/update-step-approval.dto';
import { UpdateSecondaryStepApprovalDto } from '@interface/common/dto/step-approval/update-secondary-step-approval.dto';
import { UpdateSecondaryStepApprovalResponseDto } from '@interface/common/dto/step-approval/update-secondary-step-approval-response.dto';
import { StepApprovalEnumsResponseDto } from '@interface/common/dto/step-approval/step-approval-enums.dto';
import {
  UpdateCriteriaStepApproval,
  UpdateSelfStepApproval,
  UpdatePrimaryStepApproval,
  UpdateSecondaryStepApproval,
} from '@interface/common/decorators/step-approval/step-approval-api.decorators';
import { GetStepApprovalEnums } from '@interface/common/decorators/step-approval/step-approval-enums-api.decorators';
import {
  StepTypeEnum,
  StepApprovalStatusEnum,
} from '@interface/common/dto/step-approval/update-step-approval.dto';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { Roles } from '@interface/common/decorators';

/**
 * 단계 승인 컨트롤러
 * 평가 단계별 승인 상태 관리 API를 제공합니다.
 */
@ApiTags('A-0-3. 관리자 - 단계 승인')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/step-approvals')
export class StepApprovalController {
  constructor(
    private readonly stepApprovalContextService: StepApprovalContextService,
    private readonly wbsSelfEvaluationBusinessService: WbsSelfEvaluationBusinessService,
    private readonly downwardEvaluationBusinessService: DownwardEvaluationBusinessService,
    private readonly stepApprovalBusinessService: StepApprovalBusinessService,
  ) {}

  /**
   * 단계 승인 Enum 목록을 조회한다
   */
  @GetStepApprovalEnums()
  async getStepApprovalEnums(): Promise<StepApprovalEnumsResponseDto> {
    return {
      steps: Object.values(StepTypeEnum),
      statuses: Object.values(StepApprovalStatusEnum),
    };
  }

  /**
   * 평가기준 설정 단계 승인 상태를 변경한다
   * 재작성 요청 생성 시 제출 상태 초기화를 함께 처리합니다.
   * 승인(APPROVED) 처리 시 제출 상태도 자동으로 변경합니다.
   */
  @UpdateCriteriaStepApproval()
  async updateCriteriaStepApproval(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateStepApprovalDto,
    @CurrentUser('id') updatedBy: string,
  ): Promise<void> {
    console.log(`[CONTROLLER] 평가기준 설정 단계 승인 상태 변경 호출`);
    console.log(`[CONTROLLER] evaluationPeriodId: ${evaluationPeriodId}`);
    console.log(`[CONTROLLER] employeeId: ${employeeId}`);
    console.log(`[CONTROLLER] dto:`, JSON.stringify(dto, null, 2));
    console.log(`[CONTROLLER] updatedBy: ${updatedBy}`);

    // 재작성 요청 생성 시 제출 상태 초기화를 함께 처리
    if (dto.status === StepApprovalStatusEnum.REVISION_REQUESTED) {
      if (!dto.revisionComment || dto.revisionComment.trim() === '') {
        throw new BadRequestException('재작성 요청 코멘트는 필수입니다.');
      }

      // 비즈니스 서비스를 통해 제출 상태 초기화 및 재작성 요청 생성
      await this.stepApprovalBusinessService.평가기준설정_재작성요청_생성_및_제출상태_초기화(
        evaluationPeriodId,
        employeeId,
        dto.revisionComment,
        updatedBy,
      );
    } else {
      // 승인 상태로 변경 시 제출 상태도 함께 변경
      if (dto.status === StepApprovalStatusEnum.APPROVED) {
        await this.stepApprovalBusinessService.평가기준설정_승인_시_제출상태_변경(
          evaluationPeriodId,
          employeeId,
          updatedBy,
        );
      }

      // 단계 승인 상태 변경
      await this.stepApprovalBusinessService.평가기준설정_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        status: dto.status as any,
        revisionComment: dto.revisionComment,
        updatedBy,
      });
    }
  }

  /**
   * 자기평가 단계 승인 상태를 변경한다
   * 재작성 요청 생성 시 제출 상태 초기화를 함께 처리합니다.
   * 승인(APPROVED) 처리 시 제출 상태도 자동으로 변경합니다.
   */
  @UpdateSelfStepApproval()
  async updateSelfStepApproval(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateStepApprovalDto,
    @CurrentUser('id') updatedBy: string,
  ): Promise<void> {
    console.log(`[CONTROLLER] 자기평가 단계 승인 상태 변경 호출`);
    console.log(`[CONTROLLER] evaluationPeriodId: ${evaluationPeriodId}`);
    console.log(`[CONTROLLER] employeeId: ${employeeId}`);
    console.log(`[CONTROLLER] dto:`, JSON.stringify(dto, null, 2));
    console.log(`[CONTROLLER] updatedBy: ${updatedBy}`);

    // 재작성 요청 생성 시 제출 상태 초기화를 함께 처리
    if (dto.status === StepApprovalStatusEnum.REVISION_REQUESTED) {
      if (!dto.revisionComment || dto.revisionComment.trim() === '') {
        throw new BadRequestException('재작성 요청 코멘트는 필수입니다.');
      }

      // 비즈니스 서비스를 통해 제출 상태 초기화 및 재작성 요청 생성
      await this.wbsSelfEvaluationBusinessService.자기평가_재작성요청_생성_및_제출상태_초기화(
        evaluationPeriodId,
        employeeId,
        dto.revisionComment,
        updatedBy,
      );
    } else {
      // 승인 상태로 변경 시 제출 상태도 함께 변경
      if (dto.status === StepApprovalStatusEnum.APPROVED) {
        await this.stepApprovalBusinessService.자기평가_승인_시_제출상태_변경(
          evaluationPeriodId,
          employeeId,
          updatedBy,
        );

        // 하위 평가 자동 승인 옵션이 활성화된 경우
        if (dto.approveSubsequentSteps) {
          await this.stepApprovalBusinessService.자기평가_승인_시_하위평가들을_승인한다(
            evaluationPeriodId,
            employeeId,
            updatedBy,
          );
        }
      }

      // 단계 승인 상태 변경
      await this.stepApprovalBusinessService.자기평가_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        status: dto.status as any,
        revisionComment: dto.revisionComment,
        updatedBy,
      });
    }
  }

  /**
   * 1차 하향평가 단계 승인 상태를 변경한다
   * 재작성 요청 생성 시 제출 상태 초기화를 함께 처리합니다.
   * 승인(APPROVED) 처리 시 제출 상태도 자동으로 변경합니다.
   * approveSubsequentSteps 옵션이 true인 경우 자기평가도 함께 승인합니다.
   */
  @UpdatePrimaryStepApproval()
  async updatePrimaryStepApproval(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateStepApprovalDto,
    @CurrentUser('id') updatedBy: string,
  ): Promise<void> {
    console.log(`[CONTROLLER] 1차 하향평가 단계 승인 상태 변경 호출`);
    console.log(`[CONTROLLER] evaluationPeriodId: ${evaluationPeriodId}`);
    console.log(`[CONTROLLER] employeeId: ${employeeId}`);
    console.log(`[CONTROLLER] dto:`, JSON.stringify(dto, null, 2));
    console.log(`[CONTROLLER] updatedBy: ${updatedBy}`);

    // 재작성 요청 생성 시 제출 상태 초기화를 함께 처리
    if (dto.status === StepApprovalStatusEnum.REVISION_REQUESTED) {
      if (!dto.revisionComment || dto.revisionComment.trim() === '') {
        throw new BadRequestException('재작성 요청 코멘트는 필수입니다.');
      }

      // 비즈니스 서비스를 통해 제출 상태 초기화 및 재작성 요청 생성
      await this.downwardEvaluationBusinessService.일차_하향평가_재작성요청_생성_및_제출상태_초기화(
        evaluationPeriodId,
        employeeId,
        dto.revisionComment,
        updatedBy,
      );
    } else {
      // 승인 상태로 변경 시 제출 상태도 함께 변경
      if (dto.status === StepApprovalStatusEnum.APPROVED) {
        await this.stepApprovalBusinessService.일차_하향평가_승인_시_제출상태_변경(
          evaluationPeriodId,
          employeeId,
          updatedBy,
        );

        // 상위 평가 자동 승인 옵션이 활성화된 경우 (자기평가 승인)
        if (dto.approveSubsequentSteps) {
          await this.stepApprovalBusinessService.일차하향평가_승인_시_상위평가를_승인한다(
            evaluationPeriodId,
            employeeId,
            updatedBy,
          );
        }
      }

      // 단계 승인 상태 변경
      await this.stepApprovalBusinessService.일차하향평가_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        status: dto.status as any,
        revisionComment: dto.revisionComment,
        updatedBy,
      });
    }
  }

  /**
   * 2차 하향평가 단계 승인 상태를 평가자별로 변경한다 (부분 승인 지원)
   * 재작성 요청 생성 시 제출 상태 초기화를 함께 처리합니다.
   * 승인(APPROVED) 처리 시 제출 상태도 자동으로 변경합니다.
   * approveSubsequentSteps 옵션이 true인 경우 1차 하향평가와 자기평가도 함께 승인합니다.
   *
   * 각 2차 평가자별로 개별적으로 승인 상태를 관리할 수 있습니다.
   */
  @UpdateSecondaryStepApproval()
  async updateSecondaryStepApproval(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('evaluatorId', ParseUUIDPipe) evaluatorId: string,
    @Body() dto: UpdateSecondaryStepApprovalDto,
    @CurrentUser('id') updatedBy: string,
  ): Promise<UpdateSecondaryStepApprovalResponseDto> {
    console.log(`[CONTROLLER] 2차 하향평가 단계 승인 상태 변경 호출`);
    console.log(`[CONTROLLER] evaluationPeriodId: ${evaluationPeriodId}`);
    console.log(`[CONTROLLER] employeeId: ${employeeId}`);
    console.log(`[CONTROLLER] evaluatorId: ${evaluatorId}`);
    console.log(`[CONTROLLER] dto:`, JSON.stringify(dto, null, 2));
    console.log(`[CONTROLLER] updatedBy: ${updatedBy}`);

    let approval;

    // 재작성 요청 생성 시 제출 상태 초기화를 함께 처리
    if (dto.status === StepApprovalStatusEnum.REVISION_REQUESTED) {
      if (!dto.revisionComment || dto.revisionComment.trim() === '') {
        throw new BadRequestException('재작성 요청 코멘트는 필수입니다.');
      }

      // 비즈니스 서비스를 통해 제출 상태 초기화 및 재작성 요청 생성
      // 내부에서 이미 stepApprovalContextService.이차하향평가_확인상태를_변경한다를 호출함
      approval =
        await this.downwardEvaluationBusinessService.이차_하향평가_재작성요청_생성_및_제출상태_초기화(
          evaluationPeriodId,
          employeeId,
          evaluatorId,
          dto.revisionComment,
          updatedBy,
        );
    } else {
      // 승인 상태로 변경 시 제출 상태도 함께 변경
      if (dto.status === StepApprovalStatusEnum.APPROVED) {
        await this.stepApprovalBusinessService.이차_하향평가_승인_시_제출상태_변경(
          evaluationPeriodId,
          employeeId,
          evaluatorId,
          updatedBy,
        );

        // 상위 평가 자동 승인 옵션이 활성화된 경우 (1차 하향평가와 자기평가 승인)
        if (dto.approveSubsequentSteps) {
          await this.stepApprovalBusinessService.이차하향평가_승인_시_상위평가들을_승인한다(
            evaluationPeriodId,
            employeeId,
            updatedBy,
          );
        }
      }

      // 단계 승인 상태 변경 (평가자별 부분 승인 지원)
      // secondary_evaluation_step_approval 테이블에 평가자별로 개별 상태 저장
      approval =
        await this.stepApprovalBusinessService.이차하향평가_확인상태를_변경한다(
          {
            evaluationPeriodId,
            employeeId,
            evaluatorId,
            status: dto.status as any,
            revisionComment: dto.revisionComment,
            updatedBy,
          },
        );
    }

    // 응답 DTO로 변환
    const dto_result = approval.DTO로_변환한다();
    return {
      id: dto_result.id,
      evaluationPeriodEmployeeMappingId:
        dto_result.evaluationPeriodEmployeeMappingId,
      evaluatorId: dto_result.evaluatorId,
      status: dto_result.status as StepApprovalStatusEnum,
      approvedBy: dto_result.approvedBy,
      approvedAt: dto_result.approvedAt,
      revisionRequestId: dto_result.revisionRequestId,
      createdAt: dto_result.createdAt,
      updatedAt: dto_result.updatedAt,
    };
  }
}
