import { describe, expect, it } from "vitest";
import { createPlaylist, formatDuration, searchTracks, toggleFavorite } from "../lib/library";
import type { Track } from "../lib/types";

const tracks: Track[] = [
  { id: "one", title: "Track One", artist: "Local Artist", album: "Local Album", duration: 214, cover: "linear-gradient(135deg,#182329,#d8ff3e)", source: "imported", audioUrl: "blob:one" },
  { id: "two", title: "Track Two", artist: "Another Artist", album: "Another Album", duration: 188, cover: "linear-gradient(135deg,#ff694a,#ffca8a)", source: "imported", audioUrl: "blob:two" },
  { id: "three", title: "Track Three", artist: "Third Artist", album: "Open Roads", duration: 243, cover: "linear-gradient(135deg,#5574ff,#b7c7ff)", source: "imported", audioUrl: "blob:three" }
];

describe("library utilities", () => {
  it("formats durations", () => expect(formatDuration(214)).toBe("3:34"));
  it("searches title, artist, and album", () => {
    expect(searchTracks(tracks, "another artist")).toHaveLength(1);
    expect(searchTracks(tracks, "open roads")[0].title).toBe("Track Three");
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
