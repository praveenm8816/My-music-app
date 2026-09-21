import { describe, expect, it } from "vitest";
import { createPlaylist, demoTracks, formatDuration, searchTracks, toggleFavorite } from "../lib/library";

describe("library utilities", () => {
  it("formats durations", () => expect(formatDuration(214)).toBe("3:34"));
  it("searches title, artist, and album", () => {
    expect(searchTracks(demoTracks, "mira")).toHaveLength(1);
    expect(searchTracks(demoTracks, "open roads")[0].title).toBe("Northbound");
  });
  it("toggles a favorite without changing other tracks", () => {
    const result = toggleFavorite(demoTracks, "night-drive");
    expect(result[0].favorite).toBe(true);
    expect(result[1].favorite).toBeUndefined();
  });
  it("creates a clean playlist", () => {
    const playlist = createPlaylist("  Late night  ");
    expect(playlist.name).toBe("Late night");
    expect(playlist.trackIds).toEqual([]);
  });
});
