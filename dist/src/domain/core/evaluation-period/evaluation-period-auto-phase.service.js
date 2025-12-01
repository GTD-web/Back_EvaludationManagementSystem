"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var EvaluationPeriodAutoPhaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPeriodAutoPhaseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const evaluation_period_entity_1 = require("./evaluation-period.entity");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const evaluation_period_service_1 = require("./evaluation-period.service");
const evaluation_period_types_1 = require("./evaluation-period.types");
let EvaluationPeriodAutoPhaseService = EvaluationPeriodAutoPhaseService_1 = class EvaluationPeriodAutoPhaseService {
    evaluationPeriodRepository;
    evaluationPeriodService;
    logger = new common_1.Logger(EvaluationPeriodAutoPhaseService_1.name);
    constructor(evaluationPeriodRepository, evaluationPeriodService) {
        this.evaluationPeriodRepository = evaluationPeriodRepository;
        this.evaluationPeriodService = evaluationPeriodService;
    }
    get koreaTime() {
        return dayjs_1.default.tz().toDate();
    }
    toKoreaDayjs(date) {
        return dayjs_1.default.tz(date);
    }
    async autoPhaseTransition() {
        this.logger.log('평가기간 자동 단계 변경을 시작합니다...');
        try {
            const now = this.koreaTime;
            const activePeriods = await this.evaluationPeriodRepository.find({
                where: {
                    status: (0, typeorm_2.In)([
                        evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS,
                        evaluation_period_types_1.EvaluationPeriodStatus.WAITING,
                    ]),
                },
            });
            this.logger.log(`조회된 평가기간 수: ${activePeriods.length}개 (진행 중 + 대기 중)`);
            let transitionedCount = 0;
            for (const period of activePeriods) {
                if (period.status === evaluation_period_types_1.EvaluationPeriodStatus.WAITING) {
                    const wasStarted = await this.checkAndStartPeriod(period, now);
                    if (wasStarted) {
                        transitionedCount++;
                        const updatedPeriod = await this.evaluationPeriodRepository.findOne({
                            where: { id: period.id },
                        });
                        if (updatedPeriod) {
                            const wasTransitioned = await this.checkAndTransitionPhase(updatedPeriod, now);
                            if (wasTransitioned) {
                                transitionedCount++;
                            }
                        }
                        continue;
                    }
                }
                if (period.status === evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS) {
                    const wasTransitioned = await this.checkAndTransitionPhase(period, now);
                    if (wasTransitioned) {
                        transitionedCount++;
                    }
                }
            }
            this.logger.log(`평가기간 자동 단계 변경이 완료되었습니다. 전이된 평가기간 수: ${transitionedCount}개`);
            return transitionedCount;
        }
        catch (error) {
            this.logger.error('평가기간 자동 단계 변경 중 오류 발생:', error);
            return 0;
        }
    }
    async checkAndStartPeriod(period, now) {
        if (!period.startDate) {
            this.logger.debug(`평가기간 ${period.id}의 시작일이 설정되지 않았습니다.`);
            return false;
        }
        const koreaNow = this.toKoreaDayjs(now);
        const koreaStartDate = this.toKoreaDayjs(period.startDate);
        const shouldStart = koreaNow.isAfter(koreaStartDate) || koreaNow.isSame(koreaStartDate);
        if (shouldStart) {
            try {
                this.logger.log(`평가기간 ${period.id} 시작일 도달로 인한 상태 변경: WAITING → IN_PROGRESS (시작일: ${koreaStartDate.format('YYYY-MM-DD HH:mm:ss KST')}, 현재: ${koreaNow.format('YYYY-MM-DD HH:mm:ss KST')})`);
                await this.evaluationPeriodService.시작한다(period.id, 'SYSTEM_AUTO_START');
                const updatedPeriod = await this.evaluationPeriodRepository.findOne({
                    where: { id: period.id },
                });
                if (updatedPeriod && !updatedPeriod.currentPhase) {
                    this.logger.log(`평가기간 ${period.id} 단계가 설정되지 않아 EVALUATION_SETUP으로 설정합니다.`);
                    await this.evaluationPeriodService.단계_변경한다(period.id, evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP, 'SYSTEM_AUTO_START');
                }
                this.logger.log(`평가기간 ${period.id} 상태 변경 완료: WAITING → IN_PROGRESS`);
                return true;
            }
            catch (error) {
                this.logger.error(`평가기간 ${period.id} 상태 변경 실패: ${error.message}`, error.stack);
                return false;
            }
        }
        return false;
    }
    async checkAndTransitionPhase(period, now) {
        const currentPhase = period.currentPhase;
        if (!currentPhase) {
            this.logger.warn(`평가기간 ${period.id}의 현재 단계가 설정되지 않았습니다.`);
            return false;
        }
        const nextPhase = this.getNextPhase(currentPhase);
        if (!nextPhase) {
            return false;
        }
        const shouldTransition = this.shouldTransitionToNextPhase(period, nextPhase, now);
        if (shouldTransition) {
            try {
                this.logger.log(`평가기간 ${period.id} 단계 변경: ${currentPhase} → ${nextPhase}`);
                await this.evaluationPeriodService.단계_변경한다(period.id, nextPhase, 'SYSTEM_AUTO_PHASE');
                this.logger.log(`평가기간 ${period.id} 단계 변경 완료: ${currentPhase} → ${nextPhase}`);
                return true;
            }
            catch (error) {
                this.logger.error(`평가기간 ${period.id} 단계 변경 실패: ${error.message}`, error.stack);
                return false;
            }
        }
        return false;
    }
    getNextPhase(currentPhase) {
        const phaseSequence = {
            [evaluation_period_types_1.EvaluationPeriodPhase.WAITING]: evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP,
            [evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP]: evaluation_period_types_1.EvaluationPeriodPhase.PERFORMANCE,
            [evaluation_period_types_1.EvaluationPeriodPhase.PERFORMANCE]: evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION,
            [evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION]: evaluation_period_types_1.EvaluationPeriodPhase.PEER_EVALUATION,
            [evaluation_period_types_1.EvaluationPeriodPhase.PEER_EVALUATION]: evaluation_period_types_1.EvaluationPeriodPhase.CLOSURE,
            [evaluation_period_types_1.EvaluationPeriodPhase.CLOSURE]: null,
        };
        return phaseSequence[currentPhase] || null;
    }
    shouldTransitionToNextPhase(period, nextPhase, now) {
        const currentPhase = period.currentPhase;
        const currentPhaseDeadline = this.getPhaseDeadline(period, currentPhase);
        if (!currentPhaseDeadline) {
            this.logger.debug(`평가기간 ${period.id}의 ${currentPhase} 단계 마감일이 설정되지 않았습니다.`);
            return false;
        }
        const koreaNow = this.toKoreaDayjs(now);
        const koreaDeadline = this.toKoreaDayjs(currentPhaseDeadline);
        this.logger.log('koreaNow', koreaNow.format('YYYY-MM-DD HH:mm:ss KST'));
        this.logger.log('koreaDeadline', koreaDeadline.format('YYYY-MM-DD HH:mm:ss KST'));
        const shouldTransition = koreaNow.isAfter(koreaDeadline) || koreaNow.isSame(koreaDeadline);
        if (shouldTransition) {
            this.logger.debug(`평가기간 ${period.id}: ${currentPhase} 단계 마감일 도달 (마감일: ${koreaDeadline.format('YYYY-MM-DD HH:mm:ss KST')}, 현재: ${koreaNow.format('YYYY-MM-DD HH:mm:ss KST')})`);
        }
        return shouldTransition;
    }
    getPhaseDeadline(period, phase) {
        switch (phase) {
            case evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP:
                return period.evaluationSetupDeadline || null;
            case evaluation_period_types_1.EvaluationPeriodPhase.PERFORMANCE:
                return period.performanceDeadline || null;
            case evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION:
                return period.selfEvaluationDeadline || null;
            case evaluation_period_types_1.EvaluationPeriodPhase.PEER_EVALUATION:
                return period.peerEvaluationDeadline || null;
            case evaluation_period_types_1.EvaluationPeriodPhase.CLOSURE:
                return period.peerEvaluationDeadline || null;
            default:
                return null;
        }
    }
    async manualPhaseTransition(periodId) {
        this.logger.log(`평가기간 ${periodId} 수동 단계 전이를 시작합니다...`);
        try {
            const period = await this.evaluationPeriodRepository.findOne({
                where: { id: periodId },
            });
            if (!period) {
                this.logger.warn(`평가기간 ${periodId}를 찾을 수 없습니다.`);
                return null;
            }
            if (period.status !== evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS) {
                this.logger.warn(`평가기간 ${periodId}가 진행 중 상태가 아닙니다. (현재 상태: ${period.status})`);
                return null;
            }
            await this.checkAndTransitionPhase(period, this.koreaTime);
            return await this.evaluationPeriodRepository.findOne({
                where: { id: periodId },
            });
        }
        catch (error) {
            this.logger.error(`평가기간 ${periodId} 수동 단계 전이 실패:`, error);
            throw error;
        }
    }
    async checkAllActivePeriods() {
        this.logger.log('모든 진행 중인 평가기간의 단계 전이를 확인합니다...');
        const now = this.koreaTime;
        const activePeriods = await this.evaluationPeriodRepository.find({
            where: {
                status: evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS,
            },
        });
        let transitionedCount = 0;
        for (const period of activePeriods) {
            const beforePhase = period.currentPhase;
            await this.checkAndTransitionPhase(period, now);
            const updatedPeriod = await this.evaluationPeriodRepository.findOne({
                where: { id: period.id },
            });
            if (updatedPeriod && updatedPeriod.currentPhase !== beforePhase) {
                transitionedCount++;
            }
        }
        this.logger.log(`총 ${transitionedCount}개의 평가기간이 단계 전이되었습니다.`);
        return transitionedCount;
    }
    async adjustStatusAndPhaseAfterScheduleUpdate(periodId, changedBy) {
        this.logger.log(`평가기간 ${periodId} 일정 수정 후 상태/단계 자동 조정을 시작합니다...`);
        try {
            const period = await this.evaluationPeriodRepository.findOne({
                where: { id: periodId },
            });
            if (!period) {
                this.logger.warn(`평가기간 ${periodId}를 찾을 수 없습니다.`);
                return null;
            }
            const now = this.koreaTime;
            let statusChanged = false;
            if (period.status === evaluation_period_types_1.EvaluationPeriodStatus.WAITING &&
                period.startDate &&
                now >= period.startDate) {
                this.logger.log(`평가기간 ${periodId} 시작일 도달로 인한 상태 변경: WAITING → IN_PROGRESS`);
                await this.evaluationPeriodService.시작한다(periodId, changedBy);
                statusChanged = true;
            }
            const updatedPeriod = await this.evaluationPeriodRepository.findOne({
                where: { id: periodId },
            });
            if (!updatedPeriod) {
                return null;
            }
            if (updatedPeriod.status === evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS) {
                if (!updatedPeriod.currentPhase) {
                    this.logger.log(`평가기간 ${periodId} 단계가 설정되지 않아 EVALUATION_SETUP으로 설정합니다.`);
                    await this.evaluationPeriodService.단계_변경한다(periodId, evaluation_period_types_1.EvaluationPeriodPhase.EVALUATION_SETUP, changedBy);
                }
                let maxIterations = 10;
                let hasTransitioned = true;
                while (hasTransitioned && maxIterations > 0) {
                    const currentPeriod = await this.evaluationPeriodRepository.findOne({
                        where: { id: periodId },
                    });
                    if (!currentPeriod || !currentPeriod.currentPhase) {
                        break;
                    }
                    hasTransitioned = await this.checkAndTransitionPhase(currentPeriod, now);
                    maxIterations--;
                }
                return await this.evaluationPeriodRepository.findOne({
                    where: { id: periodId },
                });
            }
            return updatedPeriod;
        }
        catch (error) {
            this.logger.error(`평가기간 ${periodId} 일정 수정 후 상태/단계 자동 조정 실패:`, error);
            throw error;
        }
    }
};
exports.EvaluationPeriodAutoPhaseService = EvaluationPeriodAutoPhaseService;
exports.EvaluationPeriodAutoPhaseService = EvaluationPeriodAutoPhaseService = EvaluationPeriodAutoPhaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        evaluation_period_service_1.EvaluationPeriodService])
], EvaluationPeriodAutoPhaseService);
//# sourceMappingURL=evaluation-period-auto-phase.service.js.map