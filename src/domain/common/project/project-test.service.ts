import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Project } from './project.entity';
import { ProjectDto, ProjectStatus } from './project.types';
import { Employee } from '@domain/common/employee/employee.entity';

/**
 * 프로젝트 테스트용 서비스
 *
 * 테스트 시 사용할 목데이터를 생성하고 관리하는 서비스입니다.
 * 실제 운영 환경에서는 사용하지 않습니다.
 */
@Injectable()
export class ProjectTestService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  /**
   * 테스트용 프로젝트 목데이터를 생성한다
   * @returns 생성된 프로젝트 목록
   */
  async 테스트용_목데이터를_생성한다(): Promise<ProjectDto[]> {
    const testProjects = [
      // 활성 프로젝트들
      {
        name: '루미르 통합 포탈 개발',
        projectCode: 'LUMIR-001',
        status: ProjectStatus.ACTIVE,
        managerId: 'emp-001',
      },
      {
        name: '평가 시스템 고도화',
        projectCode: 'EVAL-001',
        status: ProjectStatus.ACTIVE,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-11-30'),
        managerId: 'emp-003',
      },
      {
        name: '사용자 인터페이스 개선',
        projectCode: 'UI-001',
        status: ProjectStatus.ACTIVE,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-10-31'),
        managerId: 'emp-005',
      },
      {
        name: '데이터 마이그레이션',
        projectCode: 'MIGR-001',
        status: ProjectStatus.ACTIVE,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-09-30'),
        managerId: 'emp-006',
      },
      {
        name: '보안 강화 프로젝트',
        projectCode: 'SEC-001',
        status: ProjectStatus.ACTIVE,
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-12-31'),
        managerId: 'emp-007',
      },

      // 완료된 프로젝트들
      {
        name: '시스템 분석 및 설계',
        projectCode: 'ANAL-001',
        status: ProjectStatus.COMPLETED,
        startDate: new Date('2023-10-01'),
        endDate: new Date('2023-12-31'),
        managerId: 'emp-001',
      },
      {
        name: '프로토타입 개발',
        projectCode: 'PROTO-001',
        status: ProjectStatus.COMPLETED,
        startDate: new Date('2023-11-01'),
        endDate: new Date('2024-01-31'),
        managerId: 'emp-003',
      },
      {
        name: '초기 데이터 구축',
        projectCode: 'DATA-001',
        status: ProjectStatus.COMPLETED,
        startDate: new Date('2023-12-01'),
        endDate: new Date('2024-02-29'),
        managerId: 'emp-010',
      },

      // 취소된 프로젝트들
      {
        name: '레거시 시스템 연동',
        projectCode: 'LEGACY-001',
        status: ProjectStatus.CANCELLED,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        managerId: 'emp-002',
      },
      {
        name: '모바일 앱 개발',
        projectCode: 'MOBILE-001',
        status: ProjectStatus.CANCELLED,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-31'),
        managerId: 'emp-004',
      },

      // 코드 없는 프로젝트들
      {
        name: '내부 프로세스 개선',
        projectCode: undefined,
        status: ProjectStatus.ACTIVE,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-12-31'),
        managerId: 'emp-010',
      },
      {
        name: '문서화 작업',
        projectCode: undefined,
        status: ProjectStatus.ACTIVE,
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-11-30'),
        managerId: 'emp-011',
      },
    ];

    // 직원 UUID 매핑 조회
    const externalIds = [
      ...new Set(testProjects.map((p) => p.managerId).filter((id) => id)),
    ];
    const employees = await this.employeeRepository.find({
      where: externalIds.map((externalId) => ({ externalId })),
    });

    const externalIdToUuid = new Map<string, string>();
    employees.forEach((emp) => {
      externalIdToUuid.set(emp.externalId, emp.id);
    });

    // 프로젝트 엔티티 생성 및 저장
    const projects = testProjects.map((proj) => {
      // managerId를 externalId에서 UUID로 변환
      const managerUuid = proj.managerId
        ? externalIdToUuid.get(proj.managerId)
        : undefined;

      const project = new Project(
        proj.name,
        proj.projectCode,
        proj.status,
        managerUuid,
      );
      return project;
    });

    const savedProjects = await this.projectRepository.save(projects);

    console.log(`프로젝트 생성 완료: ${savedProjects.length}개`);
    console.log(
      `managerId가 UUID로 변환된 프로젝트: ${savedProjects.filter((p) => p.managerId).length}개`,
    );

    return savedProjects.map((project) => project.DTO로_변환한다());
  }

  /**
   * 특정 프로젝트의 테스트 데이터를 생성한다
   * @param projectData 프로젝트 데이터
   * @returns 생성된 프로젝트 정보
   */
  async 특정_프로젝트_테스트데이터를_생성한다(projectData: {
    name: string;
    projectCode?: string;
    status?: ProjectStatus;
    managerId?: string;
  }): Promise<ProjectDto> {
    const project = new Project(
      projectData.name,
      projectData.projectCode,
      projectData.status || ProjectStatus.ACTIVE,
      projectData.managerId,
    );

    const savedProject = await this.projectRepository.save(project);
    return savedProject.DTO로_변환한다();
  }

  /**
   * 테스트용 랜덤 프로젝트 데이터를 생성한다
   * @param count 생성할 프로젝트 수
   * @returns 생성된 프로젝트 목록
   */
  async 랜덤_테스트데이터를_생성한다(
    count: number = 10,
  ): Promise<ProjectDto[]> {
    const projects: Project[] = [];
    const statuses: ProjectStatus[] = [
      ProjectStatus.ACTIVE,
      ProjectStatus.COMPLETED,
      ProjectStatus.CANCELLED,
    ];
    const projectTypes = [
      '개발',
      '분석',
      '설계',
      '테스트',
      '배포',
      '유지보수',
      '개선',
      '마이그레이션',
    ];

    for (let i = 0; i < count; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const projectType =
        projectTypes[Math.floor(Math.random() * projectTypes.length)];
      const startYear = 2023 + Math.floor(Math.random() * 2);
      const startMonth = Math.floor(Math.random() * 12);
      const startDay = Math.floor(Math.random() * 28) + 1;
      const duration = Math.floor(Math.random() * 12) + 1; // 1-12개월

      const project = new Project(
        `테스트${projectType}프로젝트${i + 1}`,
        `TEST${String(i + 1).padStart(3, '0')}`,
        status,
        `manager-${Math.floor(Math.random() * 5) + 1}`,
      );
      projects.push(project);
    }

    const savedProjects = await this.projectRepository.save(projects);
    return savedProjects.map((project) => project.DTO로_변환한다());
  }

  /**
   * 테스트 데이터를 정리한다
   * @returns 삭제된 프로젝트 수
   */
  async 테스트_데이터를_정리한다(): Promise<number> {
    // E2E 테스트는 독립적으로 실행되므로 모든 프로젝트 데이터를 삭제
    return await this.모든_테스트데이터를_삭제한다();
  }

  /**
   * 모든 테스트 데이터를 삭제한다
   * @returns 삭제된 프로젝트 수
   */
  async 모든_테스트데이터를_삭제한다(): Promise<number> {
    const result = await this.projectRepository
      .createQueryBuilder()
      .delete()
      .execute();

    return result.affected || 0;
  }

  /**
   * 상태별 프로젝트 테스트 데이터를 생성한다
   * @param status 프로젝트 상태
   * @param count 생성할 프로젝트 수
   * @returns 생성된 프로젝트 목록
   */
  async 상태별_프로젝트_테스트데이터를_생성한다(
    status: ProjectStatus,
    count: number = 5,
  ): Promise<ProjectDto[]> {
    const projects: Project[] = [];
    const projectTypes = [
      '개발',
      '분석',
      '설계',
      '테스트',
      '배포',
      '유지보수',
      '개선',
      '마이그레이션',
    ];

    for (let i = 0; i < count; i++) {
      const projectType =
        projectTypes[Math.floor(Math.random() * projectTypes.length)];
      const project = new Project(
        `${status}${projectType}프로젝트${i + 1}`,
        `${status.slice(0, 3).toUpperCase()}${String(i + 1).padStart(3, '0')}`,
        status,
        `manager-${Math.floor(Math.random() * 5) + 1}`,
      );
      projects.push(project);
    }

    const savedProjects = await this.projectRepository.save(projects);
    return savedProjects.map((project) => project.DTO로_변환한다());
  }

  /**
   * 매니저별 프로젝트 테스트 데이터를 생성한다
   * @param managerId 매니저 ID
   * @param count 생성할 프로젝트 수
   * @returns 생성된 프로젝트 목록
   */
  async 매니저별_프로젝트_테스트데이터를_생성한다(
    managerId: string,
    count: number = 3,
  ): Promise<ProjectDto[]> {
    const projects: Project[] = [];
    const projectTypes = [
      '개발',
      '분석',
      '설계',
      '테스트',
      '배포',
      '유지보수',
      '개선',
      '마이그레이션',
    ];
    const statuses: ProjectStatus[] = [
      ProjectStatus.ACTIVE,
      ProjectStatus.COMPLETED,
      ProjectStatus.CANCELLED,
    ];

    for (let i = 0; i < count; i++) {
      const projectType =
        projectTypes[Math.floor(Math.random() * projectTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const startYear = 2023 + Math.floor(Math.random() * 2);
      const startMonth = Math.floor(Math.random() * 12);
      const startDay = Math.floor(Math.random() * 28) + 1;
      const duration = Math.floor(Math.random() * 12) + 1;

      const project = new Project(
        `${managerId}매니저${projectType}프로젝트${i + 1}`,
        `${managerId.slice(-3).toUpperCase()}${String(i + 1).padStart(3, '0')}`,
        status,
        managerId,
      );
      projects.push(project);
    }

    const savedProjects = await this.projectRepository.save(projects);
    return savedProjects.map((project) => project.DTO로_변환한다());
  }

  /**
   * 기간별 프로젝트 테스트 데이터를 생성한다
   * @param startYear 시작 연도
   * @param endYear 종료 연도
   * @param count 생성할 프로젝트 수
   * @returns 생성된 프로젝트 목록
   */
  async 기간별_프로젝트_테스트데이터를_생성한다(
    startYear: number,
    endYear: number,
    count: number = 10,
  ): Promise<ProjectDto[]> {
    const projects: Project[] = [];
    const projectTypes = [
      '개발',
      '분석',
      '설계',
      '테스트',
      '배포',
      '유지보수',
      '개선',
      '마이그레이션',
    ];
    const statuses: ProjectStatus[] = [
      ProjectStatus.ACTIVE,
      ProjectStatus.COMPLETED,
      ProjectStatus.CANCELLED,
    ];

    for (let i = 0; i < count; i++) {
      const projectType =
        projectTypes[Math.floor(Math.random() * projectTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const year =
        startYear + Math.floor(Math.random() * (endYear - startYear + 1));
      const month = Math.floor(Math.random() * 12);
      const day = Math.floor(Math.random() * 28) + 1;
      const duration = Math.floor(Math.random() * 12) + 1;

      const project = new Project(
        `${year}년${projectType}프로젝트${i + 1}`,
        `${year}${String(i + 1).padStart(3, '0')}`,
        status,
        `manager-${Math.floor(Math.random() * 5) + 1}`,
      );
      projects.push(project);
    }

    const savedProjects = await this.projectRepository.save(projects);
    return savedProjects.map((project) => project.DTO로_변환한다());
  }
}
