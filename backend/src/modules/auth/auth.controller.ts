import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/auth/authenticated-user';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import type {
  AuthSessionView,
  AuthUserView,
  RegisteredUserView,
} from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<RegisteredUserView> {
    return this.auth.register(dto);
  }

  @Post('login')
  // 200 rather than the 201 a POST returns by default: nothing was created.
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthSessionView> {
    return this.auth.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserView> {
    return this.auth.profile(user.id);
  }
}
