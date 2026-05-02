"use server";

import { revalidatePath } from "next/cache";
import { createCareRule, setCareRuleActive } from "@/lib/care-rules";

export type RuleActionState = {
  ok: boolean;
  message: string;
};

export async function createRuleAction(
  _previousState: RuleActionState,
  formData: FormData,
): Promise<RuleActionState> {
  try {
    await createCareRule({
      personId: String(formData.get("person_id") ?? ""),
      signalKey: String(formData.get("signal_key") ?? ""),
      operator: String(formData.get("operator") ?? ""),
      threshold: String(formData.get("threshold") ?? ""),
      severity: String(formData.get("severity") ?? "review"),
      notificationChannel: String(formData.get("notification_channel") ?? "care_team"),
      notes: String(formData.get("notes") ?? ""),
    });
    revalidatePath("/app/rules");
    return { ok: true, message: "Rule added." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to create rule.",
    };
  }
}

export async function toggleRuleAction(formData: FormData) {
  const ruleId = String(formData.get("rule_id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (!ruleId) {
    return;
  }

  await setCareRuleActive(ruleId, active);
  revalidatePath("/app/rules");
}
