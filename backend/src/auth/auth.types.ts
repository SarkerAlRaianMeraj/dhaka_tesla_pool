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

/**
 * The token is deliberately absent (D15): it travels in an httpOnly cookie that
 * JavaScript cannot read, so the body carries only what a UI needs to render.
 */
export type LoginResponseView = {
  message: string;
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
  role: string;
  teslaPayBalancePoysha: number;
}): AuthUserView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    // `numeric` columns arrive as strings in PostgreSQL, so this normalises the
    // type the API promises to the type the client receives.
    teslaPayBalancePoysha: Number(user.teslaPayBalancePoysha),
  };
}
