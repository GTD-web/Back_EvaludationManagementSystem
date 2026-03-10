import { EntityManager } from 'typeorm';
import type {
  EvaluationProjectAssignmentFilter,
  CreateEvaluationProjectAssignmentData,
  UpdateEvaluationProjectAssignmentData,
  OrderDirection,
} from '../evaluation-project-assignment.types';
import type { IEvaluationProjectAssignment } from './evaluation-project-assignment.interface';

/**
 * 평가 프로젝트 할당 서비스 인터페이스
 */
export interface IEvaluationProjectAssignmentService {
  /**
   * ID로 평가 프로젝트 할당을 조회한다
   */
  ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment | null>;

  /**
   * 직원 ID, 프로젝트 ID, 평가기간 ID로 평가 프로젝트 할당을 조회한다
   */
  직원과_프로젝트와_평가기간으로_조회한다(
    employeeId: string,
    projectId: string,
    periodId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment | null>;

  /**
   * 평가 프로젝트 할당을 생성한다
   */
  생성한다(
    createData: CreateEvaluationProjectAssignmentData,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment>;

  /**
   * 평가 프로젝트 할당을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateData: UpdateEvaluationProjectAssignmentData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment>;

  /**
   * 평가 프로젝트 할당을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 특정 할당이 존재하는지 확인한다
   */
  할당_존재_확인한다(
    periodId: string,
    employeeId: string,
    projectId: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 평가기간의 모든 할당을 삭제한다
   */
  평가기간_할당_전체삭제한다(
    periodId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 직원의 모든 할당을 삭제한다
   */
  직원_할당_전체삭제한다(
    employeeId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 프로젝트의 모든 할당을 삭제한다
   */
  프로젝트_할당_전체삭제한다(
    projectId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 프로젝트 할당 순서를 변경한다 (위로 이동 또는 아래로 이동)
   */
  순서를_변경한다(
    assignmentId: string,
    direction: OrderDirection,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment>;

  /**
   * 특정 직원-평가기간의 프로젝트 할당 순서를 재정렬한다
   */
  순서를_재정렬한다(
    periodId: string,
    employeeId: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<void>;
}
