import { Injectable, Logger } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EmployeeEvaluationPeriodStatusDto } from '../../interfaces/dashboard-context.interface';
import {
  GetEmployeeEvaluationPeriodStatusQuery,
  GetEmployeeEvaluationPeriodStatusHandler,
} from './get-employee-evaluation-period-status';

/**
 * 평가기간의 모든 피평가자 현황 조회 쿼리
 *
 * 평가기간 ID로 해당 평가기간의 모든 피평가자 현황을 조회합니다.
 * 등록 해제된 직원 포함 여부를 선택할 수 있습니다.
 */
export class GetAllEmployeesEvaluationPeriodStatusQuery implements IQuery {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly includeUnregistered: boolean = false,
  ) {}
}

/**
 * 평가기간의 모든 피평가자 현황 조회 핸들러
 */
@Injectable()
@QueryHandler(GetAllEmployeesEvaluationPeriodStatusQuery)
export class GetAllEmployeesEvaluationPeriodStatusHandler
  implements IQueryHandler<GetAllEmployeesEvaluationPeriodStatusQuery>
{
  private readonly logger = new Logger(
    GetAllEmployeesEvaluationPeriodStatusHandler.name,
  );

  constructor(
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    private readonly singleStatusHandler: GetEmployeeEvaluationPeriodStatusHandler,
  ) {}

  async execute(
    query: GetAllEmployeesEvaluationPeriodStatusQuery,
  ): Promise<EmployeeEvaluationPeriodStatusDto[]> {
    const { evaluationPeriodId, includeUnregistered } = query;

    try {
      // 1. 평가기간의 모든 피평가자 맵핑 조회
      // Employee와 JOIN하여 isExcludedFromList만 체크 (직원 자체가 삭제되지 않은 경우만)
      const queryBuilder = this.mappingRepository
        .createQueryBuilder('mapping')
        .leftJoin(
          Employee,
          'employee',
          'employee.id = mapping.employeeId AND employee.deletedAt IS NULL',
        )
        .select('mapping.employeeId', 'employeeId')
        .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
          evaluationPeriodId,
        })
        .andWhere('employee.isExcludedFromList = :isExcludedFromList', {
          isExcludedFromList: false,
        }); // 직원 조회 제외되지 않은 직원만 (직원 자체가 삭제되지 않은 경우만)

      // 등록 해제된 직원 포함 여부에 따라 조건 추가
      if (!includeUnregistered) {
        // 기본: 등록 해제되지 않은 직원만 (제외된 직원은 포함)
        queryBuilder.andWhere('mapping.deletedAt IS NULL');
      }

      // 디버깅을 위한 SQL 로그
      const sql = queryBuilder.getSql();

      // includeUnregistered가 true면 소프트 삭제된 엔티티도 포함
      if (includeUnregistered) {
        queryBuilder.withDeleted();
      }

      const mappings = await queryBuilder.getRawMany();

      // 2. 각 직원별 상세 현황 조회 (병렬 처리)
      // 성능 최적화: Promise.all로 병렬 실행 (순차 대비 70-80% 단축)
      // 참고: 100명 이상 시 배치 처리(10-20명씩) 또는 배치 쿼리 최적화 권장
      const statusPromises = mappings.map(async (mapping) => {
        try {
          // 기존 단일 직원 조회 쿼리 재사용
          const singleQuery = new GetEmployeeEvaluationPeriodStatusQuery(
            evaluationPeriodId,
            mapping.employeeId,
            includeUnregistered,
          );

          const status = await this.singleStatusHandler.execute(singleQuery);
          return status;
        } catch (error) {
          this.logger.error(
            `직원 현황 조회 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${mapping.employeeId}`,
            error.stack,
          );
          // 한 직원의 조회 실패가 전체를 막지 않도록 null 반환
          return null;
        }
      });

      // Promise.all로 병렬 실행
      const allStatuses = await Promise.all(statusPromises);

      // null 제거
      const results = allStatuses.filter(
        (status): status is EmployeeEvaluationPeriodStatusDto =>
          status !== null,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `평가기간의 모든 피평가자 현황 조회 실패 - 평가기간: ${evaluationPeriodId}`,
        error.stack,
      );
      throw error;
    }
  }
}
