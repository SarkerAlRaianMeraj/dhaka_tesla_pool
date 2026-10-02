import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_HOST: string = 'localhost';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DATABASE_PORT: number = 5432;

  @IsString()
  @IsNotEmpty()
  DATABASE_USER: string = 'postgres';

  @IsString()
  DATABASE_PASSWORD: string = '';

  @IsString()
  @IsNotEmpty()
  DATABASE_NAME: string = 'dhaka_tesla_pool';

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  DATABASE_SSL: boolean = false;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string = 'dev-only-insecure-secret-change-me-32-chars';

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN: string = '1d';

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:3001';

  @IsString()
  @IsNotEmpty()
  SEED_DEMO_SCENARIO: string = 'false';
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    exposeDefaultValues: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map(
        (error) =>
          `  - ${error.property}: ${Object.values(error.constraints ?? {}).join(', ')}`,
      )
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return validated;
}
