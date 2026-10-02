export type Role = 'passenger' | 'driver';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  teslaPayBalancePoysha: number;
};

export type AuthSession = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: SessionUser;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type Zone = {
  id: string;
  code: string;
  name: string;
  xKm: number;
  yKm: number;
  corridors: { code: string; name: string }[];
};