import { getSupabaseAdmin } from "@/lib/supabase/server";

export type CareAlertSeverity = "info" | "warning" | "urgent";
export type CareAlertStatus = "active" | "acknowledged" | "resolved";

export type CareAlert = {
  id: string;
  alert_key: string;
  person_id: string;
  title: string;
  signal_label: string;
  severity: CareAlertSeverity;
  status: CareAlertStatus;
  summary: string;
  metric_label: string;
  metric_value: string;
  triggered_label: string;
  next_step: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function listActiveCareAlerts() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("care_alerts")
    .select(
      "id, alert_key, person_id, title, signal_label, severity, status, summary, metric_label, metric_value, triggered_label, next_step, sort_order, created_at, updated_at",
    )
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load care alerts: ${error.message}`);
  }

  return (data ?? []) as CareAlert[];
}

export async function listActiveCareAlertsForPerson(personId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("care_alerts")
    .select(
      "id, alert_key, person_id, title, signal_label, severity, status, summary, metric_label, metric_value, triggered_label, next_step, sort_order, created_at, updated_at",
    )
    .eq("status", "active")
    .eq("person_id", personId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load person care alerts: ${error.message}`);
  }

  return (data ?? []) as CareAlert[];
}
