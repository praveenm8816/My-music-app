import { NextRequest, NextResponse } from "next/server";
import { searchCatalog } from "../../../../lib/catalog";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await searchCatalog(request.nextUrl.searchParams.get("q") ?? ""));
  } catch {
    return NextResponse.json({ error: "Catalog unavailable" }, { status: 502 });
  }
}
