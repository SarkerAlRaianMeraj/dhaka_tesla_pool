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
import { parseDurationSeconds } from '../config/duration';
import { User } from '../user/user.entity';
import {
  AuthUserView,
  RegisteredUserView,
  TokenClaims,
  toAuthUserView,
} from './auth.types';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  private readonly tokenLifetimeSeconds: number;

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // The login response reports the same lifetime the token was signed with, so
    // a client never has to guess when to refresh.
    this.tokenLifetimeSeconds = parseDurationSeconds(
      this.configService.getOrThrow<string>('jwt.expiresIn'),
    );
  }

  async registerUser(
    createUserDto: CreateUserDto,
  ): Promise<RegisteredUserView> {
    const email = createUserDto.email.trim().toLowerCase();
    if (await this.usersRepository.findOne({ where: { email } })) {
      // The check plus the unique index is deliberate: the index is what actually
      // guarantees uniqueness, this only exists to return a clean 409 instead of a
      // driver error when two people register in the same instant.
      throw new ConflictException('An account with this email already exists');
    }

    const user = this.usersRepository.create({
      name: createUserDto.name.trim(),
      email,
      role: createUserDto.role,
      passwordHash: await this.passwordService.hash(createUserDto.password),
      teslaPayBalancePoysha: 0,
    });
    const saved = await this.usersRepository.save(user);

    return {
      message: 'Account created. You can sign in now.',
      user: toAuthUserView(saved),
    };
  }

  /** Verifies the credentials and returns the signed token; the controller puts
   * it in an httpOnly cookie rather than in the response body (D15). */
  async login(
    loginDto: LoginDto,
  ): Promise<{ token: string; user: AuthUserView }> {
    const email = loginDto.email.trim().toLowerCase();
    // `passwordHash` is `select: false` on the entity, so it has to be requested
    // explicitly. This is the only query in the app that reads that column.
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    // One message for "no such account" and "wrong password" alike: telling them
    // apart would confirm which addresses are registered.
    const valid = user
      ? await this.passwordService.verify(loginDto.password, user.passwordHash)
      : false;
    if (!user || !valid) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    return {
      token: await this.signToken(user),
      user: toAuthUserView(user),
    };
  }

  /** Re-reads the caller from the database instead of echoing the JWT back, so a
   * changed name or TeslaPay balance shows up immediately (NFR-1). */
  async getProfileByUserId(userId: string): Promise<AuthUserView> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Account no longer exists');
    }
    return toAuthUserView(user);
  }

  getTokenLifetimeSeconds(): number {
    return this.tokenLifetimeSeconds;
  }

  /** True in production only, so the cookie is not sent over plain HTTP in
   * development where the app runs on localhost. */
  isSecureCookie(): boolean {
    return this.configService.get<string>('app.env') === 'production';
  }

  private async signToken(user: User): Promise<string> {
    const claims: TokenClaims = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return this.jwtService.signAsync(claims);
  }
}
