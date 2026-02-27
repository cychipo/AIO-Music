export default function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Good vibes only</h1>
      <p className="text-text-secondary mb-8">What do you want to listen to today?</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Trending</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Placeholder cards */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card-pastel p-4 cursor-pointer hover:shadow-pastel-lg transition-all">
              <div className="w-full aspect-square rounded-xl bg-primary/20 mb-3" />
              <p className="font-semibold text-sm text-text-primary truncate">Track {i + 1}</p>
              <p className="text-xs text-text-muted">Artist</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
