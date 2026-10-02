import 'reflect-metadata';
// Loads backend/.env for standalone scripts (migrations, seeds). The running app
// gets the same values through ConfigModule, so both paths read one file.
import 'dotenv/config';
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
