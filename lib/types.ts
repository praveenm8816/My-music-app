export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: string;
  source: "imported" | "provider" | "r2";
  audioUrl?: string;
  audioBlob?: Blob;
  r2Key?: string;
  r2Url?: string;
  sourceUrl?: string;
  license?: string;
  favorite?: boolean;
  addedAt?: number;
};

export type Playlist = { id: string; name: string; trackIds: string[]; createdAt: number };
