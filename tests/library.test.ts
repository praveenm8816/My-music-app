import { describe, expect, it } from "vitest";
import { createPlaylist, formatDuration, searchTracks, toggleFavorite } from "../lib/library";
import type { Track } from "../lib/types";

const tracks: Track[] = [
  { id: "one", title: "Night Drive", artist: "PYLA Radio", album: "After Hours", duration: 214, cover: "linear-gradient(135deg,#182329,#d8ff3e)", source: "imported", audioUrl: "blob:one" },
  { id: "two", title: "Soft Static", artist: "Mira Vale", album: "Low Light", duration: 188, cover: "linear-gradient(135deg,#ff694a,#ffca8a)", source: "imported", audioUrl: "blob:two" },
  { id: "three", title: "Northbound", artist: "Aster Bloom", album: "Open Roads", duration: 243, cover: "linear-gradient(135deg,#5574ff,#b7c7ff)", source: "imported", audioUrl: "blob:three" }
];

describe("library utilities", () => {
  it("formats durations", () => expect(formatDuration(214)).toBe("3:34"));
  it("searches title, artist, and album", () => {
    expect(searchTracks(tracks, "mira")).toHaveLength(1);
    expect(searchTracks(tracks, "open roads")[0].title).toBe("Northbound");
  });
  it("toggles a favorite without changing other tracks", () => {
    const result = toggleFavorite(tracks, "one");
    expect(result[0].favorite).toBe(true);
    expect(result[1].favorite).toBeUndefined();
  });
  it("creates a clean playlist", () => {
    const playlist = createPlaylist("  Late night  ");
    expect(playlist.name).toBe("Late night");
    expect(playlist.trackIds).toEqual([]);
  });
});
