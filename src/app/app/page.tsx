import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  formatHeartRate,
  formatWatchBattery,
  groupCarePeople,
  listCarePeople,
  type CarePerson,
} from "@/lib/care-people";

export const metadata: Metadata = {
  title: "Safely App | Roster",
  description: "Manage seniors, watch signals, and caretaker alerts.",
};

const navItems = [
  { label: "Dashboard", href: "/app" },
  { label: "Roster", href: "/app", active: true },
  { label: "Alerts", href: "/app" },
  { label: "Rules", href: "/app/rules" },
  { label: "Care Teams", href: "/app" },
  { label: "Reports", href: "/app" },
];

function PeopleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M8.5 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm7 1a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2 19.3C2 15.8 4.8 13 8.3 13h.4c3.5 0 6.3 2.8 6.3 6.3V20H2v-.7Zm13.7.7v-.7c0-2-.8-3.9-2-5.3.6-.3 1.3-.4 2-.4h.2A5.1 5.1 0 0 1 21 18.7V20h-5.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PersonCard({ person }: Readonly<{ person: CarePerson }>) {
  return (
    <article className={`care-person-card ${person.alert}`}>
      <div className={`care-avatar ${person.avatar}`}>{person.initials}</div>
      <div className="care-person-main">
        <div className="care-person-heading">
          <h3>{person.name}</h3>
          <span className={`care-signal ${person.alert}`} />
        </div>
        <div className="care-meta">
          <span>{person.age} yr</span>
          <span>{person.status}</span>
        </div>
        <div className="care-tags">
          <span>{formatHeartRate(person.heart_rate_bpm)}</span>
          <span>Seen {person.last_seen_label}</span>
          <span>Watch {formatWatchBattery(person.watch_battery_percent)}</span>
        </div>
      </div>
    </article>
  );
}

export default async function AppPage() {
  await connection();
  const people = await listCarePeople();
  const groups = groupCarePeople(people);
  const onlinePercent =
    people.length === 0
      ? 0
      : Math.round(
          (people.filter((person) => person.alert !== "offline").length / people.length) * 100,
        );

  return (
    <main className="care-app-page">
      <div className="care-app-shell">
        <aside className="care-sidebar" aria-label="Application navigation">
          <Link className="care-sidebar-brand" href="/">
            <span>Sa</span>
            <div>
              <strong>Safely</strong>
              <small>Care operations</small>
            </div>
          </Link>
          <nav className="care-sidebar-nav" aria-label="Workspace pages">
            {navItems.map((item) => (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={item.active ? "active" : undefined}
                href={item.href}
                key={item.label}
              >
                <span aria-hidden="true">{item.label.slice(0, 1)}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="care-sidebar-status">
            <span aria-hidden="true" />
            <div>
              <strong>Live monitoring</strong>
              <small>{onlinePercent}% devices online</small>
            </div>
          </div>
        </aside>

        <section className="care-main" aria-label="Roster workspace">
          <div className="care-board" aria-label="Senior care management board">
            <header className="care-board-header">
              <div>
                <p className="care-board-eyebrow">Care operations</p>
                <h1>Roster</h1>
              </div>
              <div className="care-board-status" aria-label="Live monitoring">
                <span aria-hidden="true" />
                <div>
                  <strong>Live monitoring</strong>
                  <small>{onlinePercent}% devices online</small>
                </div>
              </div>
            </header>

            <div className="care-columns" aria-label="People grouped by care status">
              {groups.map((group) => (
                <section className={`care-column ${group.tone}`} key={group.key}>
                  <div className="care-column-body">
                    <div className="care-column-title">
                      <h2>{group.title}</h2>
                      <div>
                        <PeopleIcon />
                        <span>{group.summary}</span>
                      </div>
                    </div>
                    <div className="care-person-list">
                      {group.people.map((person) => (
                        <PersonCard person={person} key={person.id} />
                      ))}
                    </div>
                    <div className="care-column-footer">{group.footer}</div>
                  </div>
                </section>
              ))}
            </div>

            <footer className="care-board-footer">
              <div>
                <span className="care-legend stable" />
                Stable
                <span className="care-legend warning" />
                Review
                <span className="care-legend urgent" />
                Urgent
                <span className="care-legend offline" />
                Offline
              </div>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
