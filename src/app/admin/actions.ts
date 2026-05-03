"use server";

import { revalidatePath } from "next/cache";
import { SABAWOON_HAKIMI_PERSON_ID } from "@/lib/biometrics-data";
import { resetCareNotificationsToSeed } from "@/lib/care-notification-seeds";

export async function resetNotificationsAction() {
  await resetCareNotificationsToSeed();

  revalidatePath("/admin");
  revalidatePath("/app/alerts");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/roster");
  revalidatePath(`/app/people/${SABAWOON_HAKIMI_PERSON_ID}`);
}
