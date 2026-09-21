"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ExternalLink, Heart, Home, Library, ListMusic, Maximize2, MoreHorizontal, Pause, Play, Plus, Search, Share2, SkipBack, SkipForward, Trash2, Upload, X } from "lucide-react";
import { formatDuration, searchTracks, toggleFavorite, createPlaylist } from "../lib/library";
import { deletePlaylist, deleteTrack, loadTracks, savePlaylist, saveTrack } from "../lib/db";
import type { Playlist, Track } from "../lib/types";
import { searchInternetArchive, type InternetArchiveResult } from "../lib/providers";

type View = "home" | "library" | "search" | "playlists";

export default function MusicShell() {
  const [view, setView] = useState<View>("home");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showInstall, setShowInstall] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [onlineTracks, setOnlineTracks] = useState<InternetArchiveResult[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState("");
  const [playerError, setPlayerError] = useState("");
  const [expandedPlayer, setExpandedPlayer] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const filtered = useMemo(() => searchTracks(view === "library" ? tracks.filter((t) => t.source === "imported" || t.favorite) : tracks, query), [tracks, query, view]);

  useEffect(() => { loadTracks().then(setTracks); }, []);
  const play = (track: Track) => {
    if (!track.audioUrl) {
      setPlayerError("This source does not expose an in-app audio stream.");
      setCurrent(track);
      setPlaying(false);
      return;
    }
    setPlayerError("");
    setCurrent(track);
    setPlaying(true);
    const recent = JSON.parse(localStorage.getItem("pyla-recent") ?? "[]") as string[];
    localStorage.setItem("pyla-recent", JSON.stringify([track.id, ...recent.filter((id) => id !== track.id)].slice(0, 10)));
  };
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;
    audio.src = current.audioUrl;
    audio.load();
    if (playing) void audio.play().catch(() => setPlaying(false));
  }, [current, playing]);
  const favorite = (id: string) => { const next = toggleFavorite(tracks, id); setTracks(next); const track = next.find((t) => t.id === id); if (track) saveTrack(track); };
  const importFiles = (files: FileList | null) => {
    if (!files) return;
    const imported = Array.from(files).filter((file) => file.type.startsWith("audio/")).map((file) => ({ id: `import-${file.name}-${file.lastModified}`, title: file.name.replace(/\.[^/.]+$/, ""), artist: "Imported track", album: "On this device", duration: 0, cover: "linear-gradient(135deg,#101416,#52615c)", source: "imported" as const, audioUrl: URL.createObjectURL(file), audioBlob: file, addedAt: Date.now() }));
    imported.forEach(saveTrack); setTracks((old) => [...old, ...imported]); setView("library");
  };
  const addPlaylist = () => { const clean = playlistName.trim(); if (!clean) return; const next = createPlaylist(clean); savePlaylist(next); setPlaylists((old) => [...old, next]); setPlaylistName(""); };
  const removeTrack = async (track: Track) => {
    if (!window.confirm(`Delete "${track.title}" from this device?`)) return;
    await deleteTrack(track.id);
    setTracks((old) => old.filter((item) => item.id !== track.id));
    if (current?.id === track.id) { setPlaying(false); setCurrent(null); }
  };
  const removePlaylist = async (playlist: Playlist) => {
    if (!window.confirm(`Delete playlist "${playlist.name}"?`)) return;
    await deletePlaylist(playlist.id);
    setPlaylists((old) => old.filter((item) => item.id !== playlist.id));
  };
  const searchOnline = async () => {
    if (!query.trim()) return;
    setOnlineLoading(true); setOnlineError("");
    try { setOnlineTracks(await searchInternetArchive(query)); } catch { setOnlineError("Online search is unavailable right now."); } finally { setOnlineLoading(false); }
  };

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
          <div className="border-t border-ink/15 pt-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl font-bold tracking-[-0.04em]">Your listening space</h2><button onClick={() => setView("library")} className="text-sm font-semibold underline underline-offset-4">Open library</button></div><TrackRow tracks={tracks.slice(0, 4)} current={current} onPlay={play} onFavorite={favorite} empty="Your library is empty. Import music you own to start listening." /></div>
        </section>}
        {view === "library" && <section className="rise pt-10"><PageTitle title="Your library" detail={`${tracks.filter((t) => t.source === "imported" || t.favorite).length} saved tracks`} action={<button onClick={() => fileInput.current?.click()} className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-paper"><Upload size={16} /> Import</button>} /><input ref={fileInput} type="file" accept="audio/*" multiple hidden onChange={(e) => importFiles(e.target.files)} /><TrackRow tracks={filtered} current={current} onPlay={play} onFavorite={favorite} onDelete={removeTrack} empty="Import your first track to start your local library." /></section>}
        {view === "search" && <section className="rise pt-10"><PageTitle title="Find a feeling" detail="Search your local collection or Internet Archive" /><div className="relative mb-3 mt-8"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/45" size={20} /><input onKeyDown={(e) => { if (e.key === "Enter") void searchOnline(); }} autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tracks, artists, albums" className="w-full rounded-2xl border border-ink/15 bg-white/60 py-4 pl-12 pr-4 outline-none ring-lime focus:ring-2" /></div><button onClick={() => void searchOnline()} disabled={onlineLoading || !query.trim()} className="mb-8 rounded-full bg-ink px-4 py-2 text-sm font-bold text-paper disabled:opacity-40">{onlineLoading ? "Searching..." : "Search online"}</button><TrackRow tracks={filtered} current={current} onPlay={play} onFavorite={favorite} empty="Nothing here yet. Try a different search." />{onlineError && <p className="mt-6 text-sm text-ember">{onlineError}</p>}{onlineTracks.length > 0 && <div className="mt-12 border-t border-ink/15 pt-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-2xl font-bold">Internet Archive</h2><span className="text-xs text-ink/45">Open-license sources vary</span></div><TrackRow tracks={onlineTracks} current={current} onPlay={play} onFavorite={favorite} /></div>}</section>}
        {view === "playlists" && <section className="rise pt-10"><PageTitle title="Playlists" detail="Small worlds for every mood" /><div className="mt-8 flex gap-2"><input value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} placeholder="New playlist name" className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white/60 px-4 py-3 outline-none focus:ring-2 focus:ring-lime" /><button onClick={addPlaylist} className="rounded-xl bg-ink px-4 text-paper"><Plus size={20} /></button></div><div className="mt-7 divide-y divide-ink/10">{playlists.length ? playlists.map((playlist) => <div key={playlist.id} className="flex items-center justify-between py-4"><div><p className="font-semibold">{playlist.name}</p><p className="text-sm text-ink/50">{playlist.trackIds.length} tracks</p></div><div className="flex items-center gap-2"><MoreHorizontal size={20} className="text-ink/40" /><button onClick={() => void removePlaylist(playlist)} aria-label={`Delete ${playlist.name}`} className="rounded-full p-2 text-ink/35 hover:bg-ember/10 hover:text-ember"><Trash2 size={17} /></button></div></div>) : <p className="py-14 text-center text-ink/50">Create a playlist when a moment deserves its own place.</p>}</div></section>}
      </div>
      <audio ref={audioRef} onError={() => { setPlaying(false); setPlayerError("This stream could not be played in the browser."); }} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      {playerError && <div role="status" className="fixed bottom-[144px] left-3 right-3 z-20 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-xl border border-ember/30 bg-paper px-4 py-3 text-sm shadow-player"><span>{playerError}</span><button onClick={() => setPlayerError("")} aria-label="Dismiss playback message"><X size={16} /></button></div>}
      {current?.audioUrl && <Player track={current} playing={playing} setPlaying={(value) => { setPlaying(value); if (value) void audioRef.current?.play().catch(() => setPlaying(false)); else audioRef.current?.pause(); }} onNext={() => { const playable = tracks.filter((track) => track.audioUrl); const index = playable.findIndex((track) => track.id === current.id); if (index >= 0) play(playable[(index + 1) % playable.length]); }} onExpand={() => setExpandedPlayer(true)} />}
      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-10 border-t border-ink/10 bg-paper/95 px-5 pt-3 backdrop-blur sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:rounded-t-3xl sm:border-x">
        <div className="mx-auto flex max-w-md items-center justify-between"><NavButton active={view === "home"} icon={<Home size={20} />} label="Home" onClick={() => setView("home")} /><NavButton active={view === "library"} icon={<Library size={20} />} label="Library" onClick={() => setView("library")} /><NavButton active={view === "search"} icon={<Search size={20} />} label="Search" onClick={() => setView("search")} /><NavButton active={view === "playlists"} icon={<ListMusic size={20} />} label="Playlists" onClick={() => setView("playlists")} /></div>
      </nav>
      {showInstall && <div className="fixed inset-0 z-20 grid place-items-center bg-ink/40 p-6"><div className="w-full max-w-sm rounded-3xl bg-paper p-6 shadow-player"><div className="flex justify-between"><h2 className="font-display text-2xl font-bold">Take PYLA with you</h2><button onClick={() => setShowInstall(false)} aria-label="Close"><X size={20} /></button></div><p className="mt-3 leading-7 text-ink/65">On iPhone, tap Share in Safari, then “Add to Home Screen”. Your library stays on this device.</p><button onClick={() => setShowInstall(false)} className="mt-6 w-full rounded-xl bg-ink py-3 font-bold text-paper">Got it</button></div></div>}
      {expandedPlayer && current?.audioUrl && <div className="fixed inset-0 z-30 flex flex-col bg-ink px-6 pb-10 pt-8 text-paper sm:mx-auto sm:max-w-xl"><div className="flex items-center justify-between"><button onClick={() => setExpandedPlayer(false)} aria-label="Minimize player"><X size={24} /></button><span className="text-xs font-bold uppercase tracking-[0.2em] text-paper/50">Now playing</span><MoreHorizontal size={22} className="text-paper/50" /></div><div className="flex flex-1 flex-col justify-center"><div className="mx-auto aspect-square w-full max-w-sm rounded-3xl shadow-player" style={{ background: current.cover }} /><p className="mt-8 font-display text-3xl font-bold tracking-[-0.05em]">{current.title}</p><p className="mt-1 text-paper/55">{current.artist} · {current.album}</p><div className="mt-8 h-1 rounded-full bg-paper/20"><div className="h-1 w-1/3 rounded-full bg-lime" /></div><div className="mt-2 flex justify-between text-xs text-paper/45"><span>0:00</span><span>{current.duration ? formatDuration(current.duration) : "Live source"}</span></div></div><div className="flex items-center justify-center gap-8"><button aria-label="Previous track" className="text-paper/60"><SkipBack size={24} /></button><button onClick={() => { setPlaying(!playing); if (playing) audioRef.current?.pause(); else void audioRef.current?.play(); }} className="grid h-16 w-16 place-items-center rounded-full bg-lime text-ink">{playing ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}</button><button aria-label="Next track" onClick={() => { const playable = tracks.filter((track) => track.audioUrl); const index = playable.findIndex((track) => track.id === current.id); if (index >= 0) play(playable[(index + 1) % playable.length]); }} className="text-paper/60"><SkipForward size={24} /></button></div>{current.sourceUrl && <a href={current.sourceUrl} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 text-sm text-paper/60 underline underline-offset-4">Open source <ExternalLink size={14} /></a>}</div>}
    </main>
  );
}

function PageTitle({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) { return <div className="flex items-end justify-between border-b border-ink/15 pb-5"><div><h1 className="font-display text-5xl font-bold tracking-[-0.07em]">{title}</h1><p className="mt-2 text-sm text-ink/50">{detail}</p></div>{action}</div>; }
function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) { return <button onClick={onClick} className={`flex flex-col items-center gap-1 px-3 text-[11px] font-semibold ${active ? "text-ink" : "text-ink/40"}`}>{icon}<span>{label}</span></button>; }
function TrackRow({ tracks, current, onPlay, onFavorite, onDelete, empty }: { tracks: Track[]; current: Track | null; onPlay: (t: Track) => void; onFavorite: (id: string) => void; onDelete?: (track: Track) => void; empty?: string }) { return <div className="divide-y divide-ink/10">{tracks.length ? tracks.map((track) => <div key={track.id} className="group flex items-center gap-3 py-3">{track.audioUrl ? <button onClick={() => onPlay(track)} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl" style={{ background: track.cover }} aria-label={`Play ${track.title}`}>{current?.id === track.id ? <span className="absolute inset-0 grid place-items-center bg-ink/45 text-lime"><Pause size={18} fill="currentColor" /></span> : <span className="absolute inset-0 grid place-items-center bg-ink/0 text-white opacity-0 transition group-hover:bg-ink/35 group-hover:opacity-100"><Play size={18} fill="currentColor" /></span>}</button> : <div className="h-14 w-14 shrink-0 rounded-xl" style={{ background: track.cover }} aria-hidden="true" />}<div className="min-w-0 flex-1"><p className="truncate font-semibold">{track.title}</p><p className="truncate text-sm text-ink/50">{track.artist} · {track.album}</p>{track.license && <p className="truncate text-xs text-ink/40">License: {track.license}</p>}</div><span className="hidden text-xs text-ink/40 sm:block">{track.duration ? formatDuration(track.duration) : "—"}</span>{onDelete && <button aria-label={`Delete ${track.title}`} onClick={() => onDelete(track)} className="p-2 text-ink/30 hover:text-ember"><Trash2 size={17} /></button>}{track.audioUrl && <><button aria-label="Download track" onClick={() => Object.assign(document.createElement("a"), { href: track.audioUrl, download: `${track.title}.mp3` }).click()} className="hidden p-2 text-ink/30 hover:text-ink sm:block"><Download size={17} /></button><button aria-label={`${track.favorite ? "Remove" : "Add"} ${track.title} favorite`} onClick={() => onFavorite(track.id)} className={`p-2 ${track.favorite ? "text-ember" : "text-ink/30 hover:text-ember"}`}><Heart size={18} fill={track.favorite ? "currentColor" : "none"} /></button></>}</div>) : <p className="py-16 text-center text-ink/50">{empty}</p>}</div>; }
function Player({ track, playing, setPlaying, onNext, onExpand }: { track: Track; playing: boolean; setPlaying: (value: boolean) => void; onNext: () => void; onExpand: () => void }) { return <div className="fixed bottom-[76px] left-3 right-3 z-10 mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-ink p-3 text-paper shadow-player sm:bottom-24"><button onClick={onExpand} className="h-11 w-11 shrink-0 rounded-lg" style={{ background: track.cover }} aria-label="Open now playing" /><button onClick={onExpand} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold">{track.title}</p><p className="truncate text-xs text-paper/55">{track.artist}</p></button><button aria-label="Previous track" className="hidden text-paper/60 sm:block"><SkipBack size={18} /></button><button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"} className="grid h-10 w-10 place-items-center rounded-full bg-lime text-ink">{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button><button onClick={onNext} aria-label="Next track" className="text-paper/60"><SkipForward size={18} /></button><button onClick={onExpand} aria-label="Open now playing" className="hidden text-paper/60 sm:block"><Maximize2 size={17} /></button></div>; }
