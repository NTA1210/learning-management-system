interface QuizPaginationProps {
  currentPage: number;
  totalPages: number;
  textColor: string;
  borderColor: string;
  hasPrev: boolean;
  hasNext: boolean;
  pageOptions: number[];
  onPrev: () => void;
  onNext: () => void;
  onSelectPage: (page: number) => void;
}

export function QuizPagination({
  currentPage,
  totalPages,
  textColor,
  borderColor,
  hasPrev,
  hasNext,
  pageOptions,
  onPrev,
  onNext,
  onSelectPage,
}: QuizPaginationProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-8 mb-12">
      <p className="text-sm" style={{ color: textColor }}>
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex flex-wrap gap-2 justify-center items-center">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="px-3 py-1.5 rounded-lg border transition-colors"
          style={{
            borderColor: borderColor,
            color: hasPrev ? textColor : "#94a3b8",
            opacity: hasPrev ? 1 : 0.4,
          }}
        >
          Previous
        </button>
        {pageOptions.map((page) => (
          <button
            key={`pagination-${page}`}
            onClick={() => onSelectPage(page)}
            className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
              currentPage === page ? "bg-indigo-500 text-white" : ""
            }`}
            style={{
              borderColor: borderColor,
              color: currentPage === page ? "#ffffff" : textColor,
            }}
          >
            {page}
          </button>
        ))}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="px-3 py-1.5 rounded-lg border transition-colors"
          style={{
            borderColor: borderColor,
            color: hasNext ? textColor : "#94a3b8",
            opacity: hasNext ? 1 : 0.4,
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}





