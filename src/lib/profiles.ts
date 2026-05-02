import { getSupabaseAdmin } from "@/lib/supabase/server";

export const DEMO_PROFILE_ID = "demo-caregiver-profile";

export type CareProfile = {
  id: string;
  display_name: string;
  role: string;
  notification_number: string | null;
  created_at: string;
  updated_at: string;
};

export async function getDemoProfile() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, notification_number, created_at, updated_at")
    .eq("id", DEMO_PROFILE_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load profile: ${error.message}`);
  }

  return data as CareProfile | null;
}

export async function updateDemoProfileNotificationNumber(notificationNumber: string) {
  const cleanedNumber = notificationNumber.trim();

  if (!cleanedNumber) {
    throw new Error("Enter a notification number.");
  }

  if (cleanedNumber.length > 32) {
    throw new Error("Notification number must be 32 characters or fewer.");
  }

  if (!/^[0-9+\-().\s]+$/.test(cleanedNumber)) {
    throw new Error("Use only digits, spaces, and common phone number symbols.");
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({
      notification_number: cleanedNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", DEMO_PROFILE_ID);

  if (error) {
    throw new Error(`Unable to update profile: ${error.message}`);
  }
}
