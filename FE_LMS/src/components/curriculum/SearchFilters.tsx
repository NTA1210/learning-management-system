import React from "react";
import { Search } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  sortOption: 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc';
  onSortChange: (value: 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc') => void;
  pageLimit: number;
  onPageLimitChange: (limit: number) => void;
  currentPage: number;
  totalMajors: number;
  onPageChange: (page: number) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  onSearchChange,
  onSearch,
  sortOption,
  onSortChange,
  pageLimit,
  onPageLimitChange,
  currentPage,
  totalMajors,
  onPageChange,
}) => {
  const { darkMode } = useTheme();

  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search majors or specialists..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
          style={{
            backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
            borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
            color: darkMode ? '#ffffff' : '#000000',
          }}
        />
      </div>
      <button
        onClick={onSearch}
        className="p-2 rounded-lg text-white transition-all duration-200 flex items-center justify-center"
        style={{ backgroundColor: darkMode ? '#4c1d95' : '#4f46e5' }}
        onMouseEnter={(e) =>
          ((e.target as HTMLElement).style.backgroundColor = darkMode ? '#5b21b6' : '#4338ca')
        }
        onMouseLeave={(e) =>
          ((e.target as HTMLElement).style.backgroundColor = darkMode ? '#4c1d95' : '#4f46e5')
        }
      >
        <Search size={20} />
      </button>
      
      {/* Sort options */}
      <div className="relative">
        <select
          value={sortOption}
          onChange={e => onSortChange(e.target.value as 'name_asc'|'name_desc'|'date_asc'|'date_desc')}
          className="appearance-none rounded-lg px-4 py-2 pr-10 border focus:outline-none focus:ring-2 transition-colors duration-200 shadow-sm"
          style={{
            width: 120,
            fontWeight: 600,
            background: darkMode ? '#152632' : '#ffffff',
            color: darkMode ? '#ffffff' : '#111827',
            borderColor: darkMode ? '#334155' : '#e5e7eb',
            boxShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 2px rgba(0,0,0,0.06)'
          }}
        >
          <option value="name_asc">A-Z</option>
          <option value="name_desc">Z-A</option>
          <option value="date_asc">Oldest</option>
          <option value="date_desc">Newest</option>
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="currentColor"
            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.062l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
          </svg>
        </span>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-3 mr-3 flex-wrap">
        <div className="relative">
          <select
            value={pageLimit}
            onChange={e => onPageLimitChange(Number(e.target.value))}
            className="appearance-none rounded-lg px-4 py-2 pr-10 border focus:outline-none focus:ring-2 transition-colors duration-200 shadow-sm"
            style={{
              width: 135,
              fontWeight: 600,
              background: darkMode ? '#152632' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              borderColor: darkMode ? '#334155' : '#e5e7eb',
              boxShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 2px rgba(0,0,0,0.06)'
            }}
          >
            {[5, 25, 50, 75, 100].map(l => (
              <option key={l} value={l}>{l} / page</option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.062l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
        <span style={{
          minWidth: 100,
          fontVariantNumeric: 'tabular-nums',
          color: darkMode ? '#e5e7eb' : '#223344'
        }}>
          {`${(pageLimit * (currentPage - 1)) + 1} – ${Math.min(pageLimit * currentPage, totalMajors)} of ${totalMajors}`}
        </span>
        <button
          className="px-4 py-1 rounded border mx-1 disabled:opacity-40"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous page"
          style={{
            background: darkMode ? '#223344' : '#ffffff',
            color: darkMode ? '#fff' : '#223344',
            borderColor: darkMode ? '#334155' : '#e5e7eb'
          }}
        >&#x2039;</button>
        <button
          className="px-4 py-1 rounded border mx-1 disabled:opacity-40"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={(pageLimit * currentPage) >= totalMajors}
          title="Next page"
          style={{
            background: darkMode ? '#223344' : '#ffffff',
            color: darkMode ? '#fff' : '#223344',
            borderColor: darkMode ? '#334155' : '#e5e7eb'
          }}
        >&#x203A;</button>
      </div>
    </div>
  );
};

export default SearchFilters;

