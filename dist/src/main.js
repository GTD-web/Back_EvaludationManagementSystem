"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const platform_express_1 = require("@nestjs/platform-express");
const path_1 = require("path");
const swagger_config_1 = require("../libs/config/swagger.config");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const express_1 = __importDefault(require("express"));
const admin_interface_module_1 = require("./interface/admin/admin-interface.module");
const user_interface_module_1 = require("./interface/user/user-interface.module");
const evaluator_interface_module_1 = require("./interface/evaluator/evaluator-interface.module");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.tz.setDefault('Asia/Seoul');
let cachedApp;
async function bootstrap() {
    const isVercel = !!process.env.VERCEL;
    let app;
    let expressApp;
    if (isVercel) {
        expressApp = (0, express_1.default)();
        app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressApp), {
            bodyParser: true,
            logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        });
    }
    else {
        app = await core_1.NestFactory.create(app_module_1.AppModule, {
            bodyParser: true,
            logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        });
    }
    const configService = app.get(config_1.ConfigService);
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'public'));
    app.enableCors({
        origin: '*',
        methods: '*',
        allowedHeaders: '*',
        exposedHeaders: '*',
        credentials: false,
    });
    (0, swagger_config_1.setupSwagger)(app, {
        title: 'Lumir Admin API',
        description: '루미르 평가 관리 시스템 - 관리자용 API 문서입니다.',
        version: '1.0',
        path: 'admin/api-docs',
        includeModules: [admin_interface_module_1.AdminInterfaceModule],
    });
    (0, swagger_config_1.setupSwagger)(app, {
        title: 'Lumir User API',
        description: '루미르 평가 관리 시스템 - 일반 사용자용 API 문서입니다.',
        version: '1.0',
        path: 'user/api-docs',
        includeModules: [user_interface_module_1.UserInterfaceModule],
    });
    (0, swagger_config_1.setupSwagger)(app, {
        title: 'Lumir Evaluator API',
        description: '루미르 평가 관리 시스템 - 평가자용 API 문서입니다.',
        version: '1.0',
        path: 'evaluator/api-docs',
        includeModules: [evaluator_interface_module_1.EvaluatorInterfaceModule],
    });
    if (isVercel) {
        await app.init();
        cachedApp = expressApp;
        return expressApp;
    }
    else {
        const port = configService.get('PORT', 4000);
        await app.listen(port);
        console.log(`🚀 Application is running on: http://localhost:${port}`);
        console.log(`📚 Admin API documentation: http://localhost:${port}/admin/api-docs`);
        console.log(`📚 User API documentation: http://localhost:${port}/user/api-docs`);
        console.log(`📚 Evaluator API documentation: http://localhost:${port}/evaluator/api-docs`);
    }
}
async function handler(req, res) {
    try {
        if (!cachedApp) {
            await bootstrap();
        }
        return new Promise((resolve, reject) => {
            cachedApp(req, res, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    }
    catch (error) {
        console.error('Error in Vercel handler:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
if (require.main === module) {
    bootstrap();
}
//# sourceMappingURL=main.js.map