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
