import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to specific roles, enforced by `RolesGuard`. Kept separate
 * from `JwtAuthGuard` on purpose: "who are you" and "what may you do" are two
 * different questions, and separating them means every new endpoint makes both
 * decisions explicitly instead of by accident.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
