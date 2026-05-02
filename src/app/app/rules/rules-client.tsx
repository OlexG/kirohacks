"use client";

import type { CarePerson } from "@/lib/care-people";
import type { CareRule } from "@/lib/care-rules";
import type { RuleOperator } from "@/lib/rules-options";
import { toggleRuleAction } from "./actions";

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
  rules,
}: Readonly<{ people: CarePerson[]; rules: CareRule[] }>) {
  return (
    <div className="rules-workspace">
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
      </section>
    </div>
  );
}
