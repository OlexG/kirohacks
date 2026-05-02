import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { listActiveCareAlertsForPerson } from "@/lib/care-alerts";
import { buildHrSamples, buildMeds, dayNames } from "@/lib/care-demo-metrics";
import { formatHeartRate, formatWatchBattery, getCarePerson } from "@/lib/care-people";
import { resolvePersonPhoto } from "@/lib/care-person-image";

type PersonPageProps = {
  params: Promise<{ personId: string }>;
};

export const metadata: Metadata = {
  title: "Safely App | Senior Profile",
  description: "Review senior medication schedule, watch status, and heart-rate trend.",
};

function buildHeartPath(samples: number[]) {
  if (samples.length < 2) return "";
  const width = 100;
  const height = 34;
  const max = Math.max(...samples);
  const min = Math.min(...samples);
  const range = Math.max(max - min, 1);

  return samples
    .map((value, index) => {
      const x = (index / (samples.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 5) - 2.5;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

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
  const heartPath = buildHeartPath(samples);
  const minHeartRate = Math.min(...samples);
  const maxHeartRate = Math.max(...samples);

  return (
    <main className="care-app-page">
      <div className="care-app-shell">
        <aside className="care-sidebar" aria-label="Application navigation">
          <Link className="care-sidebar-brand" href="/" aria-label="Safely home">
            <span className="care-sidebar-mark">S</span>
            <span>
              <strong>Safely</strong>
              <small>Care operations</small>
            </span>
          </Link>

          <nav className="care-sidebar-nav" aria-label="Care workspace">
            <Link className="care-sidebar-link" href="/app">
              <span>D</span>
              Dashboard
            </Link>
            <Link className="care-sidebar-link active" href="/app">
              <span>P</span>
              Profile
            </Link>
            <Link className="care-sidebar-link" href="/app/rules">
              <span>R</span>
              Rules
            </Link>
          </nav>

          <div className="care-sidebar-status" aria-label="Current profile status">
            <div>
              <span aria-hidden="true" />
              <strong>{person.alert === "offline" ? "Device offline" : "Live profile"}</strong>
            </div>
            <p>{person.last_seen_label}</p>
          </div>
        </aside>

        <section className="care-main person-profile-main" aria-label={`${person.name} profile`}>
          <div className="care-board person-profile-board">
            <header className="care-board-header person-profile-header">
              <div>
                <Link className="person-back-link" href="/app">
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
              <div className="person-profile-hero">
                <Image
                  src={image.photo}
                  alt={`${person.name} portrait`}
                  width={148}
                  height={148}
                  unoptimized={!image.hasPhoto}
                />
                <div>
                  <p className="care-detail-kicker">Profile</p>
                  <h2>{person.name}</h2>
                  <p>
                    Age {person.age}. {person.context || person.status}
                  </p>
                  <div className="person-profile-tags" aria-label="Profile status">
                    <span>{person.care_group.replace("_", " ")}</span>
                    <span>{person.last_seen_label}</span>
                    <span>{formatWatchBattery(person.watch_battery_percent)} battery</span>
                  </div>
                </div>
              </div>

              <div className="person-profile-grid">
                <section className="person-profile-panel heart-panel" aria-label="Heart rate trend">
                  <header>
                    <div>
                      <p className="care-detail-kicker">Heart data</p>
                      <h2>{formatHeartRate(person.heart_rate_bpm)}</h2>
                    </div>
                    <span>
                      {minHeartRate}-{maxHeartRate} bpm range
                    </span>
                  </header>
                  <svg viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
                    <path d={heartPath} fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="heart-sample-row" aria-label="Recent heart rate samples">
                    {samples.slice(-7).map((sample, index) => (
                      <span key={`${person.id}-sample-${index}`}>{sample}</span>
                    ))}
                  </div>
                </section>

                <section className="person-profile-panel medication-panel" aria-label="Medication schedule">
                  <header>
                    <div>
                      <p className="care-detail-kicker">Medication</p>
                      <h2>Weekly schedule</h2>
                    </div>
                  </header>
                  <div className="person-medication-week">
                    {dayNames.map((dayName, index) => {
                      const dayMeds = meds[index] ?? [];
                      return (
                        <article key={`${person.id}-${dayName}`}>
                          <span>{dayName}</span>
                          {dayMeds.length === 0 ? (
                            <p>No scheduled meds</p>
                          ) : (
                            <ul>
                              {dayMeds.map((med) => (
                                <li key={`${dayName}-${med.name}-${med.time}`}>
                                  <strong>{med.name}</strong>
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

                <section className="person-profile-panel alert-panel" aria-label="Active alerts">
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
