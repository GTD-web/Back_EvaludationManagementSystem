import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
export declare class BulkSubmitDownwardEvaluationQueryDto {
    evaluationType: DownwardEvaluationType;
    approveAllBelow?: boolean;
}
