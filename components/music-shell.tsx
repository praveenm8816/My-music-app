"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Heart, Home, Library, ListMusic, MoreHorizontal, Pause, Play, Plus, Search, Share2, SkipBack, SkipForward, Upload, X } from "lucide-react";
import { demoTracks, formatDuration, searchTracks, toggleFavorite, createPlaylist } from "../lib/library";
import { loadTracks, savePlaylist, saveTrack } from "../lib/db";
import type { Playlist, Track } from "../lib/types";

type View = "home" | "library" | "search" | "playlists";

export default function MusicShell() {
  const [view, setView] = useState<View>("home");
  const [tracks, setTracks] = useState<Track[]>(demoTracks);
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<Track>(demoTracks[0]);
  const [playing, setPlaying] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showInstall, setShowInstall] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const filtered = useMemo(() => searchTracks(view === "library" ? tracks.filter((t) => t.source === "imported" || t.favorite) : tracks, query), [tracks, query, view]);

  useEffect(() => { loadTracks().then((saved) => { if (saved.length) setTracks([...demoTracks, ...saved.filter((s) => !demoTracks.some((d) => d.id === s.id))]); }); }, []);
  const play = (track: Track) => {
    setCurrent(track);
    setPlaying(true);
    const recent = JSON.parse(localStorage.getItem("pyla-recent") ?? "[]") as string[];
    localStorage.setItem("pyla-recent", JSON.stringify([track.id, ...recent.filter((id) => id !== track.id)].slice(0, 10)));
  };
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current.audioUrl) return;
    audio.src = current.audioUrl;
    if (playing) void audio.play().catch(() => setPlaying(false));
  }, [current, playing]);
  const favorite = (id: string) => { const next = toggleFavorite(tracks, id); setTracks(next); const track = next.find((t) => t.id === id); if (track) saveTrack(track); };
  const importFiles = (files: FileList | null) => {
    if (!files) return;
    const imported = Array.from(files).filter((file) => file.type.startsWith("audio/")).map((file) => ({ id: `import-${file.name}-${file.lastModified}`, title: file.name.replace(/\.[^/.]+$/, ""), artist: "Imported track", album: "On this device", duration: 0, cover: "linear-gradient(135deg,#101416,#52615c)", source: "imported" as const, audioUrl: URL.createObjectURL(file), addedAt: Date.now() }));
    imported.forEach(saveTrack); setTracks((old) => [...old, ...imported]); setView("library");
  };
  const addPlaylist = () => { const clean = playlistName.trim(); if (!clean) return; const next = createPlaylist(clean); savePlaylist(next); setPlaylists((old) => [...old, next]); setPlaylistName(""); };

  return (
    <main className="grain min-h-screen bg-paper pb-36">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pb-7 pt-8 sm:px-10">
        <button onClick={() => setView("home")} className="font-display text-xl font-bold tracking-[-0.06em]">PYLA<span className="text-ember">.</span></button>
        <div className="flex items-center gap-2">
          <button aria-label="Install PYLA" onClick={() => setShowInstall(true)} className="rounded-full border border-ink/15 p-2.5 text-ink/65 hover:border-ink hover:text-ink"><Download size={18} /></button>
          <button aria-label="Share PYLA" onClick={() => navigator.share?.({ title: "PYLA MUSIC", url: location.href })} className="rounded-full border border-ink/15 p-2.5 text-ink/65 hover:border-ink hover:text-ink"><Share2 size={18} /></button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 sm:px-10">
        {view === "home" && <section className="rise">
          <div className="grid gap-7 pb-12 pt-10 md:grid-cols-[1.2fr_.8fr] md:items-end md:pt-20">
            <div><p className="mb-5 font-display text-xs font-bold uppercase tracking-[0.22em] text-ink/45">Your music, your rules</p><h1 className="max-w-xl font-display text-6xl font-bold leading-[.9] tracking-[-0.07em] sm:text-8xl">Make room for <span className="text-ember">sound.</span></h1></div>
            <div className="max-w-sm pb-2 text-base leading-7 text-ink/65">A calm home for the music you already own. Import, organize, and listen without the noise.</div>
          </div>
          <div className="border-t border-ink/15 pt-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl font-bold tracking-[-0.04em]">Made for tonight</h2><button onClick={() => setView("library")} className="text-sm font-semibold underline underline-offset-4">See library</button></div><TrackRow tracks={tracks.slice(0, 4)} current={current} onPlay={play} onFavorite={favorite} /></div>
        </section>}
        {view === "library" && <section className="rise pt-10"><PageTitle title="Your library" detail={`${tracks.filter((t) => t.source === "imported" || t.favorite).length} saved tracks`} action={<button onClick={() => fileInput.current?.click()} className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-paper"><Upload size={16} /> Import</button>} /><input ref={fileInput} type="file" accept="audio/*" multiple hidden onChange={(e) => importFiles(e.target.files)} /><TrackRow tracks={filtered} current={current} onPlay={play} onFavorite={favorite} empty="Import your first track to start your local library." /></section>}
        {view === "search" && <section className="rise pt-10"><PageTitle title="Find a feeling" detail="Search your local collection" /><div className="relative mb-8 mt-8"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/45" size={20} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tracks, artists, albums" className="w-full rounded-2xl border border-ink/15 bg-white/60 py-4 pl-12 pr-4 outline-none ring-lime focus:ring-2" /></div><TrackRow tracks={filtered} current={current} onPlay={play} onFavorite={favorite} empty="Nothing here yet. Try a different search." /></section>}
        {view === "playlists" && <section className="rise pt-10"><PageTitle title="Playlists" detail="Small worlds for every mood" /><div className="mt-8 flex gap-2"><input value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} placeholder="New playlist name" className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white/60 px-4 py-3 outline-none focus:ring-2 focus:ring-lime" /><button onClick={addPlaylist} className="rounded-xl bg-ink px-4 text-paper"><Plus size={20} /></button></div><div className="mt-7 divide-y divide-ink/10">{playlists.length ? playlists.map((playlist) => <div key={playlist.id} className="flex items-center justify-between py-4"><div><p className="font-semibold">{playlist.name}</p><p className="text-sm text-ink/50">{playlist.trackIds.length} tracks</p></div><MoreHorizontal size={20} className="text-ink/40" /></div>) : <p className="py-14 text-center text-ink/50">Create a playlist when a moment deserves its own place.</p>}</div></section>}
      </div>
      <audio ref={audioRef} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <Player track={current} playing={playing} setPlaying={(value) => { setPlaying(value); if (value) void audioRef.current?.play().catch(() => setPlaying(false)); else audioRef.current?.pause(); }} onNext={() => play(tracks[(tracks.findIndex((t) => t.id === current.id) + 1) % tracks.length])} />
      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-10 border-t border-ink/10 bg-paper/95 px-5 pt-3 backdrop-blur sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:rounded-t-3xl sm:border-x">
        <div className="mx-auto flex max-w-md items-center justify-between"><NavButton active={view === "home"} icon={<Home size={20} />} label="Home" onClick={() => setView("home")} /><NavButton active={view === "library"} icon={<Library size={20} />} label="Library" onClick={() => setView("library")} /><NavButton active={view === "search"} icon={<Search size={20} />} label="Search" onClick={() => setView("search")} /><NavButton active={view === "playlists"} icon={<ListMusic size={20} />} label="Playlists" onClick={() => setView("playlists")} /></div>
      </nav>
      {showInstall && <div className="fixed inset-0 z-20 grid place-items-center bg-ink/40 p-6"><div className="w-full max-w-sm rounded-3xl bg-paper p-6 shadow-player"><div className="flex justify-between"><h2 className="font-display text-2xl font-bold">Take PYLA with you</h2><button onClick={() => setShowInstall(false)} aria-label="Close"><X size={20} /></button></div><p className="mt-3 leading-7 text-ink/65">On iPhone, tap Share in Safari, then “Add to Home Screen”. Your library stays on this device.</p><button onClick={() => setShowInstall(false)} className="mt-6 w-full rounded-xl bg-ink py-3 font-bold text-paper">Got it</button></div></div>}
    </main>
  );
}

function PageTitle({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) { return <div className="flex items-end justify-between border-b border-ink/15 pb-5"><div><h1 className="font-display text-5xl font-bold tracking-[-0.07em]">{title}</h1><p className="mt-2 text-sm text-ink/50">{detail}</p></div>{action}</div>; }
function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) { return <button onClick={onClick} className={`flex flex-col items-center gap-1 px-3 text-[11px] font-semibold ${active ? "text-ink" : "text-ink/40"}`}>{icon}<span>{label}</span></button>; }
function TrackRow({ tracks, current, onPlay, onFavorite, empty }: { tracks: Track[]; current: Track; onPlay: (t: Track) => void; onFavorite: (id: string) => void; empty?: string }) { return <div className="divide-y divide-ink/10">{tracks.length ? tracks.map((track) => <div key={track.id} className="group flex items-center gap-3 py-3"><button onClick={() => onPlay(track)} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl" style={{ background: track.cover }} aria-label={`Play ${track.title}`}>{current.id === track.id ? <span className="absolute inset-0 grid place-items-center bg-ink/45 text-lime"><Pause size={18} fill="currentColor" /></span> : <span className="absolute inset-0 grid place-items-center bg-ink/0 text-white opacity-0 transition group-hover:bg-ink/35 group-hover:opacity-100"><Play size={18} fill="currentColor" /></span>}</button><button onClick={() => onPlay(track)} className="min-w-0 flex-1 text-left"><p className="truncate font-semibold">{track.title}</p><p className="truncate text-sm text-ink/50">{track.artist} · {track.album}</p></button><span className="hidden text-xs text-ink/40 sm:block">{track.duration ? formatDuration(track.duration) : "—"}</span><button aria-label="Download track" onClick={() => track.audioUrl && Object.assign(document.createElement("a"), { href: track.audioUrl, download: `${track.title}.mp3` }).click()} className="hidden p-2 text-ink/30 hover:text-ink sm:block"><Download size={17} /></button><button aria-label={`${track.favorite ? "Remove" : "Add"} ${track.title} favorite`} onClick={() => onFavorite(track.id)} className={`p-2 ${track.favorite ? "text-ember" : "text-ink/30 hover:text-ember"}`}><Heart size={18} fill={track.favorite ? "currentColor" : "none"} /></button></div>) : <p className="py-16 text-center text-ink/50">{empty}</p>}</div>; }
function Player({ track, playing, setPlaying, onNext }: { track: Track; playing: boolean; setPlaying: (value: boolean) => void; onNext: () => void }) { return <div className="fixed bottom-[76px] left-3 right-3 z-10 mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-ink p-3 text-paper shadow-player sm:bottom-24"><div className="h-11 w-11 shrink-0 rounded-lg" style={{ background: track.cover }} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{track.title}</p><p className="truncate text-xs text-paper/55">{track.artist}</p></div><button aria-label="Previous track" className="hidden text-paper/60 sm:block"><SkipBack size={18} /></button><button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"} className="grid h-10 w-10 place-items-center rounded-full bg-lime text-ink">{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button><button onClick={onNext} aria-label="Next track" className="text-paper/60"><SkipForward size={18} /></button></div>; }
