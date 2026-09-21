import type { Track } from "./types";

export interface LegalMusicProvider {
  readonly id: string;
  readonly name: string;
  search(query: string): Promise<Track[]>;
  getStreamUrl(trackId: string): Promise<string | null>;
}

export class DemoProvider implements LegalMusicProvider {
  readonly id = "demo";
  readonly name = "PYLA Demo Radio";
  async search() { return []; }
  async getStreamUrl() { return null; }
}

export type InternetArchiveResult = Track & {
  sourceUrl: string;
  license: string;
};

export async function searchInternetArchive(query: string): Promise<InternetArchiveResult[]> {
  const response = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Internet Archive search failed");
  return response.json() as Promise<InternetArchiveResult[]>;
}
