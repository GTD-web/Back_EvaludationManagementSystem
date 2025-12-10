import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Project } from './project.entity';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectDto,
  ProjectFilter,
  ProjectListOptions,
  ProjectStatus,
} from './project.types';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { ProjectHasAssignmentsException } from './project.exceptions';

/**
 * 프로젝트 도메인 서비스
 *
 * 프로젝트 엔티티의 비즈니스 로직을 담당하는 서비스입니다.
 */
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(EvaluationProjectAssignment)
    private readonly evaluationProjectAssignmentRepository: Repository<EvaluationProjectAssignment>,
  ) {}

  /**
   * 새로운 프로젝트를 생성한다 (하위 프로젝트 자동 생성 포함)
   * @param data 프로젝트 생성 데이터
   * @param createdBy 생성자 ID
   * @returns 생성된 프로젝트 정보
   */
  async 생성한다(
    data: CreateProjectDto,
    createdBy: string,
  ): Promise<ProjectDto> {
    console.log('\n🚀 [생성한다] 프로젝트 생성 시작');
    console.log('📋 data.name:', data.name);
    console.log('📋 data.managerId (입력값):', data.managerId);
    console.log('📋 data.parentProjectId:', data.parentProjectId);
    console.log('📋 data.childProjects:', data.childProjects ? `${data.childProjects.length}개` : '없음');
    
    let finalManagerId = data.managerId;
    
    // 하위 프로젝트 생성 시 상위 프로젝트 존재 확인
    if (data.parentProjectId) {
      const parentProject = await this.projectRepository.findOne({
        where: { id: data.parentProjectId, deletedAt: IsNull() },
      });

      if (!parentProject) {
        throw new NotFoundException(
          `상위 프로젝트 ID ${data.parentProjectId}를 찾을 수 없습니다.`,
        );
      }

      // managerId가 없으면 최상단 프로젝트의 PM 사용
      if (!finalManagerId) {
        console.log('🔍 managerId 없음 → 최상단 프로젝트 PM 찾기 시작');
        const topLevelProject = await this.최상단_프로젝트_조회한다(data.parentProjectId);
        finalManagerId = topLevelProject.managerId;
        console.log('✅ 최상단 프로젝트 PM 찾음:', finalManagerId);
      }
    }

    console.log('📋 최종 사용할 managerId:', finalManagerId);

    // 프로젝트 생성 (managerId 자동 설정)
    const project = Project.생성한다(
      {
        ...data,
        managerId: finalManagerId,
      },
      createdBy,
    );
    const savedProject = await this.projectRepository.save(project);
    console.log('✅ 프로젝트 생성 완료 - ID:', savedProject.id, ', managerId:', savedProject.managerId);

    // 하위 프로젝트 생성 (childProjects가 있는 경우)
    if (data.childProjects && data.childProjects.length > 0) {
      console.log('\n📦 하위 프로젝트 생성 시작');
      console.log('  - 전달할 defaultManagerId:', finalManagerId);
      
      await this.하위_프로젝트들_생성한다(
        savedProject.id,
        savedProject.projectCode || savedProject.id, // projectCode가 없으면 ID 사용
        data.childProjects,
        data.status,
        data.startDate,
        data.endDate,
        finalManagerId, // 최종 managerId 전달
        createdBy,
      );
    }

    // 생성 후 manager 정보와 하위 프로젝트를 포함하여 다시 조회
    const result = await this.ID로_조회한다(savedProject.id, true);
    if (!result) {
      throw new NotFoundException(`생성된 프로젝트를 찾을 수 없습니다.`);
    }
    return result;
  }

  /**
   * 하위 프로젝트들을 트리 구조로 생성한다
   * orderLevel별로 그룹화하여 같은 레벨은 같은 부모를 가집니다.
   * 
   * 예시:
   * - orderLevel=1 (3개): 모두 상위 프로젝트를 부모로
   * - orderLevel=2 (2개): orderLevel=1의 마지막 프로젝트를 부모로
   * - orderLevel=3 (1개): orderLevel=2의 마지막 프로젝트를 부모로
   * 
   * @param defaultManagerId 최상단 프로젝트의 PM ID (모든 하위 프로젝트는 이 ID로 설정됨, child.managerId는 무시됨)
   */
  private async 하위_프로젝트들_생성한다(
    topLevelProjectId: string,
    topLevelProjectCode: string,
    childProjects: Array<{
      orderLevel: number;
      name: string;
      projectCode?: string;
      managerId?: string;
    }>,
    status: ProjectStatus,
    startDate?: Date,
    endDate?: Date,
    defaultManagerId?: string,
    createdBy: string = 'system',
  ): Promise<void> {
    console.log('🔍 [하위_프로젝트들_생성한다] 시작');
    console.log('📋 defaultManagerId (최상단 PM):', defaultManagerId);
    console.log('📋 childProjects 개수:', childProjects.length);
    console.log('📋 childProjects 상세:', JSON.stringify(childProjects, null, 2));

    // orderLevel별로 그룹화
    const groupedByLevel = new Map<number, typeof childProjects>();
    for (const child of childProjects) {
      const existing = groupedByLevel.get(child.orderLevel) || [];
      existing.push(child);
      groupedByLevel.set(child.orderLevel, existing);
    }

    // orderLevel 순서대로 정렬
    const sortedLevels = Array.from(groupedByLevel.keys()).sort((a, b) => a - b);

    // 각 레벨의 마지막 생성 프로젝트를 추적 (다음 레벨의 부모용)
    let lastCreatedIdOfPreviousLevel = topLevelProjectId;

    // 레벨별로 처리
    for (const level of sortedLevels) {
      const childrenInLevel = groupedByLevel.get(level) || [];
      let lastCreatedInThisLevel: Project | null = null;

      // 같은 레벨의 프로젝트들 생성 (모두 같은 부모)
      for (let index = 0; index < childrenInLevel.length; index++) {
        const child = childrenInLevel[index];
        
        console.log(`\n🔹 Level ${level}, Index ${index} 처리 중`);
        console.log('  - child.name:', child.name);
        console.log('  - child.managerId (입력값):', child.managerId);
        console.log('  - defaultManagerId (최상단 PM):', defaultManagerId);
        console.log('  - 최종 사용할 managerId (무조건 최상단):', defaultManagerId);
        
        // 프로젝트 코드 자동 생성 (미입력 시)
        const childProjectCode =
          child.projectCode ||
          `${topLevelProjectCode}-SUB${level}-${String.fromCharCode(65 + index)}`; // A, B, C...

        console.log('  - 실제 저장될 managerId:', defaultManagerId);

        const createdChild = await this.projectRepository.save(
          Project.생성한다(
            {
              name: child.name,
              projectCode: childProjectCode,
              status,
              startDate,
              endDate,
              managerId: defaultManagerId, // 무조건 최상단 프로젝트의 PM 사용 (child.managerId 무시)
              parentProjectId: lastCreatedIdOfPreviousLevel, // 이전 레벨의 마지막 프로젝트
            },
            createdBy,
          ),
        );

        console.log('  ✅ 생성 완료 - ID:', createdChild.id, ', managerId:', createdChild.managerId);

        lastCreatedInThisLevel = createdChild;
      }

      // 다음 레벨의 부모는 현재 레벨의 마지막 프로젝트
      if (lastCreatedInThisLevel) {
        lastCreatedIdOfPreviousLevel = lastCreatedInThisLevel.id;
      }
    }
  }

  /**
   * 여러 프로젝트를 일괄 생성한다
   * @param dataList 프로젝트 생성 데이터 배열
   * @param createdBy 생성자 ID
   * @returns 생성된 프로젝트 정보 배열과 실패한 항목 정보
   */
  async 일괄_생성한다(
    dataList: CreateProjectDto[],
    createdBy: string,
  ): Promise<{
    success: ProjectDto[];
    failed: Array<{ index: number; data: CreateProjectDto; error: string }>;
  }> {
    console.log('\n🚀 [일괄_생성한다] 일괄 생성 시작 - 총', dataList.length, '개');
    
    const success: ProjectDto[] = [];
    const failed: Array<{
      index: number;
      data: CreateProjectDto;
      error: string;
    }> = [];

    // 각 프로젝트 생성 시도
    for (let i = 0; i < dataList.length; i++) {
      console.log(`\n📦 [${i + 1}/${dataList.length}] 프로젝트 생성 중`);
      console.log('  - name:', dataList[i].name);
      console.log('  - managerId (입력값):', dataList[i].managerId);
      console.log('  - parentProjectId:', dataList[i].parentProjectId);
      console.log('  - childProjects:', dataList[i].childProjects ? `${dataList[i].childProjects!.length}개` : '없음');
      
      try {
        let finalManagerId = dataList[i].managerId;

        // 하위 프로젝트이고 managerId가 없으면 최상단 프로젝트의 PM 사용
        if (dataList[i].parentProjectId && !finalManagerId) {
          console.log('  🔍 managerId 없음 → 최상단 프로젝트 PM 찾기 시작');
          const topLevelProject = await this.최상단_프로젝트_조회한다(dataList[i].parentProjectId!);
          finalManagerId = topLevelProject.managerId;
          console.log('  ✅ 최상단 프로젝트 PM 찾음:', finalManagerId);
        }

        console.log('  📋 최종 사용할 managerId:', finalManagerId);

        const project = Project.생성한다({
          ...dataList[i],
          managerId: finalManagerId,
        }, createdBy);
        const savedProject = await this.projectRepository.save(project);
        console.log('  ✅ 프로젝트 생성 완료 - managerId:', savedProject.managerId);

        // 하위 프로젝트 생성 (childProjects가 있는 경우)
        if (dataList[i].childProjects && dataList[i].childProjects!.length > 0) {
          console.log('  📦 하위 프로젝트 생성 - defaultManagerId:', finalManagerId);
          
          await this.하위_프로젝트들_생성한다(
            savedProject.id,
            savedProject.projectCode || savedProject.id, // projectCode가 없으면 ID 사용
            dataList[i].childProjects!,
            dataList[i].status,
            dataList[i].startDate,
            dataList[i].endDate,
            finalManagerId,
            createdBy,
          );
        }

        // 생성 후 manager 정보와 하위 프로젝트를 포함하여 다시 조회
        const result = await this.ID로_조회한다(savedProject.id, true);
        if (result) {
          success.push(result);
        }
      } catch (error) {
        failed.push({
          index: i,
          data: dataList[i],
          error:
            error instanceof Error
              ? error.message
              : '프로젝트 생성 중 오류가 발생했습니다.',
        });
      }
    }

    return { success, failed };
  }

  /**
   * 프로젝트 정보를 수정한다
   * @param id 프로젝트 ID
   * @param data 수정할 데이터
   * @param updatedBy 수정자 ID
   * @returns 수정된 프로젝트 정보
   */
  /**
   * 프로젝트를 수정한다 (하위 프로젝트 재생성 포함)
   * @param id 프로젝트 ID
   * @param data 수정 데이터
   * @param updatedBy 수정자 ID
   * @returns 수정된 프로젝트 정보
   */
  async 수정한다(
    id: string,
    data: UpdateProjectDto,
    updatedBy: string,
  ): Promise<ProjectDto> {
    const project = await this.projectRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!project) {
      throw new NotFoundException(
        `ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`,
      );
    }

    // 프로젝트 기본 정보 수정
    project.업데이트한다(data, updatedBy);
    await this.projectRepository.save(project);

    // 하위 프로젝트 재생성 (childProjects가 명시적으로 제공된 경우)
    if (data.childProjects !== undefined) {
      // 기존 하위 프로젝트 삭제
      const existingChildren = await this.모든_하위_프로젝트_조회한다(id);
      for (const child of existingChildren.reverse()) {
        await this.projectRepository.remove(child); // 하드 삭제
      }

      // 새로운 하위 프로젝트 생성
      if (data.childProjects.length > 0) {
        await this.하위_프로젝트들_생성한다(
          id,
          project.projectCode || id, // projectCode가 없으면 ID 사용
          data.childProjects,
          project.status,
          project.startDate,
          project.endDate,
          project.managerId,
          updatedBy,
        );
      }
    }

    // 수정 후 manager 정보와 하위 프로젝트를 포함하여 다시 조회
    const result = await this.ID로_조회한다(id, true);
    if (!result) {
      throw new NotFoundException(`수정된 프로젝트를 찾을 수 없습니다.`);
    }
    return result;
  }

  /**
   * 프로젝트를 삭제한다 (소프트 삭제)
   * @param id 프로젝트 ID
   * @param deletedBy 삭제자 ID
   * @throws ProjectHasAssignmentsException 프로젝트에 할당이 존재하는 경우
   */
  /**
   * 프로젝트를 삭제한다 (하위 프로젝트도 함께 삭제)
   * @param id 프로젝트 ID
   * @param deletedBy 삭제자 ID
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!project) {
      throw new NotFoundException(
        `ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`,
      );
    }

    // 하위 프로젝트 조회 (재귀적으로 모든 하위)
    const allChildProjects = await this.모든_하위_프로젝트_조회한다(id);

    // 자신과 모든 하위 프로젝트의 할당 체크
    const projectIdsToCheck = [id, ...allChildProjects.map((p) => p.id)];

    for (const projectId of projectIdsToCheck) {
      const assignmentCount =
        await this.evaluationProjectAssignmentRepository.count({
          where: { projectId, deletedAt: IsNull() },
        });

      if (assignmentCount > 0) {
        const projectToCheck = [project, ...allChildProjects].find(
          (p) => p.id === projectId,
        );
        throw new ProjectHasAssignmentsException(
          projectId,
          assignmentCount,
          `프로젝트 "${projectToCheck?.name || projectId}"에 ${assignmentCount}개의 할당이 있어 삭제할 수 없습니다.`,
        );
      }
    }

    // 모든 하위 프로젝트 삭제 (깊은 레벨부터 역순으로)
    for (const child of allChildProjects.reverse()) {
      child.삭제한다(deletedBy);
      await this.projectRepository.save(child);
    }

    // 상위 프로젝트 삭제
    project.삭제한다(deletedBy);
    await this.projectRepository.save(project);
  }

  /**
   * 주어진 프로젝트 ID의 최상단 프로젝트를 조회한다
   * @param projectId 프로젝트 ID
   * @returns 최상단 프로젝트
   */
  private async 최상단_프로젝트_조회한다(projectId: string): Promise<Project> {
    let currentProject = await this.projectRepository.findOne({
      where: { id: projectId, deletedAt: IsNull() },
    });

    if (!currentProject) {
      throw new NotFoundException(`프로젝트 ID ${projectId}를 찾을 수 없습니다.`);
    }

    // parentProjectId가 없을 때까지 계속 올라감
    while (currentProject.parentProjectId) {
      const parentProject = await this.projectRepository.findOne({
        where: { id: currentProject.parentProjectId, deletedAt: IsNull() },
      });

      if (!parentProject) {
        // 상위 프로젝트가 없으면 현재 프로젝트가 최상단
        break;
      }

      currentProject = parentProject;
    }

    console.log('  🔝 최상단 프로젝트 찾음 - ID:', currentProject.id, ', name:', currentProject.name, ', managerId:', currentProject.managerId);
    return currentProject;
  }

  /**
   * 모든 하위 프로젝트를 재귀적으로 조회한다 (얕은 → 깊은 순서)
   */
  private async 모든_하위_프로젝트_조회한다(
    parentId: string,
  ): Promise<Project[]> {
    const allChildren: Project[] = [];
    const directChildren = await this.projectRepository.find({
      where: { parentProjectId: parentId, deletedAt: IsNull() },
    });

    for (const child of directChildren) {
      allChildren.push(child);
      // 재귀: 이 하위의 하위도 조회
      const grandChildren = await this.모든_하위_프로젝트_조회한다(child.id);
      allChildren.push(...grandChildren);
    }

    return allChildren;
  }

  /**
   * ID로 프로젝트를 조회한다 (계층 구조 포함)
   * @param id 프로젝트 ID
   * @param includeChildren 하위 프로젝트 포함 여부 (기본값: false)
   * @returns 프로젝트 정보 (없으면 null)
   */
  async ID로_조회한다(
    id: string,
    includeChildren: boolean = false,
  ): Promise<ProjectDto | null> {
    const result = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'project.managerId AS "managerId"',
        'project.parentProjectId AS "parentProjectId"',
        'manager.id AS manager_employee_id',
        'manager.externalId AS manager_external_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.id = :id', { id })
      .andWhere('project.deletedAt IS NULL')
      .getRawOne();

    if (!result) {
      return null;
    }

    // 하위 프로젝트 조회 (옵션)
    let childProjects: ProjectDto[] | undefined;
    if (includeChildren) {
      childProjects = await this.하위_프로젝트_목록_조회한다(id);
    }

    return {
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      managerId: result.managerId,
      parentProjectId: result.parentProjectId,
      manager: result.manager_external_id
        ? {
            managerId: result.manager_external_id,
            employeeId: result.manager_employee_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      childProjects,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    };
  }

  /**
   * 프로젝트 코드로 프로젝트를 조회한다
   * @param projectCode 프로젝트 코드
   * @returns 프로젝트 정보 (없으면 null)
   */
  async 프로젝트코드로_조회한다(
    projectCode: string,
  ): Promise<ProjectDto | null> {
    const result = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'manager.id AS manager_employee_id',
        'manager.externalId AS manager_external_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.projectCode = :projectCode', { projectCode })
      .andWhere('project.deletedAt IS NULL')
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      manager: result.manager_external_id
        ? {
            managerId: result.manager_external_id,
            employeeId: result.manager_employee_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    };
  }

  /**
   * 프로젝트명으로 프로젝트를 조회한다
   * @param name 프로젝트명
   * @returns 프로젝트 정보 (없으면 null)
   */
  async 프로젝트명으로_조회한다(name: string): Promise<ProjectDto | null> {
    const result = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'manager.id AS manager_employee_id',
        'manager.externalId AS manager_external_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.name = :name', { name })
      .andWhere('project.deletedAt IS NULL')
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      manager: result.manager_external_id
        ? {
            managerId: result.manager_external_id,
            employeeId: result.manager_employee_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    };
  }

  /**
   * 필터 조건으로 프로젝트 목록을 조회한다
   * @param filter 필터 조건
   * @returns 프로젝트 목록
   */
  async 필터_조회한다(filter: ProjectFilter): Promise<ProjectDto[]> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'manager.id AS manager_employee_id',
        'manager.externalId AS manager_external_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.deletedAt IS NULL');

    if (filter.status) {
      queryBuilder.andWhere('project.status = :status', {
        status: filter.status,
      });
    }

    if (filter.managerId) {
      queryBuilder.andWhere('project.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    if (filter.startDateFrom) {
      queryBuilder.andWhere('project.startDate >= :startDateFrom', {
        startDateFrom: filter.startDateFrom,
      });
    }

    if (filter.startDateTo) {
      queryBuilder.andWhere('project.startDate <= :startDateTo', {
        startDateTo: filter.startDateTo,
      });
    }

    if (filter.endDateFrom) {
      queryBuilder.andWhere('project.endDate >= :endDateFrom', {
        endDateFrom: filter.endDateFrom,
      });
    }

    if (filter.endDateTo) {
      queryBuilder.andWhere('project.endDate <= :endDateTo', {
        endDateTo: filter.endDateTo,
      });
    }

    // 계층 구조 필터
    if (filter.parentProjectId !== undefined) {
      queryBuilder.andWhere('project.parentProjectId = :parentProjectId', {
        parentProjectId: filter.parentProjectId,
      });
    }

    if (filter.hierarchyLevel) {
      if (filter.hierarchyLevel === 'parent') {
        // 상위 프로젝트만 (parentProjectId가 null)
        queryBuilder.andWhere('project.parentProjectId IS NULL');
      } else if (filter.hierarchyLevel === 'child') {
        // 하위 프로젝트만 (parentProjectId가 있음)
        queryBuilder.andWhere('project.parentProjectId IS NOT NULL');
      }
      // 'all'인 경우 필터 적용하지 않음
    }

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      manager: result.manager_external_id
        ? {
            managerId: result.manager_external_id,
            employeeId: result.manager_employee_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    }));
  }

  /**
   * 옵션에 따라 프로젝트 목록을 조회한다 (페이징, 정렬 포함)
   * @param options 조회 옵션
   * @returns 프로젝트 목록과 총 개수
   */
  async 목록_조회한다(options: ProjectListOptions = {}): Promise<{
    projects: ProjectDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      filter = {},
    } = options;

    // 총 개수를 위한 쿼리
    const countQueryBuilder =
      this.projectRepository.createQueryBuilder('project');
    countQueryBuilder.where('project.deletedAt IS NULL');

    // 필터 적용 (총 개수용)
    if (filter.status) {
      countQueryBuilder.andWhere('project.status = :status', {
        status: filter.status,
      });
    }

    if (filter.managerId) {
      countQueryBuilder.andWhere('project.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    if (filter.startDateFrom) {
      countQueryBuilder.andWhere('project.startDate >= :startDateFrom', {
        startDateFrom: filter.startDateFrom,
      });
    }

    if (filter.startDateTo) {
      countQueryBuilder.andWhere('project.startDate <= :startDateTo', {
        startDateTo: filter.startDateTo,
      });
    }

    if (filter.endDateFrom) {
      countQueryBuilder.andWhere('project.endDate >= :endDateFrom', {
        endDateFrom: filter.endDateFrom,
      });
    }

    if (filter.endDateTo) {
      countQueryBuilder.andWhere('project.endDate <= :endDateTo', {
        endDateTo: filter.endDateTo,
      });
    }

    // 프로젝트명 검색 (부분 일치)
    if (filter.search) {
      countQueryBuilder.andWhere('project.name ILIKE :search', {
        search: `%${filter.search}%`,
      });
    }

    // 계층 구조 필터 (총 개수용)
    if (filter.parentProjectId !== undefined) {
      countQueryBuilder.andWhere('project.parentProjectId = :parentProjectId', {
        parentProjectId: filter.parentProjectId,
      });
    }

    if (filter.hierarchyLevel) {
      if (filter.hierarchyLevel === 'parent') {
        countQueryBuilder.andWhere('project.parentProjectId IS NULL');
      } else if (filter.hierarchyLevel === 'child') {
        countQueryBuilder.andWhere('project.parentProjectId IS NOT NULL');
      }
    }

    const total = await countQueryBuilder.getCount();

    // 데이터 조회를 위한 쿼리 (manager join 포함)
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'project.managerId AS "managerId"',
        'project.parentProjectId AS "parentProjectId"',
        'manager.id AS manager_employee_id',
        'manager.externalId AS manager_external_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.deletedAt IS NULL');

    // 필터 적용
    if (filter.status) {
      queryBuilder.andWhere('project.status = :status', {
        status: filter.status,
      });
    }

    if (filter.managerId) {
      queryBuilder.andWhere('project.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    if (filter.startDateFrom) {
      queryBuilder.andWhere('project.startDate >= :startDateFrom', {
        startDateFrom: filter.startDateFrom,
      });
    }

    if (filter.startDateTo) {
      queryBuilder.andWhere('project.startDate <= :startDateTo', {
        startDateTo: filter.startDateTo,
      });
    }

    if (filter.endDateFrom) {
      queryBuilder.andWhere('project.endDate >= :endDateFrom', {
        endDateFrom: filter.endDateFrom,
      });
    }

    if (filter.endDateTo) {
      queryBuilder.andWhere('project.endDate <= :endDateTo', {
        endDateTo: filter.endDateTo,
      });
    }

    // 프로젝트명 검색 (부분 일치)
    if (filter.search) {
      queryBuilder.andWhere('project.name ILIKE :search', {
        search: `%${filter.search}%`,
      });
    }

    // 계층 구조 필터
    if (filter.parentProjectId !== undefined) {
      queryBuilder.andWhere('project.parentProjectId = :parentProjectId', {
        parentProjectId: filter.parentProjectId,
      });
    }

    if (filter.hierarchyLevel) {
      if (filter.hierarchyLevel === 'parent') {
        queryBuilder.andWhere('project.parentProjectId IS NULL');
      } else if (filter.hierarchyLevel === 'child') {
        queryBuilder.andWhere('project.parentProjectId IS NOT NULL');
      }
    }

    // 정렬
    queryBuilder.orderBy(`project.${sortBy}`, sortOrder);

    // 페이징
    const offset = (page - 1) * limit;
    queryBuilder.offset(offset).limit(limit);

    const results = await queryBuilder.getRawMany();

    const projects: ProjectDto[] = results.map((result) => ({
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      managerId: result.managerId,
      parentProjectId: result.parentProjectId,
      manager: result.manager_external_id
        ? {
            managerId: result.manager_external_id,
            employeeId: result.manager_employee_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    }));

    return {
      projects,
      total,
      page,
      limit,
    };
  }

  /**
   * 전체 프로젝트 목록을 조회한다
   * @returns 전체 프로젝트 목록
   */
  async 전체_조회한다(): Promise<ProjectDto[]> {
    const results = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'manager.id AS manager_employee_id',
        'manager.externalId AS manager_external_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.deletedAt IS NULL')
      .orderBy('project.name', 'ASC')
      .getRawMany();

    return results.map((result) => ({
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      manager: result.manager_external_id
        ? {
            managerId: result.manager_external_id,
            employeeId: result.manager_employee_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    }));
  }

  /**
   * 활성 프로젝트 목록을 조회한다
   * @returns 활성 프로젝트 목록
   */
  async 활성_조회한다(): Promise<ProjectDto[]> {
    const results = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'manager.id AS manager_employee_id',
        'manager.externalId AS manager_external_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.deletedAt IS NULL')
      .andWhere('project.status = :status', { status: ProjectStatus.ACTIVE })
      .orderBy('project.name', 'ASC')
      .getRawMany();

    return results.map((result) => ({
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      manager: result.manager_external_id
        ? {
            managerId: result.manager_external_id,
            employeeId: result.manager_employee_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    }));
  }

  /**
   * 매니저별 프로젝트 목록을 조회한다
   * @param managerId 매니저 ID
   * @returns 매니저 프로젝트 목록
   */
  async 매니저별_조회한다(managerId: string): Promise<ProjectDto[]> {
    const results = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'manager.id AS manager_employee_id',
        'manager.externalId AS manager_external_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.deletedAt IS NULL')
      .andWhere('project.managerId = :managerId', { managerId })
      .orderBy('project.name', 'ASC')
      .getRawMany();

    return results.map((result) => ({
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      manager: result.manager_external_id
        ? {
            managerId: result.manager_external_id,
            employeeId: result.manager_employee_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    }));
  }

  /**
   * 프로젝트가 존재하는지 확인한다
   * @param id 프로젝트 ID
   * @returns 존재 여부
   */
  async 존재하는가(id: string): Promise<boolean> {
    const count = await this.projectRepository.count({
      where: { id, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * 프로젝트 코드가 존재하는지 확인한다
   * @param projectCode 프로젝트 코드
   * @param excludeId 제외할 프로젝트 ID (수정 시 자신 제외용)
   * @returns 존재 여부
   */
  async 프로젝트코드가_존재하는가(
    projectCode: string,
    excludeId?: string,
  ): Promise<boolean> {
    const queryBuilder = this.projectRepository.createQueryBuilder('project');
    queryBuilder.where('project.projectCode = :projectCode', { projectCode });
    queryBuilder.andWhere('project.deletedAt IS NULL');

    if (excludeId) {
      queryBuilder.andWhere('project.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * 프로젝트 상태를 변경한다
   * @param id 프로젝트 ID
   * @param status 새로운 상태
   * @param updatedBy 수정자 ID
   * @returns 수정된 프로젝트 정보
   */
  async 상태_변경한다(
    id: string,
    status: ProjectStatus,
    updatedBy: string,
  ): Promise<ProjectDto> {
    const project = await this.projectRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!project) {
      throw new NotFoundException(
        `ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`,
      );
    }

    project.status = status;
    project.수정자를_설정한다(updatedBy);

    const savedProject = await this.projectRepository.save(project);
    return savedProject.DTO로_변환한다();
  }

  /**
   * 프로젝트를 완료 처리한다
   * @param id 프로젝트 ID
   * @param updatedBy 수정자 ID
   * @returns 수정된 프로젝트 정보
   */
  async 완료_처리한다(id: string, updatedBy: string): Promise<ProjectDto> {
    return this.상태_변경한다(id, ProjectStatus.COMPLETED, updatedBy);
  }

  /**
   * 프로젝트를 취소 처리한다
   * @param id 프로젝트 ID
   * @param updatedBy 수정자 ID
   * @returns 수정된 프로젝트 정보
   */
  async 취소_처리한다(id: string, updatedBy: string): Promise<ProjectDto> {
    return this.상태_변경한다(id, ProjectStatus.CANCELLED, updatedBy);
  }

  /**
   * 특정 프로젝트의 하위 프로젝트 목록을 재귀적으로 조회한다
   * @param parentProjectId 상위 프로젝트 ID
   * @param depth 현재 깊이 (무한 루프 방지용, 기본값 0)
   * @param maxDepth 최대 깊이 (기본값 10)
   * @returns 하위 프로젝트 목록 (재귀적으로 모든 하위 포함)
   */
  async 하위_프로젝트_목록_조회한다(
    parentProjectId: string,
    depth: number = 0,
    maxDepth: number = 10,
  ): Promise<ProjectDto[]> {
    // 무한 루프 방지
    if (depth >= maxDepth) {
      return [];
    }

    const results = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'project.managerId AS "managerId"',
        'project.parentProjectId AS "parentProjectId"',
        'manager.id AS manager_employee_id',
        'manager.externalId AS manager_external_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.parentProjectId = :parentProjectId', { parentProjectId })
      .andWhere('project.deletedAt IS NULL')
      .orderBy('project.createdAt', 'ASC')
      .getRawMany();

    // 각 하위 프로젝트에 대해 재귀적으로 하위 조회
    const projectsWithChildren = await Promise.all(
      results.map(async (result) => {
        // 재귀: 이 프로젝트의 하위 프로젝트들을 조회
        const children = await this.하위_프로젝트_목록_조회한다(
          result.id,
          depth + 1,
          maxDepth,
        );

        return {
          id: result.id,
          name: result.name,
          projectCode: result.projectCode,
          status: result.status,
          startDate: result.startDate,
          endDate: result.endDate,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          deletedAt: result.deletedAt,
          managerId: result.managerId,
          parentProjectId: result.parentProjectId,
          manager: result.manager_external_id
            ? {
                managerId: result.manager_external_id,
                employeeId: result.manager_employee_id,
                name: result.manager_name,
                email: result.manager_email,
                phoneNumber: result.manager_phone_number,
                departmentName: result.manager_department_name,
                rankName: result.manager_rank_name,
              }
            : undefined,
          childProjects: children.length > 0 ? children : undefined,
          get isDeleted() {
            return result.deletedAt !== null && result.deletedAt !== undefined;
          },
          get isActive() {
            return result.status === 'ACTIVE';
          },
          get isCompleted() {
            return result.status === 'COMPLETED';
          },
          get isCancelled() {
            return result.status === 'CANCELLED';
          },
        };
      }),
    );

    return projectsWithChildren;
  }

  /**
   * 상위 프로젝트의 하위 프로젝트 수를 조회한다
   * @param parentProjectId 상위 프로젝트 ID
   * @returns 하위 프로젝트 수
   */
  async 하위_프로젝트_수를_조회한다(parentProjectId: string): Promise<number> {
    return this.projectRepository.count({
      where: { parentProjectId, deletedAt: IsNull() },
    });
  }

  /**
   * 계층 구조로 프로젝트 목록을 조회한다 (상위 프로젝트 + 하위 프로젝트 nested)
   * @param options 조회 옵션
   * @returns 계층 구조의 프로젝트 목록
   */
  async 계층구조_목록_조회한다(
    options: ProjectListOptions = {},
  ): Promise<{
    projects: ProjectDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC', filter = {} } = options;

    // 상위 프로젝트만 조회
    const parentFilter = {
      ...filter,
      hierarchyLevel: 'parent' as const,
    };

    const parentProjects = await this.목록_조회한다({
      page,
      limit,
      sortBy,
      sortOrder,
      filter: parentFilter,
    });

    // 각 상위 프로젝트의 하위 프로젝트 조회
    const projectsWithChildren = await Promise.all(
      parentProjects.projects.map(async (parent) => {
        const children = await this.하위_프로젝트_목록_조회한다(parent.id);
        return {
          ...parent,
          childProjects: children,
          childProjectCount: children.length,
        };
      }),
    );

    return {
      projects: projectsWithChildren,
      total: parentProjects.total,
      page: parentProjects.page,
      limit: parentProjects.limit,
    };
  }

  /**
   * 자동 생성된 모든 하위 프로젝트를 일괄 삭제한다
   * 
   * 삭제 대상:
   * - parentProjectId가 NULL이 아닌 프로젝트
   * - projectCode에 '-SUB' 패턴이 포함된 프로젝트
   * - 이름에 "하위 프로젝트" 또는 "N차" 패턴이 포함된 프로젝트
   * 
   * @param forceDelete 할당 체크를 건너뛸지 여부 (기본값: false)
   * @param hardDelete 영구 삭제 여부 (기본값: false, soft delete)
   * @param deletedBy 삭제자 ID
   * @returns 삭제 결과
   */
  async 하위_프로젝트들_일괄_삭제한다(
    forceDelete: boolean = false,
    hardDelete: boolean = false,
    deletedBy: string,
  ): Promise<{
    deletedCount: number;
    deleteType: 'soft' | 'hard';
    assignmentCheckPerformed: boolean;
    deletedProjects: Array<{
      id: string;
      name: string;
      projectCode: string;
      parentProjectId: string | null;
    }>;
    executionTimeSeconds: number;
  }> {
    const startTime = Date.now();

    // 1. 삭제 대상 하위 프로젝트 조회
    const childProjects = await this.projectRepository
      .createQueryBuilder('project')
      .select([
        'project.id',
        'project.name',
        'project.projectCode',
        'project.parentProjectId',
      ])
      .where('project.deletedAt IS NULL')
      .andWhere(
        `(
          project.parentProjectId IS NOT NULL
          OR project.projectCode LIKE '%-SUB%'
          OR project.name LIKE '%하위%'
          OR project.name LIKE '% - 1차%'
          OR project.name LIKE '% - 2차%'
          OR project.name LIKE '% - 3차%'
          OR project.name LIKE '% - 4차%'
          OR project.name LIKE '% - 5차%'
          OR project.name LIKE '% - 6차%'
          OR project.name LIKE '% - 7차%'
          OR project.name LIKE '% - 8차%'
          OR project.name LIKE '% - 9차%'
          OR project.name LIKE '% - 10차%'
        )`,
      )
      .getMany();

    if (childProjects.length === 0) {
      throw new NotFoundException('삭제할 하위 프로젝트를 찾을 수 없습니다');
    }

    // 2. 할당 체크 (forceDelete가 false인 경우)
    const assignmentCheckPerformed = !forceDelete;
    if (!forceDelete) {
      const projectIds = childProjects.map((p) => p.id);
      const assignmentsExist =
        await this.evaluationProjectAssignmentRepository.count({
          where: { projectId: projectIds as any },
        });

      if (assignmentsExist > 0) {
        // 첫 번째 하위 프로젝트 ID를 대표로 사용 (일괄 삭제이므로)
        throw new ProjectHasAssignmentsException(
          childProjects[0].id,
          assignmentsExist,
          `${assignmentsExist}개의 할당이 있는 하위 프로젝트가 포함되어 있어 삭제할 수 없습니다`,
        );
      }
    }

    // 3. 삭제 실행
    const deletedProjectsInfo = childProjects.map((p) => ({
      id: p.id,
      name: p.name,
      projectCode: p.projectCode || '',
      parentProjectId: p.parentProjectId ?? null, // undefined를 null로 변환
    }));

    if (hardDelete) {
      // Hard Delete: 영구 삭제
      const projectIds = childProjects.map((p) => p.id);
      await this.projectRepository.delete(projectIds);
    } else {
      // Soft Delete: deletedAt만 업데이트
      for (const project of childProjects) {
        project.삭제한다(deletedBy);
        await this.projectRepository.save(project);
      }
    }

    const executionTimeSeconds = (Date.now() - startTime) / 1000;

    return {
      deletedCount: childProjects.length,
      deleteType: hardDelete ? 'hard' : 'soft',
      assignmentCheckPerformed,
      deletedProjects: deletedProjectsInfo,
      executionTimeSeconds,
    };
  }
}
