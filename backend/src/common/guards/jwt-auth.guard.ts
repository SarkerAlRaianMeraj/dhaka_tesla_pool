import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { isRole } from '../enums/role.enum';
import { ACCESS_TOKEN_COOKIE } from '../../auth/auth.cookie';

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
};

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

/**
 * The single entry point for authentication. Every non-public route declares it
 * so that "is this endpoint protected?" is answered by looking at one decorator
 * rather than by auditing the module wiring.
 *
 * The guard verifies the signature and expiry and then rebuilds the principal
 * from the payload. A tampered role claim fails the signature check, and a role
 * that is not a real role is rejected here rather than being allowed to fall
 * through to a default.
 */
@Injectable()
export class JwtAuthGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      // The reason is deliberately not echoed: distinguishing "expired" from
      // "invalid signature" tells an attacker which of the two they got right.
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!payload.sub || !isRole(payload.role)) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    return true;
  }
}

/**
 * The cookie is the browser path (D15: httpOnly, so JavaScript cannot read it).
 * The `Authorization: Bearer` header is still accepted so that `curl`, Postman,
 * and the scripts used to demonstrate the API work without a cookie jar. A caller
 * that presents both must present the same identity, so the cookie wins and the
 * header is only a fallback.
 */
function extractToken(request: Request): string | undefined {
  const cookies = request.cookies as Record<string, string> | undefined;
  const cookieToken = cookies?.[ACCESS_TOKEN_COOKIE];
  if (cookieToken && cookieToken.length > 0) {
    return cookieToken;
  }

  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return undefined;
  }
  const bearerToken = header.slice('Bearer '.length).trim();
  return bearerToken.length > 0 ? bearerToken : undefined;
}
