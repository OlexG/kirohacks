"use client";

import { useActionState, useId, useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CareAlertSeverity } from "@/lib/care-alerts";
import { buildSuggestedNotificationText } from "@/lib/notification-copy";
import type { CareProfile } from "@/lib/profiles";
import {
  sendTextNotificationAction,
  updateProfileNotificationNumberAction,
  type ProfileNumberActionState,
  type TextNotificationActionState,
} from "./actions";

/* ------------------------------------------------------------------ */
/*  Types — mirrors the enriched alert/person from roster-client      */
/* ------------------------------------------------------------------ */

export type RoomPerson = {
  id: string;
  name: string;
  age: number;
  status: string;
  alert: "urgent" | "warning" | "stable" | "offline";
  photo: string;
  hasPhoto: boolean;
  initials: string;
  heart_rate_bpm: number | null;
  watch_battery_percent: number | null;
};

export type RoomAlert = {
  id: string;
  alert_key: string;
  person_id: string;
  title: string;
  signal_label: string;
  severity: CareAlertSeverity;
  status: string;
  summary: string;
  metric_label: string;
  metric_value: string;
  triggered_label: string;
  next_step: string;
  created_at: string;
  person: RoomPerson;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const signalGroups = [
  { match: "fall", label: "Fall", icon: "↓" },
  { match: "heart", label: "Heart", icon: "♥" },
  { match: "oxygen", label: "Oxygen", icon: "○" },
  { match: "movement", label: "Movement", icon: "→" },
  { match: "inactive", label: "Movement", icon: "→" },
  { match: "offline", label: "Device", icon: "◇" },
  { match: "battery", label: "Device", icon: "◇" },
  { match: "sleep", label: "Sleep", icon: "◑" },
  { match: "medication", label: "Medication", icon: "+" },
  { match: "check", label: "Check-in", icon: "✓" },
  { match: "location", label: "Location", icon: "◎" },
] as const;

function getSignalGroup(alert: RoomAlert) {
  const haystack = `${alert.alert_key} ${alert.signal_label} ${alert.title}`.toLowerCase();
  return signalGroups.find((g) => haystack.includes(g.match)) ?? { match: "", label: "Custom", icon: "·" };
}

const severityLabels: Record<CareAlertSeverity, string> = {
  urgent: "Urgent",
  warning: "Review",
  info: "Info",
};

const severityRank: Record<CareAlertSeverity, number> = {
  urgent: 0,
  warning: 1,
  info: 2,
};

const initialProfileNumberState: ProfileNumberActionState = {
  ok: false,
  message: "",
};

const initialTextNotificationState: TextNotificationActionState = {
  ok: false,
  message: "",
};

function getContactHref(type: "call" | "message", phone: string | null | undefined) {
  if (!phone) return undefined;
  const normalized = phone.replace(/[^\d+]/g, "");
  if (!normalized) return undefined;
  return `${type === "call" ? "tel" : "sms"}:${normalized}`;
}

/* ------------------------------------------------------------------ */
/*  Center Stage — the primary alert                                  */
/* ------------------------------------------------------------------ */

function CenterStage({
  alert,
  onDismiss,
  profile,
}: Readonly<{
  alert: RoomAlert;
  onDismiss: () => void;
  profile: CareProfile | null;
}>) {
  const signal = getSignalGroup(alert);
  const routeTarget = profile?.notification_number ?? "no number set";
  const callHref = getContactHref("call", profile?.notification_number);
  const suggestedTextFormId = useId();
  const suggestedText = buildSuggestedNotificationText(alert, alert.person);
  const [textState, textFormAction, isTextPending] = useActionState(
    sendTextNotificationAction,
    initialTextNotificationState,
  );

  return (
    <article className={`room-center room-severity-${alert.severity}`} aria-label="Primary alert requiring response">
      <div className="room-center-pulse" aria-hidden="true" />

      <div className="room-center-content">
        <div className="room-center-signal">
          <span className="room-signal-icon" aria-hidden="true">{signal.icon}</span>
          <span className="room-signal-label">{signal.label}</span>
          <span className={`room-severity-badge ${alert.severity}`}>{severityLabels[alert.severity]}</span>
        </div>

        <div className="room-center-person">
          <div className="room-center-photo">
            <Image
              src={alert.person.photo}
              alt={`${alert.person.name}`}
              width={132}
              height={132}
              priority
              unoptimized={!alert.person.hasPhoto}
            />
          </div>
          <h2 className="room-center-name">{alert.person.name}</h2>
          <p className="room-center-age">Age {alert.person.age}</p>
        </div>

        <div className="room-center-event">
          <h3 className="room-center-title">{alert.title}</h3>
          <p className="room-center-summary">{alert.summary}</p>
        </div>

        <div className="room-center-metrics">
          <div className="room-metric">
            <span className="room-metric-label">{alert.metric_label}</span>
            <strong className="room-metric-value">{alert.metric_value}</strong>
          </div>
          <div className="room-metric">
            <span className="room-metric-label">Heart rate</span>
            <strong className="room-metric-value">
              {alert.person.heart_rate_bpm === null ? "--" : `${alert.person.heart_rate_bpm} bpm`}
            </strong>
          </div>
          <div className="room-metric">
            <span className="room-metric-label">Watch</span>
            <strong className="room-metric-value">
              {alert.person.watch_battery_percent === null ? "--" : `${alert.person.watch_battery_percent}%`}
            </strong>
          </div>
          <div className="room-metric">
            <span className="room-metric-label">Triggered</span>
            <strong className="room-metric-value">{alert.triggered_label}</strong>
          </div>
          <div className="room-metric">
            <span className="room-metric-label">Routing</span>
            <strong className="room-metric-value">{routeTarget}</strong>
          </div>
        </div>

        <div className="room-center-suggested">
          <label htmlFor={`${suggestedTextFormId}-text`}>Suggested text</label>
          <textarea
            defaultValue={suggestedText}
            form={profile?.notification_number ? suggestedTextFormId : undefined}
            id={`${suggestedTextFormId}-text`}
            name="suggested_text"
            rows={3}
          />
        </div>

        <div className="room-center-actions">
          <Link className="room-action-primary" href={`/app/people/${alert.person.id}`}>
            Review profile
          </Link>
          {callHref ? (
            <a className="room-action-secondary" href={callHref}>Call</a>
          ) : (
            <button className="room-action-secondary" disabled type="button">Call</button>
          )}
          {profile?.notification_number ? (
            <form action={textFormAction} className="room-message-form" id={suggestedTextFormId}>
              <input name="alert_id" type="hidden" value={alert.id} />
              <button className="room-action-secondary" disabled={isTextPending} type="submit">
                {isTextPending ? "Sending" : "Message"}
              </button>
            </form>
          ) : (
            <button className="room-action-secondary" disabled type="button">Message</button>
          )}
          <button className="room-action-dismiss" type="button" onClick={onDismiss}>
            Acknowledge
          </button>
        </div>
        {textState.message ? (
          <p className={`room-message-status ${textState.ok ? "success" : "error"}`}>{textState.message}</p>
        ) : null}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Orbit tile — a peripheral alert                                   */
/* ------------------------------------------------------------------ */

function OrbitTile({
  alert,
  index,
  total,
  isActive,
  onClick,
}: Readonly<{
  alert: RoomAlert;
  index: number;
  total: number;
  isActive: boolean;
  onClick: () => void;
}>) {
  const signal = getSignalGroup(alert);

  return (
    <button
      aria-label={`${alert.person.name}: ${alert.title}`}
      aria-pressed={isActive}
      className={`room-orbit-tile room-severity-${alert.severity}${isActive ? " active" : ""}`}
      onClick={onClick}
      style={
        {
          "--orbit-depth": index,
          "--orbit-index": index,
          "--orbit-total": total,
          "--orbit-x": `${index * 18}px`,
          "--orbit-y": `${(index - 2) * 70}px`,
          "--orbit-scale": 1 - index * 0.035,
          "--orbit-hover-scale": 1.02 - index * 0.02,
        } as CSSProperties
      }
      type="button"
    >
      <div className="room-orbit-photo">
        <Image
          src={alert.person.photo}
          alt={alert.person.name}
          width={38}
          height={38}
          unoptimized={!alert.person.hasPhoto}
        />
        <span className={`room-orbit-pip ${alert.severity}`} aria-hidden="true" />
      </div>
      <span className="room-orbit-name">{alert.person.name}</span>
      <span className="room-orbit-signal">
        <span aria-hidden="true">{signal.icon}</span>
        {signal.label}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Ground tray — acknowledged / snoozed alerts                       */
/* ------------------------------------------------------------------ */

function GroundTray({ alerts, onRestore }: Readonly<{ alerts: RoomAlert[]; onRestore: (id: string) => void }>) {
  if (alerts.length === 0) return null;

  return (
    <div className="room-ground" aria-label="Acknowledged alerts">
      <span className="room-ground-label">Acknowledged</span>
      <div className="room-ground-items">
        {alerts.map((alert) => (
          <button
            className="room-ground-item"
            key={alert.id}
            onClick={() => onRestore(alert.id)}
            type="button"
            aria-label={`Restore alert for ${alert.person.name}`}
          >
            <Image
              src={alert.person.photo}
              alt={alert.person.name}
              width={28}
              height={28}
              unoptimized={!alert.person.hasPhoto}
            />
            <span>{alert.person.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Calm state — everyone is safe                                     */
/* ------------------------------------------------------------------ */

function CalmState({ people }: Readonly<{ people: RoomPerson[] }>) {
  const uniquePeople = people.filter(
    (person, index, self) => self.findIndex((p) => p.id === person.id) === index,
  );

  return (
    <div className="room-calm" aria-label="All clear — no active alerts">
      <div className="room-calm-portraits">
        {uniquePeople.slice(0, 8).map((person) => (
          <div className="room-calm-face" key={person.id}>
            <Image
              src={person.photo}
              alt={person.name}
              width={56}
              height={56}
              unoptimized={!person.hasPhoto}
            />
          </div>
        ))}
      </div>
      <h2 className="room-calm-title">Everyone is safe right now</h2>
      <p className="room-calm-sub">
        {uniquePeople.length} senior{uniquePeople.length !== 1 ? "s" : ""} monitored · All signals within range
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings popover — notification routing                           */
/* ------------------------------------------------------------------ */

function SettingsPopover({ profile }: Readonly<{ profile: CareProfile | null }>) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    updateProfileNotificationNumberAction,
    initialProfileNumberState,
  );

  return (
    <div className="room-settings">
      <button
        aria-expanded={open}
        aria-label="Alert routing settings"
        className="room-settings-trigger"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18">
          <path
            d="M10 13a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm7.3-2.1-.6-.3a1.5 1.5 0 0 1-.7-1.7l.2-.7a8 8 0 0 0-1-1.7l-.7.2a1.5 1.5 0 0 1-1.7-.7l-.3-.6a8 8 0 0 0-2-.3v.7a1.5 1.5 0 0 1-1 1.4l-.7-.2a8 8 0 0 0-1 1.7l.6.3a1.5 1.5 0 0 1 .7 1.7l-.2.7a8 8 0 0 0 1 1.7l.7-.2a1.5 1.5 0 0 1 1.7.7l.3.6a8 8 0 0 0 2 .3v-.7a1.5 1.5 0 0 1 1-1.4l.7.2a8 8 0 0 0 1-1.7Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {open ? (
        <div className="room-settings-popover" role="dialog" aria-label="Notification routing">
          <p className="room-settings-title">Alert routing</p>
          <form action={formAction} className="room-settings-form">
            <label>
              <span>Notify number</span>
              <input
                autoComplete="tel"
                defaultValue={profile?.notification_number ?? ""}
                inputMode="tel"
                name="notification_number"
                placeholder="+1 (555) 010-0199"
                type="tel"
              />
            </label>
            <button disabled={isPending} type="submit">
              {isPending ? "Saving…" : "Save"}
            </button>
            {state.message ? (
              <p className={state.ok ? "success" : "error"}>{state.message}</p>
            ) : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Situation bar                                                     */
/* ------------------------------------------------------------------ */

function SituationBar({
  alerts,
  dismissed,
}: Readonly<{
  alerts: RoomAlert[];
  dismissed: number;
}>) {
  const active = alerts.length;
  const urgent = alerts.filter((a) => a.severity === "urgent").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;
  const info = alerts.filter((a) => a.severity === "info").length;

  return (
    <div className="room-situation" aria-label="Alert situation summary">
      {active === 0 ? (
        <span className="room-situation-calm">All clear</span>
      ) : (
        <>
          {urgent > 0 ? <span className="room-situation-count urgent">{urgent} urgent</span> : null}
          {warning > 0 ? <span className="room-situation-count warning">{warning} review</span> : null}
          {info > 0 ? <span className="room-situation-count info">{info} info</span> : null}
        </>
      )}
      {dismissed > 0 ? (
        <span className="room-situation-dismissed">{dismissed} acknowledged</span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The Room — main export                                            */
/* ------------------------------------------------------------------ */

export function AlertRoom({
  alerts,
  people,
  profile,
}: Readonly<{
  alerts: RoomAlert[];
  people: RoomPerson[];
  profile: CareProfile | null;
}>) {
  const orderedAlerts = useMemo(
    () =>
      [...alerts].sort((a, b) => {
        const severityDelta = severityRank[a.severity] - severityRank[b.severity];
        if (severityDelta !== 0) return severityDelta;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    [alerts],
  );
  const [centerId, setCenterId] = useState(orderedAlerts[0]?.id ?? "");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const activeAlerts = orderedAlerts.filter((a) => !dismissedIds.has(a.id));
  const dismissedAlerts = orderedAlerts.filter((a) => dismissedIds.has(a.id));

  const centerAlert = activeAlerts.find((a) => a.id === centerId) ?? activeAlerts[0] ?? null;
  const centerIndex = centerAlert ? activeAlerts.findIndex((a) => a.id === centerAlert.id) : -1;
  const orbitAlerts =
    centerIndex === -1 ? [] : [...activeAlerts.slice(centerIndex + 1), ...activeAlerts.slice(0, centerIndex)];
  const previewAlerts = orbitAlerts.slice(0, 5);
  const hiddenPreviewCount = Math.max(0, orbitAlerts.length - previewAlerts.length);

  const allPeople = people.length > 0 ? people : alerts.map((a) => a.person);

  function handleOrbitClick(id: string) {
    setCenterId(id);
  }

  function handleDismiss() {
    if (!centerAlert) return;
    setDismissedIds((prev) => new Set([...prev, centerAlert.id]));
    // Move to next alert
    const next = orbitAlerts[0];
    if (next) setCenterId(next.id);
  }

  function handleRestore(id: string) {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setCenterId(id);
  }

  return (
    <div className="room-canvas">
      <div className="room-top-bar">
        <SituationBar alerts={activeAlerts} dismissed={dismissedAlerts.length} />
        <SettingsPopover profile={profile} />
      </div>

      <div className="room-stage">
        {centerAlert ? (
          <>
            <div className="room-orbit" aria-label="Other active alerts">
              {previewAlerts.map((alert, i) => (
                <OrbitTile
                  alert={alert}
                  index={i}
                  isActive={false}
                  key={alert.id}
                  onClick={() => handleOrbitClick(alert.id)}
                  total={orbitAlerts.length}
                />
              ))}
              {hiddenPreviewCount > 0 ? (
                <span
                  className="room-orbit-more"
                  style={
                    {
                      "--orbit-depth": previewAlerts.length,
                      "--orbit-x": `${previewAlerts.length * 18}px`,
                      "--orbit-y": `${(previewAlerts.length - 2) * 70}px`,
                    } as CSSProperties
                  }
                >
                  +{hiddenPreviewCount} more
                </span>
              ) : null}
            </div>

            <CenterStage
              alert={centerAlert}
              key={centerAlert.id}
              onDismiss={handleDismiss}
              profile={profile}
            />
          </>
        ) : (
          <CalmState people={allPeople} />
        )}
      </div>

      <GroundTray alerts={dismissedAlerts} onRestore={handleRestore} />
    </div>
  );
}
