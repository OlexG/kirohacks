"use server";

import { revalidatePath } from "next/cache";
import { updateDemoProfileNotificationNumber } from "@/lib/profiles";

export type ProfileNumberActionState = {
  ok: boolean;
  message: string;
};

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
