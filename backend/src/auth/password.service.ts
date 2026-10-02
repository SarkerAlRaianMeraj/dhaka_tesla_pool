import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

/**
 * Password hashing with bcrypt, as required by `backend/rules.md`.
 *
 * `bcryptjs` is the pure-JavaScript build of the same algorithm, chosen over the
 * native `bcrypt` package because the submission has to build and run on a machine
 * with nothing but Node installed — no compiler toolchain, no rebuild after a
 * Node upgrade.
 *
 * Ten rounds is the standard default: roughly 60-100ms per hash on typical server
 * hardware, which is slow on purpose, since a stolen table is attacked at guesses
 * per second and not per hash.
 */
const SALT_ROUNDS = 10;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verify(password: string, stored: string): Promise<boolean> {
    return bcrypt.compare(password, stored);
  }
}
