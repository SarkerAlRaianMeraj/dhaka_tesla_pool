import { buildCorridorIndex, canShare } from './matching';

/**
 * The three worked examples from `PRD_Dhaka_Tesla_Pool.md` §6.1, plus the case
 * that makes the counter-intuitive part unavoidable.
 *
 * These are transcribed from the PRD's own table rather than from the code's idea
 * of the rule, so a change in the implementation that breaks pooling shows up here
 * as a failure against the document rather than as a surprising demo.
 */
describe('the matching rule (PRD 6.1)', () => {
  // The eight zones and four corridors exactly as Phase 1 seeds them. Mohakhali
  // appears in two corridors and Dhanmondi in two; that is not a mistake in the
  // fixture, it is the rule.
  const zones = [
    { code: 'banani', corridors: [{ code: 'banani_gulshan' }] },
    { code: 'gulshan1', corridors: [{ code: 'banani_gulshan' }] },
    {
      code: 'mohakhali',
      corridors: [{ code: 'banani_gulshan' }, { code: 'dhanmondi_farmgate' }],
    },
    {
      code: 'dhanmondi',
      corridors: [{ code: 'dhanmondi_farmgate' }, { code: 'bashundhara_east' }],
    },
    {
      code: 'farmgate',
      corridors: [{ code: 'dhanmondi_farmgate' }, { code: 'bashundhara_east' }],
    },
    { code: 'mirpur', corridors: [{ code: 'mirpur_uttara' }] },
    { code: 'uttara', corridors: [{ code: 'mirpur_uttara' }] },
    { code: 'bashundhara', corridors: [{ code: 'bashundhara_east' }] },
  ];
  const index = buildCorridorIndex(zones);

  const request = (pickupZoneCode: string, destinationZoneCode: string) => ({
    pickupZoneCode,
    destinationZoneCode,
  });

  it('shares a Tesla between two Banani pickups in the same corridor', () => {
    // "Nusrat Banani -> Mohakhali & Rafiq Banani -> Gulshan 1: both banani_gulshan"
    expect(
      canShare(
        request('banani', 'mohakhali'),
        request('banani', 'gulshan1'),
        index,
      ),
    ).toBe(true);
  });

  it('shares a Tesla for a third rider whose corridor only meets via a shared zone', () => {
    // "+ Shirin Banani -> Dhanmondi: banani_gulshan n dhanmondi_farmgate = {Mohakhali}".
    // This is the case a single-corridor-per-zone implementation gets wrong.
    expect(
      canShare(
        request('banani', 'mohakhali'),
        request('banani', 'dhanmondi'),
        index,
      ),
    ).toBe(true);
    expect(
      canShare(
        request('banani', 'gulshan1'),
        request('banani', 'dhanmondi'),
        index,
      ),
    ).toBe(true);
  });

  it('refuses two requests whose destination corridors share no zone', () => {
    // "Banani -> Mirpur & Banani -> Bashundhara: mirpur_uttara vs
    //  bashundhara_east = empty: No"
    expect(
      canShare(
        request('banani', 'mirpur'),
        request('banani', 'bashundhara'),
        index,
      ),
    ).toBe(false);
  });

  it('refuses any pairing whose pickups differ, however well the corridors match', () => {
    expect(
      canShare(
        request('banani', 'mohakhali'),
        request('gulshan1', 'mohakhali'),
        index,
      ),
    ).toBe(false);
    expect(
      canShare(
        request('mirpur', 'uttara'),
        request('banani', 'gulshan1'),
        index,
      ),
    ).toBe(false);
  });

  it('refuses a pairing involving a zone it cannot place', () => {
    expect(
      canShare(
        request('banani', 'mohakhali'),
        request('banani', 'atlantis'),
        index,
      ),
    ).toBe(false);
    expect(
      canShare(
        request('banani', 'atlantis'),
        request('banani', 'mohakhali'),
        index,
      ),
    ).toBe(false);
  });

  it('is symmetric, because either request may be offered the seat first', () => {
    const a = request('banani', 'mohakhali');
    const b = request('banani', 'bashundhara');
    expect(canShare(a, b, index)).toBe(canShare(b, a, index));
  });

  it('reproduces the whole demo cast in one Bullet', () => {
    const nusrat = request('banani', 'mohakhali');
    const rafiq = request('banani', 'gulshan1');
    const shirin = request('banani', 'dhanmondi');

    expect(canShare(nusrat, rafiq, index)).toBe(true);
    expect(canShare(nusrat, shirin, index)).toBe(true);
    expect(canShare(rafiq, shirin, index)).toBe(true);
  });
});
