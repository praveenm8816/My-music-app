import Dexie, { type Table } from "dexie";
import type { Playlist, Track } from "./types";

class PylaDB extends Dexie {
  tracks!: Table<Track, string>;
  playlists!: Table<Playlist, string>;
  constructor() {
    super("pyla-music");
    this.version(1).stores({ tracks: "id, artist, favorite, addedAt", playlists: "id, createdAt" });
  }
}

export const db = new PylaDB();
export const saveTrack = (track: Track) => db.tracks.put({ ...track, addedAt: track.addedAt ?? Date.now() });
export const loadTracks = async () => {
  const tracks = await db.tracks.toArray();
  return tracks.map((track) => track.audioBlob
    ? { ...track, audioUrl: URL.createObjectURL(track.audioBlob) }
    : track);
};
export const savePlaylist = (playlist: Playlist) => db.playlists.put(playlist);
