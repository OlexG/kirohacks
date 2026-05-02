import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { listActiveCareAlertsForPerson } from "@/lib/care-alerts";
import { buildHrSamples } from "@/lib/care-demo-metrics";
import { formatWatchBattery, getCarePerson } from "@/lib/care-people";
import {
  formatMlScore,
  formatRiskScore,
  listFallRiskObservationsForPerson,
  type FallRiskObservation,
} from "@/lib/fall-risk";
import {
  buildMedicationWeek,
  dayLabels,
  dayNames,
  getNextMedicationLabel,
  listMedicationsForPerson,
} from "@/lib/medications";
import { AppSidebar } from "../../sidebar";
import { resolvePersonPhoto } from "@/lib/care-person-image";
import { MedicationReminderButton } from "./medication-reminder-button";

type PersonPageProps = {
  params: Promise<{ personId: string }>;
};

export const metadata: Metadata = {
  title: "Safely App | Senior Profile",
  description: "Review senior medication schedule, watch status, and heart-rate trend.",
};

type ChartPoint = {
  label: string;
  value: number;
};

function formatNullable(value: number | string | boolean | null | undefined, fallback = "--") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function formatDecimal(value: number | null | undefined, digits = 2, suffix = "") {
  if (value === null || value === undefined) {
    return "--";
  }

  return `${value.toFixed(digits)}${suffix}`;
}

function formatClass(value: string | null | undefined) {
  if (!value) {
    return "--";
  }

  return value.replaceAll("_", " ");
}

function latestNumber(
  observations: FallRiskObservation[],
  selector: (observation: FallRiskObservation) => number | null,
) {
  return observations.find((observation) => selector(observation) !== null) ?? null;
}

function chartPoints(
  observations: FallRiskObservation[],
  selector: (observation: FallRiskObservation) => number | null,
  limit = 16,
) {
  return observations
    .filter((observation) => selector(observation) !== null)
    .slice(0, limit)
    .reverse()
    .map((observation) => ({
      label: new Date(observation.generated_at).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      value: selector(observation) ?? 0,
    }));
}

function MiniLineChart({
  label,
  points,
  suffix = "",
}: Readonly<{ label: string; points: ChartPoint[]; suffix?: string }>) {
  if (points.length < 2) {
    return (
      <article className="person-mini-chart empty">
        <span>{label}</span>
        <strong>No trend yet</strong>
        <p>Waiting for fall-risk webhook data.</p>
      </article>
    );
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const path = points
    .map((point, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 92 - ((point.value - min) / range) * 74;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  const latest = points.at(-1);

  return (
    <article className="person-mini-chart">
      <span>{label}</span>
      <strong>
        {latest?.value.toFixed(label.includes("Speed") ? 2 : 0)}
        {suffix}
      </strong>
      <svg viewBox="0 0 100 100" role="img" aria-label={`${label} trend`}>
        <path d="M 0 92 H 100" />
        <path d={path} />
      </svg>
      <p>{latest?.label ?? "Latest"}</p>
    </article>
  );
}

export default async function PersonProfilePage({ params }: PersonPageProps) {
  await connection();
  const { personId } = await params;
  const [person, alerts, medications, fallRiskObservations] = await Promise.all([
    getCarePerson(personId),
    listActiveCareAlertsForPerson(personId),
    listMedicationsForPerson(personId),
    listFallRiskObservationsForPerson(personId),
  ]);

  if (!person) {
    notFound();
  }

  const image = resolvePersonPhoto(person);
  const meds = buildMedicationWeek(medications);
  const samples = buildHrSamples(person.heart_rate_bpm ?? 70, person.sort_order);
  const minHeartRate = Math.min(...samples);
  const maxHeartRate = Math.max(...samples);
  const nextMedication = getNextMedicationLabel(meds);
  const totalScheduledDoses = Object.values(meds).flat().length;
  const ruleRiskScore =
    person.fall_rule_risk_score_100 ??
    latestNumber(fallRiskObservations, (observation) => observation.rule_risk_score_100)
      ?.rule_risk_score_100 ??
    null;
  const instabilityScore =
    person.fall_rule_instability_score_100 ??
    latestNumber(fallRiskObservations, (observation) => observation.rule_instability_score_100)
      ?.rule_instability_score_100 ??
    null;
  const ruleRiskLevel =
    person.fall_rule_risk_level ??
    latestNumber(fallRiskObservations, (observation) => observation.rule_risk_score_100)
      ?.rule_risk_level ??
    null;
  const mlScore =
    person.fall_ml_risk_score_01 ??
    latestNumber(fallRiskObservations, (observation) => observation.ml_risk_score_01)
      ?.ml_risk_score_01 ??
    null;
  const steadinessClass =
    person.walking_steadiness_class ??
    latestNumber(fallRiskObservations, (observation) => observation.walking_steadiness_score_01)
      ?.walking_steadiness_class ??
    null;
  const recentInstabilityEvents = fallRiskObservations.filter(
    (observation) => observation.message_type === "instability_event",
  );
  const highInstabilityEvents = recentInstabilityEvents.filter((observation) => observation.severity === "high");
  const mobilitySpeed =
    person.walking_speed_mps ??
    latestNumber(fallRiskObservations, (observation) => observation.walking_speed_mps)
      ?.walking_speed_mps ??
    null;
  const cadence =
    latestNumber(fallRiskObservations, (observation) => observation.cadence_spm)?.cadence_spm ?? null;
  const riskChart = chartPoints(fallRiskObservations, (observation) => observation.rule_risk_score_100);
  const instabilityChart = chartPoints(
    fallRiskObservations,
    (observation) => observation.rule_instability_score_100,
  );
  const heartChart = chartPoints(fallRiskObservations, (observation) => observation.heart_rate_bpm);
  const mobilityChart = chartPoints(fallRiskObservations, (observation) => observation.walking_speed_mps);

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

            <section className="person-profile-view person-room-view">
              <div className="person-room-topbar" aria-label="Profile controls">
                <Link className="person-back-link" href="/app/dashboard">
                  Back to workspace
                </Link>
                <div className="person-room-status" aria-label="Profile status">
                  <span>{alerts.length === 0 ? "No active alerts" : `${alerts.length} active alerts`}</span>
                  <span>{formatWatchBattery(person.watch_battery_percent)} watch</span>
                  <span>{person.last_seen_label}</span>
                </div>
              </div>

              <div className="person-room-stage">
                <article className="person-focus-card" aria-label="Profile summary">
                  <div className="person-focus-pulse" aria-hidden="true" />
                  <div className="person-focus-content">
                    <Image
                      className="person-focus-photo"
                      src={image.photo}
                      alt={`${person.name} profile photo`}
                      width={154}
                      height={154}
                      priority
                      unoptimized
                    />
                    <p className="person-focus-kicker">Senior profile</p>
                    <h2>{person.name}</h2>
                    <p className="person-focus-subtitle">Age {person.age} · Home · {person.status}</p>
                    <p className="person-focus-summary">{person.context || person.status}</p>

                    <div className="person-focus-metrics" aria-label="Primary metrics">
                      <div>
                        <span>Heart rate</span>
                        <strong>{person.heart_rate_bpm ?? "--"} bpm</strong>
                      </div>
                      <div>
                        <span>Rule risk</span>
                        <strong>{formatRiskScore(ruleRiskScore)}</strong>
                      </div>
                      <div>
                        <span>Next med</span>
                        <strong>{nextMedication === "None" ? "None" : nextMedication}</strong>
                      </div>
                    </div>
                  </div>
                </article>

                <section className="person-orbit-card person-orbit-heart" aria-label="Rule risk">
                  <header>
                    <div>
                      <p className="care-detail-kicker">Rule Risk</p>
                      <strong>{formatRiskScore(ruleRiskScore)}</strong>
                      <span>{formatClass(ruleRiskLevel)}</span>
                    </div>
                    <div className="person-live-pill">
                      <span aria-hidden="true" />
                      Rule
                    </div>
                  </header>
                  <p>Transparent score from thresholds and baselines.</p>
                </section>

                <section className="person-orbit-card person-orbit-watch" aria-label="Experimental ML score">
                  <span>Experimental ML</span>
                  <strong>{formatMlScore(mlScore)}</strong>
                  <p>{person.fall_ml_model_version ?? "Non-clinical estimate"}</p>
                </section>

                <section className="person-orbit-card person-orbit-motion" aria-label="Walking steadiness">
                  <span>Walking steadiness</span>
                  <strong>{formatClass(steadinessClass)}</strong>
                  <p>{mobilitySpeed === null ? "Speed pending" : `${mobilitySpeed.toFixed(2)} m/s`}</p>
                </section>

                <section className="person-orbit-card person-orbit-rest" aria-label="Recent instability">
                  <span>Recent instability</span>
                  <strong>{instabilityScore === null ? recentInstabilityEvents.length : formatRiskScore(instabilityScore)}</strong>
                  <p>
                    {recentInstabilityEvents.length} events · {highInstabilityEvents.length} high
                  </p>
                </section>
              </div>

              <div className="person-room-tray">
                <section className="person-profile-data-card" aria-label="Fall-risk profile data">
                  <header>
                    <div>
                      <p className="care-detail-kicker">Profile</p>
                      <h2>Fall-risk profile</h2>
                    </div>
                    <span>{person.fall_risk_updated_at ? "Live from webhook" : "Awaiting webhook"}</span>
                  </header>
                  <div className="person-profile-data-grid">
                    <div>
                      <span>Sex</span>
                      <strong>{formatClass(person.sex)}</strong>
                    </div>
                    <div>
                      <span>Height</span>
                      <strong>{person.height_cm === null ? "--" : `${Number(person.height_cm).toFixed(0)} cm`}</strong>
                    </div>
                    <div>
                      <span>Assistive device</span>
                      <strong>{formatClass(person.assistive_device)}</strong>
                    </div>
                    <div>
                      <span>Prior falls</span>
                      <strong>{formatNullable(person.prior_falls_12mo)}</strong>
                    </div>
                    <div>
                      <span>Injurious fall</span>
                      <strong>{person.injurious_fall_12mo === null ? "--" : person.injurious_fall_12mo ? "Yes" : "No"}</strong>
                    </div>
                    <div>
                      <span>Unable to rise</span>
                      <strong>
                        {person.unable_to_rise_after_fall_12mo === null
                          ? "--"
                          : person.unable_to_rise_after_fall_12mo
                            ? "Yes"
                            : "No"}
                      </strong>
                    </div>
                  </div>
                  <div className="person-tags">
                    {(person.impairment_tags ?? []).length === 0 ? (
                      <span>No impairment tags yet</span>
                    ) : (
                      (person.impairment_tags ?? []).map((tag) => <span key={tag}>{tag}</span>)
                    )}
                  </div>
                </section>

                <section className="person-chart-card" aria-label="Fall-risk time series">
                  <header>
                    <div>
                      <p className="care-detail-kicker">Time series</p>
                      <h2>Monitoring trends</h2>
                    </div>
                    <span>{fallRiskObservations.length} samples</span>
                  </header>
                  <div className="person-chart-grid">
                    <MiniLineChart label="Rule Risk" points={riskChart} />
                    <MiniLineChart label="Instability" points={instabilityChart} />
                    <MiniLineChart label="Heart Rate" points={heartChart} suffix=" bpm" />
                    <MiniLineChart label="Speed" points={mobilityChart} suffix=" m/s" />
                  </div>
                  <div className="person-latest-strip">
                    <span>Cadence {formatDecimal(cadence, 0, " spm")}</span>
                    <span>Asymmetry {formatDecimal(person.walking_asymmetry_pct, 1, "%")}</span>
                    <span>Double support {formatDecimal(person.walking_double_support_pct, 1, "%")}</span>
                    <span>HR range {minHeartRate}-{maxHeartRate} bpm</span>
                  </div>
                </section>

                <section className="person-week-card" aria-label="Medication schedule">
                  <header>
                    <div>
                      <p className="care-detail-kicker">Medication</p>
                      <h2>Weekly medication</h2>
                    </div>
                    <span className="person-week-summary">{nextMedication === "None" ? "No next dose" : `${nextMedication} next`}</span>
                  </header>
                  <div className="person-medication-overview">
                    <div>
                      <span>Next dose</span>
                      <strong>{nextMedication === "None" ? "No scheduled dose" : nextMedication}</strong>
                    </div>
                    <div>
                      <span>Medications</span>
                      <strong>{medications.length}</strong>
                    </div>
                    <div>
                      <span>Weekly doses</span>
                      <strong>{totalScheduledDoses}</strong>
                    </div>
                  </div>
                  <div className="person-week-row" aria-label="Medication days">
                    {dayLabels.map((label, index) => {
                      const scheduled = (meds[index] ?? []).length > 0;
                      return (
                        <div className={scheduled ? "scheduled" : ""} key={`${person.id}-day-${index}`}>
                          <span>{label}</span>
                          <strong>{(meds[index] ?? []).length}</strong>
                          <i aria-hidden="true">{scheduled ? "set" : "none"}</i>
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
                                  <small>{med.time}</small>
                                  <span>
                                    <strong>{med.name}</strong>
                                    <em>
                                      {med.dose}
                                      {med.deliveryMethod ? ` · ${med.deliveryMethod}` : ""}
                                    </em>
                                  </span>
                                  <MedicationReminderButton
                                    dayName={dayName}
                                    dose={med.dose}
                                    medicationId={med.medicationId}
                                    time={med.time}
                                  />
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
