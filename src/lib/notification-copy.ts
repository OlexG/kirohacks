type NotificationAlertCopy = {
  title: string;
  signal_label: string;
  summary: string;
  metric_label: string;
  metric_value: string;
  triggered_label: string;
  next_step: string;
};

type NotificationPersonCopy = {
  name: string;
  heart_rate_bpm?: number | null;
  watch_battery_percent?: number | null;
};

function normalizeCopy(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function getAlertKind(alert: NotificationAlertCopy) {
  const haystack = `${alert.title} ${alert.signal_label} ${alert.summary}`.toLowerCase();

  if (haystack.includes("fall")) {
    return "fall";
  }

  if (haystack.includes("heart")) {
    return "heart";
  }

  if (haystack.includes("offline") || haystack.includes("sync") || haystack.includes("connectivity")) {
    return "watch";
  }

  if (haystack.includes("caregiver") || haystack.includes("handoff") || haystack.includes("assigned")) {
    return "handoff";
  }

  return "general";
}

export function buildSuggestedNotificationText(alert: NotificationAlertCopy, person: NotificationPersonCopy) {
  const metric = normalizeCopy(`${alert.metric_label}: ${alert.metric_value}`);
  const triggered = normalizeCopy(alert.triggered_label);

  switch (getAlertKind(alert)) {
    case "fall":
      return `${person.name} may have had a fall ${triggered}. Please check on ${person.name} now and confirm whether standing is safe. ${metric}.`;
    case "heart":
      return `${person.name}'s heart rate is elevated (${alert.metric_value}) ${triggered}. Please check for chest pain, dizziness, shortness of breath, or unusual fatigue.`;
    case "watch":
      return `${person.name}'s watch has not synced recently (${alert.metric_value}). Please confirm the watch is charged, nearby, and still being worn.`;
    case "handoff":
      return `A caregiver response is in progress for ${person.name}. Please confirm someone has reached ${person.name} and record the next step.`;
    default:
      return `${person.name} needs a care check: ${normalizeCopy(alert.title)}. ${metric}. Triggered ${triggered}.`;
  }
}
