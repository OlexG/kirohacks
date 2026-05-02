"use client";

import { useMemo, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CareAlert, CareAlertSeverity } from "@/lib/care-alerts";
import type { CarePeopleGroup, CarePerson } from "@/lib/care-people";
import { resolvePersonPhoto } from "@/lib/care-person-image";
import type { CareProfile } from "@/lib/profiles";
import { AppSidebar } from "./sidebar";
import { AlertRoom, type RoomAlert, type RoomPerson } from "./alert-room";

export type CareView = "dashboard" | "roster" | "alerts";

type RosterPerson = CarePerson & {
  activeAlert: CareAlert | null;
  hasPhoto: boolean;
  photo: string;
};

type RosterAlert = CareAlert & {
  person: RosterPerson;
};

type RosterGroup = Omit<CarePeopleGroup, "people"> & {
  people: RosterPerson[];
};

const careViews: Record<CareView, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: "Care operations", title: "Dashboard" },
  roster: { eyebrow: "Care operations", title: "Roster" },
  alerts: { eyebrow: "Response queue", title: "Alerts" },
};

const alertLabels: Record<CarePerson["alert"], string> = {
  urgent: "Urgent",
  warning: "Review",
  stable: "Clear",
  offline: "Offline",
};

const groupConfig: Record<
  CarePerson["care_group"],
  Omit<RosterGroup, "people" | "summary">
> = {
  stable: {
    key: "stable",
    title: "Stable",
    tone: "green",
    footer: "Quiet check-ins pending",
  },
  watch_list: {
    key: "watch_list",
    title: "Watch List",
    tone: "blue",
    footer: "Custom rules under review",
  },
  active_alerts: {
    key: "active_alerts",
    title: "Active Alerts",
    tone: "amber",
    footer: "Alerts waiting on response",
  },
  offline: {
    key: "offline",
    title: "Offline",
    tone: "red",
    footer: "Devices need setup help",
  },
};

const groupOrder: CarePerson["care_group"][] = ["stable", "watch_list", "active_alerts", "offline"];

function summarizeGroup(key: CarePerson["care_group"], people: RosterPerson[]) {
  if (key === "offline") {
    const connected = people.filter((person) => person.alert !== "offline").length;
    return `${connected}/${people.length} connected`;
  }

  if (key === "active_alerts") {
    const urgent = people.filter((person) => person.activeAlert?.severity === "urgent").length;
    return `${urgent}/${people.length} urgent`;
  }

  if (key === "watch_list") {
    return `${people.length} reviewed`;
  }

  return `${people.length} monitored`;
}

function severityToPersonAlert(severity: CareAlertSeverity): CarePerson["alert"] {
  if (severity === "urgent") {
    return "urgent";
  }

  if (severity === "warning") {
    return "warning";
  }

  return "stable";
}

function buildGroups(people: CarePerson[] = [], alerts: CareAlert[] = []): RosterGroup[] {
  const alertsByPerson = new Map<string, CareAlert>();

  alerts.forEach((alert) => {
    if (!alertsByPerson.has(alert.person_id)) {
      alertsByPerson.set(alert.person_id, alert);
    }
  });

  const rosterPeople = people.map<RosterPerson>((person) => {
    const image = resolvePersonPhoto(person);
    const activeAlert = alertsByPerson.get(person.id) ?? null;

    return {
      ...person,
      ...image,
      activeAlert,
      alert: activeAlert ? severityToPersonAlert(activeAlert.severity) : person.alert,
      care_group: activeAlert ? "active_alerts" : person.care_group,
      context: activeAlert?.summary ?? person.context,
      status: activeAlert?.title ?? person.status,
    };
  });

  return groupOrder.map((key) => {
    const groupPeople = rosterPeople.filter((person) => person.care_group === key);
    return {
      ...groupConfig[key],
      people: groupPeople,
      summary: summarizeGroup(key, groupPeople),
    };
  });
}

function buildRosterAlerts(alerts: CareAlert[] = [], groups: RosterGroup[] = []): RosterAlert[] {
  const peopleById = new Map<string, RosterPerson>();

  groups.forEach((group) => {
    group.people.forEach((person) => {
      peopleById.set(person.id, person);
    });
  });

  return alerts.flatMap((alert) => {
    const person = peopleById.get(alert.person_id);
    return person ? [{ ...alert, person }] : [];
  });
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

function AlertBadge({ alert }: Readonly<{ alert: CarePerson["alert"] }>) {
  return <span className={`care-alert-badge ${alert}`}>{alertLabels[alert]}</span>;
}

const statusChartConfig = [
  { key: "stable", label: "Stable", color: "#4f7f63" },
  { key: "warning", label: "Review", color: "#c4812b" },
  { key: "urgent", label: "Urgent", color: "#c54a3f" },
  { key: "offline", label: "Offline", color: "#7f8790" },
] satisfies Array<{ key: CarePerson["alert"]; label: string; color: string }>;

function getPercent(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function StatusDonut({ people }: Readonly<{ people: RosterPerson[] }>) {
  const total = people.length;
  const stops = statusChartConfig.reduce<
    Array<(typeof statusChartConfig)[number] & { count: number; start: number; end: number }>
  >((items, item) => {
    const count = people.filter((person) => person.alert === item.key).length;
    const start = items.at(-1)?.end ?? 0;
    const end = total === 0 ? start : start + (count / total) * 360;
    return [...items, { ...item, count, start, end }];
  }, []);
  const donutBackground =
    total === 0
      ? "#ece2d3"
      : `conic-gradient(${stops
          .map((item) => `${item.color} ${item.start.toFixed(1)}deg ${item.end.toFixed(1)}deg`)
          .join(", ")})`;
  const clearCount = people.filter((person) => person.alert === "stable").length;

  return (
    <article className="dashboard-chart-panel status-mix" aria-label="Roster status mix">
      <div className="care-dashboard-heading">
        <p>Status mix</p>
        <h2>Roster health</h2>
      </div>
      <div className="dashboard-donut-wrap">
        <div
          aria-label={`${getPercent(clearCount, total)} percent stable`}
          className="dashboard-donut"
          role="img"
          style={{ background: donutBackground }}
        >
          <strong>{getPercent(clearCount, total)}%</strong>
          <span>stable</span>
        </div>
        <div className="dashboard-chart-legend">
          {stops.map((item) => (
            <span key={item.key}>
              <i style={{ backgroundColor: item.color }} />
              {item.label}
              <strong>{item.count}</strong>
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function BatteryBars({ people }: Readonly<{ people: RosterPerson[] }>) {
  const buckets = [
    {
      key: "strong",
      label: "70-100",
      count: people.filter((person) => (person.watch_battery_percent ?? -1) >= 70).length,
    },
    {
      key: "steady",
      label: "40-69",
      count: people.filter((person) => {
        const battery = person.watch_battery_percent;
        return battery !== null && battery >= 40 && battery < 70;
      }).length,
    },
    {
      key: "low",
      label: "0-39",
      count: people.filter((person) => {
        const battery = person.watch_battery_percent;
        return battery !== null && battery < 40;
      }).length,
    },
    {
      key: "offline",
      label: "Offline",
      count: people.filter((person) => person.watch_battery_percent === null).length,
    },
  ];
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));

  return (
    <article className="dashboard-chart-panel battery-chart" aria-label="Watch battery distribution">
      <div className="care-dashboard-heading">
        <p>Device readiness</p>
        <h2>Watch batteries</h2>
      </div>
      <div className="battery-bars">
        {buckets.map((bucket) => (
          <div className={`battery-bar ${bucket.key}`} key={bucket.key}>
            <div className="battery-bar-track">
              <span
                style={
                  {
                    "--bar-height": `${Math.max(12, Math.round((bucket.count / maxCount) * 100))}%`,
                  } as CSSProperties
                }
              />
            </div>
            <strong>{bucket.count}</strong>
            <small>{bucket.label}</small>
          </div>
        ))}
      </div>
    </article>
  );
}

function AlertTrend({ alerts }: Readonly<{ alerts: RosterAlert[] }>) {
  const latestAlertTime = alerts.reduce((latest, alert) => {
    const createdAt = new Date(alert.created_at).getTime();
    return Number.isNaN(createdAt) ? latest : Math.max(latest, createdAt);
  }, 0);
  const dayKeys = Array.from({ length: 7 }, (_, index) => {
    const date = latestAlertTime === 0 ? new Date(0) : new Date(latestAlertTime);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
  const alertCounts = new Map(dayKeys.map((day) => [day, 0]));

  alerts.forEach((alert) => {
    const day = new Date(alert.created_at).toISOString().slice(0, 10);
    if (alertCounts.has(day)) {
      alertCounts.set(day, (alertCounts.get(day) ?? 0) + 1);
    }
  });

  const samples = dayKeys.map((day) => alertCounts.get(day) ?? 0);
  const max = Math.max(1, ...samples);
  const points = samples
    .map((sample, index) => {
      const x = 8 + index * 14;
      const y = 82 - (sample / max) * 58;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <article className="dashboard-chart-panel alert-trend" aria-label="Seven day alert count trend">
      <div className="care-dashboard-heading">
        <p>Alerts</p>
        <h2>Alert trend</h2>
      </div>
      <div className="alert-trend-body">
        <div>
          <strong>{alerts.length}</strong>
          <span>open now</span>
        </div>
        <svg viewBox="0 0 100 92" role="img" aria-label="Seven day alert count trend">
          <path d="M8 82H94" />
          <path d="M8 58H94" />
          <path d="M8 34H94" />
          <polyline points={points} />
          {samples.map((sample, index) => {
            const x = 8 + index * 14;
            const y = 82 - (sample / max) * 58;
            return <circle cx={x} cy={y} key={`${sample}-${index}`} r="2.2" />;
          })}
        </svg>
      </div>
    </article>
  );
}

function DashboardOverview({ alerts, groups }: Readonly<{ alerts: RosterAlert[]; groups: RosterGroup[] }>) {
  const people = groups.flatMap((group) => group.people);

  return (
    <section className="care-dashboard-view" aria-label="Dashboard overview">
      <div className="dashboard-charts-grid" aria-label="Quick care overview charts">
        <StatusDonut people={people} />
        <BatteryBars people={people} />
        <AlertTrend alerts={alerts} />
      </div>

      <div className="care-dashboard-grid">
        <section className="care-dashboard-panel senior-overview" aria-label="All seniors">
          <div className="care-dashboard-heading">
            <p>Roster</p>
            <h2>All seniors</h2>
          </div>

          <div className="care-dashboard-table-wrap">
            <table className="care-dashboard-table">
              <thead>
                <tr>
                  <th scope="col">Senior</th>
                  <th scope="col">Status</th>
                  <th scope="col">Watch</th>
                  <th scope="col">Last seen</th>
                  <th scope="col">Alert</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.id}>
                    <th scope="row">
                      <span className="care-dashboard-avatar-wrap">
                        <Image
                          src={person.photo}
                          alt={`${person.name} portrait`}
                          width={34}
                          height={34}
                          unoptimized={!person.hasPhoto}
                        />
                        <span className={`care-dashboard-dot ${person.alert}`} />
                      </span>
                      <span>
                        <Link className="care-dashboard-person-link" href={`/app/people/${person.id}`}>
                          {person.name}
                        </Link>
                        <small>Age {person.age}</small>
                      </span>
                    </th>
                    <td>{person.status}</td>
                    <td className="care-dashboard-metric">
                      {person.watch_battery_percent === null ? "--" : `${person.watch_battery_percent}%`}
                    </td>
                    <td>{person.last_seen_label}</td>
                    <td>
                      <AlertBadge alert={person.alert} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="care-dashboard-panel alert-overview" aria-label="Alert summary">
          <div className="care-dashboard-heading">
            <p>Alerts</p>
            <h2>{alerts.length === 0 ? "No active alerts" : "Needs attention"}</h2>
          </div>

          {alerts.length === 0 ? (
            <p className="care-dashboard-empty">All monitored seniors are currently clear.</p>
          ) : (
            <div className="care-dashboard-alerts">
              {alerts.map((alert) => (
                <article className={`care-dashboard-alert ${alert.severity}`} key={alert.id}>
                  <Image
                    src={alert.person.photo}
                    alt={`${alert.person.name} portrait`}
                    width={34}
                    height={34}
                    unoptimized={!alert.person.hasPhoto}
                  />
                  <div>
                    <Link className="care-dashboard-person-link" href={`/app/people/${alert.person.id}`}>
                      {alert.person.name}
                    </Link>
                    <span>{alert.summary}</span>
                  </div>
                  <AlertBadge alert={severityToPersonAlert(alert.severity)} />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function PersonCard({ person }: Readonly<{ person: RosterPerson }>) {
  const watchLabel =
    person.watch_battery_percent === null ? "Watch offline" : `${person.watch_battery_percent}% watch`;
  const signalLabel =
    person.alert === "urgent" ? "!" : person.alert === "warning" ? "~" : person.alert === "offline" ? "--" : "";

  return (
    <Link className={`care-person-card ${person.alert}`} href={`/app/people/${person.id}`}>
      <div className="care-photo">
        <Image
          alt={`${person.name} portrait`}
          className="care-photo-image"
          height={40}
          src={person.photo}
          unoptimized={!person.hasPhoto}
          width={40}
        />
        {!person.hasPhoto ? <span className="care-photo-initials">{person.initials}</span> : null}
      </div>

      <div className="care-person-id">
        <h3>{person.name}</h3>
        <p>
          <span>{person.age} yrs</span>
          <span className="care-person-status">{watchLabel}</span>
        </p>
      </div>

      {signalLabel ? (
        <span aria-hidden="true" className={`care-person-signal ${person.alert}`}>
          {signalLabel}
        </span>
      ) : null}
    </Link>
  );
}

function RosterColumns({ groups }: Readonly<{ groups: RosterGroup[] }>) {
  return (
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
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function CareWorkspace({
  activeView,
  alerts,
  groups,
  profile,
}: Readonly<{
  activeView: CareView;
  alerts: RosterAlert[];
  groups: RosterGroup[];
  profile: CareProfile | null;
}>) {
  if (activeView === "dashboard") {
    return <DashboardOverview alerts={alerts} groups={groups} />;
  }

  if (activeView === "roster") {
    return <RosterColumns groups={groups} />;
  }

  const roomAlerts: RoomAlert[] = alerts.map((a) => ({
    id: a.id,
    alert_key: a.alert_key,
    person_id: a.person_id,
    title: a.title,
    signal_label: a.signal_label,
    severity: a.severity,
    status: a.status,
    summary: a.summary,
    metric_label: a.metric_label,
    metric_value: a.metric_value,
    triggered_label: a.triggered_label,
    next_step: a.next_step,
    created_at: a.created_at,
    person: {
      id: a.person.id,
      name: a.person.name,
      age: a.person.age,
      status: a.person.status ?? "",
      alert: a.person.alert,
      photo: a.person.photo,
      hasPhoto: a.person.hasPhoto,
      initials: a.person.initials,
      heart_rate_bpm: a.person.heart_rate_bpm,
      watch_battery_percent: a.person.watch_battery_percent,
    },
  }));
  const roomPeople: RoomPerson[] = groups.flatMap((group) =>
    group.people.map((person) => ({
      id: person.id,
      name: person.name,
      age: person.age,
      status: person.status ?? "",
      alert: person.alert,
      photo: person.photo,
      hasPhoto: person.hasPhoto,
      initials: person.initials,
      heart_rate_bpm: person.heart_rate_bpm,
      watch_battery_percent: person.watch_battery_percent,
    })),
  );

  return (
    <section className="care-detail-view room-view" aria-label={`${careViews[activeView].title} workspace`}>
      <AlertRoom alerts={roomAlerts} people={roomPeople} profile={profile} />
    </section>
  );
}

export function RosterClient({
  alerts = [],
  initialView = "dashboard",
  people = [],
  profile,
}: Readonly<{
  alerts: CareAlert[];
  initialView?: CareView;
  people: CarePerson[];
  profile: CareProfile | null;
}>) {
  const groups = useMemo(() => buildGroups(people, alerts), [alerts, people]);
  const rosterAlerts = useMemo(() => buildRosterAlerts(alerts, groups), [alerts, groups]);
  const onlinePercent =
    people.length === 0
      ? 0
      : Math.round((people.filter((person) => person.alert !== "offline").length / people.length) * 100);
  const view = careViews[initialView];

  return (
    <main className="care-app-page">
      <div className="care-app-shell">
        <AppSidebar activePage={initialView} />
        <section className="care-main" aria-label={`${view.title} workspace`}>
          <div className={`care-board ${initialView}-board`} aria-label="Senior care management board">
            <header className="care-board-header">
              <div>
                <p className="care-board-eyebrow">{view.eyebrow}</p>
                <h1>{view.title}</h1>
              </div>
              <div className="care-board-status" aria-label="Live monitoring">
                <span aria-hidden="true" />
                <div>
                  <strong>Live monitoring</strong>
                  <small>{onlinePercent}% devices online</small>
                </div>
              </div>
            </header>

            <CareWorkspace
              activeView={initialView}
              alerts={rosterAlerts}
              groups={groups}
              profile={profile}
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

    </main>
  );
}
