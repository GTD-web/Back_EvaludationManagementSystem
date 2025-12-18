import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IWbsSelfEvaluation } from './interfaces/wbs-self-evaluation.interface';
import type {
  WbsSelfEvaluationDto,
  CreateWbsSelfEvaluationData,
} from './wbs-self-evaluation.types';

/**
 * WBS 자가평가 엔티티
 * 직원이 특정 WBS 항목에 대해 수행한 자가평가를 관리합니다.
 */
@Entity('wbs_self_evaluation')
@Index(['evaluationDate'])
@Index(['periodId', 'employeeId'])
@Index(['periodId', 'wbsItemId'])
@Index(['employeeId', 'wbsItemId'])
@Index(['assignedDate'])
export class WbsSelfEvaluation
  extends BaseEntity<WbsSelfEvaluationDto>
  implements IWbsSelfEvaluation
{
  @Column({
    type: 'uuid',
    comment: '평가 기간 ID',
  })
  periodId: string;

  @Column({
    type: 'uuid',
    comment: '직원 ID',
  })
  employeeId: string;

  @Column({
    type: 'uuid',
    comment: 'WBS 항목 ID',
  })
  wbsItemId: string;

  @Column({
    type: 'uuid',
    comment: '할당자 ID',
  })
  assignedBy: string;

  @Column({
    type: 'timestamp with time zone',
    comment: '할당일',
  })
  assignedDate: Date;

  @Column({
    type: 'boolean',
    default: false,
    comment: '피평가자가 1차 평가자에게 제출한 여부',
  })
  submittedToEvaluator: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '1차 평가자에게 제출한 일시',
  })
  submittedToEvaluatorAt?: Date;

  @Column({
    type: 'boolean',
    default: false,
    comment: '1차 평가자가 관리자에게 제출한 여부',
  })
  submittedToManager: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '관리자에게 제출한 일시',
  })
  submittedToManagerAt?: Date;

  @Column({
    type: 'timestamp with time zone',
    comment: '평가일',
  })
  evaluationDate: Date;

  @Column({
    type: 'text',
    nullable: true,
    comment: '성과 입력 (실제 달성한 성과 및 결과)',
  })
  performanceResult?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '자가평가 내용',
  })
  selfEvaluationContent?: string;

  @Column({
    type: 'integer',
    nullable: true,
    comment: '자가평가 점수',
  })
  selfEvaluationScore?: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: '세부 프로젝트 (서브 프로젝트)',
  })
  subProject?: string | null;

  constructor(data?: CreateWbsSelfEvaluationData) {
    super();
    if (data) {
      this.periodId = data.periodId;
      this.employeeId = data.employeeId;
      this.wbsItemId = data.wbsItemId;
      this.assignedBy = data.assignedBy;
      this.assignedDate = new Date();
      this.submittedToEvaluator = false;
      this.submittedToManager = false;
      this.performanceResult = data.performanceResult;
      this.selfEvaluationContent = data.selfEvaluationContent;
      this.selfEvaluationScore = data.selfEvaluationScore;
      this.subProject = data.subProject;
      this.evaluationDate = new Date();

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 특정 평가기간에 속하는지 확인한다
   */
  평가기간과_일치하는가(periodId: string): boolean {
    return this.periodId === periodId;
  }

  /**
   * 특정 직원의 자가평가인지 확인한다
   */
  해당_직원의_자가평가인가(employeeId: string): boolean {
    return this.employeeId === employeeId;
  }

  /**
   * 특정 WBS 항목의 자가평가인지 확인한다
   */
  해당_WBS항목의_자가평가인가(wbsItemId: string): boolean {
    return this.wbsItemId === wbsItemId;
  }

  /**
   * 피평가자가 1차 평가자에게 제출한다
   */
  피평가자가_1차평가자에게_제출한다(): void {
    this.submittedToEvaluator = true;
    this.submittedToEvaluatorAt = new Date();
  }

  /**
   * 1차 평가자가 관리자에게 제출한다
   * 관리자에게 제출할 때는 평가자에게도 제출한 것으로 간주한다
   */
  일차평가자가_관리자에게_제출한다(): void {
    // 평가자에게 제출하지 않았으면 자동으로 제출한 것으로 설정
    if (!this.submittedToEvaluator) {
      this.submittedToEvaluator = true;
      this.submittedToEvaluatorAt = new Date();
    }
    this.submittedToManager = true;
    this.submittedToManagerAt = new Date();
  }

  /**
   * 피평가자 제출을 취소한다 (제출 상태만 false로 변경, submittedToEvaluatorAt은 유지)
   */
  피평가자_제출을_취소한다(): void {
    this.submittedToEvaluator = false;
    // Reset 시에는 submittedToEvaluatorAt을 초기화하지 않고 유지
  }

  /**
   * 피평가자 제출을 완전히 초기화한다 (제출 상태와 제출 일시 모두 초기화)
   * 재작성 요청 생성 시 사용됩니다.
   */
  피평가자_제출을_완전히_초기화한다(): void {
    this.submittedToEvaluator = false;
    this.submittedToEvaluatorAt = null as any;
  }

  /**
   * 1차 평가자 제출을 취소한다 (제출 상태만 false로 변경, submittedToManagerAt은 유지)
   */
  일차평가자_제출을_취소한다(): void {
    this.submittedToManager = false;
    // Reset 시에는 submittedToManagerAt을 초기화하지 않고 유지
  }

  /**
   * 1차 평가자 제출을 완전히 초기화한다 (제출 상태와 제출 일시 모두 초기화)
   * 재작성 요청 생성 시 사용됩니다.
   */
  일차평가자_제출을_완전히_초기화한다(): void {
    this.submittedToManager = false;
    this.submittedToManagerAt = null as any;
  }

  /**
   * 피평가자가 1차 평가자에게 제출했는지 확인한다
   */
  피평가자가_1차평가자에게_제출했는가(): boolean {
    return this.submittedToEvaluator;
  }

  /**
   * 1차 평가자가 관리자에게 제출했는지 확인한다
   */
  일차평가자가_관리자에게_제출했는가(): boolean {
    return this.submittedToManager;
  }

  /**
   * 자가평가 점수가 유효한 범위인지 확인한다
   * @param maxScore 최대 점수 (평가기간의 maxSelfEvaluationRate)
   */
  점수가_유효한가(maxScore: number): boolean {
    if (
      this.selfEvaluationScore === undefined ||
      this.selfEvaluationScore === null
    ) {
      return true; // 점수가 없으면 유효한 것으로 간주 (선택 사항이므로)
    }
    return (
      this.selfEvaluationScore >= 0 && this.selfEvaluationScore <= maxScore
    );
  }

  /**
   * 자가평가를 수정한다
   */
  자가평가를_수정한다(
    content?: string,
    score?: number,
    performanceResult?: string,
    subProject?: string | null,
    updatedBy?: string,
  ): void {
    if (content !== undefined) {
      this.selfEvaluationContent = content;
    }
    if (score !== undefined) {
      this.selfEvaluationScore = score;
    }
    if (performanceResult !== undefined) {
      this.performanceResult = performanceResult;
    }
    if (subProject !== undefined) {
      this.subProject = subProject;
    }
    this.evaluationDate = new Date();

    if (updatedBy) {
      this.메타데이터를_업데이트한다(updatedBy);
    }
  }

  /**
   * 자가평가 내용을 초기화한다 (빈 문자열과 0점으로 설정)
   */
  자가평가_내용을_초기화한다(updatedBy?: string): void {
    // Clear 시: 내용은 빈 문자열(""), 점수는 0점으로 설정
    this.selfEvaluationContent = '';
    this.selfEvaluationScore = 0;
    this.performanceResult = null as any;
    this.submittedToEvaluator = false;
    this.submittedToEvaluatorAt = null as any;
    this.submittedToManager = false;
    this.submittedToManagerAt = null as any;
    this.evaluationDate = new Date();

    if (updatedBy) {
      this.메타데이터를_업데이트한다(updatedBy);
    }
  }

  /**
   * 자가평가를 삭제한다
   */
  삭제한다(): void {
    this.deletedAt = new Date();
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): WbsSelfEvaluationDto {
    return {
      id: this.id,
      periodId: this.periodId,
      employeeId: this.employeeId,
      wbsItemId: this.wbsItemId,
      assignedBy: this.assignedBy,
      assignedDate: this.assignedDate,
      submittedToEvaluator: this.submittedToEvaluator,
      submittedToEvaluatorAt: this.submittedToEvaluatorAt,
      submittedToManager: this.submittedToManager,
      submittedToManagerAt: this.submittedToManagerAt,
      evaluationDate: this.evaluationDate,
      performanceResult: this.performanceResult,
      selfEvaluationContent: this.selfEvaluationContent,
      selfEvaluationScore: this.selfEvaluationScore,
      subProject: this.subProject,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      version: this.version,
    };
  }
}
