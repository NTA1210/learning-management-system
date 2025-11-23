import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface SearchableSelectProps {
  value: string;
  options: { _id: string; title: string }[];
  placeholder?: string;
  darkMode: boolean;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  options,
  placeholder = "Select an option",
  darkMode,
  onChange,
  required = false,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt._id === value);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        const option = filteredOptions[highlightedIndex];
        if (option) {
          onChange(option._id);
          setIsOpen(false);
          setSearchTerm("");
          setHighlightedIndex(-1);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredOptions, highlightedIndex, onChange]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 rounded-lg border text-left flex items-center justify-between"
          style={{
            backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
            borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
            color: darkMode ? "#ffffff" : "#000000",
          }}
        >
          <span className={selectedOption ? "" : "text-gray-400"}>
            {selectedOption ? selectedOption.title : placeholder}
          </span>
          <div className="flex items-center gap-2">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded hover:bg-opacity-20"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown
              size={16}
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
              style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
            />
          </div>
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 rounded-lg border shadow-lg overflow-hidden"
            style={{
              backgroundColor: darkMode ? "rgba(31, 41, 55, 0.95)" : "#ffffff",
              borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {/* Search input */}
            <div className="sticky top-0 p-2 border-b" style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb", backgroundColor: darkMode ? "rgba(31, 41, 55, 0.95)" : "#ffffff" }}>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  placeholder="Search courses..."
                  className="w-full pl-9 pr-3 py-2 rounded border text-sm"
                  style={{
                    backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#f9fafb",
                    borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                    color: darkMode ? "#ffffff" : "#000000",
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options list */}
            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-center" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                  No courses found
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option._id}
                    type="button"
                    onClick={() => handleSelect(option._id)}
                    className="w-full px-4 py-2 text-left text-sm transition-colors"
                    style={{
                      backgroundColor:
                        option._id === value
                          ? darkMode ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.1)"
                          : highlightedIndex === index
                          ? darkMode ? "rgba(75, 85, 99, 0.3)" : "#f3f4f6"
                          : "transparent",
                      color: darkMode ? "#ffffff" : "#1f2937",
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {option.title}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;

