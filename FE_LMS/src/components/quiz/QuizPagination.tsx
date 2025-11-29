interface QuizPaginationProps {
  currentPage: number;
  totalPages: number;
  textColor: string;
  borderColor: string;
  hasPrev: boolean;
  hasNext: boolean;
  pageOptions: number[];
  onPrev: (page?: number, queryValue?: string) => void;
  onNext: (page?: number, queryValue?: string) => void;
  onSelectPage: (page: number, queryValue?: string) => void;
  sendStringParams?: boolean;
}

const wrapPageValue = (page: number) => `"${page}"`;

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
  sendStringParams = false,
}: QuizPaginationProps) {
  const buildQueryValue = (page: number) => (sendStringParams ? wrapPageValue(page) : undefined);

  const handlePrev = () => {
    if (!hasPrev) return;
    const targetPage = Math.max(1, currentPage - 1);
    onPrev?.(targetPage, buildQueryValue(targetPage));
  };

  const handleNext = () => {
    if (!hasNext) return;
    const targetPage = Math.min(totalPages, currentPage + 1);
    onNext?.(targetPage, buildQueryValue(targetPage));
  };

  const handleSelect = (page: number) => {
    onSelectPage(page, buildQueryValue(page));
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-8 mb-12">
      <p className="text-sm" style={{ color: textColor }}>
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex flex-wrap gap-2 justify-center items-center">
        <button
          onClick={handlePrev}
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
            onClick={() => handleSelect(page)}
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
          onClick={handleNext}
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





