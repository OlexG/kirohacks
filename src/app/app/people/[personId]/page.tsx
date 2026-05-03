import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SABAWOON_HAKIMI_PERSON_ID } from "@/lib/biometrics-data";
import { listActiveCareAlertsForPerson } from "@/lib/care-alerts";
import { buildHrSamples } from "@/lib/care-demo-metrics";
import { formatWatchBattery, getCarePerson } from "@/lib/care-people";
import {
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
import { checkMissedMedications } from "@/lib/medication-alerts";
import { AppSidebar } from "../../sidebar";
import { resolvePersonPhoto } from "@/lib/care-person-image";
import { LiveDataRefresh, LiveMetricValue } from "../../live-data-refresh";
import { MedicationReminderButton } from "./medication-reminder-button";

type PersonPageProps = {
  params: Promise<{ personId: string }>;
};

export const metadata: Metadata = {
  title: "Elsa App | Senior Profile",
  description: "Review senior medication schedule, watch status, and heart-rate trend.",
};

type ChartPoint = {
  label: string;
  value: number;
};

const INSTABILITY_FLASH_THRESHOLD = 80;
const SABAWOON_LOCATION_ADDRESS = "611 Luneta Dr";
const SABAWOON_LOCATION_CITY = "San Luis Obispo, CA";
const SABAWOON_LOCATION_LATITUDE = 35.291391;
const SABAWOON_LOCATION_LONGITUDE = -120.6747912;
const SABAWOON_LOCATION_ZOOM = 17;
const MAP_TILE_SIZE = 256;

type MapTile = {
  key: string;
  left: string;
  top: string;
  url: string;
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
  alertThreshold,
  suffix = "",
}: Readonly<{ label: string; points: ChartPoint[]; alertThreshold?: number; suffix?: string }>) {
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
  const isAlerting = alertThreshold !== undefined && latest !== undefined && latest.value > alertThreshold;

  return (
    <article className={`person-mini-chart${isAlerting ? " is-alerting" : ""}`}>
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

function buildMapTiles(latitude: number, longitude: number, zoom: number): MapTile[] {
  const scale = 2 ** zoom;
  const latitudeRadians = (latitude * Math.PI) / 180;
  const x = ((longitude + 180) / 360) * scale;
  const y =
    ((1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) /
      2) *
    scale;
  const centerTileX = Math.floor(x);
  const centerTileY = Math.floor(y);
  const fractionalX = x - centerTileX;
  const fractionalY = y - centerTileY;
  const tiles: MapTile[] = [];

  for (let yOffset = -2; yOffset <= 2; yOffset += 1) {
    for (let xOffset = -2; xOffset <= 2; xOffset += 1) {
      const tileX = centerTileX + xOffset;
      const tileY = centerTileY + yOffset;
      const wrappedTileX = ((tileX % scale) + scale) % scale;

      tiles.push({
        key: `${zoom}-${wrappedTileX}-${tileY}`,
        left: `calc(50% + ${(xOffset - fractionalX) * MAP_TILE_SIZE}px)`,
        top: `calc(50% + ${(yOffset - fractionalY) * MAP_TILE_SIZE}px)`,
        url: `https://tile.openstreetmap.org/${zoom}/${wrappedTileX}/${tileY}.png`,
      });
    }
  }

  return tiles;
}

function PersonLocationMap({
  personName,
  photo,
}: Readonly<{
  personName: string;
  photo: string;
}>) {
  const mapTiles = buildMapTiles(
    SABAWOON_LOCATION_LATITUDE,
    SABAWOON_LOCATION_LONGITUDE,
    SABAWOON_LOCATION_ZOOM,
  );
  const coordinateLabel = `${SABAWOON_LOCATION_LATITUDE.toFixed(6)}, ${SABAWOON_LOCATION_LONGITUDE.toFixed(6)}`;

  return (
    <section className="person-location-card" aria-label={`${personName} location`}>
      <div
        className="person-map-panel"
        aria-label={`${personName} near ${SABAWOON_LOCATION_ADDRESS}, ${SABAWOON_LOCATION_CITY}`}
      >
        <div className="person-map-tile-layer" aria-hidden="true">
          {mapTiles.map((tile) => (
            <span
              className="person-map-tile"
              key={tile.key}
              style={{
                backgroundImage: `url("${tile.url}")`,
                left: tile.left,
                top: tile.top,
              }}
            />
          ))}
        </div>

        <div className="person-map-marker" aria-hidden="true">
          <span />
          <Image src={photo} alt="" width={54} height={54} unoptimized />
        </div>

        <div className="person-map-address">
          <span>{personName}</span>
          <strong>{SABAWOON_LOCATION_ADDRESS}</strong>
          <small>{SABAWOON_LOCATION_CITY}</small>
          <small>{coordinateLabel}</small>
        </div>
        <a
          className="person-map-attribution"
          href="https://www.openstreetmap.org/copyright"
          rel="noreferrer"
          target="_blank"
        >
          © OpenStreetMap
        </a>
      </div>
    </section>
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

  // Create medication_missed alerts for any past days with unchecked doses
  await checkMissedMedications(personId, person.name, meds);

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
  const latestObservation = fallRiskObservations[0] ?? null;
  const isLiveProfile = person.id === SABAWOON_HAKIMI_PERSON_ID;
  const profileDataLabel = isLiveProfile
    ? person.fall_risk_updated_at
      ? "Live from webhook"
      : "Awaiting webhook"
    : "Non live profile";
  const isRuleRiskHigh = ruleRiskScore !== null && ruleRiskScore > 50;
  const isInstabilityCritical =
    instabilityScore !== null && instabilityScore >= INSTABILITY_FLASH_THRESHOLD;
  const criticalLiveFieldStyle = {
    background: "#b84a3c",
    borderColor: "#7f2118",
    boxShadow:
      "0 0 0 2px rgba(255, 255, 255, 0.52), 0 0 0 8px rgba(184, 74, 60, 0.34), 0 16px 34px rgba(184, 74, 60, 0.26)",
  };
  const latestFallRiskSignature = [
    person.fall_risk_updated_at ?? "pending",
    latestObservation?.id ?? "no-observation",
    latestObservation?.message_type ?? "none",
    ruleRiskScore ?? "no-risk",
    instabilityScore ?? "no-instability",
    person.heart_rate_bpm ?? "no-hr",
  ].join(":");
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
              <div className="person-room-stage">
                <article className="person-focus-card" aria-label="Profile summary">
                  <div className="person-profile-live-corner" aria-label="Watch connection status">
                    <LiveDataRefresh
                      intervalMs={3500}
                      statusText="Watch is connected"
                      updatedAt={person.fall_risk_updated_at ?? latestObservation?.generated_at}
                      variant="profile"
                      watchedKey={latestFallRiskSignature}
                    />
                  </div>
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
                    <p className="person-focus-kicker">
                      {isLiveProfile ? "Senior profile" : "Senior profile · Non live profile"}
                    </p>
                    <h2>{person.name}</h2>
                    <p className="person-focus-subtitle">Age {person.age} · Home · {person.status}</p>
                    <p className="person-focus-summary">{person.context || person.status}</p>

                    <div className="person-focus-metrics" aria-label="Primary metrics">
                      <div>
                        <span>Heart rate</span>
                        <LiveMetricValue compareKey={person.heart_rate_bpm ?? "none"}>
                          {person.heart_rate_bpm ?? "--"} bpm
                        </LiveMetricValue>
                      </div>
                      <div className={isRuleRiskHigh ? "is-alerting-live-field" : undefined}>
                        <span>Fall risk</span>
                        <LiveMetricValue compareKey={ruleRiskScore ?? "none"}>
                          {formatRiskScore(ruleRiskScore)}
                        </LiveMetricValue>
                      </div>
                      <div>
                        <span>Next med</span>
                        <strong>{nextMedication === "None" ? "None" : nextMedication}</strong>
                      </div>
                    </div>
                  </div>
                </article>

                <section
                  className={`person-orbit-card person-orbit-heart${
                    isRuleRiskHigh ? " is-alerting-live-field is-critical-live-field" : ""
                  }`}
                  style={isRuleRiskHigh ? criticalLiveFieldStyle : undefined}
                  aria-label="Fall risk"
                >
                  <header>
                    <div>
                      <p className="care-detail-kicker">Fall Risk</p>
                      <LiveMetricValue compareKey={ruleRiskScore ?? "none"}>
                        {formatRiskScore(ruleRiskScore)}
                      </LiveMetricValue>
                      <span>{formatClass(ruleRiskLevel)}</span>
                    </div>
                    <div className="person-live-pill">
                      <span aria-hidden="true" />
                      Fall
                    </div>
                  </header>
                  <p>Transparent score from thresholds and baselines.</p>
                </section>

                <section
                  className={`person-orbit-card person-orbit-motion${
                    isInstabilityCritical
                      ? " is-alerting-live-field is-critical-live-field is-instability-critical-live-field"
                      : ""
                  }`}
                  style={isInstabilityCritical ? criticalLiveFieldStyle : undefined}
                  aria-label="Instability"
                >
                  <span>Instability</span>
                  <LiveMetricValue
                    compareKey={`${instabilityScore ?? "none"}:${recentInstabilityEvents.length}`}
                  >
                    {instabilityScore === null ? recentInstabilityEvents.length : formatRiskScore(instabilityScore)}
                  </LiveMetricValue>
                  <p>
                    {recentInstabilityEvents.length} events · {highInstabilityEvents.length} high
                  </p>
                </section>

                <section className="person-orbit-card person-orbit-rest" aria-label="Walking speed">
                  <span>Speed</span>
                  <LiveMetricValue compareKey={mobilitySpeed ?? "none"}>
                    {mobilitySpeed === null ? "--" : mobilitySpeed.toFixed(2)}
                  </LiveMetricValue>
                  <p>{mobilitySpeed === null ? "Speed pending" : "m/s walking speed"}</p>
                </section>
              </div>

              <div className="person-room-tray">
                <section className="person-profile-data-card" aria-label="Fall-risk profile data">
                  <header>
                    <div>
                      <p className="care-detail-kicker">Profile</p>
                      <h2>Fall-risk profile</h2>
                    </div>
                    <span className={!isLiveProfile ? "non-live-profile-pill" : undefined}>
                      {profileDataLabel}
                    </span>
                  </header>
                  <div className="person-profile-data-grid">
                    <div>
                      <span>Sex</span>
                      <LiveMetricValue compareKey={person.sex ?? "none"}>{formatClass(person.sex)}</LiveMetricValue>
                    </div>
                    <div>
                      <span>Height</span>
                      <LiveMetricValue compareKey={person.height_cm ?? "none"}>
                        {person.height_cm === null ? "--" : `${Number(person.height_cm).toFixed(0)} cm`}
                      </LiveMetricValue>
                    </div>
                    <div>
                      <span>Assistive device</span>
                      <LiveMetricValue compareKey={person.assistive_device ?? "none"}>
                        {formatClass(person.assistive_device)}
                      </LiveMetricValue>
                    </div>
                    <div>
                      <span>Prior falls</span>
                      <LiveMetricValue compareKey={person.prior_falls_12mo ?? "none"}>
                        {formatNullable(person.prior_falls_12mo)}
                      </LiveMetricValue>
                    </div>
                    <div>
                      <span>Injurious fall</span>
                      <LiveMetricValue compareKey={String(person.injurious_fall_12mo)}>
                        {person.injurious_fall_12mo === null ? "--" : person.injurious_fall_12mo ? "Yes" : "No"}
                      </LiveMetricValue>
                    </div>
                    <div>
                      <span>Unable to rise</span>
                      <LiveMetricValue compareKey={String(person.unable_to_rise_after_fall_12mo)}>
                        {person.unable_to_rise_after_fall_12mo === null
                          ? "--"
                          : person.unable_to_rise_after_fall_12mo
                            ? "Yes"
                            : "No"}
                      </LiveMetricValue>
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
                    <MiniLineChart label="Fall Risk" points={riskChart} />
                    <MiniLineChart label="Instability" points={instabilityChart} />
                    <MiniLineChart label="Heart Rate" points={heartChart} alertThreshold={100} suffix=" bpm" />
                    <MiniLineChart label="Speed" points={mobilityChart} suffix=" m/s" />
                  </div>
                  <div className="person-latest-strip">
                    <span>Cadence {formatDecimal(cadence, 0, " spm")}</span>
                    <span>Asymmetry {formatDecimal(person.walking_asymmetry_pct, 1, "%")}</span>
                    <span>Double support {formatDecimal(person.walking_double_support_pct, 1, "%")}</span>
                    <span>HR range {minHeartRate}-{maxHeartRate} bpm</span>
                  </div>
                </section>

                {isLiveProfile ? <PersonLocationMap personName={person.name} photo={image.photo} /> : null}

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
