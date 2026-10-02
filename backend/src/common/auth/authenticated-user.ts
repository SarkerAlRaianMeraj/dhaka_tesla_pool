import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../enums/role.enum';

/**
 * What the API knows about the caller. It is built from the verified JWT, never
 * from the request body, so a client cannot claim a role it does not have
 * (NFR-1). Handlers read this instead of re-parsing the token.
 */
export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{
      user: AuthenticatedUser;
    }>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
