import { NextRequest, NextResponse } from "next/server";
import { lookup } from "@/lib/sources/aggregator.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const trimmed = q.trim();

  if (!trimmed) {
    return NextResponse.json(
      { status: "needs_clarification", reason: "Paramètre q manquant.", layers: [] },
      { status: 400 }
    );
  }

  try {
    const result = await lookup(trimmed);
    const httpStatus =
      result.status === "needs_clarification"
        ? 400
        : result.status === "empty"
          ? 404
          : result.status === "out_of_region"
            ? 422
            : 200;
    return NextResponse.json(result, { status: httpStatus });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    console.error("[/api/lookup] error:", err);
    return NextResponse.json(
      { status: "error", reason: message, layers: [] },
      { status: 500 }
    );
  }
}
