import type { Playlist, Track } from "./types";

export const demoTracks: Track[] = [
  { id: "night-drive", title: "Night Drive", artist: "PYLA Radio", album: "After Hours", duration: 214, cover: "linear-gradient(135deg,#182329,#d8ff3e)", source: "demo", audioUrl: "/demo/night-drive.mp3" },
  { id: "soft-static", title: "Soft Static", artist: "Mira Vale", album: "Low Light", duration: 188, cover: "linear-gradient(135deg,#ff694a,#ffca8a)", source: "demo" },
  { id: "northbound", title: "Northbound", artist: "Aster Bloom", album: "Open Roads", duration: 243, cover: "linear-gradient(135deg,#5574ff,#b7c7ff)", source: "demo" },
  { id: "green-room", title: "Green Room", artist: "Kito Sane", album: "Objects in Motion", duration: 201, cover: "linear-gradient(135deg,#7b5cff,#d8ff3e)", source: "demo" }
];

export const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
export const searchTracks = (tracks: Track[], query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return tracks;
  return tracks.filter((track) => `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(normalized));
};
export const toggleFavorite = (tracks: Track[], id: string) => tracks.map((track) => track.id === id ? { ...track, favorite: !track.favorite } : track);
export const createPlaylist = (name: string): Playlist => ({ id: `playlist-${Date.now()}`, name: name.trim(), trackIds: [], createdAt: Date.now() });
