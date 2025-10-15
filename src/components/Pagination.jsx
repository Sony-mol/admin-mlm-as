import React from 'react';

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const btn = "px-3 py-1 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)] disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between mt-4">
      <div className="text-sm opacity-70">
        Page {page} of {totalPages} • Showing {Math.min(pageSize, Math.max(0, total - (page - 1) * pageSize))} of {total} items
      </div>
      <div className="flex items-center gap-2">
        <button className={btn} onClick={() => onPageChange(1)} disabled={!canPrev}>First</button>
        <button className={btn} onClick={() => onPageChange(page - 1)} disabled={!canPrev}>Prev</button>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={page}
          onChange={(e) => onPageChange(Math.min(totalPages, Math.max(1, Number(e.target.value) || 1)))}
          className="w-16 px-2 py-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-center"
        />
        <button className={btn} onClick={() => onPageChange(page + 1)} disabled={!canNext}>Next</button>
        <button className={btn} onClick={() => onPageChange(totalPages)} disabled={!canNext}>Last</button>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="ml-2 px-2 py-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n}/page</option>
          ))}
        </select>
      </div>
    </div>
  );
}


