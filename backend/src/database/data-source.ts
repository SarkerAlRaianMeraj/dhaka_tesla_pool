import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { buildConfiguration } from '../config/configuration';
import { validateEnv } from '../config/env.validation';

const env = validateEnv(process.env);
const config = buildConfiguration(env);

/**
 * Options shared by the running app and the migration/seed scripts so a schema
 * change can never be applied to one connection shape and not the other.
 */
export function buildDataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.database,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
    migrationsRun: false,
  };
}

export const AppDataSource = new DataSource(buildDataSourceOptions());
export default AppDataSource;
