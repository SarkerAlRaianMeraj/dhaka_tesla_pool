import { Role } from '../../common/enums/role.enum';

/**
 * Response shapes for the auth module. The API returns these narrow views instead
 * of the `User` entity, so `passwordHash` cannot leak by accident: the column is
 * already excluded at the database level, and this is the second lock.
 */
export type AuthUserView = {
  id: string;
  name: string;
  email: string;
  role: string;
  teslaPayBalancePoysha: number;
};

export type AuthSessionView = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: AuthUserView;
};

export type RegisteredUserView = {
  message: string;
  user: AuthUserView;
};

/** Claims signed into the JWT. `role` is what the guards authorise on. */
export type TokenClaims = {
  sub: string;
  email: string;
  name: string;
  role: string;
};

export function toAuthUserView(user: {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  teslaPayBalancePoysha: number;
}): AuthUserView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    teslaPayBalancePoysha: Number(user.teslaPayBalancePoysha),
  };
}
