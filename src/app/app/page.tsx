import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Safely App | Roster",
  description: "Manage seniors, watch signals, and caretaker alerts.",
};

type Person = {
  name: string;
  age: number;
  status: string;
  heartRate: string;
  lastSeen: string;
  watch: string;
  initials: string;
  avatar: string;
  alert?: "urgent" | "warning" | "stable" | "offline";
};

const groups: Array<{
  title: string;
  summary: string;
  tone: "blue" | "green" | "amber" | "red";
  people: Person[];
  footer?: string;
}> = [
  {
    title: "Stable",
    summary: "4/5 monitored",
    tone: "green",
    people: [
      {
        name: "Eleanor Ward",
        age: 82,
        status: "Normal rhythm",
        heartRate: "72 bpm",
        lastSeen: "2 min",
        watch: "91%",
        initials: "EW",
        avatar: "avatar-a",
        alert: "stable",
      },
      {
        name: "Mia Stephens",
        age: 78,
        status: "Morning walk",
        heartRate: "81 bpm",
        lastSeen: "5 min",
        watch: "84%",
        initials: "MS",
        avatar: "avatar-b",
        alert: "stable",
      },
      {
        name: "Leo Martinez",
        age: 86,
        status: "Resting",
        heartRate: "68 bpm",
        lastSeen: "8 min",
        watch: "76%",
        initials: "LM",
        avatar: "avatar-c",
        alert: "stable",
      },
      {
        name: "Grace Patel",
        age: 80,
        status: "Check-in complete",
        heartRate: "74 bpm",
        lastSeen: "11 min",
        watch: "88%",
        initials: "GP",
        avatar: "avatar-d",
        alert: "stable",
      },
    ],
    footer: "1 quiet check-in pending",
  },
  {
    title: "Watch List",
    summary: "4/5 reviewed",
    tone: "blue",
    people: [
      {
        name: "Sabawoon Hakimi",
        age: 77,
        status: "Elevated heart rate",
        heartRate: "112 bpm",
        lastSeen: "1 min",
        watch: "69%",
        initials: "SH",
        avatar: "avatar-e",
        alert: "warning",
      },
      {
        name: "Noah Williams",
        age: 83,
        status: "Low movement",
        heartRate: "64 bpm",
        lastSeen: "17 min",
        watch: "72%",
        initials: "NW",
        avatar: "avatar-f",
        alert: "warning",
      },
      {
        name: "Ariel Patel",
        age: 81,
        status: "New threshold",
        heartRate: "93 bpm",
        lastSeen: "22 min",
        watch: "58%",
        initials: "AP",
        avatar: "avatar-g",
        alert: "warning",
      },
      {
        name: "Daniel Rivera",
        age: 88,
        status: "Nap window",
        heartRate: "59 bpm",
        lastSeen: "31 min",
        watch: "80%",
        initials: "DR",
        avatar: "avatar-h",
        alert: "stable",
      },
    ],
    footer: "2 custom rules active",
  },
  {
    title: "Active Alerts",
    summary: "3/4 acknowledged",
    tone: "amber",
    people: [
      {
        name: "Mae Johnson",
        age: 88,
        status: "Fall detected",
        heartRate: "96 bpm",
        lastSeen: "Now",
        watch: "63%",
        initials: "MJ",
        avatar: "avatar-i",
        alert: "urgent",
      },
      {
        name: "David Price",
        age: 84,
        status: "Heart rate high",
        heartRate: "119 bpm",
        lastSeen: "3 min",
        watch: "55%",
        initials: "DP",
        avatar: "avatar-j",
        alert: "urgent",
      },
      {
        name: "Gabriel Bailey",
        age: 79,
        status: "Caregiver assigned",
        heartRate: "87 bpm",
        lastSeen: "6 min",
        watch: "82%",
        initials: "GB",
        avatar: "avatar-k",
        alert: "warning",
      },
      {
        name: "Ethan Brown",
        age: 85,
        status: "Medication reminder",
        heartRate: "73 bpm",
        lastSeen: "14 min",
        watch: "74%",
        initials: "EB",
        avatar: "avatar-l",
        alert: "stable",
      },
    ],
    footer: "1 alert waiting on response",
  },
  {
    title: "Offline",
    summary: "3/5 connected",
    tone: "red",
    people: [
      {
        name: "Evelyn Moore",
        age: 90,
        status: "Watch offline",
        heartRate: "--",
        lastSeen: "42 min",
        watch: "0%",
        initials: "EM",
        avatar: "avatar-m",
        alert: "offline",
      },
      {
        name: "Alexander Scott",
        age: 87,
        status: "Charging device",
        heartRate: "--",
        lastSeen: "1 hr",
        watch: "12%",
        initials: "AS",
        avatar: "avatar-n",
        alert: "offline",
      },
      {
        name: "Henry White",
        age: 83,
        status: "Missed sync",
        heartRate: "--",
        lastSeen: "2 hr",
        watch: "31%",
        initials: "HW",
        avatar: "avatar-o",
        alert: "offline",
      },
      {
        name: "Hazel Rodriguez",
        age: 89,
        status: "Signal weak",
        heartRate: "78 bpm",
        lastSeen: "28 min",
        watch: "43%",
        initials: "HR",
        avatar: "avatar-p",
        alert: "warning",
      },
    ],
    footer: "2 devices need setup help",
  },
];

const navItems = [
  { label: "Dashboard", href: "/app" },
  { label: "Roster", href: "/app", active: true },
  { label: "Alerts", href: "/app" },
  { label: "Rules", href: "/app" },
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

function PersonCard({ person }: Readonly<{ person: Person }>) {
  return (
    <article className={`care-person-card ${person.alert ?? "stable"}`}>
      <div className={`care-avatar ${person.avatar}`}>{person.initials}</div>
      <div className="care-person-main">
        <div className="care-person-heading">
          <h3>{person.name}</h3>
          <span className={`care-signal ${person.alert ?? "stable"}`} />
        </div>
        <div className="care-meta">
          <span>{person.age} yr</span>
          <span>{person.status}</span>
        </div>
        <div className="care-tags">
          <span>{person.heartRate}</span>
          <span>Seen {person.lastSeen}</span>
          <span>Watch {person.watch}</span>
        </div>
      </div>
    </article>
  );
}

export default function AppPage() {
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
            <span />
            <div>
              <strong>Live monitoring</strong>
              <small>92% devices online</small>
            </div>
          </div>
        </aside>

        <section className="care-main" aria-label="Roster workspace">
          <div className="care-board" aria-label="Senior care management board">
            <header className="care-board-header">
              <h1>Roster</h1>
            </header>

            <div className="care-columns" aria-label="People grouped by care status">
              {groups.map((group) => (
                <section className={`care-column ${group.tone}`} key={group.title}>
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
                        <PersonCard person={person} key={person.name} />
                      ))}
                    </div>
                    {group.footer ? <div className="care-column-footer">{group.footer}</div> : null}
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
