import React from 'react';
import { 
  Pagination as UIPagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
  Button
} from '@/components/ui';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Composant de pagination réutilisable, stylé comme le design existant
export const PaginationControls: React.FC<PaginationControlsProps> = ({ page, totalPages, onPageChange }) => {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const visiblePages = () => {
    // Génère une petite fenêtre autour de la page active: 1 ... p-1 p p+1 ... N
    const pages: number[] = [];
    const add = (p: number) => {
      if (p >= 1 && p <= totalPages && !pages.includes(p)) pages.push(p);
    };
    add(1);
    add(page - 1);
    add(page);
    add(page + 1);
    add(totalPages);
    return pages.sort((a, b) => a - b);
  };

  const pages = visiblePages();

  return (
    <div className="sticky bottom-4 z-10">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200 shadow-lg p-2 inline-block mx-auto">
        <UIPagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  if (canPrev) onPageChange(page - 1);
                }}
                className={!canPrev ? 'pointer-events-none opacity-50' : ''}
                href="#"
              />
            </PaginationItem>

            {pages.map((p, idx) => {
              const prev = pages[idx - 1];
              const showEllipsis = prev && p - prev > 1;
              return (
                <React.Fragment key={p}>
                  {showEllipsis && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(p);
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                </React.Fragment>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  if (canNext) onPageChange(page + 1);
                }}
                className={!canNext ? 'pointer-events-none opacity-50' : ''}
                href="#"
              />
            </PaginationItem>
          </PaginationContent>
        </UIPagination>
      </div>
    </div>
  );
};

export default PaginationControls;



