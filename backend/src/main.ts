import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
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
  app.enableCors({
    origin: corsOrigin.split(','),
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
