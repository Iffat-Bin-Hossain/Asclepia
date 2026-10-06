'use client';

import { Pagination } from '@/types';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlProps {
  pagination?: Pagination;
  onPageChange: (newPage: number) => void;
  itemLabel?: string;
}

export default function PaginationControl({
  pagination,
  onPageChange,
  itemLabel = 'items',
}: PaginationControlProps) {
  if (!pagination || pagination.total === 0) return null;

  const { page, limit, total, totalPages, hasNextPage, hasPrevPage } = pagination;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '16px',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '6px 4px',
      }}
    >
      {/* Left: Fixed chunk summary, e.g. "Showing 1–2 of 2 doctors" */}
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        Showing <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{startItem}</span>–
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{endItem}</span> of{' '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{total}</span> {itemLabel}
      </p>

      {/* Right: Clean Page Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onPageChange(1)}
            disabled={!hasPrevPage}
            className="btn btn-secondary btn-sm"
            style={{ width: '30px', height: '30px', padding: 0 }}
            title="First Page"
          >
            <ChevronsLeft size={13} />
          </button>

          <button
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage}
            className="btn btn-secondary btn-sm"
            style={{ width: '30px', height: '30px', padding: 0 }}
            title="Previous Page"
          >
            <ChevronLeft size={13} />
          </button>

          <div style={{ display: 'flex', gap: '4px' }}>
            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    style={{
                      padding: '0 4px',
                      lineHeight: '30px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    …
                  </span>
                );
              }
              const isActive = p === page;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  className={isActive ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                  style={{
                    minWidth: '30px',
                    height: '30px',
                    padding: '0 6px',
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage}
            className="btn btn-secondary btn-sm"
            style={{ width: '30px', height: '30px', padding: 0 }}
            title="Next Page"
          >
            <ChevronRight size={13} />
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNextPage}
            className="btn btn-secondary btn-sm"
            style={{ width: '30px', height: '30px', padding: 0 }}
            title="Last Page"
          >
            <ChevronsRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
