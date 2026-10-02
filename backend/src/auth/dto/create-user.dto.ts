import {
  IsEmail,
  IsEnum,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

/**
 * Sign-up for both roles. The brief's actors are all Dhaka residents with an
 * email and a name, and separate passenger/driver forms would only duplicate the
 * same fields; the chosen role decides what the account is allowed to do.
 */
export class CreateUserDto {
  @IsString()
  @Length(2, 120, { message: 'name must be 2-120 characters' })
  name: string;

  @IsEmail({}, { message: 'email must be a valid address' })
  @MaxLength(180)
  email: string;

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  // bcrypt hashes at most 72 bytes; anything longer is silently ignored by the
  // algorithm, which would make two different passwords interchangeable.
  @MaxLength(72, { message: 'password must be at most 72 characters' })
  password: string;

  @IsEnum(Role, { message: 'role must be passenger or driver' })
  role: Role;
}
