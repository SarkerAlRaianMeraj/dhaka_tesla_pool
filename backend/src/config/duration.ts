/**
 * Parses a JWT-style duration (`3600s`, `15m`, `1h`, `7d`) into seconds.
 *
 * Lives beside the other configuration helpers so that the value is validated in
 * one place and the API can tell a client when its token expires without
 * re-implementing the format.
 */
export function parseDurationSeconds(raw: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(raw.trim());
  if (!match) {
    throw new Error(
      `Duration must look like 3600s, 15m, 1h or 7d — received "${raw}"`,
    );
  }

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return Number(match[1]) * multipliers[match[2]];
}
