import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const port = config.get<number>('app.port');
  const corsOrigin = config.get<string>('app.corsOrigin');
  if (port === undefined || corsOrigin === undefined) {
    throw new Error('app.port and app.corsOrigin must be configured');
  }

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  // Reads the httpOnly session cookie. `cookie-parser` is not Express middleware
  // that Nest wraps for us, so it is registered explicitly.
  app.use(cookieParser());
  app.enableCors({
    origin: corsOrigin.split(','),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    // Required for the browser to send and store the session cookie. The origin
    // list above stays explicit, because `origin: true` would reflect any origin
    // and pair it with credentials.
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');

  new Logger('Bootstrap').log(
    `Dhaka Tesla Pool API ready on http://localhost:${port}/api/v1 [${config.get<string>('app.env')}]`,
  );
}

void bootstrap();
