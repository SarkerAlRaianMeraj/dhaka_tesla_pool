import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parseDurationSeconds } from '../../config/duration';
import { User } from '../users/user.entity';
import {
  AuthSessionView,
  AuthUserView,
  RegisteredUserView,
  TokenClaims,
  toAuthUserView,
} from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  private readonly tokenLifetimeSeconds: number;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    // The response reports the same lifetime the token was signed with, so a
    // client never has to guess when to refresh.
    this.tokenLifetimeSeconds = parseDurationSeconds(
      config.getOrThrow<string>('jwt.expiresIn'),
    );
  }

  async register(dto: RegisterDto): Promise<RegisteredUserView> {
    const email = normaliseEmail(dto.email);
    if (await this.users.findOne({ where: { email } })) {
      // The check plus the unique index is deliberate: the index is what actually
      // guarantees uniqueness, this only exists to return a clean 409 instead of a
      // driver error when two people register in the same instant.
      throw new ConflictException('An account with this email already exists');
    }

    const user = this.users.create({
      name: dto.name.trim(),
      email,
      role: dto.role,
      passwordHash: await this.passwords.hash(dto.password),
      teslaPayBalancePoysha: 0,
    });
    const saved = await this.users.save(user);

    return {
      message: 'Account created. You can sign in now.',
      user: toAuthUserView(saved),
    };
  }

  async login(dto: LoginDto): Promise<AuthSessionView> {
    const email = normaliseEmail(dto.email);
    // `passwordHash` is `select: false` on the entity, so it has to be requested
    // explicitly. This is the only query in the app that reads that column.
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    // One message for "no such account" and "wrong password" alike: telling them
    // apart would confirm which addresses are registered.
    const valid = user
      ? await this.passwords.verify(dto.password, user.passwordHash)
      : false;
    if (!user || !valid) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    return {
      accessToken: await this.signToken(user),
      tokenType: 'Bearer',
      expiresInSeconds: this.tokenLifetimeSeconds,
      user: toAuthUserView(user),
    };
  }

  /** Re-reads the caller from the database instead of echoing the JWT back, so a
   * changed name or TeslaPay balance shows up immediately (NFR-1). */
  async profile(userId: string): Promise<AuthUserView> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Account no longer exists');
    }
    return toAuthUserView(user);
  }

  private async signToken(user: User): Promise<string> {
    const claims: TokenClaims = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return this.jwt.signAsync(claims);
  }
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}
