import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseNaaSongsPage, validateAudio } from "../lib/naasongs-importer";

describe("NaaSongs importer", () => {
  const fixture = readFileSync("fixtures/naasongs-telugu-folk.html", "utf8");
  it("parses and caps the Telugu folk page at five songs", () => {
    const songs = parseNaaSongsPage(fixture, "https://naasongs.com.co/telugu-folk-songs-download-1f.html", 5);
    expect(songs).toHaveLength(5);
    expect(songs[0].title).toContain("Ringu Ringula");
    expect(songs[0].artist).toBe("Ramu Rathod");
    expect(songs[0].sourcePageUrl).toContain("telugu-folk");
    expect(songs[0].attribution).toContain("NaaSongs");
  });
  it("rejects non-audio content", () => {
    expect(() => validateAudio(new TextEncoder().encode("html"), "text/html", "https://example.test/file.mp3")).toThrow();
  });
  it("accepts MP3 signatures", () => {
    expect(() => validateAudio(new Uint8Array([0x49, 0x44, 0x33]), "application/octet-stream", "song.mp3")).not.toThrow();
  });
});
