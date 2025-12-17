import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import * as ExcelJS from 'exceljs';
import {
  IDashboardContext,
  EmployeeEvaluationPeriodStatusDto,
  MyEvaluationTargetStatusDto,
} from './interfaces/dashboard-context.interface';
import {
  GetEmployeeEvaluationPeriodStatusQuery,
  GetAllEmployeesEvaluationPeriodStatusQuery,
  GetMyEvaluationTargetsStatusQuery,
  GetEmployeeAssignedDataQuery,
  EmployeeAssignedDataResult,
  GetEvaluatorAssignedEmployeesDataQuery,
  EvaluatorAssignedEmployeesDataResult,
  GetFinalEvaluationsByPeriodQuery,
  FinalEvaluationByPeriodResult,
  GetFinalEvaluationsByEmployeeQuery,
  FinalEvaluationByEmployeeResult,
  GetAllEmployeesFinalEvaluationsQuery,
  AllEmployeesFinalEvaluationResult,
} from './handlers/queries';
import type { DepartmentHierarchyWithEmployeesDto } from '@context/organization-management-context';
import type { DepartmentNode } from '@domain/common/sso/interfaces';

/**
 * 대시보드 서비스
 *
 * 평가 관련 대시보드 정보를 제공하는 서비스입니다.
 * CQRS 패턴을 사용하여 쿼리를 처리합니다.
 */
@Injectable()
export class DashboardService implements IDashboardContext {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * 직원의 평가기간 현황을 조회한다
   */
  async 직원의_평가기간_현황을_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<EmployeeEvaluationPeriodStatusDto | null> {
    const query = new GetEmployeeEvaluationPeriodStatusQuery(
      evaluationPeriodId,
      employeeId,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 평가기간의 모든 피평가자 현황을 조회한다
   */
  async 평가기간의_모든_피평가자_현황을_조회한다(
    evaluationPeriodId: string,
    includeUnregistered: boolean = false,
  ): Promise<EmployeeEvaluationPeriodStatusDto[]> {
    const query = new GetAllEmployeesEvaluationPeriodStatusQuery(
      evaluationPeriodId,
      includeUnregistered,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 내가 담당하는 평가 대상자 현황을 조회한다
   */
  async 내가_담당하는_평가대상자_현황을_조회한다(
    evaluationPeriodId: string,
    evaluatorId: string,
  ): Promise<MyEvaluationTargetStatusDto[]> {
    const query = new GetMyEvaluationTargetsStatusQuery(
      evaluationPeriodId,
      evaluatorId,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 사용자 할당 정보를 조회한다
   *
   * 특정 직원의 평가기간 내 할당된 프로젝트, WBS, 평가기준, 성과, 자기평가 정보를 조회합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 조회할 직원 ID (피평가자)
   * @param viewerId 조회하는 사람의 ID (평가자 확인용, optional)
   */
  async 사용자_할당_정보를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
    viewerId?: string,
  ): Promise<EmployeeAssignedDataResult> {
    const query = new GetEmployeeAssignedDataQuery(
      evaluationPeriodId,
      employeeId,
      viewerId,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 담당자의 피평가자 할당 정보를 조회한다
   *
   * 평가자가 담당하는 특정 피평가자의 평가기간 내 할당된 프로젝트, WBS, 평가기준, 성과, 자기평가, 하향평가 정보를 조회합니다.
   */
  async 담당자의_피평가자_할당_정보를_조회한다(
    evaluationPeriodId: string,
    evaluatorId: string,
    employeeId: string,
  ): Promise<EvaluatorAssignedEmployeesDataResult> {
    const query = new GetEvaluatorAssignedEmployeesDataQuery(
      evaluationPeriodId,
      evaluatorId,
      employeeId,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 평가기간별 최종평가 목록을 조회한다
   *
   * 특정 평가기간에 등록된 모든 직원의 최종평가를 조회합니다.
   * 제외된 직원은 결과에서 제외됩니다.
   */
  async 평가기간별_최종평가_목록을_조회한다(
    evaluationPeriodId: string,
  ): Promise<FinalEvaluationByPeriodResult[]> {
    const query = new GetFinalEvaluationsByPeriodQuery(evaluationPeriodId);
    return await this.queryBus.execute(query);
  }

  /**
   * 직원별 최종평가 목록을 조회한다
   *
   * 특정 직원의 모든 평가기간에 대한 최종평가를 조회합니다.
   * 날짜 범위를 지정하여 특정 기간의 평가만 조회할 수 있습니다.
   */
  async 직원별_최종평가_목록을_조회한다(
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<FinalEvaluationByEmployeeResult[]> {
    const query = new GetFinalEvaluationsByEmployeeQuery(
      employeeId,
      startDate,
      endDate,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 전체_직원별_최종평가_목록을_조회한다
   *
   * 모든 직원의 최종평가를 조회합니다.
   * 날짜 범위를 지정하여 특정 기간의 평가만 조회할 수 있습니다.
   * 제외된 직원은 결과에서 자동으로 제외됩니다.
   */
  async 전체_직원별_최종평가_목록을_조회한다(
    startDate?: Date,
    endDate?: Date,
  ): Promise<AllEmployeesFinalEvaluationResult[]> {
    const query = new GetAllEmployeesFinalEvaluationsQuery(startDate, endDate);
    return await this.queryBus.execute(query);
  }

  /**
   * 직원 현황을 엑셀로 생성한다
   *
   * 직원 평가 현황 데이터를 엑셀 파일로 변환합니다.
   */
  async 직원_현황을_엑셀로_생성한다(
    data: EmployeeEvaluationPeriodStatusDto[],
    periodName: string,
    departmentHierarchy: DepartmentHierarchyWithEmployeesDto[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('평가 현황');

    // 상태 텍스트 변환 함수
    const getStatusText = (status: string): string => {
      const statusMap: Record<string, string> = {
        none: '미설정',
        in_progress: '진행중',
        complete: '완료',
        pending: '대기',
        approved: '승인',
        revision_requested: '재작성 요청',
        revision_completed: '재작성 완료',
      };
      return statusMap[status] || status;
    };

    // 부서 하이라키에서 부서 순서 정보 추출
    interface DepartmentOrderInfo {
      departmentName: string;
      order: number;
      parentOrder: number; // 상위 부서(본부)의 order
      level: number;
    }

    const departmentOrderMap = new Map<string, DepartmentOrderInfo>();
    let globalOrder = 0;

    // 재귀적으로 부서 계층 구조를 순회하며 순서 정보 수집
    const collectDepartmentOrders = (
      departments: DepartmentHierarchyWithEmployeesDto[],
      parentOrder: number = 0,
    ) => {
      departments.forEach((dept) => {
        globalOrder++;
        departmentOrderMap.set(dept.name, {
          departmentName: dept.name,
          order: dept.order,
          parentOrder: parentOrder,
          level: dept.level,
        });

        // 하위 부서 처리
        if (dept.subDepartments && dept.subDepartments.length > 0) {
          collectDepartmentOrders(dept.subDepartments, dept.order);
        }
      });
    };

    collectDepartmentOrders(departmentHierarchy);

    // 데이터를 부서별로 그룹화
    const groupedData: Record<string, EmployeeEvaluationPeriodStatusDto[]> = {};

    data.forEach((item) => {
      const deptName = item.employee?.departmentName || '기타';

      if (!groupedData[deptName]) {
        groupedData[deptName] = [];
      }
      groupedData[deptName].push(item);
    });

    // 부서를 하이라키 순서대로 정렬
    const sortedDepartments = Object.keys(groupedData).sort((a, b) => {
      // '기타'는 항상 맨 뒤로
      if (a === '기타') return 1;
      if (b === '기타') return -1;

      const infoA = departmentOrderMap.get(a);
      const infoB = departmentOrderMap.get(b);

      if (!infoA || !infoB) {
        return a.localeCompare(b, 'ko');
      }

      // 상위 부서(본부) order로 먼저 정렬
      if (infoA.parentOrder !== infoB.parentOrder) {
        return infoA.parentOrder - infoB.parentOrder;
      }

      // 같은 본부 내에서는 부서 order로 정렬
      if (infoA.order !== infoB.order) {
        return infoA.order - infoB.order;
      }

      // order가 같으면 이름순
      return a.localeCompare(b, 'ko');
    });

    // 각 부서 내에서 직원 이름순 정렬
    for (const department of Object.keys(groupedData)) {
      groupedData[department].sort((a, b) => {
        return (a.employee?.name || '').localeCompare(
          b.employee?.name || '',
          'ko',
        );
      });
    }

    // 헤더 스타일 정의
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF4472C4' },
      },
      alignment: {
        vertical: 'middle' as const,
        horizontal: 'center' as const,
      },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const },
      },
    };

    // 부서명 스타일 정의 (병합된 셀용)
    const departmentMergedStyle = {
      font: { bold: true, color: { argb: 'FF000000' } },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FFD9E1F2' },
      },
      alignment: {
        vertical: 'middle' as const,
        horizontal: 'center' as const,
      },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const },
      },
    };

    // 헤더 행 추가
    const headerRow = worksheet.addRow([
      '부서',
      '이름',
      '직급',
      '1차 평가자',
      '2차 평가자',
      '재임여부',
      '평가선정',
      '자기평가',
      '1차평가',
      '2차평가',
      '동료평가',
      '최종평가',
    ]);

    // 헤더 스타일 적용
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });

    // 열 너비 설정
    worksheet.columns = [
      { key: 'department', width: 18 },
      { key: 'name', width: 12 },
      { key: 'rank', width: 10 },
      { key: 'primaryEvaluator', width: 15 },
      { key: 'secondaryEvaluator', width: 20 },
      { key: 'status', width: 10 },
      { key: 'selection', width: 12 },
      { key: 'selfEval', width: 30 },
      { key: 'primaryEval', width: 30 },
      { key: 'secondaryEval', width: 30 },
      { key: 'peerEval', width: 15 },
      { key: 'finalEval', width: 20 },
    ];

    // 데이터 행 추가 (부서별로 그룹화)
    sortedDepartments.forEach((department) => {
      const departmentData = groupedData[department];
      if (!departmentData || departmentData.length === 0) {
        return;
      }

      const departmentStartRow = worksheet.rowCount + 1;

      departmentData.forEach((item) => {
        // 평가자 정보 구성
        const primaryEvaluator =
          item.downwardEvaluation.primary.evaluator?.name || '-';
        const secondaryEvaluators =
          item.downwardEvaluation.secondary.evaluators
            .map((e) => e.evaluator.name)
            .join(', ') || '-';

        // 자기평가 정보
        const selfEvalStatus = getStatusText(item.selfEvaluation.status);
        const selfEvalScore =
          item.selfEvaluation.totalScore !== null
            ? `${item.selfEvaluation.totalScore.toFixed(1)}점`
            : '-';
        const selfEvalGrade = item.selfEvaluation.grade || '-';
        const selfEvalInfo = `${selfEvalStatus} (${selfEvalScore} / ${selfEvalGrade})`;

        // 1차평가 정보
        const primaryStatus = getStatusText(
          item.downwardEvaluation.primary.status,
        );
        const primaryScore =
          item.downwardEvaluation.primary.totalScore !== null
            ? `${item.downwardEvaluation.primary.totalScore.toFixed(1)}점`
            : '-';
        const primaryGrade = item.downwardEvaluation.primary.grade || '-';
        const primaryInfo = `${primaryStatus} (${primaryScore} / ${primaryGrade})`;

        // 2차평가 정보
        const secondaryStatus = getStatusText(
          item.downwardEvaluation.secondary.status,
        );
        const secondaryScore =
          item.downwardEvaluation.secondary.totalScore !== null
            ? `${item.downwardEvaluation.secondary.totalScore.toFixed(1)}점`
            : '-';
        const secondaryGrade = item.downwardEvaluation.secondary.grade || '-';
        const secondaryInfo = `${secondaryStatus} (${secondaryScore} / ${secondaryGrade})`;

        // 동료평가 정보
        const peerStatus = getStatusText(item.peerEvaluation.status);
        const peerInfo = `${peerStatus} (${item.peerEvaluation.completedRequestCount}/${item.peerEvaluation.totalRequestCount})`;

        // 최종평가 정보
        const finalGrade = item.finalEvaluation.evaluationGrade || '-';
        const finalJobGrade = item.finalEvaluation.jobGrade || '-';
        const finalJobDetailedGrade =
          item.finalEvaluation.jobDetailedGrade || '-';
        const finalInfo = `${finalGrade} (${finalJobGrade}${finalJobDetailedGrade})`;

        const row = worksheet.addRow({
          department: item.employee?.departmentName || '-',
          name: item.employee?.name || '-',
          rank: item.employee?.rankName || '-',
          primaryEvaluator: primaryEvaluator,
          secondaryEvaluator: secondaryEvaluators,
          status: item.employee?.status || '-',
          selection: item.isEvaluationTarget ? '포함' : '제외',
          selfEval: selfEvalInfo,
          primaryEval: primaryInfo,
          secondaryEval: secondaryInfo,
          peerEval: peerInfo,
          finalEval: finalInfo,
        });

        // 데이터 행 스타일
        row.eachCell((cell, colNumber) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        // 평가 대상이 아닌 경우 회색 배경 (부서 컬럼 제외한 나머지 컬럼)
        if (!item.isEvaluationTarget) {
          row.eachCell((cell, colNumber) => {
            if (colNumber > 1) {
              // 부서 이후의 컬럼만
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE7E6E6' },
              };
            }
          });
        }
      });

      // 부서명 셀 병합 (세로 병합) - 1번째 컬럼
      const departmentEndRow = worksheet.rowCount;
      if (departmentStartRow <= departmentEndRow) {
        worksheet.mergeCells(departmentStartRow, 1, departmentEndRow, 1);

        // 병합된 부서명 셀 스타일 적용
        const mergedCell = worksheet.getCell(departmentStartRow, 1);
        mergedCell.style = departmentMergedStyle;
      }
    });

    // 엑셀 파일을 버퍼로 변환
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
