import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { parseNaaSongsPage, sha256, validateAudio, type NaaSong } from "../lib/naasongs-importer";

const sourcePageUrl = process.env.NAASONGS_SOURCE_URL ?? "https://naasongs.com.co/telugu-folk-songs-download-1f.html";
const limit = 5;
const delayMs = Number(process.env.IMPORT_RATE_LIMIT_MS ?? 1500);
const dryRun = process.argv.includes("--dry-run");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function r2Client() {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET) return null;
  return new S3Client({ region: "auto", endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
}

async function fetchBytes(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": "PYLA-MUSIC-authorized-importer/1.0" } });
  if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
  return { bytes: new Uint8Array(await response.arrayBuffer()), contentType: response.headers.get("content-type") };
}

async function main() {
  const page = process.env.IMPORT_FIXTURE ? await readFile(process.env.IMPORT_FIXTURE, "utf8") : new TextDecoder().decode((await fetchBytes(sourcePageUrl)).bytes);
  const songs = parseNaaSongsPage(page, sourcePageUrl, limit);
  if (!songs.length) throw new Error("No audio links found");
  console.log(`Found ${songs.length} songs (cap ${limit})`);
  const catalog: Array<NaaSong & { r2Key?: string; sha256?: string; status: string }> = [];
  let previous: Array<{ sourceAudioUrl?: string; sha256?: string }> = [];
  try {
    previous = JSON.parse(await readFile("data/naasongs-catalog.json", "utf8")).songs ?? [];
  } catch {}
  const client = r2Client();
  if (!dryRun && !client) throw new Error("R2 credentials are required for live import; use --dry-run or IMPORT_FIXTURE");
  const hashes = new Set<string>();
  for (const song of songs) {
    if (!dryRun) {
      const { bytes, contentType } = await fetchBytes(song.sourceAudioUrl);
      validateAudio(bytes, contentType, song.sourceAudioUrl);
      const digest = sha256(bytes);
      if (hashes.has(digest) || previous.some((item) => item.sourceAudioUrl === song.sourceAudioUrl || item.sha256 === digest)) { catalog.push({ ...song, sha256: digest, status: "duplicate" }); continue; }
      hashes.add(digest);
      const key = `${process.env.R2_KEY_PREFIX ?? "naasongs/telugu-folk"}/${song.id}-${basename(new URL(song.sourceAudioUrl).pathname)}`;
      await client!.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: bytes, ContentType: contentType ?? "audio/mpeg", Metadata: { sourcepage: song.sourcePageUrl, sourceaudio: song.sourceAudioUrl, attribution: song.attribution } }));
      catalog.push({ ...song, r2Key: key, sha256: digest, status: "uploaded" });
    } else catalog.push({ ...song, status: "dry-run" });
    await sleep(delayMs);
  }
  await mkdir("data", { recursive: true });
  await writeFile("data/naasongs-catalog.json", JSON.stringify({ generatedAt: new Date().toISOString(), sourcePageUrl, songs: catalog }, null, 2));
  if (client && !dryRun) await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: `${process.env.R2_KEY_PREFIX ?? "naasongs/telugu-folk"}/catalog.json`, Body: JSON.stringify({ generatedAt: new Date().toISOString(), sourcePageUrl, songs: catalog }), ContentType: "application/json" }));
  console.log(JSON.stringify({ dryRun, songs: catalog.length, uploaded: catalog.filter((song) => song.status === "uploaded").length, catalog: "data/naasongs-catalog.json" }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
