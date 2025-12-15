import { IBaseEntity } from '@libs/database/base/base.entity';
export interface IWbsEvaluationCriteria extends IBaseEntity {
    wbsItemId: string;
    criteria: string;
    importance: number;
    subProject?: string | null;
    기준내용업데이트한다(criteria: string, importance: number, subProject: string | null | undefined, updatedBy: string): void;
    WBS항목일치하는가(wbsItemId: string): boolean;
    유효한가(): boolean;
}
