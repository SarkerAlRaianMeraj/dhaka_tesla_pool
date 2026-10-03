import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

type ExpiresIn = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

/**
 * App-wide authentication infrastructure: token signing plus the two guards that
 * every protected route composes.
 *
 * Feature modules import this explicitly rather than relying on a global module,
 * because the import list is then a readable answer to "what authorization does
 * this module depend on?" — and that is the question NFR-1 asks a reviewer.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const expiresIn = config.getOrThrow<string>('jwt.expiresIn');
        return {
          secret: config.getOrThrow<string>('jwt.secret'),
          // `expiresIn` is typed as the `ms` template-literal type. The runtime
          // accepts any duration string, and `env.validation.ts` has already
          // checked the format, so the validated string is asserted here.
          signOptions: {
            expiresIn: expiresIn as ExpiresIn,
            algorithm: 'HS256',
          },
          // Stated rather than inferred. `jsonwebtoken` will not accept `none` or
          // an RS256 token when the secret is a plain string, so this is
          // hardening; but relying on that default means the accepted algorithm is
          // a property of a dependency's internals rather than of this file.
          verifyOptions: { algorithms: ['HS256'] },
        };
      },
    }),
  ],
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthCoreModule {}
