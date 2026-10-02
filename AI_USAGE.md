# AI Usage Log

Disclosed per SRS §7.6 and the challenge brief §8: AI tools are permitted, must be disclosed, and every line of shipped code must remain explainable and modifiable by the team.

## Tools used

| Tool | Used for |
|---|---|
| opencode (Claude-based coding agent, running in a terminal) | Writing and refactoring source files, scaffolding configuration, drafting documentation, and running build/lint/test commands |
| Web search / documentation lookups | Verifying library APIs and versions before use rather than relying on recall |
| The challenge brief and SRS | Requirements, acceptance criteria, and the story cast — all human-authored inputs to this project |

## Phase-by-phase record

| Phase | What the AI produced | What a human decided or checked |
|---|---|---|
| 0 | Scaffold, compose topology, health probe, migration runner | Topology, ports, the local-PostgreSQL development stance |
| 1 | Entity and migration code, auth endpoints and guards, the three screens, the axios client and Zod schemas | Every product rule; bcrypt over scrypt; the httpOnly cookie over `localStorage`; all departures from the course standards (D14–D21), each reviewed and recorded |

## What the AI did and did not decide

- **Did:** propose file structures, entity fields, guard and middleware wiring, Dockerfile shapes, and draft prose for the PRD and docs.
- **Did not:** choose the matching rule, the fare model, the capacity mechanism, or the scope boundaries. Those are documented decisions in `docs/decisions.md` and `PRD_Dhaka_Tesla_Pool.md`, derived from the brief and reviewed by the team.
- **Verification rule applied throughout:** nothing is committed unless `npm run build` and `npm run lint` are green and the phase's slice has been clicked through end to end. Phases 1–8 write no test files; the six required behaviours are proven in Phase 9 (see `PROJECT_PLAN.md`). Code that failed to build was fixed or removed, never accepted because the AI produced it.

## One accepted suggestion

**Pessimistic write lock on the pool row for seat assignment (TypeORM `findOne` with a row-level lock inside a transaction), backed by a database `CHECK` constraint on occupancy.** Accepted because it makes the "capacity can never be exceeded" requirement (FR-C1, NFR-2) a property of the database rather than of application discipline: the lock serialises competing claims, and the constraint catches any future code path that forgets the check. Cost: claims on the same pool serialise, which is acceptable at MVP scale and is quantified in the scaling reasoning.

## One rejected or modified suggestion

**Rejected — keep a Redis seat counter per Tesla for O(1) capacity checks and let the database store only the final occupancy.** Rejected on two grounds. First, it makes correctness depend on a cache that can evict a key under memory pressure, which is precisely the failure that produces an overbooked Tesla. Second, the brief explicitly rules out Redis for this MVP (NFR-7, brief §16: do not add technologies to look advanced). The PostgreSQL row is a few microseconds slower and is the only source of truth.

**Modified — a "matching engine" that auto-assigns any compatible request to an open pool as soon as it is created.** The idea was sound but it removed the driver's accept step the brief asks for (FR-D4). Modified so that matching *identifies and surfaces* candidates (setting the `MATCHED` state) while the driver performs the assignment, and a passenger may join an open pool when the same deterministic rule says they fit.

## Open disclosure

- AI-assisted code is reviewed line by line before commit, and the team can explain, debug, and modify any part of the system live.
- No AI-generated text, data, or asset is presented as human-original work without being checked against the source documents it claims to come from.
- This log is updated as the phases proceed; new accepted and rejected suggestions are appended as they occur.