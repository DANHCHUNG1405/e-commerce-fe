"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui";
export function Pagination({
  page,
  hasNext,
  busy,
  onChange,
}: {
  page: number;
  hasNext: boolean;
  busy?: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <nav aria-label="Phân trang" className="mt-8 flex items-center justify-center gap-4">
      <Button
        variant="secondary"
        aria-label="Trang trước"
        disabled={page <= 1 || busy}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={17} />
        <span className="hidden sm:inline">Trước</span>
      </Button>
      <span aria-live="polite" className="text-sm text-zinc-500">
        Trang <strong className="rounded-lg bg-orange-50 px-3 py-2 text-orange-700">{page}</strong>
      </span>
      <Button
        variant="secondary"
        aria-label="Trang tiếp theo"
        disabled={!hasNext || busy}
        onClick={() => onChange(page + 1)}
      >
        <span className="hidden sm:inline">Tiếp</span>
        <ChevronRight size={17} />
      </Button>
    </nav>
  );
}
