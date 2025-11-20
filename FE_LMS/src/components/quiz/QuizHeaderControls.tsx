import type { ChangeEvent } from "react";
import type { Subject } from "../../services";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface QuizPaginationInfo {
  hasPrev: boolean;
  hasNext: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

interface QuizHeaderControlsProps {
  startItem: number;
  endItem: number;
  totalQuestions: number;
  subjectInfo: Subject | null;
  textColor: string;
  darkMode: boolean;
  borderColor: string;
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  paginationInfo: QuizPaginationInfo;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function QuizHeaderControls({
  startItem,
  endItem,
  totalQuestions,
  subjectInfo,
  textColor,
  darkMode,
  borderColor,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  paginationInfo,
  onPrevPage,
  onNextPage,
}: QuizHeaderControlsProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
      <div className="space-y-1 text-left w-full md:flex-1">
        <p className="text-sm font-medium" style={{ color: textColor }}>
          Showing{" "}
          <span className="font-semibold">
            {startItem} - {endItem}
          </span>{" "}
          of <span className="font-semibold">{totalQuestions}</span> questions
        </p>
        {subjectInfo && (
          <p className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>
            Subject: {subjectInfo.code ? `${subjectInfo.code} · ` : ""}
            {subjectInfo.name}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3 w-full sm:flex-row sm:items-center sm:gap-4 sm:justify-end md:w-auto">
        <div className="flex flex-col gap-1 w-full sm:w-44">
          <label className="text-sm" style={{ color: textColor }}>
            Rows per page
          </label>
          <select
            value={pageSize}
            onChange={onPageSizeChange}
            className="rounded-lg border px-3 py-1 bg-transparent w-full"
            style={{ borderColor: borderColor, color: textColor }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size} className="bg-slate-900 text-white">
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 self-start md:self-auto md:mt-[23px]">
          <button
            onClick={onPrevPage}
            disabled={!paginationInfo.hasPrev}
            className="p-2 rounded-lg border transition-colors"
            style={{
              borderColor: borderColor,
              color: paginationInfo.hasPrev ? textColor : "#94a3b8",
              opacity: paginationInfo.hasPrev ? 1 : 0.4,
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm" style={{ color: textColor }}>
            Page {paginationInfo.currentPage} / {paginationInfo.totalPages}
          </span>
          <button
            onClick={onNextPage}
            disabled={!paginationInfo.hasNext}
            className="p-2 rounded-lg border transition-colors"
            style={{
              borderColor: borderColor,
              color: paginationInfo.hasNext ? textColor : "#94a3b8",
              opacity: paginationInfo.hasNext ? 1 : 0.4,
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

