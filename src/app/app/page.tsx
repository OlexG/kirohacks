"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Medication = { name: string; time: string };
type MedWeek = Record<number, Medication[]>;
type CareView = "roster" | "alerts" | "rules" | "teams" | "reports";

type Person = {
  name: string;
  age: number;
  status: string;
  bpm: number;
  initials: string;
  avatar: string;
  photo: string;
  alert: "urgent" | "warning" | "stable" | "offline";
  meds: MedWeek;
};

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const medOptions = [
  "Aspirin",
  "Lisinopril",
  "Metformin",
  "Atorvastatin",
  "Levothyroxine",
  "Amlodipine",
  "Donepezil",
];

const dayPatterns: number[][] = [
  [1, 3, 5],
  [0, 2, 4, 6],
  [1, 2, 3, 4, 5],
  [0, 3, 6],
  [2, 4, 6],
];

const navItems = [
  { label: "Roster", short: "R", view: "roster" },
  { label: "Alerts", short: "A", view: "alerts" },
  { label: "Rules", short: "R", view: "rules" },
  { label: "Care Teams", short: "C", view: "teams" },
  { label: "Reports", short: "R", view: "reports" },
] satisfies Array<{ label: string; short: string; view: CareView }>;

const careViews: Record<CareView, { eyebrow: string; title: string }> = {
  roster: { eyebrow: "Care operations", title: "Roster" },
  alerts: { eyebrow: "Response queue", title: "Alerts" },
  rules: { eyebrow: "Automation", title: "Rules" },
  teams: { eyebrow: "Coordination", title: "Care Teams" },
  reports: { eyebrow: "Outcomes", title: "Reports" },
};

const ruleCards = [
  ["Heart rate", "Notify if above 115 bpm for 5 minutes", "Arthur, David"],
  ["Medication", "Escalate missed morning pills after 30 minutes", "Ethan, Eleanor"],
  ["Connectivity", "Flag devices offline for more than 20 minutes", "Offline group"],
];

const teamCards = [
  ["Family pod", "Mira, Jacob, Lena", "Primary coverage"],
  ["Clinical review", "Nurse Avery, Dr. Chen", "Vitals and medication plans"],
  ["Emergency contacts", "Local responders, building desk", "Escalation backup"],
];

const reportCards = [
  ["92%", "Devices online", "Up 4% this week"],
  ["14", "Medication check-ins", "3 need review"],
  ["2m", "Median response", "Across urgent alerts"],
];

const portraitPalettes = [
  { bg: "#F8EED9", hair: "#5A564B", skin: "#D6C8B2", shirt: "#7B786F" },
  { bg: "#F5F3EE", hair: "#7B786F", skin: "#CBC9C4", shirt: "#5A564B" },
  { bg: "#D6C8B2", hair: "#5A564B", skin: "#F8EED9", shirt: "#A4A29A" },
  { bg: "#CBC9C4", hair: "#7B786F", skin: "#F8EED9", shirt: "#5A564B" },
];

function buildPortrait(initials: string, seed: number) {
  const palette = portraitPalettes[seed % portraitPalettes.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="18" fill="${palette.bg}"/>
      <circle cx="48" cy="37" r="21" fill="${palette.skin}"/>
      <path d="M25 38c1-20 14-29 27-29 12 0 21 8 22 22-7-6-15-9-25-9-11 0-19 5-24 16Z" fill="${palette.hair}"/>
      <path d="M18 92c4-23 18-34 30-34s26 11 30 34H18Z" fill="${palette.shirt}"/>
      <text x="48" y="84" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#F5F3EE">${initials}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildMeds(seed: number): MedWeek {
  const days = dayPatterns[seed % dayPatterns.length];
  const primary = medOptions[seed % medOptions.length];
  const secondary = medOptions[(seed + 2) % medOptions.length];
  const week: MedWeek = {};
  days.forEach((d) => {
    week[d] = [{ name: primary, time: "8:00 AM" }];
  });
  if (seed % 2 === 0) {
    [1, 4].forEach((d) => {
      week[d] = [...(week[d] ?? []), { name: secondary, time: "7:00 PM" }];
    });
  }
  return week;
}

function buildHrSamples(base: number, seed: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 28; i++) {
    const noise =
      Math.sin((i + seed) * 0.6) * 4 + Math.cos((i + seed) * 1.4) * 2.4;
    out.push(Math.round(base + noise));
  }
  return out;
}

type RawPerson = Omit<Person, "meds" | "photo"> & { seed: number };

const rawGroups: Array<{
  title: string;
  summary: string;
  tone: "blue" | "green" | "amber" | "red";
  people: RawPerson[];
  footer?: string;
}> = [
  {
    title: "Stable",
    summary: "4/5 monitored",
    tone: "green",
    people: [
      { name: "Eleanor Ward", age: 82, status: "Normal rhythm", bpm: 72, initials: "EW", avatar: "avatar-a", alert: "stable", seed: 1 },
      { name: "Mia Stephens", age: 78, status: "Morning walk", bpm: 81, initials: "MS", avatar: "avatar-b", alert: "stable", seed: 2 },
      { name: "Leo Martinez", age: 86, status: "Resting", bpm: 68, initials: "LM", avatar: "avatar-c", alert: "stable", seed: 3 },
      { name: "Grace Patel", age: 80, status: "Check-in complete", bpm: 74, initials: "GP", avatar: "avatar-d", alert: "stable", seed: 4 },
    ],
    footer: "1 quiet check-in pending",
  },
  {
    title: "Watch List",
    summary: "4/5 reviewed",
    tone: "blue",
    people: [
      { name: "Sabawoon Hakimi", age: 77, status: "Elevated heart rate", bpm: 112, initials: "SH", avatar: "avatar-e", alert: "warning", seed: 5 },
      { name: "Noah Williams", age: 83, status: "Low movement", bpm: 64, initials: "NW", avatar: "avatar-f", alert: "warning", seed: 6 },
      { name: "Ariel Patel", age: 81, status: "New threshold", bpm: 93, initials: "AP", avatar: "avatar-g", alert: "warning", seed: 7 },
      { name: "Daniel Rivera", age: 88, status: "Nap window", bpm: 59, initials: "DR", avatar: "avatar-h", alert: "stable", seed: 8 },
    ],
    footer: "2 custom rules active",
  },
  {
    title: "Active Alerts",
    summary: "3/4 acknowledged",
    tone: "amber",
    people: [
      { name: "Mae Johnson", age: 88, status: "Fall detected", bpm: 96, initials: "MJ", avatar: "avatar-i", alert: "urgent", seed: 9 },
      { name: "David Price", age: 84, status: "Heart rate high", bpm: 119, initials: "DP", avatar: "avatar-j", alert: "urgent", seed: 10 },
      { name: "Gabriel Bailey", age: 79, status: "Caregiver assigned", bpm: 87, initials: "GB", avatar: "avatar-k", alert: "warning", seed: 11 },
      { name: "Ethan Brown", age: 85, status: "Medication reminder", bpm: 73, initials: "EB", avatar: "avatar-l", alert: "stable", seed: 12 },
    ],
    footer: "1 alert waiting on response",
  },
  {
    title: "Offline",
    summary: "3/5 connected",
    tone: "red",
    people: [
      { name: "Evelyn Moore", age: 90, status: "Watch offline", bpm: 0, initials: "EM", avatar: "avatar-m", alert: "offline", seed: 13 },
      { name: "Alexander Scott", age: 87, status: "Charging device", bpm: 0, initials: "AS", avatar: "avatar-n", alert: "offline", seed: 14 },
      { name: "Henry White", age: 83, status: "Missed sync", bpm: 0, initials: "HW", avatar: "avatar-o", alert: "offline", seed: 15 },
      { name: "Hazel Rodriguez", age: 89, status: "Signal weak", bpm: 78, initials: "HR", avatar: "avatar-p", alert: "warning", seed: 16 },
    ],
    footer: "2 devices need setup help",
  },
];

const groups = rawGroups.map((g) => ({
  ...g,
  people: g.people.map<Person>((p) => ({
    ...p,
    photo: buildPortrait(p.initials, p.seed),
    meds: buildMeds(p.seed),
  })),
}));

const hrSampleCache = new Map<string, number[]>();
function getHrSamples(person: Person, seed: number) {
  const key = `${person.name}-${person.bpm}`;
  if (!hrSampleCache.has(key)) {
    hrSampleCache.set(key, buildHrSamples(person.bpm || 70, seed));
  }
  return hrSampleCache.get(key)!;
}

function HeartGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="care-heart-glyph">
      <path
        d="M12 21s-7.5-4.7-9.6-9.2C.9 8.5 2.7 5 6.2 5c2 0 3.3 1.1 3.9 2.1C10.7 6.1 12 5 14 5c3.5 0 5.3 3.5 3.8 6.8C15.5 16.3 12 21 12 21Z"
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

function CareSidebar({
  activeView,
  onViewChange,
}: Readonly<{
  activeView: CareView;
  onViewChange: (view: CareView) => void;
}>) {
  return (
    <aside className="care-sidebar" aria-label="Application navigation">
      <Link className="care-sidebar-brand" href="/" aria-label="Safely home">
        <span className="care-sidebar-mark">
          <HeartGlyph />
        </span>
        <span>
          <strong>Safely</strong>
          <small>Care operations</small>
        </span>
      </Link>

      <nav className="care-sidebar-nav" aria-label="Care workspace">
        <Link className="care-sidebar-link" href="/">
          <span>D</span>
          Dashboard
        </Link>
        {navItems.map((item) => (
          <button
            type="button"
            className={`care-sidebar-link${activeView === item.view ? " active" : ""}`}
            key={item.label}
            aria-current={activeView === item.view ? "page" : undefined}
            onClick={() => onViewChange(item.view)}
          >
            <span>{item.short}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="care-sidebar-status" aria-label="Live monitoring status">
        <div>
          <span aria-hidden="true" />
          <strong>Live monitoring</strong>
        </div>
        <p>92% devices online</p>
      </div>
    </aside>
  );
}

function HeartMonitor({ bpm, samples }: Readonly<{ bpm: number; samples: number[] }>) {
  const path = useMemo(() => {
    if (samples.length < 2) return "";
    const w = 100;
    const h = 24;
    const max = Math.max(...samples);
    const min = Math.min(...samples);
    const range = Math.max(max - min, 1);
    return samples
      .map((v, i) => {
        const x = (i / (samples.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [samples]);

  const offline = bpm <= 0;

  return (
    <div className={`care-heart-monitor${offline ? " offline" : ""}`}>
      <div className="care-heart-trace" aria-hidden="true">
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="care-heart-line">
          <path d={path} fill="none" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
      <div
        className="care-heart-readout"
        aria-label={offline ? "Heart rate unavailable" : `Heart rate ${bpm} beats per minute`}
      >
        <HeartGlyph />
        <strong>{offline ? "—" : bpm}</strong>
        <small>bpm</small>
      </div>
    </div>
  );
}

function PillWeek({
  person,
  onSelectDay,
}: Readonly<{ person: Person; onSelectDay: (day: number) => void }>) {
  return (
    <div className="care-pill-week" role="group" aria-label={`${person.name} weekly medication`}>
      {dayLabels.map((d, i) => {
        const meds = person.meds[i] ?? [];
        const scheduled = meds.length > 0;
        return (
          <button
            key={`${person.name}-day-${i}`}
            type="button"
            className={`care-pill-day ${scheduled ? "scheduled" : "rest"}`}
            onClick={() => onSelectDay(i)}
            aria-label={`${dayNames[i]} medication for ${person.name}`}
          >
            <span className="care-pill-letter">{d}</span>
            <span className="care-pill-dot" aria-hidden="true">
              {scheduled ? meds.length : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PersonCard({
  person,
  onSelectDay,
}: Readonly<{ person: Person; onSelectDay: (person: Person, day: number) => void }>) {
  const samples = getHrSamples(person, person.name.length);
  return (
    <article className={`care-person-card ${person.alert}`}>
      <div className="care-person-top">
        <div className="care-photo">
          <Image
            className="care-photo-image"
            src={person.photo}
            alt={`${person.name} portrait`}
            width={64}
            height={64}
            unoptimized
          />
          <span className="care-photo-initials">{person.initials}</span>
        </div>
        <div className="care-person-id">
          <h3>{person.name}</h3>
          <p>
            <span>Age {person.age}</span>
            <span className="care-person-status">{person.status}</span>
          </p>
        </div>
      </div>

      <PillWeek person={person} onSelectDay={(d) => onSelectDay(person, d)} />

      <HeartMonitor bpm={person.bpm} samples={samples} />
    </article>
  );
}

function MedicationModal({
  selected,
  onClose,
}: Readonly<{
  selected: { person: Person; day: number } | null;
  onClose: () => void;
}>) {
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected, onClose]);

  if (!selected) return null;
  const { person, day } = selected;
  const meds = person.meds[day] ?? [];

  return (
    <div
      className="care-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${person.name} medication on ${dayNames[day]}`}
      onClick={onClose}
    >
      <div className="care-modal" onClick={(e) => e.stopPropagation()}>
        <header className="care-modal-header">
          <div>
            <p className="care-modal-eyebrow">{dayNames[day]}</p>
            <h2>{person.name}</h2>
            <p className="care-modal-sub">Age {person.age} · {person.status}</p>
          </div>
          <button
            type="button"
            className="care-modal-close"
            onClick={onClose}
            aria-label="Close medication detail"
          >
            ×
          </button>
        </header>

        <section className="care-modal-section" aria-label="Medications">
          <h3>Medication</h3>
          {meds.length === 0 ? (
            <p className="care-modal-empty">No medications scheduled for {dayNames[day]}.</p>
          ) : (
            <ul className="care-modal-list">
              {meds.map((m) => (
                <li key={`${person.name}-${day}-${m.name}-${m.time}`}>
                  <div>
                    <strong>{m.name}</strong>
                    <span>{m.time}</span>
                  </div>
                  <span className="care-modal-tag">Scheduled</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="care-modal-section" aria-label="Vitals">
          <h3>Vitals</h3>
          <div className="care-modal-vitals">
            <div>
              <span>Heart rate</span>
              <strong>{person.bpm > 0 ? `${person.bpm} bpm` : "Offline"}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{person.status}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AlertQueueView({ onSelectDay }: Readonly<{ onSelectDay: (person: Person, day: number) => void }>) {
  const alertPeople = groups.flatMap((group) =>
    group.people.filter((person) => person.alert === "urgent" || person.alert === "warning"),
  );

  return (
    <div className="care-detail-grid">
      {alertPeople.map((person) => (
        <article className={`care-detail-card ${person.alert}`} key={person.name}>
          <div className="care-detail-card-header">
            <Image src={person.photo} alt={`${person.name} portrait`} width={48} height={48} unoptimized />
            <div>
              <h2>{person.name}</h2>
              <p>Age {person.age} · {person.status}</p>
            </div>
          </div>
          <div className="care-detail-metric">
            <span>Current heart rate</span>
            <strong>{person.bpm} bpm</strong>
          </div>
          <button type="button" className="care-detail-action" onClick={() => onSelectDay(person, 0)}>
            Review medication
          </button>
        </article>
      ))}
    </div>
  );
}

function SimpleCardView({
  type,
}: Readonly<{
  type: Exclude<CareView, "roster" | "alerts">;
}>) {
  const cards = type === "rules" ? ruleCards : type === "teams" ? teamCards : reportCards;

  return (
    <div className={`care-detail-grid ${type}`}>
      {cards.map(([title, body, meta]) => (
        <article className="care-detail-card" key={title}>
          <div className="care-detail-kicker">{type}</div>
          <h2>{title}</h2>
          <p>{body}</p>
          <div className="care-detail-meta">{meta}</div>
        </article>
      ))}
    </div>
  );
}

function RosterColumns({ onSelectDay }: Readonly<{ onSelectDay: (person: Person, day: number) => void }>) {
  return (
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
                <PersonCard
                  person={person}
                  key={person.name}
                  onSelectDay={(p, d) => onSelectDay(p, d)}
                />
              ))}
            </div>
            {group.footer ? <div className="care-column-footer">{group.footer}</div> : null}
          </div>
        </section>
      ))}
    </div>
  );
}

function CareWorkspace({
  activeView,
  onSelectDay,
}: Readonly<{ activeView: CareView; onSelectDay: (person: Person, day: number) => void }>) {
  if (activeView === "roster") {
    return <RosterColumns onSelectDay={onSelectDay} />;
  }

  return (
    <section className="care-detail-view" aria-label={`${careViews[activeView].title} workspace`}>
      {activeView === "alerts" ? (
        <AlertQueueView onSelectDay={onSelectDay} />
      ) : (
        <SimpleCardView type={activeView} />
      )}
    </section>
  );
}

export default function AppPage() {
  const [selected, setSelected] = useState<{ person: Person; day: number } | null>(null);
  const [activeView, setActiveView] = useState<CareView>("roster");
  const view = careViews[activeView];

  return (
    <main className="care-app-page">
      <div className="care-app-shell">
        <CareSidebar activeView={activeView} onViewChange={setActiveView} />
        <section className="care-main" aria-label="Roster workspace">
          <div className="care-board" aria-label="Senior care management board">
            <header className="care-board-header">
              <div>
                <p className="care-board-eyebrow">{view.eyebrow}</p>
                <h1>{view.title}</h1>
              </div>
              <div className="care-board-status" aria-label="Live monitoring">
                <span aria-hidden="true" />
                <div>
                  <strong>Live monitoring</strong>
                  <small>92% devices online</small>
                </div>
              </div>
            </header>

            <CareWorkspace
              activeView={activeView}
              onSelectDay={(person, day) => setSelected({ person, day })}
            />

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

      <MedicationModal selected={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
