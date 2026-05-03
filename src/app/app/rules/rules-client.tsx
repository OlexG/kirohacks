"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import type { CarePerson } from "@/lib/care-people";
import type { CareRule } from "@/lib/care-rules";
import {
  findSignal,
  RULE_SIGNALS,
  type RuleOperator,
  type RuleSeverity,
  type RuleSignalOption,
} from "@/lib/rules-options";
import {
  createRuleAction,
  toggleRuleAction,
  type RuleActionState,
} from "./actions";

const operatorLabels: Record<RuleOperator, string> = {
  above: "At/above",
  below: "At/below",
  equals: "Equals",
  detected: "Detected",
  not_seen_for: "Not seen for",
};

const severityLabels: Record<RuleSeverity, string> = {
  info: "Info",
  review: "Review",
  urgent: "Urgent",
};

const severityCopy: Record<RuleSeverity, string> = {
  info: "Log for awareness",
  review: "Route to review queue",
  urgent: "Escalate immediately",
};

const reliabilityLabels: Record<RuleSignalOption["reliability"], string> = {
  "watch-native": "Apple Watch native",
  "healthkit-event": "HealthKit event",
  derived: "Derived signal",
  imported: "Imported health data",
};

const notificationLabels: Record<string, string> = {
  care_team: "Care Team",
  primary_caregiver: "Primary Caregiver",
};

const initialRuleState: RuleActionState = {
  ok: false,
  message: "",
};

type RulePanelMode = "empty" | "create" | "rule";

function formatChannel(channel: string) {
  return notificationLabels[channel] ?? channel.replaceAll("_", " ");
}

function formatRule(rule: CareRule) {
  const operator = operatorLabels[rule.operator];

  if (rule.operator === "detected") {
    return `${rule.signal_label} is detected`;
  }

  return `${rule.signal_label} ${operator.toLowerCase()} ${rule.threshold} ${rule.unit ?? ""}`;
}

function formatCondition({
  operator,
  threshold,
  unit,
}: Readonly<{ operator: RuleOperator; threshold: number | null; unit: string | null }>) {
  if (operator === "detected") {
    return "Signal is detected";
  }

  if (operator === "not_seen_for") {
    return `No sync for ${threshold ?? "--"} ${unit ?? "minutes"}`;
  }

  return `${operatorLabels[operator]} ${threshold ?? "--"} ${unit ?? ""}`;
}

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

function DiagramNode({
  body,
  kicker,
  title,
  tone = "neutral",
}: Readonly<{
  body: string;
  kicker: string;
  title: string;
  tone?: "neutral" | "source" | "condition" | "alert" | "notify";
}>) {
  return (
    <article className={`rule-diagram-node ${tone}`}>
      <span>{kicker}</span>
      <strong>{title}</strong>
      <p>{body}</p>
    </article>
  );
}

function DiagramFlow({ children }: Readonly<{ children: ReactNode[] }>) {
  return (
    <div className="rule-diagram-flow">
      {children.map((child, index) => (
        <div className="rule-diagram-step" key={index}>
          {child}
          {index < children.length - 1 ? <i aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}

function RuleDiagram({ rule }: Readonly<{ rule: CareRule }>) {
  const signal = findSignal(rule.signal_key);
  const source = signal?.source ?? rule.signal_label;
  const reliability = signal ? reliabilityLabels[signal.reliability] : "Configured signal";

  return (
    <section className="rule-diagram-detail" aria-label={`${rule.person_name} rule diagram`}>
      <div className="rule-panel-heading">
        <div>
          <p>Rule diagram</p>
          <h2>{rule.person_name}</h2>
        </div>
        <span className={`rule-severity-pill ${rule.severity}`}>{severityLabels[rule.severity]}</span>
      </div>

      <DiagramFlow>
        {[
          <DiagramNode key="person" body={rule.active ? "Rule is currently evaluating." : "Rule is paused."} kicker="Person" title={rule.person_name} />,
          <DiagramNode key="signal" body={`${reliability} - ${source}`} kicker="Signal" title={rule.signal_label} tone="source" />,
          <DiagramNode key="condition" body={signal?.thresholdLabel ?? "Rule condition"} kicker="Condition" title={formatCondition(rule)} tone="condition" />,
          <DiagramNode key="alert" body={severityCopy[rule.severity]} kicker="Alert level" title={severityLabels[rule.severity]} tone="alert" />,
          <DiagramNode key="notify" body={rule.active ? "Send when condition matches." : "No notification while paused."} kicker="Notify" title={formatChannel(rule.notification_channel)} tone="notify" />,
        ]}
      </DiagramFlow>

      <div className="rule-diagram-notes">
        <div>
          <span>Rule summary</span>
          <strong>{formatRule(rule)}</strong>
        </div>
        <div>
          <span>Notes</span>
          <p>{rule.notes || "No notes saved for this rule."}</p>
        </div>
      </div>
    </section>
  );
}

function RuleCreator({ people }: Readonly<{ people: CarePerson[] }>) {
  const defaultSignal = RULE_SIGNALS.find((signal) => signal.key === "heart_rate") ?? RULE_SIGNALS[0];
  const [state, formAction, isPending] = useActionState(createRuleAction, initialRuleState);
  const [personId, setPersonId] = useState(people[0]?.id ?? "");
  const [signalKey, setSignalKey] = useState(defaultSignal.key);
  const selectedSignal = useMemo(() => findSignal(signalKey) ?? defaultSignal, [defaultSignal, signalKey]);
  const [operator, setOperator] = useState<RuleOperator>(selectedSignal.defaultOperator);
  const [threshold, setThreshold] = useState(String(selectedSignal.defaultThreshold ?? ""));
  const [severity, setSeverity] = useState<RuleSeverity>("review");
  const [notificationChannel, setNotificationChannel] = useState("care_team");
  const [notes, setNotes] = useState("");
  const selectedPerson = people.find((person) => person.id === personId);

  function handleSignalChange(nextSignalKey: string) {
    const nextSignal = findSignal(nextSignalKey) ?? defaultSignal;
    setSignalKey(nextSignal.key);
    setOperator(nextSignal.defaultOperator);
    setThreshold(String(nextSignal.defaultThreshold ?? ""));
  }

  return (
    <section className="rule-creator" aria-label="Create rule diagram">
      <div className="rule-panel-heading">
        <div>
          <p>Diagram creator</p>
          <h2>New monitoring rule</h2>
        </div>
        <span className="rule-severity-pill review">Draft</span>
      </div>

      <DiagramFlow>
        {[
          <DiagramNode key="person" body="Choose the senior this rule watches." kicker="Person" title={selectedPerson?.name ?? "Select person"} />,
          <DiagramNode key="signal" body={`${reliabilityLabels[selectedSignal.reliability]} - ${selectedSignal.source}`} kicker="Signal" title={selectedSignal.label} tone="source" />,
          <DiagramNode key="condition" body={selectedSignal.thresholdLabel} kicker="Condition" title={formatCondition({ operator, threshold: threshold ? Number(threshold) : null, unit: selectedSignal.unit })} tone="condition" />,
          <DiagramNode key="alert" body={severityCopy[severity]} kicker="Alert level" title={severityLabels[severity]} tone="alert" />,
          <DiagramNode key="notify" body="Notification route for matching events." kicker="Notify" title={formatChannel(notificationChannel)} tone="notify" />,
        ]}
      </DiagramFlow>

      <form action={formAction} className="rule-diagram-form">
        <div className="rule-diagram-fields">
          <label>
            Person
            <select name="person_id" value={personId} onChange={(event) => setPersonId(event.target.value)} required>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Signal
            <select name="signal_key" value={signalKey} onChange={(event) => handleSignalChange(event.target.value)}>
              {RULE_SIGNALS.map((signal) => (
                <option key={signal.key} value={signal.key}>
                  {signal.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Operator
            <select name="operator" value={operator} onChange={(event) => setOperator(event.target.value as RuleOperator)}>
              {selectedSignal.operators.map((signalOperator) => (
                <option key={signalOperator} value={signalOperator}>
                  {operatorLabels[signalOperator]}
                </option>
              ))}
            </select>
          </label>

          <label>
            Threshold
            <input
              disabled={!selectedSignal.requiresThreshold}
              inputMode="decimal"
              name="threshold"
              onChange={(event) => setThreshold(event.target.value)}
              placeholder={selectedSignal.thresholdLabel}
              type="number"
              value={threshold}
            />
          </label>

          <label>
            Alert level
            <select name="severity" value={severity} onChange={(event) => setSeverity(event.target.value as RuleSeverity)}>
              <option value="info">Info</option>
              <option value="review">Review</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>

          <label>
            Notify
            <select
              name="notification_channel"
              value={notificationChannel}
              onChange={(event) => setNotificationChannel(event.target.value)}
            >
              <option value="care_team">Care Team</option>
              <option value="primary_caregiver">Primary Caregiver</option>
            </select>
          </label>
        </div>

        <label className="rule-notes-field">
          Notes
          <textarea
            name="notes"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add context for caregivers."
            value={notes}
          />
        </label>

        <div className="rule-form-footer">
          <p className={state.message ? (state.ok ? "success" : "error") : undefined}>
            {state.message || selectedSignal.detail}
          </p>
          <button className="care-detail-action" disabled={isPending || people.length === 0} type="submit">
            {isPending ? "Creating" : "Create rule"}
          </button>
        </div>
      </form>
    </section>
  );
}

function EmptyRulePanel() {
  return (
    <section className="rule-empty-panel" aria-label="No rule selected">
      <div>
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 7h5l2 3h9v8H4V7Zm0-3h6l2 3H4V4Z" fill="currentColor" />
          </svg>
        </span>
        <h2>Select a rule or create one.</h2>
        <p>Open a stored rule to inspect its operational diagram, or start a new visual rule from the creator.</p>
      </div>
    </section>
  );
}

export function RulesWorkspace({
  people,
  rules,
}: Readonly<{ people: CarePerson[]; rules: CareRule[] }>) {
  const [mode, setMode] = useState<RulePanelMode>("empty");
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) ?? null;

  function openRule(ruleId: string) {
    setSelectedRuleId(ruleId);
    setMode("rule");
  }

  function openCreator() {
    setSelectedRuleId(null);
    setMode("create");
  }

  return (
    <div className="rules-workspace">
      <section className="rules-content-grid rules-diagram-layout">
        <div className="rules-table-panel rules-list-panel">
          <div className="panel-heading rules-list-heading">
            <div>
              <h2>Stored rules</h2>
              <p>{rules.length} rules loaded from Supabase.</p>
            </div>
            <button className="care-detail-action" onClick={openCreator} type="button">
              New rule
            </button>
          </div>

          <div className="rules-list">
            {rules.map((rule) => (
              <article
                className={`stored-rule ${rule.severity} ${rule.active ? "" : "inactive"} ${
                  selectedRuleId === rule.id && mode === "rule" ? "selected" : ""
                }`}
                key={rule.id}
              >
                <button
                  aria-pressed={selectedRuleId === rule.id && mode === "rule"}
                  className="rule-open-button"
                  onClick={() => openRule(rule.id)}
                  type="button"
                >
                  <span className="stored-rule-icon">
                    <RuleIcon type={rule.signal_key} />
                  </span>
                  <span className="stored-rule-main">
                    <span className="stored-rule-title">
                      <h3>{rule.person_name}</h3>
                      <span>{severityLabels[rule.severity]}</span>
                    </span>
                    <p>{formatRule(rule)}</p>
                    <span className="stored-rule-meta">
                      <span className="rule-meta-pill">{formatChannel(rule.notification_channel)}</span>
                      <span className="rule-meta-pill">{rule.active ? "Active" : "Paused"}</span>
                    </span>
                  </span>
                </button>
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

        <div className="rules-diagram-panel">
          {mode === "create" ? <RuleCreator people={people} /> : null}
          {mode === "rule" && selectedRule ? <RuleDiagram rule={selectedRule} /> : null}
          {mode === "empty" || (mode === "rule" && !selectedRule) ? <EmptyRulePanel /> : null}
        </div>
      </section>
    </div>
  );
}
