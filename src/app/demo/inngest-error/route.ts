import { inngest } from "@/ingest/client";

export async function POST() {

  await inngest.send({ name: "demo/error", data: {} });

  return Response.json({ status: "started" });
}
