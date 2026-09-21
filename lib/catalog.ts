import { createClient } from "@supabase/supabase-js";
import type { Track } from "./types";
import { createPlaybackUrl } from "./r2";

type CatalogRow = { id: string; title: string; artist: string; year: number | null; source_page_url: string; source_audio_url: string; attribution: string; r2_key: string; sha256: string; };

export async function searchCatalog(query: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const pattern = `%${query.trim()}%`;
  const { data, error } = await supabase.from("music_catalog").select("*").or(`title.ilike.${pattern},artist.ilike.${pattern}`).limit(25);
  if (error) throw error;
  return Promise.all(((data ?? []) as CatalogRow[]).map(async (row): Promise<Track> => ({
    id: `r2-${row.id}`, title: row.title, artist: row.artist, album: "NaaSongs Telugu Folk", duration: 0,
    cover: "linear-gradient(135deg,#101416,#52615c)", source: "r2", r2Key: row.r2_key,
    audioUrl: (await createPlaybackUrl(row.r2_key)) ?? undefined, sourceUrl: row.source_page_url, license: row.attribution
  })));
}
