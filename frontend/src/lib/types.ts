export type Role = "passenger" | "driver";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  teslaPayBalancePoysha: number;
};

/** The login response body carries no token - it travels in an httpOnly cookie. */
export type LoginResponse = {
  message: string;
  expiresInSeconds: number;
  user: SessionUser;
};

export type RegisterResponse = {
  message: string;
  user: SessionUser;
};

export type Zone = {
  id: string;
  code: string;
  name: string;
  xKm: number;
  yKm: number;
  corridors: { code: string; name: string }[];
};