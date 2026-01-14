import {
  Controller,
  Body,
  Param,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WbsSelfEvaluationBusinessService } from '@business/wbs-self-evaluation/wbs-self-evaluation-business.service';
import { DownwardEvaluationBusinessService } from '@business/downward-evaluation/downward-evaluation-business.service';
import { StepApprovalBusinessService } from '@business/step-approval/step-approval-business.service';
import { CreateRevisionRequestDto } from '@interface/common/dto/step-approval/create-revision-request.dto';
import {
  RequestCriteriaRevision,
  RequestSelfRevision,
  RequestPrimaryRevision,
  RequestSecondaryRevision,
} from '@interface/common/decorators/step-approval/revision-request-api.decorators';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { Roles } from '@interface/common/decorators';

/**
 * 재작성 요청 컨트롤러
 * 평가 단계별 재작성 요청 생성 API를 제공합니다.
 * 재작성 요청 생성 시 알림은 전송되지 않습니다.
 */
@ApiTags('A-0-4. 평가자 - 재작성 요청')
@ApiBearerAuth('Bearer')
@Roles('evaluator')
@Controller('evaluator/step-revision-requests')
export class EvaluatorStepRevisionRequestController {
  constructor(
    private readonly wbsSelfEvaluationBusinessService: WbsSelfEvaluationBusinessService,
    private readonly downwardEvaluationBusinessService: DownwardEvaluationBusinessService,
    private readonly stepApprovalBusinessService: StepApprovalBusinessService,
  ) {}

  /**
   * 평가기준 설정 재작성 요청을 생성한다
   */
  @RequestCriteriaRevision()
  async requestCriteriaRevision(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: CreateRevisionRequestDto,
    @CurrentUser('id') requestedBy: string,
  ): Promise<void> {
    console.log(`[CONTROLLER] 평가기준 설정 재작성 요청 생성 호출`);
    console.log(`[CONTROLLER] evaluationPeriodId: ${evaluationPeriodId}`);
    console.log(`[CONTROLLER] employeeId: ${employeeId}`);
    console.log(`[CONTROLLER] dto:`, JSON.stringify(dto, null, 2));
    console.log(`[CONTROLLER] requestedBy: ${requestedBy}`);

    // 재작성 요청 코멘트 검증
    if (!dto.revisionComment || dto.revisionComment.trim() === '') {
      throw new BadRequestException('재작성 요청 코멘트는 필수입니다.');
    }

    // 비즈니스 서비스를 통해 재작성 요청 생성 및 제출 상태 초기화
    await this.stepApprovalBusinessService.평가기준설정_재작성요청_생성_및_제출상태_초기화(
      evaluationPeriodId,
      employeeId,
      dto.revisionComment,
      requestedBy,
    );
  }

  /**
   * 자기평가 재작성 요청을 생성한다
   */
  @RequestSelfRevision()
  async requestSelfRevision(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: CreateRevisionRequestDto,
    @CurrentUser('id') requestedBy: string,
  ): Promise<void> {
    console.log(`[CONTROLLER] 자기평가 재작성 요청 생성 호출`);
    console.log(`[CONTROLLER] evaluationPeriodId: ${evaluationPeriodId}`);
    console.log(`[CONTROLLER] employeeId: ${employeeId}`);
    console.log(`[CONTROLLER] dto:`, JSON.stringify(dto, null, 2));
    console.log(`[CONTROLLER] requestedBy: ${requestedBy}`);

    // 재작성 요청 코멘트 검증
    if (!dto.revisionComment || dto.revisionComment.trim() === '') {
      throw new BadRequestException('재작성 요청 코멘트는 필수입니다.');
    }

    // 비즈니스 서비스를 통해 재작성 요청 생성 및 제출 상태 초기화
    await this.wbsSelfEvaluationBusinessService.자기평가_재작성요청_생성_및_제출상태_초기화(
      evaluationPeriodId,
      employeeId,
      dto.revisionComment,
      requestedBy,
    );
  }

  /**
   * 1차 하향평가 재작성 요청을 생성한다
   */
  @RequestPrimaryRevision()
  async requestPrimaryRevision(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: CreateRevisionRequestDto,
    @CurrentUser('id') requestedBy: string,
  ): Promise<void> {
    console.log(`[CONTROLLER] 1차 하향평가 재작성 요청 생성 호출`);
    console.log(`[CONTROLLER] evaluationPeriodId: ${evaluationPeriodId}`);
    console.log(`[CONTROLLER] employeeId: ${employeeId}`);
    console.log(`[CONTROLLER] dto:`, JSON.stringify(dto, null, 2));
    console.log(`[CONTROLLER] requestedBy: ${requestedBy}`);

    // 재작성 요청 코멘트 검증
    if (!dto.revisionComment || dto.revisionComment.trim() === '') {
      throw new BadRequestException('재작성 요청 코멘트는 필수입니다.');
    }

    // 비즈니스 서비스를 통해 재작성 요청 생성 및 제출 상태 초기화
    await this.downwardEvaluationBusinessService.일차_하향평가_재작성요청_생성_및_제출상태_초기화(
      evaluationPeriodId,
      employeeId,
      dto.revisionComment,
      requestedBy,
    );
  }

  /**
   * 2차 하향평가 재작성 요청을 생성한다 (평가자별)
   */
  @RequestSecondaryRevision()
  async requestSecondaryRevision(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('evaluatorId', ParseUUIDPipe) evaluatorId: string,
    @Body() dto: CreateRevisionRequestDto,
    @CurrentUser('id') requestedBy: string,
  ): Promise<void> {
    console.log(`[CONTROLLER] 2차 하향평가 재작성 요청 생성 호출`);
    console.log(`[CONTROLLER] evaluationPeriodId: ${evaluationPeriodId}`);
    console.log(`[CONTROLLER] employeeId: ${employeeId}`);
    console.log(`[CONTROLLER] evaluatorId: ${evaluatorId}`);
    console.log(`[CONTROLLER] dto:`, JSON.stringify(dto, null, 2));
    console.log(`[CONTROLLER] requestedBy: ${requestedBy}`);

    // 재작성 요청 코멘트 검증
    if (!dto.revisionComment || dto.revisionComment.trim() === '') {
      throw new BadRequestException('재작성 요청 코멘트는 필수입니다.');
    }

    // 비즈니스 서비스를 통해 재작성 요청 생성 및 제출 상태 초기화
    await this.downwardEvaluationBusinessService.이차_하향평가_재작성요청_생성_및_제출상태_초기화(
      evaluationPeriodId,
      employeeId,
      evaluatorId,
      dto.revisionComment,
      requestedBy,
    );
  }
}
