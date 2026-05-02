import { recordSabawoonWatchAlert } from "@/lib/biometrics-data";

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
    const data = await recordSabawoonWatchAlert(payload as Record<string, unknown>);
    return Response.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record biometrics data.";
    return Response.json({ error: message }, { status: 500 });
  }
}
