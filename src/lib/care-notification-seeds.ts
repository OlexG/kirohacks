import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SABAWOON_HAKIMI_PERSON_ID } from "@/lib/biometrics-data";

export type SeedCareNotification = {
  alert_key: string;
  person_id: string;
  title: string;
  signal_label: string;
  severity: "info" | "warning" | "urgent";
  status: "active" | "acknowledged" | "resolved";
  summary: string;
  metric_label: string;
  metric_value: string;
  triggered_label: string;
  next_step: string;
  sort_order: number;
};

type SeedCareNotificationTemplate = Omit<SeedCareNotification, "alert_key" | "person_id"> & {
  fallback_key: string;
  signal_key: string;
};

type SeedRuleRow = {
  id: string;
  signal_key: string;
};

export const SEEDED_NOTIFICATION_SIGNAL_KEYS = [
  "repeated_instability_cluster",
  "instability_score",
  "fall_risk_score",
  "jerk_peak",
] as const;

const SEEDED_CARE_NOTIFICATION_TEMPLATES: SeedCareNotificationTemplate[] = [
  {
    fallback_key: "seed-sabawoon-repeated-instability-cluster",
    signal_key: "repeated_instability_cluster",
    title: "Repeated instability detected",
    signal_label: "Repeated instability cluster",
    severity: "urgent",
    status: "active",
    summary:
      "Sabawoon's watch reported repeated instability in the current 10-minute window.",
    metric_label: "Cluster window",
    metric_value: "3 high events / 10 min",
    triggered_label: "Seeded baseline",
    next_step:
      "Check on Sabawoon now and confirm he is seated or walking with support.",
    sort_order: 10,
  },
  {
    fallback_key: "seed-sabawoon-critical-instability-score",
    signal_key: "instability_score",
    title: "Instability score reached critical range",
    signal_label: "Instability score",
    severity: "urgent",
    status: "active",
    summary:
      "Sabawoon's instability score is 80/100, triggering the at/above 80/100 rule.",
    metric_label: "Instability score",
    metric_value: "80/100",
    triggered_label: "Seeded baseline",
    next_step:
      "Review the live profile and ask whether Sabawoon feels dizzy, weak, or unsteady.",
    sort_order: 20,
  },
  {
    fallback_key: "seed-sabawoon-fall-risk-score",
    signal_key: "fall_risk_score",
    title: "Fall-risk score elevated",
    signal_label: "Fall-risk score",
    severity: "warning",
    status: "active",
    summary:
      "Sabawoon's fall-risk score is 65/100, triggering the at/above 55/100 rule.",
    metric_label: "Fall-risk score",
    metric_value: "65/100",
    triggered_label: "Seeded baseline",
    next_step:
      "Review recent instability events before changing activity or walking plans.",
    sort_order: 30,
  },
  {
    fallback_key: "seed-sabawoon-motion-spike",
    signal_key: "jerk_peak",
    title: "Abrupt motion spike",
    signal_label: "Jerk peak",
    severity: "warning",
    status: "active",
    summary:
      "Sabawoon's jerk peak is 10.5 g/s, triggering the at/above 2.00 g/s rule.",
    metric_label: "Jerk peak",
    metric_value: "10.5 g/s",
    triggered_label: "Seeded baseline",
    next_step:
      "Ask whether Sabawoon stumbled, corrected his balance, or needs help moving.",
    sort_order: 40,
  },
];

async function getSeedRuleAlertKeyMap() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("care_rules")
    .select("id, signal_key")
    .eq("person_id", SABAWOON_HAKIMI_PERSON_ID)
    .eq("active", true)
    .in("signal_key", [...SEEDED_NOTIFICATION_SIGNAL_KEYS])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load seed notification rules: ${error.message}`);
  }

  const alertKeyBySignalKey = new Map<string, string>();
  for (const row of (data ?? []) as SeedRuleRow[]) {
    if (!alertKeyBySignalKey.has(row.signal_key)) {
      alertKeyBySignalKey.set(row.signal_key, `rule-${row.id}`);
    }
  }

  return alertKeyBySignalKey;
}

function buildSeedNotifications(alertKeyBySignalKey: Map<string, string>) {
  return SEEDED_CARE_NOTIFICATION_TEMPLATES.map(({ fallback_key, signal_key, ...template }) => ({
    ...template,
    alert_key: alertKeyBySignalKey.get(signal_key) ?? fallback_key,
    person_id: SABAWOON_HAKIMI_PERSON_ID,
  }));
}

export async function getCareNotificationAdminState() {
  const supabase = getSupabaseAdmin();
  const [{ data, error }, alertKeyBySignalKey] = await Promise.all([
    supabase
      .from("care_alerts")
      .select("alert_key, title, signal_label, severity, status, metric_value, updated_at")
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false }),
    getSeedRuleAlertKeyMap(),
  ]);

  if (error) {
    throw new Error(`Unable to load notifications: ${error.message}`);
  }

  const notifications = data ?? [];
  const seedKeys = new Set<string>(
    buildSeedNotifications(alertKeyBySignalKey).map((notification) => notification.alert_key),
  );

  return {
    activeCount: notifications.filter((notification) => notification.status === "active").length,
    seedCount: notifications.filter((notification) => seedKeys.has(notification.alert_key)).length,
    totalCount: notifications.length,
    notifications,
  };
}

export async function resetCareNotificationsToSeed() {
  const supabase = getSupabaseAdmin();
  const seedNotifications = buildSeedNotifications(await getSeedRuleAlertKeyMap());
  const { error: deleteError } = await supabase
    .from("care_alerts")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (deleteError) {
    throw new Error(`Unable to wipe notifications: ${deleteError.message}`);
  }

  const { error: insertError } = await supabase
    .from("care_alerts")
    .insert(seedNotifications);

  if (insertError) {
    throw new Error(`Unable to seed notifications: ${insertError.message}`);
  }

  return seedNotifications.length;
}
