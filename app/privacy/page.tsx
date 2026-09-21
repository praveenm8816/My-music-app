export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-paper px-6 py-10 text-ink">
      <div className="mx-auto max-w-2xl">
        <a href="/" className="font-display text-sm font-bold tracking-[0.18em]">← PYLA</a>
        <h1 className="mt-16 font-display text-5xl font-bold tracking-[-0.05em]">Privacy, plainly.</h1>
        <p className="mt-6 text-lg leading-8 text-ink/70">PYLA keeps your local library on your device. We do not sell your listening history or audio files.</p>
        <h2 className="mt-12 font-display text-2xl font-bold">Local-first by design</h2>
        <p className="mt-3 leading-7 text-ink/70">Imported audio, favorites, playlists, and recent plays use IndexedDB in your browser. If you connect Supabase, account data syncs according to your project’s policies.</p>
        <h2 className="mt-10 font-display text-2xl font-bold">Legal sources</h2>
        <p className="mt-3 leading-7 text-ink/70">PYLA does not provide copyrighted music. The legal-provider interface is ready for providers you are authorized to use.</p>
      </div>
    </main>
  );
}
