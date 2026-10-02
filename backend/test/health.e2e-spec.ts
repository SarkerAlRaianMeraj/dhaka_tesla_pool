import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports healthy while the database is reachable', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    const body = response.body as {
      status: string;
      info: Record<string, { status: string }>;
    };

    expect(body.status).toBe('ok');
    expect(body.info.database?.status).toBe('up');
  });

  it('echoes a request id so a client can quote it in a bug report', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', 'phase-0-check')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('phase-0-check');
  });
});
