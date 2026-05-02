"use client";

import { useActionState } from "react";
import {
  sendMedicationReminderAction,
  type MedicationReminderActionState,
} from "../../actions";

const initialMedicationReminderState: MedicationReminderActionState = {
  ok: false,
  message: "",
};

export function MedicationReminderButton({
  dayName,
  dose,
  medicationId,
  time,
}: Readonly<{
  dayName: string;
  dose: string;
  medicationId: string;
  time: string;
}>) {
  const [state, formAction, isPending] = useActionState(
    sendMedicationReminderAction,
    initialMedicationReminderState,
  );

  return (
    <form action={formAction} className="person-medication-reminder-form">
      <input name="day_name" type="hidden" value={dayName} />
      <input name="dose" type="hidden" value={dose} />
      <input name="medication_id" type="hidden" value={medicationId} />
      <input name="time" type="hidden" value={time} />
      <button disabled={isPending} type="submit">
        {isPending ? "Sending" : "Notify"}
      </button>
      <span className={state.message ? (state.ok ? "success" : "error") : undefined}>
        {state.message || "Reminder ready"}
      </span>
    </form>
  );
}
