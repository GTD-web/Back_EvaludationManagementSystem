import { BaseEntity } from '@libs/database/base/base.entity';
import { ProjectManagerDto } from './project-manager.types';
export declare class ProjectManager extends BaseEntity<ProjectManagerDto> {
    managerId: string;
    name: string;
    email?: string;
    employeeNumber?: string;
    departmentName?: string;
    isActive: boolean;
    note?: string;
    constructor(managerId?: string, name?: string, email?: string, employeeNumber?: string, departmentName?: string, isActive?: boolean);
    DTO로_변환한다(): ProjectManagerDto;
    static 생성한다(data: {
        managerId: string;
        name: string;
        email?: string;
        employeeNumber?: string;
        departmentName?: string;
        isActive?: boolean;
        note?: string;
    }, createdBy: string): ProjectManager;
    업데이트한다(data: {
        name?: string;
        email?: string;
        employeeNumber?: string;
        departmentName?: string;
        isActive?: boolean;
        note?: string;
    }, updatedBy: string): void;
    삭제한다(deletedBy: string): void;
}
