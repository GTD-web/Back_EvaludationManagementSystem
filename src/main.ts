import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { join } from 'path';
import { setupSwagger } from '../libs/config/swagger.config';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import express from 'express';
import { AdminInterfaceModule } from './interface/admin/admin-interface.module';
import { UserInterfaceModule } from './interface/user/user-interface.module';
import { EvaluatorInterfaceModule } from './interface/evaluator/evaluator-interface.module';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// dayjs 플러그인 설정 (한국 시간대)
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Seoul');

// Vercel 서버리스 함수를 위한 전역 변수
let cachedApp: express.Application;

async function bootstrap() {
  const isVercel = !!process.env.VERCEL;
  let app: NestExpressApplication;
  let expressApp: express.Application;

  if (isVercel) {
    // Vercel 환경: Express 앱 생성
    expressApp = express();
    app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(expressApp),
      {
        bodyParser: true,
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      },
    );
  } else {
    // 로컬 환경: 일반 NestJS 앱 생성
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bodyParser: true,
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
  }

  // ConfigService 가져오기
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 정적 파일 서빙 설정 (public 폴더)
  app.useStaticAssets(join(process.cwd(), 'public'));

  // CORS 설정 - 전체 허용
  app.enableCors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
    exposedHeaders: '*',
    credentials: false, // origin이 '*'일 때는 credentials를 false로 설정해야 함
  });

  // 관리자용 Swagger 설정
  setupSwagger(app, {
    title: 'Lumir Admin API (v1.0)',
    description: '루미르 평가 관리 시스템 - 관리자용 API 문서입니다.',
    version: '1.0',
    path: 'admin/api-docs',
    includeModules: [AdminInterfaceModule],
  });

  // 사용자용 Swagger 설정
  setupSwagger(app, {
    title: 'Lumir User API',
    description: '루미르 평가 관리 시스템 - 일반 사용자용 API 문서입니다.',
    version: '1.0',
    path: 'user/api-docs',
    includeModules: [UserInterfaceModule],
  });

  // 평가자용 Swagger 설정
  setupSwagger(app, {
    title: 'Lumir Evaluator API',
    description: '루미르 평가 관리 시스템 - 평가자용 API 문서입니다.',
    version: '1.0',
    path: 'evaluator/api-docs',
    includeModules: [EvaluatorInterfaceModule],
  });

  if (isVercel) {
    // Vercel 환경: 앱 초기화 후 Express 앱 반환
    await app.init();
    cachedApp = expressApp!;
    return expressApp!;
  } else {
    // 로컬 환경: 포트 리스닝
    const port = configService.get<number>('PORT', 4000);
    await app.listen(port);

    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(
      `📚 Admin API documentation: http://localhost:${port}/admin/api-docs`,
    );
    console.log(
      `📚 User API documentation: http://localhost:${port}/user/api-docs`,
    );
    console.log(
      `📚 Evaluator API documentation: http://localhost:${port}/evaluator/api-docs`,
    );
  }
}

// Vercel 서버리스 함수 핸들러
export default async function handler(
  req: express.Request,
  res: express.Response,
) {
  try {
    if (!cachedApp) {
      await bootstrap();
    }
    return new Promise((resolve, reject) => {
      cachedApp!(req, res, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  } catch (error) {
    console.error('Error in Vercel handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 로컬 개발 환경에서만 bootstrap 실행
if (require.main === module) {
  bootstrap();
}
