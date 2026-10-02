import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/authenticated-user';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ACCESS_TOKEN_COOKIE } from './auth.cookie';
import { AuthService } from './auth.service';
import {
  AuthUserView,
  LoginResponseView,
  RegisteredUserView,
} from './auth.types';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() createUserDto: CreateUserDto): Promise<RegisteredUserView> {
    return this.authService.registerUser(createUserDto);
  }

  @Post('login')
  // 200 rather than the 201 a POST returns by default: nothing was created.
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseView> {
    const { token, user } = await this.authService.login(loginDto);

    // The JWT goes into an httpOnly cookie (D15), so script running in the browser
    // cannot read it. `passthrough` keeps Nest in charge of serialising the body
    // while this method still sets the header.
    response.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.authService.isSecureCookie(),
      maxAge: this.authService.getTokenLifetimeSeconds() * 1000,
      path: '/',
    });

    return {
      message: 'Signed in.',
      expiresInSeconds: this.authService.getTokenLifetimeSeconds(),
      user,
    };
  }

  @Post('logout')
  // Unauthenticated by design: signing out must succeed even if the token has
  // already expired, otherwise a stale cookie would be stuck in the browser.
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response): { message: string } {
    response.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    return { message: 'Signed out.' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserView> {
    return this.authService.getProfileByUserId(user.id);
  }
}
