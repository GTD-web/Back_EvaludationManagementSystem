import { DepartmentDto } from '../../../domain/common/department/department.types';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';

/**
 * 조직 관리 컨텍스트 인터페이스
 *
 * 부서와 직원 정보를 조회하는 비즈니스 로직을 정의합니다.
 * 조직 구조 조회, 직원 관계 조회 등의 기능을 제공합니다.
 */
export interface IOrganizationManagementContext {
  /**
   * 모든 부서 목록을 조회합니다
   * @returns 전체 부서 목록
   */
  전체부서목록조회(): Promise<DepartmentDto[]>;

  /**
   * 부서 정보를 조회합니다
   * @param departmentId 부서 ID
   * @returns 부서 정보
   */
  부서정보조회(departmentId: string): Promise<DepartmentDto | null>;

  /**
   * 부서별 직원 목록을 조회합니다
   * @param departmentId 부서 ID
   * @returns 해당 부서의 직원 목록
   */
  부서별직원목록조회(departmentId: string): Promise<EmployeeDto[]>;

  /**
   * 조직도를 조회합니다
   * @returns 전체 조직 구조
   */
  조직도조회(): Promise<OrganizationChartDto>;

  /**
   * 모든 직원 목록을 조회합니다
   * @param includeExcluded 제외된 직원 포함 여부 (기본값: false)
   * @param departmentId 부서 ID (선택, 지정 시 해당 부서 직원만 조회)
   * @returns 전체 직원 목록 또는 부서별 직원 목록
   */
  전체직원목록조회(
    includeExcluded?: boolean,
    departmentId?: string,
  ): Promise<EmployeeDto[]>;

  /**
   * 직원의 상급자를 조회합니다
   * @param employeeId 직원 ID
   * @returns 상급자 정보
   */
  상급자조회(employeeId: string): Promise<EmployeeDto | null>;

  /**
   * 직원의 하급자 목록을 조회합니다
   * @param employeeId 직원 ID
   * @returns 하급자 목록
   */
  하급자목록조회(employeeId: string): Promise<EmployeeDto[]>;

  /**
   * 부서의 하위 부서 목록을 조회합니다
   * @param departmentId 부서 ID
   * @returns 하위 부서 목록
   */
  하위부서목록조회(departmentId: string): Promise<DepartmentDto[]>;

  /**
   * 부서의 상위 부서를 조회합니다
   * @param departmentId 부서 ID
   * @returns 상위 부서 정보
   */
  상위부서조회(departmentId: string): Promise<DepartmentDto | null>;

  /**
   * 직원의 부서장을 조회합니다
   * @param employeeId 직원 ID
   * @returns 부서장 ID 또는 null
   */
  부서장조회(employeeId: string): Promise<string | null>;

  /**
   * 활성 직원 목록을 조회합니다
   * @returns 활성 상태의 직원 목록
   */
  활성직원목록조회(): Promise<EmployeeDto[]>;

  /**
   * 부서 하이라키 구조를 조회합니다
   * @returns 부서 하이라키 목록
   */
  부서하이라키조회(): Promise<DepartmentHierarchyDto[]>;

  /**
   * 직원 목록을 포함한 부서 하이라키 구조를 조회합니다
   * @returns 직원 목록을 포함한 부서 하이라키 목록
   */
  부서하이라키_직원포함_조회(): Promise<DepartmentHierarchyWithEmployeesDto[]>;

  /**
   * 사번으로 직원의 관리자 권한 여부를 확인합니다
   * @param employeeNumber 직원 번호
   * @returns 관리자 권한 여부 (직원이 존재하고 관리자 권한이 있는 경우 true)
   */
  사번으로_관리자권한있는가(employeeNumber: string): Promise<boolean>;

  /**
   * 직원의 관리자 권한 여부를 변경합니다
   * @param employeeId 직원 ID
   * @param isAdmin 관리자 권한 여부
   * @param updatedBy 변경 설정자
   * @returns 업데이트된 직원 정보
   */
  직원관리자권한변경(
    employeeId: string,
    isAdmin: boolean,
    updatedBy: string,
  ): Promise<EmployeeDto>;

  /**
   * 여러 직원의 관리자 권한 여부를 일괄 변경합니다
   * @param employeeIds 직원 ID 목록
   * @param isAdmin 관리자 권한 여부
   * @param updatedBy 변경 설정자
   * @returns 처리 결과 (성공/실패 개수 및 실패한 ID 목록)
   */
  여러직원관리자권한변경(
    employeeIds: string[],
    isAdmin: boolean,
    updatedBy: string,
  ): Promise<{
    totalProcessed: number;
    succeeded: number;
    failed: number;
    failedIds: string[];
    errors: string[];
  }>;
}

/**
 * 조직도 DTO
 */
export interface OrganizationChartDto {
  /** 부서 목록 */
  departments: DepartmentWithEmployeesDto[];
  /** 전체 직원 수 */
  totalEmployeeCount: number;
  /** 마지막 업데이트 시간 */
  lastUpdatedAt: Date;
}

/**
 * 직원 정보를 포함한 부서 DTO
 */
export interface DepartmentWithEmployeesDto extends DepartmentDto {
  /** 부서 소속 직원 목록 */
  employees: EmployeeDto[];
  /** 하위 부서 목록 */
  subDepartments: DepartmentWithEmployeesDto[];
}

/**
 * 부서 하이라키 DTO (필수 필드만 포함)
 */
export interface DepartmentHierarchyDto {
  /** 부서 ID */
  id: string;
  /** 부서명 */
  name: string;
  /** 부서 코드 */
  code: string;
  /** 정렬 순서 */
  order: number;
  /** 상위 부서 ID (외부 시스템) */
  parentDepartmentId?: string;
  /** 현재 부서의 계층 레벨 (0이 최상위) */
  level: number;
  /** 이 부서 아래로 존재하는 최대 깊이 (하위 부서가 없으면 0) */
  depth: number;
  /** 직계 하위 부서 개수 */
  childrenCount: number;
  /** 모든 하위 부서 개수 (재귀적, 손자 부서 포함) */
  totalDescendants: number;
  /** 하위 부서 목록 */
  subDepartments: DepartmentHierarchyDto[];
}

/**
 * 간결한 직원 정보 DTO (필수 필드만)
 */
export interface EmployeeSummaryDto {
  /** 직원 ID */
  id: string;
  /** 직원 번호 */
  employeeNumber: string;
  /** 이름 */
  name: string;
  /** 이메일 */
  email: string;
  /** 직책명 */
  rankName?: string;
  /** 직책 코드 */
  rankCode?: string;
  /** 직책 레벨 */
  rankLevel?: number;
  /** 재직 여부 */
  isActive: boolean;
}

/**
 * 직원 목록을 포함한 부서 하이라키 DTO
 */
export interface DepartmentHierarchyWithEmployeesDto {
  /** 부서 ID */
  id: string;
  /** 부서명 */
  name: string;
  /** 부서 코드 */
  code: string;
  /** 정렬 순서 */
  order: number;
  /** 상위 부서 ID (외부 시스템) */
  parentDepartmentId?: string;
  /** 현재 부서의 계층 레벨 (0이 최상위) */
  level: number;
  /** 이 부서 아래로 존재하는 최대 깊이 (하위 부서가 없으면 0) */
  depth: number;
  /** 직계 하위 부서 개수 */
  childrenCount: number;
  /** 모든 하위 부서 개수 (재귀적, 손자 부서 포함) */
  totalDescendants: number;
  /** 부서 소속 직원 수 */
  employeeCount: number;
  /** 부서 소속 직원 목록 */
  employees: EmployeeSummaryDto[];
  /** 하위 부서 목록 */
  subDepartments: DepartmentHierarchyWithEmployeesDto[];
}
