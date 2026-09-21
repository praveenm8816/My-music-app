import { createHash } from "node:crypto";

export type NaaSong = {
  id: string;
  title: string;
  artist: string;
  year?: number;
  sourcePageUrl: string;
  sourceAudioUrl: string;
  attribution: string;
};

const clean = (value: string) => value.replace(/\s+/g, " ").replace(/[\u00a0]/g, " ").trim();
const decode = (value: string) => value.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');

export function parseNaaSongsPage(html: string, sourcePageUrl: string, limit = 5): NaaSong[] {
  const songs: NaaSong[] = [];
  const seen = new Set<string>();
  const anchorPattern = /<a[^>]+href=["']([^"']+\.mp3(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(html)) !== null) {
    const sourceAudioUrl = new URL(decode(match[1]), sourcePageUrl).toString();
    if (seen.has(sourceAudioUrl) || songs.length >= limit) continue;
    const anchorText = clean(decode(match[2].replace(/<[^>]+>/g, " "))).replace(/download/i, "").replace(/\s*[-–:]\s*$/, "");
    const start = Math.max(0, (match.index ?? 0) - 500);
    const context = clean(decode(html.slice(start, (match.index ?? 0) + match[0].length + 500).replace(/<[^>]+>/g, " ")));
    const artist = context.match(/Artist\s*[:-]\s*([^|]+?)(?:Year|Download|$)/i)?.[1]?.replace(/^[-:]\s*/, "").trim() || "Unknown artist";
    const yearText = context.match(/Year\s*[:-]\s*(20\d{2})/i)?.[1];
    const heading = context.match(/(?:^|\s)([^|]+?(?:Song|Part\s*\d+))\s+(?:Download|Artist|Year)/i)?.[1]?.trim();
    const title = heading || anchorText || sourceAudioUrl.split("/").pop()?.replace(/\.mp3.*$/i, "").replace(/%20/g, " ") || "Untitled";
    const id = createHash("sha256").update(sourceAudioUrl).digest("hex").slice(0, 20);
    songs.push({ id, title, artist, year: yearText ? Number(yearText) : undefined, sourcePageUrl, sourceAudioUrl, attribution: `Source: NaaSongs; page: ${sourcePageUrl}; artist: ${artist}` });
    seen.add(sourceAudioUrl);
  }
  return songs;
}

export function validateAudio(bytes: Uint8Array, contentType: string | null, url: string): void {
  const isMp3 = bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
  const isOgg = bytes.length >= 4 && bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53;
  const isWav = bytes.length >= 12 && String.fromCharCode(...Array.from(bytes.slice(0, 4))) === "RIFF" && String.fromCharCode(...Array.from(bytes.slice(8, 12))) === "WAVE";
  if (!isMp3 && !isOgg && !isWav && !contentType?.startsWith("audio/")) throw new Error(`Audio validation failed for ${url}`);
}

export const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
