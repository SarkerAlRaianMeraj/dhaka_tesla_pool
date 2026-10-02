import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from './jwt-auth.guard';
import { Role } from '../enums/role.enum';

/**
 * Runs after `JwtAuthGuard` and answers the second question: may this caller do
 * this? A route with no `@Roles()` is open to any authenticated user, so the
 * decorator is the only place a role restriction can be introduced.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      // Unreachable in practice: `JwtAuthGuard` runs first on every protected
      // route. Kept so the guard fails closed if the order ever changes.
      throw new ForbiddenException('Role required');
    }

    if (!required.includes(user.role)) {
      throw new ForbiddenException(
        `This action is restricted to: ${required.join(', ')}`,
      );
    }
    return true;
  }
}
