export default function Pagination({ page, totalPages, onChange, total }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-6 text-sm">
      <button
        className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </button>
      <span className="text-gray-600">
        Page {page} of {totalPages} · {total} results
      </span>
      <button
        className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
