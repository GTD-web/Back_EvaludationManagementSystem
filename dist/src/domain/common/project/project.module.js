"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const project_entity_1 = require("./project.entity");
const project_service_1 = require("./project.service");
const project_test_service_1 = require("./project-test.service");
const employee_entity_1 = require("../employee/employee.entity");
const evaluation_project_assignment_entity_1 = require("../../core/evaluation-project-assignment/evaluation-project-assignment.entity");
let ProjectModule = class ProjectModule {
};
exports.ProjectModule = ProjectModule;
exports.ProjectModule = ProjectModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([project_entity_1.Project, employee_entity_1.Employee, evaluation_project_assignment_entity_1.EvaluationProjectAssignment]),
        ],
        providers: [project_service_1.ProjectService, project_test_service_1.ProjectTestService],
        exports: [project_service_1.ProjectService, project_test_service_1.ProjectTestService, typeorm_1.TypeOrmModule],
    })
], ProjectModule);
//# sourceMappingURL=project.module.js.map