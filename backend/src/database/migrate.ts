import 'reflect-metadata';
import { AppDataSource } from './data-source';

/**
 * Programmatic migration runner. Kept as a script (rather than the TypeORM CLI)
 * so migrations, seeding, and container startup share one code path and one set
 * of connection options.
 *
 *   npm run migration:run
 *   npm run migration:revert
 *   npm run migration:show
 */
async function main(): Promise<void> {
  const command = process.argv[2] ?? 'run';

  await AppDataSource.initialize();

  try {
    switch (command) {
      case 'run': {
        const applied = await AppDataSource.runMigrations({
          transaction: 'all',
        });
        console.log(
          applied.length > 0
            ? `applied ${applied.length} migration(s): ${applied.map((m) => m.name).join(', ')}`
            : 'no pending migrations',
        );
        break;
      }
      case 'revert': {
        await AppDataSource.undoLastMigration({ transaction: 'all' });
        console.log('reverted last migration');
        break;
      }
      case 'show': {
        const pending = await AppDataSource.showMigrations();
        console.log(
          pending ? 'pending migrations exist' : 'schema is up to date',
        );
        break;
      }
      default:
        throw new Error(`unknown migration command: ${command}`);
    }
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
