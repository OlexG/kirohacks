"use server";

import { revalidatePath } from "next/cache";
import { sendAlertTextNotification, sendMedicationReminderTextNotification } from "@/lib/notifications";
import { updateDemoProfileNotificationNumber } from "@/lib/profiles";

export type ProfileNumberActionState = {
  ok: boolean;
  message: string;
};

export type TextNotificationActionState = {
  ok: boolean;
  message: string;
};

export type MedicationReminderActionState = {
  ok: boolean;
  message: string;
};

function formatNotificationError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error.message.toLowerCase().includes("twilio")) {
    return "Unable to reach the notification service.";
  }

  return error.message;
}

export async function updateProfileNotificationNumberAction(
  _previousState: ProfileNumberActionState,
  formData: FormData,
): Promise<ProfileNumberActionState> {
  try {
    await updateDemoProfileNotificationNumber(String(formData.get("notification_number") ?? ""));
    revalidatePath("/app");
    return { ok: true, message: "Notification number saved." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to save notification number.",
    };
  }
}

export async function sendTextNotificationAction(
  _previousState: TextNotificationActionState,
  formData: FormData,
): Promise<TextNotificationActionState> {
  try {
    const result = await sendAlertTextNotification(
      String(formData.get("alert_id") ?? ""),
      String(formData.get("suggested_text") ?? ""),
    );
    return { ok: true, message: result.sid ? "Notification sent." : "Notification sent." };
  } catch (error) {
    return {
      ok: false,
      message: formatNotificationError(error, "Unable to send notification."),
    };
  }
}

export async function sendMedicationReminderAction(
  _previousState: MedicationReminderActionState,
  formData: FormData,
): Promise<MedicationReminderActionState> {
  try {
    const result = await sendMedicationReminderTextNotification({
      dayName: String(formData.get("day_name") ?? ""),
      dose: String(formData.get("dose") ?? ""),
      medicationId: String(formData.get("medication_id") ?? ""),
      time: String(formData.get("time") ?? ""),
    });

    return {
      ok: true,
      message: result.sid ? "Reminder sent." : "Reminder sent.",
    };
  } catch (error) {
    return {
      ok: false,
      message: formatNotificationError(error, "Unable to send medication reminder."),
    };
  }
}
