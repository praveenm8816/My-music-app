export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: string;
  source: "demo" | "imported" | "provider";
  audioUrl?: string;
  sourceUrl?: string;
  license?: string;
  favorite?: boolean;
  addedAt?: number;
};

export type Playlist = { id: string; name: string; trackIds: string[]; createdAt: number };
