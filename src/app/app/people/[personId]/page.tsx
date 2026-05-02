import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { listActiveCareAlertsForPerson } from "@/lib/care-alerts";
import { buildHrSamples, buildMeds, dayLabels, dayNames } from "@/lib/care-demo-metrics";
import { formatWatchBattery, getCarePerson } from "@/lib/care-people";
import { AppSidebar } from "../../sidebar";
import { resolvePersonPhoto } from "@/lib/care-person-image";

type PersonPageProps = {
  params: Promise<{ personId: string }>;
};

export const metadata: Metadata = {
  title: "Safely App | Senior Profile",
  description: "Review senior medication schedule, watch status, and heart-rate trend.",
};

export default async function PersonProfilePage({ params }: PersonPageProps) {
  await connection();
  const { personId } = await params;
  const [person, alerts] = await Promise.all([
    getCarePerson(personId),
    listActiveCareAlertsForPerson(personId),
  ]);

  if (!person) {
    notFound();
  }

  const image = resolvePersonPhoto(person);
  const meds = buildMeds(person.sort_order);
  const samples = buildHrSamples(person.heart_rate_bpm ?? 70, person.sort_order);
  const minHeartRate = Math.min(...samples);
  const maxHeartRate = Math.max(...samples);
  const heartBars = samples.slice(-12);
  const heartRange = Math.max(maxHeartRate - minHeartRate, 1);
  const nextMedication =
    Object.values(meds)
      .flat()
      .sort((first, second) => first.time.localeCompare(second.time))[0]?.time ?? "None";
  const oxygenLevel = `${96 + (person.sort_order % 3)}%`;
  const stepCount = (1800 + person.sort_order * 312).toLocaleString("en-US");
  const sleepDuration = `${6 + (person.sort_order % 3)}h ${12 + person.sort_order * 4}m`;

  return (
    <main className="care-app-page">
      <div className="care-app-shell">
        <AppSidebar activePage="profile" />

        <section className="care-main person-profile-main" aria-label={`${person.name} profile`}>
          <div className="care-board person-profile-board">
            <header className="care-board-header person-profile-header">
              <div>
                <Link className="person-back-link" href="/app/dashboard">
                  Back to workspace
                </Link>
                <p className="care-board-eyebrow">Senior profile</p>
                <h1>{person.name}</h1>
              </div>
              <div className="care-board-status" aria-label="Watch status">
                <span aria-hidden="true" />
                <div>
                  <strong>{person.status}</strong>
                  <small>{formatWatchBattery(person.watch_battery_percent)} watch battery</small>
                </div>
              </div>
            </header>

            <section className="person-profile-view">
              <div className="person-profile-stack">
                <section className="person-profile-card" aria-label="Profile summary">
                  <div className="person-profile-top">
                    <div className="person-profile-photo">
                      <Image
                        src={image.photo}
                        alt={`${person.name} profile photo`}
                        width={92}
                        height={92}
                        unoptimized
                      />
                    </div>
                    <div className="person-profile-copy">
                      <h2>{person.name}</h2>
                      <p>
                        Senior <span aria-hidden="true">&middot;</span> Age {person.age}
                      </p>
                    </div>
                    <span className="person-status-pill">{person.status}</span>
                  </div>
                  <p className="person-profile-body">{person.context || person.status}</p>
                  <div className="person-metric-row">
                    <div className="person-metric-tile">
                      <span>Location</span>
                      <strong>Home</strong>
                    </div>
                    <div className="person-metric-tile">
                      <span>Last seen</span>
                      <strong>{person.last_seen_label}</strong>
                    </div>
                  </div>
                </section>

                <section className="person-heart-card" aria-label="Heartbeat monitor">
                  <header>
                    <div>
                      <p className="care-detail-kicker">Heartbeat monitor</p>
                      <h2>{person.heart_rate_bpm ?? "--"}</h2>
                      <span>beats per minute</span>
                    </div>
                    <div className="person-live-pill">
                      <span aria-hidden="true" />
                      Live
                    </div>
                  </header>

                  <div className="person-heart-bars" aria-label="Recent heart rate samples">
                    {heartBars.map((sample, index) => {
                      const height = 28 + ((sample - minHeartRate) / heartRange) * 54;
                      return (
                        <span
                          key={`${person.id}-heart-bar-${index}`}
                          style={{ height: `${height}px` }}
                          title={`${sample} bpm`}
                        />
                      );
                    })}
                  </div>
                  <p>
                    Normal resting range for {person.name.split(" ")[0]}: {minHeartRate}-{maxHeartRate} bpm.
                  </p>
                </section>

                <div className="person-metric-grid" aria-label="Care metrics">
                  <div className="person-metric-tile">
                    <span>Oxygen</span>
                    <strong>{oxygenLevel}</strong>
                  </div>
                  <div className="person-metric-tile">
                    <span>Steps</span>
                    <strong>{stepCount}</strong>
                  </div>
                  <div className="person-metric-tile">
                    <span>Sleep</span>
                    <strong>{sleepDuration}</strong>
                  </div>
                  <div className="person-metric-tile">
                    <span>Next med</span>
                    <strong>{nextMedication}</strong>
                  </div>
                </div>

                <section className="person-week-card" aria-label="Medication schedule">
                  <header>
                    <div>
                      <p className="care-detail-kicker">Medication</p>
                      <h2>Weekly medication</h2>
                    </div>
                    <span className="person-week-summary">{nextMedication === "None" ? "No next dose" : `${nextMedication} next`}</span>
                  </header>
                  <div className="person-week-row" aria-label="Medication days">
                    {dayLabels.map((label, index) => {
                      const scheduled = (meds[index] ?? []).length > 0;
                      return (
                        <div className={scheduled ? "scheduled" : ""} key={`${person.id}-day-${index}`}>
                          <span>{label}</span>
                          <strong>{(meds[index] ?? []).length}</strong>
                          <i aria-hidden="true" />
                        </div>
                      );
                    })}
                  </div>
                  <div className="person-medication-list">
                    {dayNames.map((dayName, index) => {
                      const dayMeds = meds[index] ?? [];
                      return (
                        <article className={dayMeds.length > 0 ? "has-meds" : ""} key={`${person.id}-${dayName}`}>
                          <div className="person-medication-day">
                            <span>{dayLabels[index]}</span>
                            <strong>{dayName}</strong>
                          </div>
                          {dayMeds.length === 0 ? (
                            <p>No scheduled meds</p>
                          ) : (
                            <ul>
                              {dayMeds.map((med) => (
                                <li key={`${dayName}-${med.name}-${med.time}`}>
                                  <span>
                                    <strong>{med.name}</strong>
                                    <em>Scheduled dose</em>
                                  </span>
                                  <small>{med.time}</small>
                                </li>
                              ))}
                            </ul>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="person-alert-card" aria-label="Active alerts">
                  <header>
                    <div>
                      <p className="care-detail-kicker">Alerts</p>
                      <h2>{alerts.length === 0 ? "No active alerts" : `${alerts.length} active`}</h2>
                    </div>
                  </header>
                  {alerts.length === 0 ? (
                    <p className="person-profile-empty">No alerts are currently open for this senior.</p>
                  ) : (
                    <div className="person-alert-list">
                      {alerts.map((alert) => (
                        <article className={alert.severity} key={alert.id}>
                          <span>{alert.severity}</span>
                          <strong>{alert.title}</strong>
                          <p>{alert.summary}</p>
                          <small>
                            {alert.signal_label} - {alert.metric_value} - {alert.triggered_label}
                          </small>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
