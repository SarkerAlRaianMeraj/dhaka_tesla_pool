import Link from "next/link";

const cast = [
  {
    name: "Jashim",
    role: "Driver",
    detail: "Owns Bullet, a three-seat Tesla. Wants full seats and a clear go-signal.",
  },
  {
    name: "Nusrat",
    role: "Passenger",
    detail: "Banani to Mohakhali, already late. Wants a seat held and an exact fare.",
  },
  {
    name: "Rafiq",
    role: "Passenger",
    detail: "Banani to Gulshan 1. Willing to share, as long as the fare does not move.",
  },
  {
    name: "Shirin",
    role: "Passenger",
    detail: "Thirty seconds late for the last seat. Needs either a seat or an honest answer.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium tracking-wide text-emerald-700 uppercase">
          Ride pooling MVP
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Share a seat. Split the fare. Survive Dhaka traffic.
        </h1>
        <p className="text-lg text-zinc-600">
          Dhaka Tesla Pool decides, in about a second, whether two strangers can share one
          Tesla on compatible routes, then keeps each fare, seat, and status to itself.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {cast.map((person) => (
          <article key={person.name} className="rounded-lg border border-zinc-200 p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">{person.name}</h2>
              <span className="text-xs text-zinc-500">{person.role}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-600">{person.detail}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-zinc-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-zinc-800">
              Phase 1 &mdash; identity and reference data
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Sign up as a passenger or a driver, sign in, and land on a home screen
              chosen by the role in your token. The eight zones come from the API,
              not from this page.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}