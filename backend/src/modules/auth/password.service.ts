import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';

const scrypt: (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer> = promisify(scryptCallback);

/**
 * Password hashing on top of `node:crypto` only.
 *
 * scrypt is memory-hard, ships in the standard library, and adds no native build
 * step — the submission has to run on an evaluator's machine with nothing but
 * Node installed. `bcrypt` would be an equally reasonable choice; both are
 * "slow on purpose" so a stolen table cannot be attacked at billions of guesses
 * per second.
 */
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH).toString('hex');
    const derived = await scrypt(password, salt, KEY_LENGTH);
    return `scrypt:${salt}:${derived.toString('hex')}`;
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [algorithm, salt, hash] = stored.split(':');
    if (algorithm !== 'scrypt' || !salt || !hash) {
      return false;
    }

    const expected = Buffer.from(hash, 'hex');
    const actual = await scrypt(password, salt, expected.length);
    // Constant-time compare: a length or content mismatch must not leak how much
    // of a guess was correct.
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }
}
