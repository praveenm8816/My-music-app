import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { parseNaaSongsPage, sha256, validateAudio, type NaaSong } from "../lib/naasongs-importer";
import { createClient } from "@supabase/supabase-js";

const sourcePageUrl = process.env.NAASONGS_SOURCE_URL ?? "https://naasongs.com.co/telugu-folk-songs-download-1f.html";
const limit = 5;
const delayMs = Number(process.env.IMPORT_RATE_LIMIT_MS ?? 1500);
const dryRun = process.argv.includes("--dry-run");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function r2Client() {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) return null;
  if (!/^[a-f0-9]{32}$/i.test(process.env.R2_ACCOUNT_ID)) throw new Error("R2_ACCOUNT_ID must be the 32-character Cloudflare account ID");
  return new S3Client({ region: "auto", endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
}

async function putWithRetry(client: S3Client, command: PutObjectCommand, label: string) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await client.send(command);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(1000 * attempt);
    }
  }
  const message = lastError instanceof Error ? lastError.message : "unknown upload error";
  throw new Error(`R2 upload failed for ${label} after 3 attempts: ${message}`);
}

async function fetchBytes(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": "PYLA-MUSIC-authorized-importer/1.0" } });
  if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
  return { bytes: new Uint8Array(await response.arrayBuffer()), contentType: response.headers.get("content-type") };
}

async function checkAudioLink(url: string) {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "PYLA-MUSIC-authorized-importer/1.0", Range: "bytes=0-15" } });
    return { ok: response.ok, status: response.status, contentType: response.headers.get("content-type") };
  } catch {
    return { ok: false, status: 0, contentType: null };
  }
}

async function main() {
  const page = process.env.IMPORT_FIXTURE ? await readFile(process.env.IMPORT_FIXTURE, "utf8") : new TextDecoder().decode((await fetchBytes(sourcePageUrl)).bytes);
  const songs = parseNaaSongsPage(page, sourcePageUrl, limit);
  if (!songs.length) throw new Error("No audio links found");
  console.log(`Found ${songs.length} songs (cap ${limit})`);
  const catalog: Array<NaaSong & { r2Key?: string; sha256?: string; status: string; linkStatus?: number; linkContentType?: string | null }> = [];
  let previous: Array<{ sourceAudioUrl?: string; sha256?: string; status?: string }> = [];
  try {
    previous = JSON.parse(await readFile("data/naasongs-catalog.json", "utf8")).songs ?? [];
  } catch {}
  const client = dryRun ? null : r2Client();
  const bucket = process.env.R2_BUCKET_NAME;
  if (!dryRun && (!client || !bucket)) throw new Error("R2 credentials are required for live import; use --dry-run or configure .env.local");
  const supabase = !dryRun && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  if (!dryRun && !supabase) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for live catalog persistence");
  const hashes = new Set<string>();
  for (const song of songs) {
    if (!dryRun) {
      const { bytes, contentType } = await fetchBytes(song.sourceAudioUrl);
      validateAudio(bytes, contentType, song.sourceAudioUrl);
      const digest = sha256(bytes);
      if (hashes.has(digest) || previous.some((item) => item.status === "uploaded" && (item.sourceAudioUrl === song.sourceAudioUrl || item.sha256 === digest))) { catalog.push({ ...song, sha256: digest, status: "duplicate" }); continue; }
      hashes.add(digest);
      const key = `${process.env.R2_KEY_PREFIX ?? "naasongs/telugu-folk"}/${song.id}-${basename(new URL(song.sourceAudioUrl).pathname)}`;
      await putWithRetry(client!, new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: contentType ?? "audio/mpeg", Metadata: { sourcepage: song.sourcePageUrl, sourceaudio: song.sourceAudioUrl, attribution: song.attribution } }), song.title);
      catalog.push({ ...song, r2Key: key, sha256: digest, status: "uploaded" });
      const { error } = await supabase!.from("music_catalog").upsert({ id: song.id, title: song.title, artist: song.artist, year: song.year ?? null, source_page_url: song.sourcePageUrl, source_audio_url: song.sourceAudioUrl, attribution: song.attribution, r2_key: key, sha256: digest }, { onConflict: "source_audio_url" });
      if (error) throw error;
    } else {
      const link = await checkAudioLink(song.sourceAudioUrl);
      catalog.push({ ...song, status: link.ok ? "audio-link-ok" : "audio-link-failed", linkStatus: link.status, linkContentType: link.contentType });
    }
    await sleep(delayMs);
  }
  await mkdir("data", { recursive: true });
  await writeFile("data/naasongs-catalog.json", JSON.stringify({ generatedAt: new Date().toISOString(), sourcePageUrl, songs: catalog }, null, 2));
  if (client && !dryRun) await putWithRetry(client, new PutObjectCommand({ Bucket: bucket, Key: `${process.env.R2_KEY_PREFIX ?? "naasongs/telugu-folk"}/catalog.json`, Body: JSON.stringify({ generatedAt: new Date().toISOString(), sourcePageUrl, songs: catalog }), ContentType: "application/json" }), "catalog.json");
  console.log(JSON.stringify({ dryRun, songs: catalog.length, uploaded: catalog.filter((song) => song.status === "uploaded").length, catalog: "data/naasongs-catalog.json" }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
