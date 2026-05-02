import { revalidatePath } from "next/cache";
import { recordSabawoonWatchAlert } from "@/lib/biometrics-data";
import {
  FallRiskEnvelopeError,
  isFallRiskEnvelope,
  recordSabawoonFallRiskEnvelope,
} from "@/lib/fall-risk";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON request body." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return Response.json({ error: "JSON body must be an object." }, { status: 400 });
  }

  try {
    const payloadObject = payload as Record<string, unknown>;
    const data = isFallRiskEnvelope(payloadObject)
      ? await recordSabawoonFallRiskEnvelope(payloadObject)
      : await recordSabawoonWatchAlert(payloadObject);

    revalidatePath("/app/dashboard");
    revalidatePath("/app/roster");
    revalidatePath("/app/alerts");
    revalidatePath(`/app/people/${data.person_id}`);

    return Response.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof FallRiskEnvelopeError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unable to record biometrics data.";
    return Response.json({ error: message }, { status: 500 });
  }
}
