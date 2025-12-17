"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const ExcelJS = __importStar(require("exceljs"));
const queries_1 = require("./handlers/queries");
let DashboardService = class DashboardService {
    queryBus;
    constructor(queryBus) {
        this.queryBus = queryBus;
    }
    async 직원의_평가기간_현황을_조회한다(evaluationPeriodId, employeeId) {
        const query = new queries_1.GetEmployeeEvaluationPeriodStatusQuery(evaluationPeriodId, employeeId);
        return await this.queryBus.execute(query);
    }
    async 평가기간의_모든_피평가자_현황을_조회한다(evaluationPeriodId, includeUnregistered = false) {
        const query = new queries_1.GetAllEmployeesEvaluationPeriodStatusQuery(evaluationPeriodId, includeUnregistered);
        return await this.queryBus.execute(query);
    }
    async 내가_담당하는_평가대상자_현황을_조회한다(evaluationPeriodId, evaluatorId) {
        const query = new queries_1.GetMyEvaluationTargetsStatusQuery(evaluationPeriodId, evaluatorId);
        return await this.queryBus.execute(query);
    }
    async 사용자_할당_정보를_조회한다(evaluationPeriodId, employeeId, viewerId) {
        const query = new queries_1.GetEmployeeAssignedDataQuery(evaluationPeriodId, employeeId, viewerId);
        return await this.queryBus.execute(query);
    }
    async 담당자의_피평가자_할당_정보를_조회한다(evaluationPeriodId, evaluatorId, employeeId) {
        const query = new queries_1.GetEvaluatorAssignedEmployeesDataQuery(evaluationPeriodId, evaluatorId, employeeId);
        return await this.queryBus.execute(query);
    }
    async 평가기간별_최종평가_목록을_조회한다(evaluationPeriodId) {
        const query = new queries_1.GetFinalEvaluationsByPeriodQuery(evaluationPeriodId);
        return await this.queryBus.execute(query);
    }
    async 직원별_최종평가_목록을_조회한다(employeeId, startDate, endDate) {
        const query = new queries_1.GetFinalEvaluationsByEmployeeQuery(employeeId, startDate, endDate);
        return await this.queryBus.execute(query);
    }
    async 전체_직원별_최종평가_목록을_조회한다(startDate, endDate) {
        const query = new queries_1.GetAllEmployeesFinalEvaluationsQuery(startDate, endDate);
        return await this.queryBus.execute(query);
    }
    async 직원_현황을_엑셀로_생성한다(data, periodName, departmentHierarchy) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('평가 현황');
        const getStatusText = (status) => {
            const statusMap = {
                none: '미설정',
                in_progress: '진행중',
                complete: '완료',
                pending: '대기',
                approved: '승인',
                revision_requested: '재작성 요청',
                revision_completed: '재작성 완료',
            };
            return statusMap[status] || status;
        };
        const departmentOrderMap = new Map();
        let globalOrder = 0;
        const collectDepartmentOrders = (departments, parentOrder = 0) => {
            departments.forEach((dept) => {
                globalOrder++;
                departmentOrderMap.set(dept.name, {
                    departmentName: dept.name,
                    order: dept.order,
                    parentOrder: parentOrder,
                    level: dept.level,
                });
                if (dept.subDepartments && dept.subDepartments.length > 0) {
                    collectDepartmentOrders(dept.subDepartments, dept.order);
                }
            });
        };
        collectDepartmentOrders(departmentHierarchy);
        const groupedData = {};
        data.forEach((item) => {
            const deptName = item.employee?.departmentName || '기타';
            if (!groupedData[deptName]) {
                groupedData[deptName] = [];
            }
            groupedData[deptName].push(item);
        });
        const sortedDepartments = Object.keys(groupedData).sort((a, b) => {
            if (a === '기타')
                return 1;
            if (b === '기타')
                return -1;
            const infoA = departmentOrderMap.get(a);
            const infoB = departmentOrderMap.get(b);
            if (!infoA || !infoB) {
                return a.localeCompare(b, 'ko');
            }
            if (infoA.parentOrder !== infoB.parentOrder) {
                return infoA.parentOrder - infoB.parentOrder;
            }
            if (infoA.order !== infoB.order) {
                return infoA.order - infoB.order;
            }
            return a.localeCompare(b, 'ko');
        });
        for (const department of Object.keys(groupedData)) {
            groupedData[department].sort((a, b) => {
                return (a.employee?.name || '').localeCompare(b.employee?.name || '', 'ko');
            });
        }
        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFFFF' } },
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' },
            },
            alignment: {
                vertical: 'middle',
                horizontal: 'center',
            },
            border: {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            },
        };
        const departmentMergedStyle = {
            font: { bold: true, color: { argb: 'FF000000' } },
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' },
            },
            alignment: {
                vertical: 'middle',
                horizontal: 'center',
            },
            border: {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            },
        };
        const headerRow = worksheet.addRow([
            '부서',
            '이름',
            '직급',
            '1차 평가자',
            '2차 평가자',
            '재임여부',
            '평가선정',
            '자기평가',
            '1차평가',
            '2차평가',
            '동료평가',
            '최종평가',
        ]);
        headerRow.eachCell((cell) => {
            cell.style = headerStyle;
        });
        worksheet.columns = [
            { key: 'department', width: 18 },
            { key: 'name', width: 12 },
            { key: 'rank', width: 10 },
            { key: 'primaryEvaluator', width: 15 },
            { key: 'secondaryEvaluator', width: 20 },
            { key: 'status', width: 10 },
            { key: 'selection', width: 12 },
            { key: 'selfEval', width: 30 },
            { key: 'primaryEval', width: 30 },
            { key: 'secondaryEval', width: 30 },
            { key: 'peerEval', width: 15 },
            { key: 'finalEval', width: 20 },
        ];
        sortedDepartments.forEach((department) => {
            const departmentData = groupedData[department];
            if (!departmentData || departmentData.length === 0) {
                return;
            }
            const departmentStartRow = worksheet.rowCount + 1;
            departmentData.forEach((item) => {
                const primaryEvaluator = item.downwardEvaluation.primary.evaluator?.name || '-';
                const secondaryEvaluators = item.downwardEvaluation.secondary.evaluators
                    .map((e) => e.evaluator.name)
                    .join(', ') || '-';
                const selfEvalStatus = getStatusText(item.selfEvaluation.status);
                const selfEvalScore = item.selfEvaluation.totalScore !== null
                    ? `${item.selfEvaluation.totalScore.toFixed(1)}점`
                    : '-';
                const selfEvalGrade = item.selfEvaluation.grade || '-';
                const selfEvalInfo = `${selfEvalStatus} (${selfEvalScore} / ${selfEvalGrade})`;
                const primaryStatus = getStatusText(item.downwardEvaluation.primary.status);
                const primaryScore = item.downwardEvaluation.primary.totalScore !== null
                    ? `${item.downwardEvaluation.primary.totalScore.toFixed(1)}점`
                    : '-';
                const primaryGrade = item.downwardEvaluation.primary.grade || '-';
                const primaryInfo = `${primaryStatus} (${primaryScore} / ${primaryGrade})`;
                const secondaryStatus = getStatusText(item.downwardEvaluation.secondary.status);
                const secondaryScore = item.downwardEvaluation.secondary.totalScore !== null
                    ? `${item.downwardEvaluation.secondary.totalScore.toFixed(1)}점`
                    : '-';
                const secondaryGrade = item.downwardEvaluation.secondary.grade || '-';
                const secondaryInfo = `${secondaryStatus} (${secondaryScore} / ${secondaryGrade})`;
                const peerStatus = getStatusText(item.peerEvaluation.status);
                const peerInfo = `${peerStatus} (${item.peerEvaluation.completedRequestCount}/${item.peerEvaluation.totalRequestCount})`;
                const finalGrade = item.finalEvaluation.evaluationGrade || '-';
                const finalJobGrade = item.finalEvaluation.jobGrade || '-';
                const finalJobDetailedGrade = item.finalEvaluation.jobDetailedGrade || '-';
                const finalInfo = `${finalGrade} (${finalJobGrade}${finalJobDetailedGrade})`;
                const row = worksheet.addRow({
                    department: item.employee?.departmentName || '-',
                    name: item.employee?.name || '-',
                    rank: item.employee?.rankName || '-',
                    primaryEvaluator: primaryEvaluator,
                    secondaryEvaluator: secondaryEvaluators,
                    status: item.employee?.status || '-',
                    selection: item.isEvaluationTarget ? '포함' : '제외',
                    selfEval: selfEvalInfo,
                    primaryEval: primaryInfo,
                    secondaryEval: secondaryInfo,
                    peerEval: peerInfo,
                    finalEval: finalInfo,
                });
                row.eachCell((cell, colNumber) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
                if (!item.isEvaluationTarget) {
                    row.eachCell((cell, colNumber) => {
                        if (colNumber > 1) {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFE7E6E6' },
                            };
                        }
                    });
                }
            });
            const departmentEndRow = worksheet.rowCount;
            if (departmentStartRow <= departmentEndRow) {
                worksheet.mergeCells(departmentStartRow, 1, departmentEndRow, 1);
                const mergedCell = worksheet.getCell(departmentStartRow, 1);
                mergedCell.style = departmentMergedStyle;
            }
        });
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cqrs_1.QueryBus])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map