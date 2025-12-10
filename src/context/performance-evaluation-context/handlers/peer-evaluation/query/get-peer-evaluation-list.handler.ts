import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { PeerEvaluationQuestionMapping } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.entity';
import { EvaluationQuestion } from '@domain/sub/evaluation-question/evaluation-question.entity';
import type {
  PeerEvaluationDto,
  PeerEvaluationStatus,
} from '@domain/core/peer-evaluation/peer-evaluation.types';

/**
 * 동료평가 상세정보 조회 결과 (상세 조회와 동일)
 */
export interface PeerEvaluationDetailResult {
  // 평가 기본 정보
  id: string;
  evaluationDate: Date;
  status: string;
  isCompleted: boolean;
  completedAt?: Date;
  requestDeadline?: Date;
  mappedDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  version: number;

  // 평가기간 정보
  period: {
    id: string;
    name: string;
    startDate: Date;
    status: string;
  } | null;

  // 평가자 정보
  evaluator: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentId: string;
    status: string;
    rankName?: string;
    roles?: string[];
  } | null;

  // 평가자 부서 정보
  evaluatorDepartment: {
    id: string;
    name: string;
    code: string;
  } | null;

  // 피평가자 정보
  evaluatee: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentId: string;
    status: string;
  } | null;

  // 피평가자 부서 정보
  evaluateeDepartment: {
    id: string;
    name: string;
    code: string;
  } | null;

  // 매핑자 정보
  mappedBy: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    status: string;
  } | null;

  // 평가질문 목록
  questions: {
    id: string;
    text: string;
    minScore?: number;
    maxScore?: number;
    displayOrder: number;
    answer?: string;
    score?: number;
    answeredAt?: Date;
    answeredBy?: string;
  }[];
}

/**
 * 동료평가 목록 조회 쿼리
 */
export class GetPeerEvaluationListQuery {
  constructor(
    public readonly evaluatorId?: string,
    public readonly evaluateeId?: string,
    public readonly periodId?: string,
    public readonly status?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

/**
 * 동료평가 목록 조회 핸들러
 */
@Injectable()
@QueryHandler(GetPeerEvaluationListQuery)
export class GetPeerEvaluationListHandler
  implements IQueryHandler<GetPeerEvaluationListQuery>
{
  private readonly logger = new Logger(GetPeerEvaluationListHandler.name);

  constructor(
    @InjectRepository(PeerEvaluation)
    private readonly peerEvaluationRepository: Repository<PeerEvaluation>,
    @InjectRepository(PeerEvaluationQuestionMapping)
    private readonly questionMappingRepository: Repository<PeerEvaluationQuestionMapping>,
  ) {}

  async execute(query: GetPeerEvaluationListQuery): Promise<{
    evaluations: PeerEvaluationDetailResult[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { evaluatorId, evaluateeId, periodId, status, page, limit } = query;

    // 동료평가 목록 조회 (상세 정보 포함)
    const queryBuilder = this.peerEvaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoin(
        EvaluationPeriod,
        'period',
        'period.id = evaluation.periodId AND period.deletedAt IS NULL',
      )
      .leftJoin(
        Employee,
        'evaluator',
        'evaluator.id = evaluation.evaluatorId AND evaluator.deletedAt IS NULL',
      )
      .leftJoin(
        Department,
        'evaluatorDepartment',
        'evaluatorDepartment.externalId = evaluator.departmentId AND evaluatorDepartment.deletedAt IS NULL',
      )
      .leftJoin(
        Employee,
        'evaluatee',
        'evaluatee.id = evaluation.evaluateeId AND evaluatee.deletedAt IS NULL',
      )
      .leftJoin(
        Department,
        'evaluateeDepartment',
        'evaluateeDepartment.externalId = evaluatee.departmentId AND evaluateeDepartment.deletedAt IS NULL',
      )
      .leftJoin(
        Employee,
        'mappedByEmployee',
        '"mappedByEmployee"."id" = "evaluation"."mappedBy"::UUID AND "mappedByEmployee"."deletedAt" IS NULL',
      )
      .select([
        // 평가 정보
        'evaluation.id AS evaluation_id',
        'evaluation.evaluationDate AS evaluation_evaluationdate',
        'evaluation.status AS evaluation_status',
        'evaluation.isCompleted AS evaluation_iscompleted',
        'evaluation.completedAt AS evaluation_completedat',
        'evaluation.requestDeadline AS evaluation_requestdeadline',
        'evaluation.mappedDate AS evaluation_mappeddate',
        'evaluation.isActive AS evaluation_isactive',
        'evaluation.createdAt AS evaluation_createdat',
        'evaluation.updatedAt AS evaluation_updatedat',
        'evaluation.deletedAt AS evaluation_deletedat',
        'evaluation.version AS evaluation_version',
        // 평가기간 정보
        'period.id AS period_id',
        'period.name AS period_name',
        'period.startDate AS period_startdate',
        'period.status AS period_status',
        // 평가자 정보
        'evaluator.id AS evaluator_id',
        'evaluator.name AS evaluator_name',
        'evaluator.employeeNumber AS evaluator_employeenumber',
        'evaluator.email AS evaluator_email',
        'evaluator.departmentId AS evaluator_departmentid',
        'evaluator.status AS evaluator_status',
        'evaluator.rankName AS evaluator_rankname',
        'evaluator.roles AS evaluator_roles',
        // 평가자 부서 정보
        'evaluatorDepartment.id AS evaluatordepartment_id',
        'evaluatorDepartment.name AS evaluatordepartment_name',
        'evaluatorDepartment.code AS evaluatordepartment_code',
        // 피평가자 정보
        'evaluatee.id AS evaluatee_id',
        'evaluatee.name AS evaluatee_name',
        'evaluatee.employeeNumber AS evaluatee_employeenumber',
        'evaluatee.email AS evaluatee_email',
        'evaluatee.departmentId AS evaluatee_departmentid',
        'evaluatee.status AS evaluatee_status',
        // 피평가자 부서 정보
        'evaluateeDepartment.id AS evaluateedepartment_id',
        'evaluateeDepartment.name AS evaluateedepartment_name',
        'evaluateeDepartment.code AS evaluateedepartment_code',
        // 매핑자 정보
        'mappedByEmployee.id AS mappedby_id',
        'mappedByEmployee.name AS mappedby_name',
        'mappedByEmployee.employeeNumber AS mappedby_employeenumber',
        'mappedByEmployee.email AS mappedby_email',
        'mappedByEmployee.status AS mappedby_status',
      ])
      .where('evaluation.deletedAt IS NULL');

    // 필터 조건 적용
    if (evaluatorId) {
      queryBuilder.andWhere('evaluation.evaluatorId = :evaluatorId', {
        evaluatorId,
      });
    }

    if (evaluateeId) {
      queryBuilder.andWhere('evaluation.evaluateeId = :evaluateeId', {
        evaluateeId,
      });
    }

    if (periodId) {
      queryBuilder.andWhere('evaluation.periodId = :periodId', { periodId });
    }

    if (status) {
      queryBuilder.andWhere('evaluation.status = :status', {
        status: status as PeerEvaluationStatus,
      });
    }

    // 정렬 및 페이지네이션
    queryBuilder.orderBy('evaluation.createdAt', 'DESC');

    if (page && limit) {
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);
    }

    const evaluations = await queryBuilder.getRawMany();

    // 각 평가에 대해 질문 정보 조회
    const evaluationsWithQuestions: PeerEvaluationDetailResult[] = [];

    for (const evaluation of evaluations) {
      // 평가질문 조회 (답변 정보 포함)
      const questions = await this.questionMappingRepository
        .createQueryBuilder('mapping')
        .leftJoin(
          EvaluationQuestion,
          'question',
          'question.id = mapping.questionId AND question.deletedAt IS NULL',
        )
        .select([
          'mapping.displayOrder AS displayorder',
          'mapping.answer AS mapping_answer',
          'mapping.score AS mapping_score',
          'mapping.answeredAt AS mapping_answeredat',
          'mapping.answeredBy AS mapping_answeredby',
          'question.id AS question_id',
          'question.text AS question_text',
          'question.minScore AS question_minscore',
          'question.maxScore AS question_maxscore',
        ])
        .where('mapping.peerEvaluationId = :evaluationId', {
          evaluationId: evaluation.evaluation_id,
        })
        .andWhere('mapping.deletedAt IS NULL')
        .orderBy('mapping.displayOrder', 'ASC')
        .getRawMany();

      evaluationsWithQuestions.push({
        id: evaluation.evaluation_id,
        evaluationDate: evaluation.evaluation_evaluationdate,
        status: evaluation.evaluation_status,
        isCompleted: evaluation.evaluation_iscompleted,
        completedAt: evaluation.evaluation_completedat,
        requestDeadline: evaluation.evaluation_requestdeadline,
        mappedDate: evaluation.evaluation_mappeddate,
        isActive: evaluation.evaluation_isactive,
        createdAt: evaluation.evaluation_createdat,
        updatedAt: evaluation.evaluation_updatedat,
        deletedAt: evaluation.evaluation_deletedat,
        version: evaluation.evaluation_version,

        period: evaluation.period_id
          ? {
              id: evaluation.period_id,
              name: evaluation.period_name,
              startDate: evaluation.period_startdate,
              status: evaluation.period_status,
            }
          : null,

        evaluator: evaluation.evaluator_id
          ? {
              id: evaluation.evaluator_id,
              name: evaluation.evaluator_name,
              employeeNumber: evaluation.evaluator_employeenumber,
              email: evaluation.evaluator_email,
              departmentId: evaluation.evaluator_departmentid,
              status: evaluation.evaluator_status,
              rankName: evaluation.evaluator_rankname || '',
              roles: evaluation.evaluator_roles || [],
            }
          : null,

        evaluatorDepartment: evaluation.evaluatordepartment_id
          ? {
              id: evaluation.evaluatordepartment_id,
              name: evaluation.evaluatordepartment_name,
              code: evaluation.evaluatordepartment_code,
            }
          : null,

        evaluatee: evaluation.evaluatee_id
          ? {
              id: evaluation.evaluatee_id,
              name: evaluation.evaluatee_name,
              employeeNumber: evaluation.evaluatee_employeenumber,
              email: evaluation.evaluatee_email,
              departmentId: evaluation.evaluatee_departmentid,
              status: evaluation.evaluatee_status,
            }
          : null,

        evaluateeDepartment: evaluation.evaluateedepartment_id
          ? {
              id: evaluation.evaluateedepartment_id,
              name: evaluation.evaluateedepartment_name,
              code: evaluation.evaluateedepartment_code,
            }
          : null,

        mappedBy: evaluation.mappedby_id
          ? {
              id: evaluation.mappedby_id,
              name: evaluation.mappedby_name,
              employeeNumber: evaluation.mappedby_employeenumber,
              email: evaluation.mappedby_email,
              status: evaluation.mappedby_status,
            }
          : null,

        questions: questions.map((q) => ({
          id: q.question_id,
          text: q.question_text,
          minScore: q.question_minscore,
          maxScore: q.question_maxscore,
          displayOrder: q.displayorder,
          answer: q.mapping_answer,
          score: q.mapping_score,
          answeredAt: q.mapping_answeredat,
          answeredBy: q.mapping_answeredby,
        })),
      });
    }

    const result = {
      evaluations: evaluationsWithQuestions,
      total: evaluationsWithQuestions.length,
      page,
      limit,
    };

    return result;
  }
}
