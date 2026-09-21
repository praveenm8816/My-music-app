import type { Playlist, Track } from "./types";

export const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
export const searchTracks = (tracks: Track[], query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return tracks;
  return tracks.filter((track) => `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(normalized));
};
export const toggleFavorite = (tracks: Track[], id: string) => tracks.map((track) => track.id === id ? { ...track, favorite: !track.favorite } : track);
export const createPlaylist = (name: string): Playlist => ({ id: `playlist-${Date.now()}`, name: name.trim(), trackIds: [], createdAt: Date.now() });
