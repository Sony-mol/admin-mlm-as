import React from 'react';

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="pagination-modern">
      <div className="text-sm opacity-70 mr-auto">
        Page <span className="font-semibold text-gradient">{page}</span> of <span className="font-semibold">{totalPages}</span> • <span className="font-semibold">{Math.min(pageSize, Math.max(0, total - (page - 1) * pageSize))}</span> of <span className="font-semibold">{total}</span> items
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onPageChange(1)} disabled={!canPrev}>First</button>
        <button onClick={() => onPageChange(page - 1)} disabled={!canPrev}>Prev</button>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={page}
          onChange={(e) => onPageChange(Math.min(totalPages, Math.max(1, Number(e.target.value) || 1)))}
          className="w-16 px-2 py-1 rounded-lg border-2 border-primary bg-gradient-to-r from-blue-50 to-purple-50 text-center font-semibold text-primary"
        />
        <button onClick={() => onPageChange(page + 1)} disabled={!canNext}>Next</button>
        <button onClick={() => onPageChange(totalPages)} disabled={!canNext}>Last</button>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="modern-select ml-2"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n}/page</option>
          ))}
        </select>
      </div>
    </div>
  );
}


