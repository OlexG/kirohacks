"use client";

import { useActionState } from "react";
import type { CareProfile } from "@/lib/profiles";
import {
  updateProfileNotificationNumberAction,
  type ProfileNumberActionState,
} from "./actions";

const initialProfileNumberState: ProfileNumberActionState = {
  ok: false,
  message: "",
};

export function ProfileNumberForm({ profile }: Readonly<{ profile: CareProfile | null }>) {
  const [state, formAction, isPending] = useActionState(
    updateProfileNotificationNumberAction,
    initialProfileNumberState,
  );

  return (
    <section className="ops-profile-number" aria-label="Notification profile">
      <div>
        <p>Demo profile</p>
        <h2>{profile?.display_name ?? "Demo Caregiver"}</h2>
        <span>Add your number for notifications.</span>
      </div>

      <form action={formAction}>
        <label>
          Number
          <input
            autoComplete="tel"
            defaultValue={profile?.notification_number ?? ""}
            inputMode="tel"
            name="notification_number"
            placeholder="+1 (555) 010-0199"
            type="tel"
          />
        </label>
        <button disabled={isPending} type="submit">
          {isPending ? "Saving" : "Save"}
        </button>
        <p className={state.message ? (state.ok ? "success" : "error") : undefined}>
          {state.message ||
            (profile?.notification_number
              ? `Current: ${profile.notification_number}`
              : "No number saved yet.")}
        </p>
      </form>
    </section>
  );
}
