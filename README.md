# PYLA MUSIC

PYLA is a mobile-first, local-first music PWA for legal personal playback.

## Getting started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` to enable Supabase auth/data wiring. Without credentials, the app runs in demo mode and stores imported tracks, favorites, and playlists in IndexedDB.

## Product notes

- Import audio from the Library tab; files never leave the device.
- The legal-provider interface in `lib/providers.ts` is intentionally provider-agnostic.
- Search includes an Internet Archive adapter at `/api/music/search`; results retain source and license links, and only provider-exposed audio files are playable.
- On iPhone, use Safari’s Share → Add to Home Screen flow for the installed PWA experience.
- Demo audio assets are not included; imported local files provide playback URLs for a production audio element integration.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
