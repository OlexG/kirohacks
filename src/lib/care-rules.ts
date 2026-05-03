import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCarePerson } from "@/lib/care-people";
import {
  evaluateCareRulesForLatestObservation,
  resolveCareRuleAlert,
} from "@/lib/care-rule-evaluator";
import {
  findSignal,
  type RuleOperator,
  type RuleSeverity,
} from "@/lib/rules-options";

export type CareRule = {
  id: string;
  person_id: string;
  person_name: string;
  signal_key: string;
  signal_label: string;
  operator: RuleOperator;
  threshold: number | null;
  unit: string | null;
  severity: RuleSeverity;
  active: boolean;
  notification_channel: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type CreateRuleInput = {
  personId: string;
  signalKey: string;
  operator: string;
  threshold: string;
  severity: string;
  notificationChannel: string;
  notes: string;
};

export async function listCareRules() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("care_rules")
    .select(
      "id, person_id, person_name, signal_key, signal_label, operator, threshold, unit, severity, active, notification_channel, notes, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load care rules: ${error.message}`);
  }

  return (data ?? []) as CareRule[];
}

export async function createCareRule(input: CreateRuleInput) {
  const person = await getCarePerson(input.personId);
  const signal = findSignal(input.signalKey);

  if (!person) {
    throw new Error("Choose a valid person.");
  }

  if (!signal) {
    throw new Error("Choose a valid Apple Watch signal.");
  }

  if (!signal.operators.includes(input.operator as RuleOperator)) {
    throw new Error("Choose a valid comparison for this signal.");
  }

  if (!["info", "review", "urgent"].includes(input.severity)) {
    throw new Error("Choose a valid alert level.");
  }

  const threshold = input.threshold.trim();
  const numericThreshold = threshold === "" ? null : Number(threshold);

  if (signal.requiresThreshold && (numericThreshold === null || Number.isNaN(numericThreshold))) {
    throw new Error("Enter a numeric threshold for this rule.");
  }

  if (!signal.requiresThreshold && numericThreshold !== null) {
    throw new Error("This signal does not use a threshold.");
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("care_rules").insert({
    person_id: person.id,
    person_name: person.name,
    signal_key: signal.key,
    signal_label: signal.label,
    operator: input.operator,
    threshold: numericThreshold,
    unit: signal.unit,
    severity: input.severity,
    notification_channel: input.notificationChannel,
    notes: input.notes.trim() || null,
    active: true,
  });

  if (error) {
    throw new Error(`Unable to create rule: ${error.message}`);
  }

  await evaluateCareRulesForLatestObservation(person.id);
}

export async function setCareRuleActive(ruleId: string, active: boolean) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("care_rules")
    .update({ active })
    .eq("id", ruleId)
    .select("person_id")
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to update rule: ${error.message}`);
  }

  if (!active) {
    await resolveCareRuleAlert(ruleId);
    return;
  }

  if (data?.person_id) {
    await evaluateCareRulesForLatestObservation(String(data.person_id));
  }
}
