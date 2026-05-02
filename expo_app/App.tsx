import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type TabKey = "care" | "medication" | "alerts" | "devices";
type AlertTone = "urgent" | "warning" | "info";

type MedicationDose = {
  id: string;
  name: string;
  dose: string;
  time: string;
  instructions: string;
};

type MedicationDay = {
  key: number;
  label: string;
  short: string;
  date: string;
  administered: boolean;
  doses: MedicationDose[];
};

const colors = {
  cream: "#F5F3EE",
  surface: "#FDFCF8",
  sand: "#F8EED9",
  taupe: "#D6C8B2",
  stone: "#CBC9C4",
  muted: "#A4A29A",
  textSoft: "#7B786F",
  ink: "#5A564B",
  white: "#FFFCF8",
};

const elder = {
  name: "Eleanor Ward",
  preferredName: "Eleanor",
  relation: "Mom",
  age: 82,
  status: "Stable",
  statusDetail: "Resting at home after a morning walk.",
  location: "Living room",
  lastSeen: "2 min ago",
  heartRate: 72,
  oxygen: "97%",
  steps: "2,418",
  sleep: "7h 12m",
  initials: "EW",
};

const heartSamples = [68, 70, 69, 73, 72, 76, 74, 71, 72, 75, 73, 72];

const medicationWeek: MedicationDay[] = [
  {
    key: 0,
    label: "Sunday",
    short: "S",
    date: "May 3",
    administered: true,
    doses: [
      {
        id: "sun-aspirin",
        name: "Aspirin",
        dose: "81 mg",
        time: "8:00 AM",
        instructions: "Give with breakfast and a full glass of water.",
      },
    ],
  },
  {
    key: 1,
    label: "Monday",
    short: "M",
    date: "May 4",
    administered: true,
    doses: [
      {
        id: "mon-lisinopril",
        name: "Lisinopril",
        dose: "10 mg",
        time: "8:00 AM",
        instructions: "Check blood pressure before administering.",
      },
      {
        id: "mon-atorvastatin",
        name: "Atorvastatin",
        dose: "20 mg",
        time: "8:00 PM",
        instructions: "Evening dose. Confirm she has eaten dinner.",
      },
    ],
  },
  {
    key: 2,
    label: "Tuesday",
    short: "T",
    date: "May 5",
    administered: false,
    doses: [
      {
        id: "tue-lisinopril",
        name: "Lisinopril",
        dose: "10 mg",
        time: "8:00 AM",
        instructions: "Morning dose pending confirmation.",
      },
      {
        id: "tue-donepezil",
        name: "Donepezil",
        dose: "5 mg",
        time: "7:30 PM",
        instructions: "Give before bedtime routine.",
      },
    ],
  },
  {
    key: 3,
    label: "Wednesday",
    short: "W",
    date: "May 6",
    administered: false,
    doses: [
      {
        id: "wed-aspirin",
        name: "Aspirin",
        dose: "81 mg",
        time: "8:00 AM",
        instructions: "Give with breakfast.",
      },
    ],
  },
  {
    key: 4,
    label: "Thursday",
    short: "T",
    date: "May 7",
    administered: false,
    doses: [
      {
        id: "thu-lisinopril",
        name: "Lisinopril",
        dose: "10 mg",
        time: "8:00 AM",
        instructions: "Check blood pressure before administering.",
      },
    ],
  },
  {
    key: 5,
    label: "Friday",
    short: "F",
    date: "May 8",
    administered: false,
    doses: [
      {
        id: "fri-aspirin",
        name: "Aspirin",
        dose: "81 mg",
        time: "8:00 AM",
        instructions: "Give with breakfast.",
      },
      {
        id: "fri-atorvastatin",
        name: "Atorvastatin",
        dose: "20 mg",
        time: "8:00 PM",
        instructions: "Evening dose.",
      },
    ],
  },
  {
    key: 6,
    label: "Saturday",
    short: "S",
    date: "May 9",
    administered: false,
    doses: [],
  },
];

const alerts = [
  {
    tone: "urgent" as AlertTone,
    title: "Missed medication",
    body: "Tuesday morning Lisinopril has not been marked administered.",
    time: "12 min ago",
  },
  {
    tone: "warning" as AlertTone,
    title: "Abnormal biometric reading",
    body: "Heart rate briefly rose above 105 bpm while Eleanor was seated.",
    time: "38 min ago",
  },
  {
    tone: "warning" as AlertTone,
    title: "Fall sensitivity event",
    body: "Apple Watch detected a stumble near the hallway. Eleanor tapped I am OK.",
    time: "Yesterday",
  },
  {
    tone: "info" as AlertTone,
    title: "Low movement window",
    body: "Movement was lower than usual between 1:00 PM and 3:00 PM.",
    time: "Yesterday",
  },
];

const deviceMetrics = [
  ["Connection", "Connected"],
  ["Battery", "68%"],
  ["Last sync", "1 min ago"],
  ["WatchOS", "11.4"],
];

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "care", label: "Care" },
  { key: "medication", label: "Medication" },
  { key: "alerts", label: "Alerts" },
  { key: "devices", label: "Devices" },
];

function HeartMark() {
  return (
    <View style={styles.brandMark}>
      <Text style={styles.brandMarkText}>S</Text>
    </View>
  );
}

function ActionButton({
  label,
  tone = "dark",
}: {
  readonly label: string;
  readonly tone?: "dark" | "light";
}) {
  return (
    <Pressable style={[styles.actionButton, tone === "light" && styles.actionButtonLight]}>
      <Text style={[styles.actionButtonText, tone === "light" && styles.actionButtonTextLight]}>
        {label}
      </Text>
    </Pressable>
  );
}

function HeartMonitor() {
  const max = Math.max(...heartSamples);
  const min = Math.min(...heartSamples);
  const range = Math.max(max - min, 1);

  return (
    <View style={styles.monitorCard}>
      <View style={styles.monitorHeader}>
        <View>
          <Text style={styles.eyebrow}>Heartbeat monitor</Text>
          <Text style={styles.heartRate}>{elder.heartRate}</Text>
          <Text style={styles.heartRateUnit}>beats per minute</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>Live</Text>
        </View>
      </View>

      <View style={styles.heartGraph}>
        {heartSamples.map((sample, index) => {
          const height = 28 + ((sample - min) / range) * 54;
          return (
            <View
              key={`${sample}-${index}`}
              style={[styles.heartBar, { height }]}
            />
          );
        })}
      </View>
      <Text style={styles.monitorNote}>Normal resting range for Eleanor: 62-92 bpm.</Text>
    </View>
  );
}

function MetricTile({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | number;
}) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function CareView() {
  return (
    <View style={styles.stack}>
      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{elder.initials}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{elder.name}</Text>
            <Text style={styles.profileMeta}>
              {elder.relation} · Age {elder.age}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{elder.status}</Text>
          </View>
        </View>
        <Text style={styles.profileBody}>{elder.statusDetail}</Text>
        <View style={styles.profileStats}>
          <MetricTile label="Location" value={elder.location} />
          <MetricTile label="Last seen" value={elder.lastSeen} />
        </View>
      </View>

      <HeartMonitor />

      <View style={styles.metricGrid}>
        <MetricTile label="Oxygen" value={elder.oxygen} />
        <MetricTile label="Steps" value={elder.steps} />
        <MetricTile label="Sleep" value={elder.sleep} />
        <MetricTile label="Next med" value="8:00 PM" />
      </View>
    </View>
  );
}

function MedicationView({
  selectedDay,
  administeredDays,
  onSelectDay,
  onToggleDay,
}: {
  readonly selectedDay: MedicationDay;
  readonly administeredDays: Record<number, boolean>;
  readonly onSelectDay: (day: MedicationDay) => void;
  readonly onToggleDay: (dayKey: number) => void;
}) {
  const selectedAdministered = administeredDays[selectedDay.key] ?? selectedDay.administered;

  return (
    <View style={styles.stack}>
      <View style={styles.weekCard}>
        <Text style={styles.sectionTitle}>Weekly medication</Text>
        <View style={styles.weekRow}>
          {medicationWeek.map((day) => {
            const active = selectedDay.key === day.key;
            const done = administeredDays[day.key] ?? day.administered;
            return (
              <Pressable
                key={day.key}
                onPress={() => onSelectDay(day)}
                style={[styles.dayButton, active && styles.dayButtonActive]}
              >
                <Text style={[styles.dayText, active && styles.dayTextActive]}>{day.short}</Text>
                <Pressable
                  onPress={() => onToggleDay(day.key)}
                  style={[styles.checkbox, done && styles.checkboxChecked]}
                >
                  <Text style={[styles.checkboxText, done && styles.checkboxTextChecked]}>
                    {done ? "✓" : ""}
                  </Text>
                </Pressable>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.weekHint}>
          Tap a day for medication details. Tap the checkbox once administered.
        </Text>
      </View>

      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View>
            <Text style={styles.eyebrow}>{selectedDay.date}</Text>
            <Text style={styles.detailTitle}>{selectedDay.label}</Text>
          </View>
          <View style={[styles.statusPill, selectedAdministered && styles.statusPillDark]}>
            <Text
              style={[
                styles.statusPillText,
                selectedAdministered && styles.statusPillTextDark,
              ]}
            >
              {selectedAdministered ? "Given" : "Pending"}
            </Text>
          </View>
        </View>

        {selectedDay.doses.length === 0 ? (
          <Text style={styles.emptyText}>No medication scheduled for this day.</Text>
        ) : (
          <View style={styles.stack}>
            {selectedDay.doses.map((dose) => (
              <View key={dose.id} style={styles.medicationDose}>
                <View style={styles.medicationDoseTop}>
                  <Text style={styles.doseTime}>{dose.time}</Text>
                  <Text style={styles.doseName}>{dose.name}</Text>
                </View>
                <Text style={styles.doseAmount}>{dose.dose}</Text>
                <Text style={styles.doseInstructions}>{dose.instructions}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function AlertsView() {
  return (
    <View style={styles.stack}>
      {alerts.map((alert) => (
        <View
          key={`${alert.title}-${alert.time}`}
          style={[
            styles.alertCard,
            alert.tone === "urgent" && styles.alertUrgent,
            alert.tone === "warning" && styles.alertWarning,
          ]}
        >
          <View style={styles.alertHeader}>
            <View style={[styles.alertDot, styles[`${alert.tone}Dot`]]} />
            <Text style={styles.alertType}>{alert.tone}</Text>
            <Text style={styles.alertTime}>{alert.time}</Text>
          </View>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertBody}>{alert.body}</Text>
          <View style={styles.alertActions}>
            <ActionButton label="Review" />
            <ActionButton label="Dismiss" tone="light" />
          </View>
        </View>
      ))}
    </View>
  );
}

function DevicesView() {
  return (
    <View style={styles.stack}>
      <View style={styles.watchCard}>
        <View style={styles.watchBody}>
          <View style={styles.watchStrapTop} />
          <View style={styles.watchFace}>
            <Text style={styles.watchHeart}>{elder.heartRate}</Text>
            <Text style={styles.watchUnit}>bpm</Text>
          </View>
          <View style={styles.watchStrapBottom} />
        </View>
        <Text style={styles.watchTitle}>Eleanor's Apple Watch</Text>
        <Text style={styles.watchSubtitle}>
          Connected, syncing biometrics, fall detection, movement, and medication reminders.
        </Text>
      </View>

      <View style={styles.deviceGrid}>
        {deviceMetrics.map(([label, value]) => (
          <MetricTile key={label} label={label} value={value} />
        ))}
      </View>

      <View style={styles.deviceStatusCard}>
        <Text style={styles.sectionTitle}>Device checks</Text>
        <View style={styles.deviceCheck}>
          <Text style={styles.deviceCheckTitle}>Fall detection</Text>
          <Text style={styles.deviceCheckValue}>Enabled</Text>
        </View>
        <View style={styles.deviceCheck}>
          <Text style={styles.deviceCheckTitle}>Heart rate alerts</Text>
          <Text style={styles.deviceCheckValue}>Above 105 bpm</Text>
        </View>
        <View style={styles.deviceCheck}>
          <Text style={styles.deviceCheckTitle}>Medication reminders</Text>
          <Text style={styles.deviceCheckValue}>On watch and phone</Text>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("care");
  const [selectedDay, setSelectedDay] = useState<MedicationDay>(medicationWeek[2]);
  const [administeredDays, setAdministeredDays] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(medicationWeek.map((day) => [day.key, day.administered])),
  );

  const title = useMemo(() => {
    if (activeTab === "care") return "Care overview";
    if (activeTab === "medication") return "Medication";
    if (activeTab === "alerts") return "Alerts";
    return "Devices";
  }, [activeTab]);

  const subtitle = useMemo(() => {
    if (activeTab === "care") return "One elder, one calm view";
    if (activeTab === "medication") return "Weekly doses and confirmation";
    if (activeTab === "alerts") return "Biometrics, falls, and missed care";
    return "Apple Watch connection status";
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <HeartMark />
            <View>
              <Text style={styles.brandName}>Safely</Text>
              <Text style={styles.brandSub}>Primary caregiver</Text>
            </View>
          </View>
          <Text style={styles.headerPill}>Live</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>{subtitle}</Text>
            <Text style={styles.screenTitle}>{title}</Text>
          </View>

          {activeTab === "care" ? <CareView /> : null}
          {activeTab === "medication" ? (
            <MedicationView
              selectedDay={selectedDay}
              administeredDays={administeredDays}
              onSelectDay={setSelectedDay}
              onToggleDay={(dayKey) =>
                setAdministeredDays((current) => ({
                  ...current,
                  [dayKey]: !current[dayKey],
                }))
              }
            />
          ) : null}
          {activeTab === "alerts" ? <AlertsView /> : null}
          {activeTab === "devices" ? <DevicesView /> : null}
        </ScrollView>

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabButton, active && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    alignItems: "center",
    backgroundColor: "rgba(245, 243, 238, 0.96)",
    borderBottomColor: "rgba(90, 86, 75, 0.1)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  brandMarkText: {
    color: colors.sand,
    fontSize: 18,
    fontWeight: "900",
  },
  brandName: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 21,
  },
  brandSub: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  headerPill: {
    backgroundColor: colors.sand,
    borderColor: colors.taupe,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  content: {
    padding: 20,
    paddingBottom: 112,
  },
  titleBlock: {
    marginBottom: 18,
  },
  eyebrow: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 38,
    marginTop: 6,
  },
  stack: {
    gap: 14,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
  },
  profileTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.taupe,
    borderRadius: 16,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  avatarText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  profileMeta: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  statusPill: {
    backgroundColor: colors.sand,
    borderColor: colors.taupe,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  statusPillDark: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  statusPillText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
  },
  statusPillTextDark: {
    color: colors.sand,
  },
  profileBody: {
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 16,
  },
  profileStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  monitorCard: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    padding: 20,
  },
  monitorHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heartRate: {
    color: colors.sand,
    fontSize: 58,
    fontWeight: "900",
    letterSpacing: -1.8,
    lineHeight: 62,
    marginTop: 5,
  },
  heartRateUnit: {
    color: colors.stone,
    fontSize: 13,
    fontWeight: "800",
  },
  livePill: {
    alignItems: "center",
    backgroundColor: "rgba(248, 238, 217, 0.12)",
    borderColor: "rgba(248, 238, 217, 0.32)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  liveDot: {
    backgroundColor: colors.sand,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  livePillText: {
    color: colors.sand,
    fontSize: 12,
    fontWeight: "900",
  },
  heartGraph: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    height: 104,
    marginTop: 18,
  },
  heartBar: {
    backgroundColor: colors.sand,
    borderRadius: 999,
    flex: 1,
    opacity: 0.9,
  },
  monitorNote: {
    color: colors.stone,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 14,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricTile: {
    backgroundColor: colors.surface,
    borderColor: colors.stone,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: "46%",
    padding: 14,
  },
  metricLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 7,
  },
  weekCard: {
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  weekRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 14,
  },
  dayButton: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderColor: colors.stone,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minHeight: 72,
    paddingVertical: 9,
  },
  dayButtonActive: {
    backgroundColor: colors.sand,
    borderColor: colors.taupe,
  },
  dayText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "900",
  },
  dayTextActive: {
    color: colors.ink,
  },
  checkbox: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 7,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  checkboxText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18,
  },
  checkboxTextChecked: {
    color: colors.sand,
  },
  weekHint: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 12,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  detailHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 3,
  },
  emptyText: {
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  medicationDose: {
    backgroundColor: colors.cream,
    borderColor: colors.stone,
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
  },
  medicationDoseTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  doseTime: {
    backgroundColor: colors.sand,
    borderColor: colors.taupe,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  doseName: {
    color: colors.ink,
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
  },
  doseAmount: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 10,
  },
  doseInstructions: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 5,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  alertUrgent: {
    backgroundColor: colors.sand,
  },
  alertWarning: {
    backgroundColor: colors.white,
  },
  alertHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  alertDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  urgentDot: {
    backgroundColor: colors.ink,
  },
  warningDot: {
    backgroundColor: colors.taupe,
  },
  infoDot: {
    backgroundColor: colors.muted,
  },
  alertType: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  alertTime: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "800",
  },
  alertTitle: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: "900",
    lineHeight: 26,
    marginTop: 13,
  },
  alertBody: {
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 8,
  },
  alertActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderColor: colors.ink,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 16,
  },
  actionButtonLight: {
    backgroundColor: colors.sand,
    borderColor: colors.taupe,
  },
  actionButtonText: {
    color: colors.sand,
    fontSize: 13,
    fontWeight: "900",
  },
  actionButtonTextLight: {
    color: colors.ink,
  },
  watchCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  watchBody: {
    alignItems: "center",
  },
  watchStrapTop: {
    backgroundColor: colors.textSoft,
    borderRadius: 18,
    height: 48,
    width: 78,
  },
  watchFace: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderColor: colors.textSoft,
    borderRadius: 34,
    borderWidth: 8,
    height: 138,
    justifyContent: "center",
    marginVertical: -4,
    width: 112,
    zIndex: 2,
  },
  watchHeart: {
    color: colors.sand,
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 44,
  },
  watchUnit: {
    color: colors.stone,
    fontSize: 13,
    fontWeight: "800",
  },
  watchStrapBottom: {
    backgroundColor: colors.textSoft,
    borderRadius: 18,
    height: 48,
    width: 78,
  },
  watchTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 18,
  },
  watchSubtitle: {
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  deviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  deviceStatusCard: {
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  deviceCheck: {
    backgroundColor: colors.cream,
    borderColor: colors.stone,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 13,
  },
  deviceCheckTitle: {
    color: colors.textSoft,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  deviceCheckValue: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
  },
  tabBar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 999,
    borderWidth: 1,
    bottom: 22,
    flexDirection: "row",
    gap: 4,
    left: 18,
    padding: 6,
    position: "absolute",
    right: 18,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  tabButtonActive: {
    backgroundColor: colors.ink,
  },
  tabText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "900",
  },
  tabTextActive: {
    color: colors.sand,
  },
});
