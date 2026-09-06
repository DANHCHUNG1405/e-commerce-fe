export default function Loading() {
  return (
    <main
      id="main-content"
      aria-busy="true"
      aria-label="Đang tải trang"
      className="mx-auto min-h-[65vh] max-w-7xl space-y-6 px-5 py-10"
    >
      <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 motion-reduce:animate-none" />
      <div className="h-8 w-64 animate-pulse rounded bg-zinc-200 motion-reduce:animate-none" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-xl border border-zinc-100 bg-white motion-reduce:animate-none"
          />
        ))}
      </div>
      <span className="sr-only" role="status">
        Đang tải nội dung, vui lòng đợi.
      </span>
    </main>
  );
}
