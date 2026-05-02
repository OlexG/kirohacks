"use client";

import { useActionState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CareAlert, CareAlertSeverity } from "@/lib/care-alerts";
import type { CarePeopleGroup, CarePerson } from "@/lib/care-people";
import { resolvePersonPhoto } from "@/lib/care-person-image";
import type { CareProfile } from "@/lib/profiles";
import { AppSidebar } from "./sidebar";
import {
  updateProfileNotificationNumberAction,
  type ProfileNumberActionState,
} from "./actions";

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

const initialProfileNumberState: ProfileNumberActionState = {
  ok: false,
  message: "",
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

function DashboardStat({
  label,
  value,
  note,
}: Readonly<{ label: string; value: string | number; note: string }>) {
  return (
    <article className="care-dashboard-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function AlertBadge({ alert }: Readonly<{ alert: CarePerson["alert"] }>) {
  return <span className={`care-alert-badge ${alert}`}>{alertLabels[alert]}</span>;
}

function DashboardOverview({ alerts, groups }: Readonly<{ alerts: RosterAlert[]; groups: RosterGroup[] }>) {
  const people = groups.flatMap((group) => group.people);
  const urgentCount = alerts.filter((alert) => alert.severity === "urgent").length;
  const onlineCount = people.filter((person) => person.alert !== "offline").length;
  const offlineCount = people.length - onlineCount;
  const onlinePercent =
    people.length === 0 ? 0 : Math.round((onlineCount / people.length) * 100);

  return (
    <section className="care-dashboard-view" aria-label="Dashboard overview">
      <div className="care-dashboard-stats" aria-label="Operational summary">
        <DashboardStat label="Seniors" value={people.length} note={`${onlineCount} reporting now`} />
        <DashboardStat label="Alerts" value={alerts.length} note={`${urgentCount} urgent`} />
        <DashboardStat label="Devices online" value={`${onlinePercent}%`} note="watch connectivity" />
        <DashboardStat label="Offline" value={offlineCount} note="need setup help" />
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

function AlertQueueView({
  alerts,
  profile,
}: Readonly<{
  alerts: RosterAlert[];
  profile: CareProfile | null;
}>) {
  const [state, formAction, isPending] = useActionState(
    updateProfileNotificationNumberAction,
    initialProfileNumberState,
  );
  const alertCountLabel = alerts.length === 1 ? "1 open alert" : `${alerts.length} open alerts`;

  return (
    <div className="alerts-workspace">
      <section className="profile-number-panel" aria-label="Notification profile">
        <div className="profile-number-copy">
          <p className="care-detail-kicker">Demo profile</p>
          <h2>{profile?.display_name ?? "Demo Caregiver"}</h2>
          <p>Add your number for notifications from the alert queue.</p>
        </div>

        <form action={formAction} className="profile-number-form">
          <label>
            Number
            <input
              autoComplete="tel"
              defaultValue={profile?.notification_number ?? ""}
              inputMode="tel"
              name="notification_number"
              placeholder="+1 (555) 010-0199"
              type="tel"
            />
          </label>
          <button className="care-detail-action" disabled={isPending} type="submit">
            {isPending ? "Saving" : "Save number"}
          </button>
          <p className={state.message ? (state.ok ? "success" : "error") : undefined}>
            {state.message ||
              (profile?.notification_number
                ? `Current number: ${profile.notification_number}`
                : "No notification number saved yet.")}
          </p>
        </form>
      </section>

      <section className="care-alert-table-panel" aria-label="Active alert table">
        <header className="care-alert-table-header">
          <div>
            <p className="care-detail-kicker">Alert table</p>
            <h2>Active alerts</h2>
          </div>
          <span>{alertCountLabel}</span>
        </header>

        {alerts.length === 0 ? (
          <article className="care-detail-card">
            <div>
              <h2>No active alerts</h2>
              <p>New urgent and review alerts will appear here.</p>
            </div>
          </article>
        ) : (
          <div className="care-alert-table-scroll">
            <table className="care-alert-table">
              <thead>
                <tr>
                  <th scope="col">Person</th>
                  <th scope="col">Alert</th>
                  <th scope="col">Signal</th>
                  <th scope="col">Metric</th>
                  <th scope="col">Triggered</th>
                  <th scope="col">Next step</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr className={alert.severity} key={alert.id}>
                    <td>
                      <div className="care-alert-person">
                        <Image
                          src={alert.person.photo}
                          alt={`${alert.person.name} portrait`}
                          width={38}
                          height={38}
                          unoptimized={!alert.person.hasPhoto}
                        />
                        <div>
                          <Link className="care-dashboard-person-link" href={`/app/people/${alert.person.id}`}>
                            {alert.person.name}
                          </Link>
                          <span>Age {alert.person.age}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="care-alert-title">
                        <span>{alert.severity}</span>
                        <strong>{alert.title}</strong>
                        <small>{alert.summary}</small>
                      </div>
                    </td>
                    <td>{alert.signal_label}</td>
                    <td>
                      <span className="care-alert-metric-label">{alert.metric_label}</span>
                      <strong className="care-alert-metric-value">{alert.metric_value}</strong>
                    </td>
                    <td>{alert.triggered_label}</td>
                    <td>{alert.next_step}</td>
                    <td>
                      <Link className="care-detail-action" href={`/app/people/${alert.person.id}`}>
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
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

  return (
    <section className="care-detail-view" aria-label={`${careViews[activeView].title} workspace`}>
      <AlertQueueView alerts={alerts} profile={profile} />
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
