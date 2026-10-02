import Link from "next/link";
import { Layout } from "@/components/Layout/layout";

const CAST = [
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
    detail:
      "Thirty seconds late for the last seat. Needs either a seat or an honest answer.",
  },
];

const Home = () => (
  <Layout>
    <section className="hero rounded-box bg-base-100 shadow-sm">
      <div className="hero-content w-full flex-col items-start py-10">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">
          Ride pooling MVP
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight">
          Share a seat. Split the fare. Survive Dhaka traffic.
        </h1>
        <p className="max-w-2xl text-base-content/70">
          Dhaka Tesla Pool decides, in about a second, whether two strangers can
          share one Tesla on compatible routes, then keeps each fare, seat, and
          status to itself.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/register" className="btn btn-primary">
            Create account
          </Link>
          <Link href="/login" className="btn btn-ghost">
            Sign in
          </Link>
        </div>
      </div>
    </section>

    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Who this is for</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {CAST.map((person) => (
          <article key={person.name} className="card bg-base-100 shadow-sm">
            <div className="card-body py-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="card-title text-base">{person.name}</h3>
                <span className="badge badge-ghost badge-sm">{person.role}</span>
              </div>
              <p className="text-sm text-base-content/70">{person.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section className="card bg-base-100 shadow-sm">
      <div className="card-body gap-3">
        <h2 className="card-title text-base">
          Phase 1 &mdash; identity and reference data
        </h2>
        <p className="text-sm text-base-content/70">
          Sign up as a passenger or a driver, sign in, and land on a home screen
          chosen by the role in your session. The eight zones come from the API,
          not from this page. Ride requests and Tesla registration follow in later
          phases.
        </p>
      </div>
    </section>
  </Layout>
);

export default Home;