import { getSupabaseAdmin } from "@/lib/supabase/server";
import { buildSuggestedNotificationText } from "@/lib/notification-copy";
import { sendSmsNotification } from "@/lib/twilio";

type AlertNotificationRow = {
  id: string;
  title: string;
  signal_label: string;
  summary: string;
  metric_label: string;
  metric_value: string;
  triggered_label: string;
  next_step: string;
  person_id: string;
};

type AlertPersonRow = {
  name: string;
  heart_rate_bpm: number | null;
  watch_battery_percent: number | null;
};

type NotificationProfileRow = {
  notification_number: string | null;
};

const SABAWOON_HAKIMI_PERSON_ID = "person-sabawoon-hakimi";

function buildAlertSms(alert: AlertNotificationRow, person: AlertPersonRow, suggestedText: string) {
  const parts = [
    `Safely notification for ${person.name}: ${alert.title}.`,
    alert.summary,
    `${alert.metric_label}: ${alert.metric_value}.`,
    `Triggered: ${alert.triggered_label}.`,
    suggestedText,
  ];

  return parts.filter(Boolean).join(" ").slice(0, 1000);
}

function buildMedicationReminderSms({
  dayName,
  deliveryMethod,
  dose,
  medicationName,
  personName,
  time,
}: {
  dayName: string;
  deliveryMethod: string;
  dose: string;
  medicationName: string;
  personName: string;
  time: string;
}) {
  const method = deliveryMethod ? ` by ${deliveryMethod.toLowerCase()}` : "";
  const timing = dayName ? ` on ${dayName}` : "";

  return [
    `Hi ${personName}, this is your medication reminder.`,
    `Please take ${medicationName}, ${dose}${method}, at ${time}${timing}.`,
    "Reply or call your caregiver if this does not look right.",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 1000);
}

async function getDemoNotificationNumber() {
  const supabase = getSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("notification_number")
    .eq("id", "demo-caregiver-profile")
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load notification profile: ${error.message}`);
  }

  const notificationNumber = (profile as NotificationProfileRow | null)?.notification_number;

  if (!notificationNumber) {
    throw new Error("No notification number is saved.");
  }

  return notificationNumber;
}

export async function sendAlertTextNotification(alertId: string, suggestedText = "") {
  if (!alertId) {
    throw new Error("Missing alert id.");
  }

  const cleanedSuggestedText = suggestedText.trim();

  const supabase = getSupabaseAdmin();
  const [{ data: alert, error: alertError }, notificationNumber] = await Promise.all([
    supabase
      .from("care_alerts")
      .select("id, title, signal_label, summary, metric_label, metric_value, triggered_label, next_step, person_id")
      .eq("id", alertId)
      .maybeSingle(),
    getDemoNotificationNumber(),
  ]);

  if (alertError) {
    throw new Error(`Unable to load alert: ${alertError.message}`);
  }

  if (!alert) {
    throw new Error("Alert not found.");
  }

  const { data: person, error: personError } = await supabase
    .from("care_people")
    .select("name, heart_rate_bpm, watch_battery_percent")
    .eq("id", (alert as AlertNotificationRow).person_id)
    .maybeSingle();

  if (personError) {
    throw new Error(`Unable to load alert person: ${personError.message}`);
  }

  if (!person) {
    throw new Error("Alert person not found.");
  }

  return sendSmsNotification(
    notificationNumber,
    buildAlertSms(
      alert as AlertNotificationRow,
      person as AlertPersonRow,
      cleanedSuggestedText ||
        buildSuggestedNotificationText(alert as AlertNotificationRow, person as AlertPersonRow),
      ),
  );
}

export async function sendMedicationReminderTextNotification({
  dayName,
  dose,
  medicationId,
  time,
}: {
  dayName: string;
  dose: string;
  medicationId: string;
  time: string;
}) {
  const cleanedMedicationId = medicationId.trim();
  const cleanedDose = dose.trim();
  const cleanedTime = time.trim();
  const cleanedDayName = dayName.trim();

  if (!cleanedMedicationId) {
    throw new Error("Missing medication id.");
  }

  if (!cleanedDose || !cleanedTime) {
    throw new Error("Missing medication reminder details.");
  }

  const supabase = getSupabaseAdmin();
  const [{ data: medication, error: medicationError }, { data: person, error: personError }, notificationNumber] =
    await Promise.all([
      supabase
        .from("medications")
        .select("id, elder_id, name, dosage, delivery_method")
        .eq("id", cleanedMedicationId)
        .eq("elder_id", SABAWOON_HAKIMI_PERSON_ID)
        .maybeSingle(),
      supabase
        .from("care_people")
        .select("id, name")
        .eq("id", SABAWOON_HAKIMI_PERSON_ID)
        .maybeSingle(),
      getDemoNotificationNumber(),
    ]);

  if (medicationError) {
    throw new Error(`Unable to load medication: ${medicationError.message}`);
  }

  if (personError) {
    throw new Error(`Unable to load person: ${personError.message}`);
  }

  if (!medication) {
    throw new Error("Medication not found for Sabawoon Hakimi.");
  }

  if (!person) {
    throw new Error("Sabawoon Hakimi profile not found.");
  }

  const medicationRow = medication as {
    delivery_method: string | null;
    name: string;
  };
  const personRow = person as { name: string };

  return sendSmsNotification(
    notificationNumber,
    buildMedicationReminderSms({
      dayName: cleanedDayName,
      deliveryMethod: medicationRow.delivery_method ?? "",
      dose: cleanedDose,
      medicationName: medicationRow.name,
      personName: personRow.name,
      time: cleanedTime,
    }),
  );
}
