import { getSupabaseAdmin } from "@/lib/supabase/server";

export type CareGroupKey = "stable" | "watch_list" | "active_alerts" | "offline";
export type CareAlertLevel = "urgent" | "warning" | "stable" | "offline";

export type CarePerson = {
  id: string;
  name: string;
  age: number;
  care_group: CareGroupKey;
  status: string;
  heart_rate_bpm: number | null;
  last_seen_label: string;
  watch_battery_percent: number | null;
  initials: string;
  avatar: string;
  alert: CareAlertLevel;
  context: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CarePeopleGroup = {
  key: CareGroupKey;
  title: string;
  summary: string;
  tone: "blue" | "green" | "amber" | "red";
  people: CarePerson[];
  footer: string;
};

const groupOrder: CareGroupKey[] = ["stable", "watch_list", "active_alerts", "offline"];

const groupConfig: Record<
  CareGroupKey,
  Omit<CarePeopleGroup, "summary" | "people">
> = {
  stable: {
    key: "stable",
    title: "Stable",
    tone: "green",
    footer: "Quiet check-ins pending",
  },
  watch_list: {
    key: "watch_list",
    title: "Watch List",
    tone: "blue",
    footer: "Custom rules under review",
  },
  active_alerts: {
    key: "active_alerts",
    title: "Active Alerts",
    tone: "amber",
    footer: "Alerts waiting on response",
  },
  offline: {
    key: "offline",
    title: "Offline",
    tone: "red",
    footer: "Devices need setup help",
  },
};

export async function listCarePeople() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("care_people")
    .select(
      "id, name, age, care_group, status, heart_rate_bpm, last_seen_label, watch_battery_percent, initials, avatar, alert, context, active, sort_order, created_at, updated_at",
    )
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Unable to load care people: ${error.message}`);
  }

  return (data ?? []) as CarePerson[];
}

export async function getCarePerson(personId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("care_people")
    .select(
      "id, name, age, care_group, status, heart_rate_bpm, last_seen_label, watch_battery_percent, initials, avatar, alert, context, active, sort_order, created_at, updated_at",
    )
    .eq("id", personId)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load person: ${error.message}`);
  }

  return data as CarePerson | null;
}

export function formatHeartRate(heartRateBpm: number | null) {
  return heartRateBpm === null ? "--" : `${heartRateBpm} bpm`;
}

export function formatWatchBattery(watchBatteryPercent: number | null) {
  return watchBatteryPercent === null ? "--" : `${watchBatteryPercent}%`;
}

function summarizeGroup(key: CareGroupKey, people: CarePerson[]) {
  if (key === "offline") {
    const connected = people.filter((person) => person.alert !== "offline").length;
    return `${connected}/${people.length} connected`;
  }

  if (key === "active_alerts") {
    const acknowledged = people.filter((person) => person.alert !== "urgent").length;
    return `${acknowledged}/${people.length} acknowledged`;
  }

  if (key === "watch_list") {
    return `${people.length} reviewed`;
  }

  return `${people.length} monitored`;
}

export function groupCarePeople(people: CarePerson[]): CarePeopleGroup[] {
  return groupOrder.map((key) => {
    const groupPeople = people.filter((person) => person.care_group === key);

    return {
      ...groupConfig[key],
      summary: summarizeGroup(key, groupPeople),
      people: groupPeople,
    };
  });
}
