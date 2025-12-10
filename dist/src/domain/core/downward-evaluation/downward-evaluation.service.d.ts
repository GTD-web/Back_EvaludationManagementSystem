import { Repository } from 'typeorm';
import { DownwardEvaluation } from './downward-evaluation.entity';
import type { CreateDownwardEvaluationData, UpdateDownwardEvaluationData, DownwardEvaluationFilter } from './downward-evaluation.types';
export declare class DownwardEvaluationService {
    private readonly downwardEvaluationRepository;
    private readonly logger;
    constructor(downwardEvaluationRepository: Repository<DownwardEvaluation>);
    생성한다(createData: CreateDownwardEvaluationData): Promise<DownwardEvaluation>;
    수정한다(id: string, updateData: UpdateDownwardEvaluationData, updatedBy: string): Promise<DownwardEvaluation>;
    삭제한다(id: string, deletedBy: string): Promise<void>;
    완전_삭제한다(id: string): Promise<void>;
    조회한다(id: string): Promise<DownwardEvaluation | null>;
    활성_조회한다(id: string): Promise<DownwardEvaluation | null>;
    필터_조회한다(filter: DownwardEvaluationFilter): Promise<DownwardEvaluation[]>;
    완료한다(id: string, completedBy: string): Promise<DownwardEvaluation>;
    피평가자별_조회한다(employeeId: string): Promise<DownwardEvaluation[]>;
    평가자별_조회한다(evaluatorId: string): Promise<DownwardEvaluation[]>;
    WBS별_조회한다(wbsId: string): Promise<DownwardEvaluation[]>;
    평가기간별_조회한다(periodId: string): Promise<DownwardEvaluation[]>;
    private 중복_검사를_수행한다;
    private 유효성을_검사한다;
}
