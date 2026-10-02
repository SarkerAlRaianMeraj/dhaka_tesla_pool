import { Controller, Get, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

/**
 * Liveness/readiness probe used by Docker Compose and by free-tier hosts.
 * It intentionally checks the database too: an API that cannot reach Postgres
 * cannot serve a single ride, so it must not report healthy.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () =>
        this.db.pingCheck('database', {
          timeout: 3000,
          connection: this.dataSource,
        }),
    ]);
  }
}
