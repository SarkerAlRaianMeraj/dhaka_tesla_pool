import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'email must be a valid address' })
  @MaxLength(180)
  email: string;

  @IsString()
  @MinLength(1, { message: 'password is required' })
  @MaxLength(72)
  password: string;
}
