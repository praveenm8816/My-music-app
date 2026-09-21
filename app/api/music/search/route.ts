import { NextRequest, NextResponse } from "next/server";

type ArchiveDoc = { identifier?: string; title?: string; creator?: string; description?: string };
type ArchiveFile = { name?: string; format?: string };

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json([]);

  const searchUrl = new URL("https://archive.org/advancedsearch.php");
  searchUrl.searchParams.set("q", `(${query}) AND mediatype:audio`);
  searchUrl.searchParams.set("fl[]", "identifier,title,creator,description");
  searchUrl.searchParams.set("rows", "8");
  searchUrl.searchParams.set("output", "json");

  try {
    const searchResponse = await fetch(searchUrl, { next: { revalidate: 300 } });
    if (!searchResponse.ok) return NextResponse.json({ error: "Provider unavailable" }, { status: 502 });
    const data = (await searchResponse.json()) as { response?: { docs?: ArchiveDoc[] } };
    const docs = data.response?.docs ?? [];
    const results = await Promise.all(docs.map(async (doc) => {
      if (!doc.identifier) return null;
      const metadataResponse = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}`, { next: { revalidate: 3600 } });
      const metadata = metadataResponse.ok ? await metadataResponse.json() as { files?: ArchiveFile[]; metadata?: { licenseurl?: string; license?: string } } : {};
      const playable = (metadata.files ?? []).find((file) => /\.(mp3|ogg|wav)$/i.test(file.name ?? "") && !/64kb|128kb/i.test(file.name ?? ""));
      const title = doc.title ?? doc.identifier;
      return {
        id: `archive-${doc.identifier}`,
        title,
        artist: typeof doc.creator === "string" ? doc.creator : "Internet Archive",
        album: "Internet Archive",
        duration: 0,
        cover: "linear-gradient(135deg,#101416,#52615c)",
        source: "provider" as const,
        audioUrl: playable ? `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${playable.name}` : undefined,
        sourceUrl: `https://archive.org/details/${encodeURIComponent(doc.identifier)}`,
        license: metadata.metadata?.licenseurl ?? metadata.metadata?.license ?? "Check source rights",
      };
    }));
    return NextResponse.json(results.filter(Boolean));
  } catch {
    return NextResponse.json({ error: "Unable to reach Internet Archive" }, { status: 502 });
  }
}
