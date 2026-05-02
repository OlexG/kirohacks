"use client";

import { useActionState, useMemo, useState } from "react";
import type { CarePerson } from "@/lib/care-people";
import type { CareRule } from "@/lib/care-rules";
import { RULE_SIGNALS, type RuleOperator } from "@/lib/rules-options";
import { createRuleAction, toggleRuleAction, type RuleActionState } from "./actions";

const initialActionState: RuleActionState = {
  ok: false,
  message: "",
};

const operatorLabels: Record<RuleOperator, string> = {
  above: "Above",
  below: "Below",
  equals: "Equals",
  detected: "Detected",
  not_seen_for: "Not seen for",
};

const severityLabels = {
  info: "Info",
  review: "Review",
  urgent: "Urgent",
};

function RuleIcon({ type }: Readonly<{ type: string }>) {
  if (type.includes("heart")) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M12 21s-7.2-4.4-9.4-8.8C1 8.9 2.8 5 6.4 5c2 0 3.4 1.1 4.1 2.2C11.2 6.1 12.6 5 14.6 5c3.6 0 5.4 3.9 3.8 7.2C16.1 16.6 12 21 12 21Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (type.includes("fall")) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M11 3.5a2.6 2.6 0 1 1 5.2 0 2.6 2.6 0 0 1-5.2 0ZM8.7 8.2l3.5-1.4c.9-.4 1.9 0 2.4.8l1.1 1.8 2.4.7-.6 1.9-3-.9-1-1.5-1.3 3.1 2.4 2.3v5h-2v-4.1l-3.1-2.6a2 2 0 0 1-.5-2.2l.9-2.1-.7.3-1.6 2.9-1.8-.9 1.9-3.4c.2-.3.5-.6 1-.7ZM5.2 18.8l3-3.4 1.5 1.3-3 3.4-1.5-1.3Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M9 2h6l.7 3A6.2 6.2 0 0 1 19 10.5v3A6.2 6.2 0 0 1 15.7 19L15 22H9l-.7-3A6.2 6.2 0 0 1 5 13.5v-3A6.2 6.2 0 0 1 8.3 5L9 2Zm3 6a4 4 0 0 0-4 4v.5a4 4 0 0 0 8 0V12a4 4 0 0 0-4-4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function formatRule(rule: CareRule) {
  const operator = operatorLabels[rule.operator];

  if (rule.operator === "detected") {
    return `${rule.signal_label} is detected`;
  }

  return `${rule.signal_label} ${operator.toLowerCase()} ${rule.threshold} ${rule.unit ?? ""}`;
}

export function RulesWorkspace({
  people,
  rules,
}: Readonly<{ people: CarePerson[]; rules: CareRule[] }>) {
  const [state, formAction, isPending] = useActionState(createRuleAction, initialActionState);
  const [personId, setPersonId] = useState(people[0]?.id ?? "");
  const [signalKey, setSignalKey] = useState(RULE_SIGNALS[0].key);
  const [operator, setOperator] = useState<RuleOperator>(RULE_SIGNALS[0].defaultOperator);
  const [threshold, setThreshold] = useState("");

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === personId) ?? people[0] ?? null,
    [people, personId],
  );
  const selectedSignal = useMemo(
    () => RULE_SIGNALS.find((signal) => signal.key === signalKey) ?? RULE_SIGNALS[0],
    [signalKey],
  );

  const activeCount = rules.filter((rule) => rule.active).length;
  const urgentCount = rules.filter((rule) => rule.severity === "urgent" && rule.active).length;

  return (
    <div className="rules-workspace">
      <section className="rules-hero" aria-label="Rules overview">
        <div>
          <p className="rules-kicker">Rules</p>
          <h1>Safety rules</h1>
          <p>
            Create per-person Apple Watch and HealthKit thresholds. Active rules are loaded from
            Supabase.
          </p>
        </div>
        <div className="rules-stats" aria-label="Rules status">
          <div>
            <strong>{activeCount}</strong>
            <span>Active</span>
          </div>
          <div>
            <strong>{urgentCount}</strong>
            <span>Urgent</span>
          </div>
          <div>
            <strong>{RULE_SIGNALS.length}</strong>
            <span>Signals</span>
          </div>
        </div>
      </section>

      <section className="rule-builder" aria-label="Create a monitoring rule">
        <div className="rule-builder-preview">
          <div className="person-chip-large">
            <span>{selectedPerson?.initials ?? "--"}</span>
            {selectedPerson ? (
              <div>
                <strong>{selectedPerson.name}</strong>
                <small>
                  {selectedPerson.age} yr · {selectedPerson.context}
                </small>
              </div>
            ) : (
              <div>
                <strong>No people yet</strong>
                <small>Add people to Supabase before creating rules.</small>
              </div>
            )}
          </div>
          <div className={`signal-card ${selectedSignal.reliability}`}>
            <div>
              <RuleIcon type={selectedSignal.key} />
              <span>{selectedSignal.source}</span>
            </div>
            <h2>{selectedSignal.label}</h2>
            <p>{selectedSignal.detail}</p>
          </div>
        </div>

        <form action={formAction} className="rule-form">
          <div className="rules-form-grid">
            <label>
              Person
              <select name="person_id" value={personId} onChange={(event) => setPersonId(event.target.value)}>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Signal
              <select
                name="signal_key"
                value={signalKey}
                onChange={(event) => {
                  const nextSignal = RULE_SIGNALS.find((signal) => signal.key === event.target.value);
                  if (!nextSignal) {
                    return;
                  }
                  setSignalKey(nextSignal.key);
                  setOperator(nextSignal.defaultOperator);
                  setThreshold(nextSignal.defaultThreshold?.toString() ?? "");
                }}
              >
                {RULE_SIGNALS.map((signal) => (
                  <option key={signal.key} value={signal.key}>
                    {signal.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Compare
              <select
                name="operator"
                value={operator}
                onChange={(event) => setOperator(event.target.value as RuleOperator)}
              >
                {selectedSignal.operators.map((signalOperator) => (
                  <option key={signalOperator} value={signalOperator}>
                    {operatorLabels[signalOperator]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {selectedSignal.thresholdLabel}
              <div className="threshold-field">
                <input
                  disabled={!selectedSignal.requiresThreshold}
                  inputMode="decimal"
                  name="threshold"
                  onChange={(event) => setThreshold(event.target.value)}
                  placeholder={selectedSignal.requiresThreshold ? "Enter value" : "Automatic"}
                  required={selectedSignal.requiresThreshold}
                  type="number"
                  value={threshold}
                />
                {selectedSignal.unit ? <span>{selectedSignal.unit}</span> : null}
              </div>
            </label>

            <label>
              Alert level
              <select name="severity" defaultValue="review">
                <option value="info">Info</option>
                <option value="review">Review</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>

            <label>
              Notify
              <select name="notification_channel" defaultValue="care_team">
                <option value="care_team">Care team</option>
                <option value="primary_caregiver">Primary caregiver</option>
                <option value="emergency_contact">Emergency contact</option>
              </select>
            </label>
          </div>

          <label className="notes-field">
            Notes
            <textarea
              name="notes"
              placeholder="Add context for caretakers reviewing this alert."
              rows={3}
            />
          </label>

          <div className="rule-form-footer">
            <p className={state.message ? (state.ok ? "success" : "error") : undefined}>
              {state.message || "Saved to the care_rules table."}
            </p>
            <button className="icon-button-primary" disabled={isPending || people.length === 0} type="submit">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" fill="currentColor" />
              </svg>
              {isPending ? "Adding" : "Add rule"}
            </button>
          </div>
        </form>
      </section>

      <section className="rules-content-grid">
        <div className="rules-table-panel">
          <div className="panel-heading">
            <div>
              <h2>Stored rules</h2>
              <p>Loaded directly from Supabase.</p>
            </div>
          </div>

          <div className="rules-list">
            {rules.map((rule) => (
              <article className={`stored-rule ${rule.severity} ${rule.active ? "" : "inactive"}`} key={rule.id}>
                <div className="stored-rule-icon">
                  <RuleIcon type={rule.signal_key} />
                </div>
                <div className="stored-rule-main">
                  <div className="stored-rule-title">
                    <h3>{rule.person_name}</h3>
                    <span>{severityLabels[rule.severity]}</span>
                  </div>
                  <p>{formatRule(rule)}</p>
                  <div className="stored-rule-meta">
                    <span className="rule-meta-pill">{rule.notification_channel.replaceAll("_", " ")}</span>
                    <span className="rule-meta-pill">{rule.active ? "Active" : "Paused"}</span>
                    {rule.notes ? <span className="rule-meta-pill note">{rule.notes}</span> : null}
                  </div>
                </div>
                <form action={toggleRuleAction}>
                  <input name="rule_id" type="hidden" value={rule.id} />
                  <input name="active" type="hidden" value={String(!rule.active)} />
                  <button className="icon-only-button" type="submit" title={rule.active ? "Pause rule" : "Activate rule"}>
                    {rule.active ? (
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="m8 5 11 7-11 7V5Z" fill="currentColor" />
                      </svg>
                    )}
                  </button>
                </form>
              </article>
            ))}
          </div>
        </div>

        <aside className="watch-signal-panel" aria-label="Apple Watch signal notes">
          <h2>Basic Apple Watch scope</h2>
          <div className="signal-note reliable">
            <strong>Do first</strong>
            <span>Falls, heart rate, resting heart rate, walking heart rate, and watch sync state.</span>
          </div>
          <div className="signal-note">
            <strong>Useful next</strong>
            <span>Steps and inactivity derived from activity samples and recent sync timestamps.</span>
          </div>
          <div className="signal-note imported">
            <strong>Imported only</strong>
            <span>Blood pressure belongs in HealthKit, but it requires a connected cuff or another source.</span>
          </div>
        </aside>
      </section>
    </div>
  );
}
