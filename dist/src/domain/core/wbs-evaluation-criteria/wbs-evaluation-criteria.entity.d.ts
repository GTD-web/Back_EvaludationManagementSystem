import { BaseEntity } from '@libs/database/base/base.entity';
import { IWbsEvaluationCriteria } from './interfaces/wbs-evaluation-criteria.interface';
import { WbsEvaluationCriteriaDto } from './wbs-evaluation-criteria.types';
export declare class WbsEvaluationCriteria extends BaseEntity<WbsEvaluationCriteriaDto> implements IWbsEvaluationCriteria {
    wbsItemId: string;
    criteria: string;
    importance: number;
    subProject?: string | null;
    DTO로_변환한다(): WbsEvaluationCriteriaDto;
    기준내용업데이트한다(criteria: string, importance: number, subProject: string | null | undefined, updatedBy: string): void;
    WBS항목일치하는가(wbsItemId: string): boolean;
    유효한가(): boolean;
    기준내용이_유효한가(): boolean;
    WBS항목ID가_유효한가(): boolean;
    동일한_평가기준인가(wbsItemId: string, criteria: string): boolean;
}
