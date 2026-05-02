import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Safely App | Care Roster",
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
  range: string;
  title: string;
  summary: string;
  tone: "blue" | "green" | "amber" | "red";
  people: Person[];
  footer?: string;
}> = [
  {
    range: "Independent living",
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
    range: "Needs review",
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
    range: "High attention",
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
    range: "Device follow-up",
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

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12 5.5c5.1 0 8.7 4.4 9.7 5.9.2.4.2.8 0 1.2-1 1.5-4.6 5.9-9.7 5.9s-8.7-4.4-9.7-5.9a1.1 1.1 0 0 1 0-1.2c1-1.5 4.6-5.9 9.7-5.9Zm0 2.8a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Zm0 2a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M13.1 2 8.4 10h4L10.9 22l5.2-8.6h-4.4L13.1 2Zm-7 2.6 1.1 2.2 2.2 1.1-2.2 1.1-1.1 2.2L5 9 2.8 7.9 5 6.8l1.1-2.2Zm13.5 8.4.9 1.8 1.8.9-1.8.9-.9 1.8-.9-1.8-1.8-.9 1.8-.9.9-1.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M7 2h2v3h6V2h2v3h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3V2Zm13 8H4v9h16v-9ZM4 8h16V7H4v1Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
      <section className="care-board" aria-label="Senior care management board">
        <header className="care-board-header">
          <div>
            <p>Safely</p>
            <h1>Care Roster</h1>
          </div>
          <div className="care-actions" aria-label="Dashboard controls">
            <button type="button" aria-label="View mode">
              <EyeIcon />
            </button>
            <button type="button">
              <SparkIcon />
              Insights
            </button>
            <button type="button">
              <CalendarIcon />
              Today
            </button>
            <button type="button" className="care-add-button">
              <PeopleIcon />
              Add person
            </button>
          </div>
        </header>

        <div className="care-stats" aria-label="Overview stats">
          <div>
            <span>16</span>
            <p>People managed</p>
          </div>
          <div>
            <span>3</span>
            <p>Active alerts</p>
          </div>
          <div>
            <span>4</span>
            <p>Custom rules</p>
          </div>
          <div>
            <span>92%</span>
            <p>Devices reporting</p>
          </div>
        </div>

        <div className="care-columns" aria-label="People grouped by care status">
          {groups.map((group) => (
            <section className={`care-column ${group.tone}`} key={group.title}>
              <div className="care-column-range">{group.range}</div>
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
          <Link href="/" aria-label="Back to landing page">
            <span>Back to overview</span>
          </Link>
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
      </section>
    </main>
  );
}
