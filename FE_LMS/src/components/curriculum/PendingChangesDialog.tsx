import React, { useState } from "react";
import { Check, RotateCcw, RotateCw, Trash2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

interface PendingMove {
  id: string;
  type: 'specialist' | 'subject';
  itemName: string;
  itemCode?: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  timestamp: number;
}

interface PendingChangesDialogProps {
  pendingMoves: PendingMove[];
  onApply: () => void;
  onDiscard: () => void;
  onRemoveMove: (moveId: string, moveType: 'specialist' | 'subject') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  loading?: boolean;
}

const PendingChangesDialog: React.FC<PendingChangesDialogProps> = ({
  pendingMoves,
  onApply,
  onDiscard,
  onRemoveMove,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  loading = false,
}) => {
  const { darkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  if (pendingMoves.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 transition-all duration-300"
      style={{
        maxWidth: "500px",
      }}
    >
      {/* Collapsible Panel */}
      <div
        className="rounded-lg shadow-lg overflow-hidden transition-all duration-300 flex flex-col"
        style={{
          backgroundColor: darkMode ? "#1f2937" : "#ffffff",
          border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid #e5e7eb",
          maxHeight: isExpanded ? "500px" : "auto",
          width: "450px",
        }}
      >
        {/* Header with Action Buttons */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{
            borderColor: darkMode ? "#374151" : "#e5e7eb",
          }}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <AlertCircle size={20} style={{ color: darkMode ? "#f59e0b" : "#f59e0b" }} />
              <span
                className="absolute -top-2 -right-2 flex items-center justify-center rounded-full text-xs font-bold"
                style={{
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  width: "20px",
                  height: "20px",
                }}
              >
                {pendingMoves.length}
              </span>
            </div>
            <span
              className="font-semibold"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              Pending Changes
            </span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onUndo}
              disabled={!canUndo || loading}
              className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: darkMode ? "#374151" : "#f3f4f6",
                color: darkMode ? "#9ca3af" : "#6b7280",
              }}
              title="Undo last change"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo || loading}
              className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: darkMode ? "#374151" : "#f3f4f6",
                color: darkMode ? "#9ca3af" : "#6b7280",
              }}
              title="Redo last undone change"
            >
              <RotateCw size={18} />
            </button>
            <button
              onClick={onDiscard}
              disabled={loading}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: darkMode ? "#4b5563" : "#e5e7eb",
                color: darkMode ? "#e5e7eb" : "#111827",
              }}
              title="Discard all changes"
            >
              Discard
            </button>
            <button
              onClick={onApply}
              disabled={loading || pendingMoves.length === 0}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-1.5"
              style={{ backgroundColor: darkMode ? "#047857" : "#16a34a", color: "#ffffff" }}
              title="Apply all changes"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Applying...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Apply
                </>
              )}
            </button>
          </div>
        </div>

        {/* Expand/Collapse Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between p-3 border-b cursor-pointer hover:bg-opacity-50 transition-colors"
          style={{
            borderColor: darkMode ? "#374151" : "#e5e7eb",
            backgroundColor: darkMode ? "rgba(55, 65, 81, 0.3)" : "rgba(243, 244, 246, 0.5)",
          }}
        >
          <span
            className="text-sm font-medium"
            style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}
          >
            {isExpanded ? "Hide" : "Show"} Changes List ({pendingMoves.length})
          </span>
          {isExpanded ? (
            <ChevronDown size={18} style={{ color: darkMode ? "#d1d5db" : "#6b7280" }} />
          ) : (
            <ChevronRight size={18} style={{ color: darkMode ? "#d1d5db" : "#6b7280" }} />
          )}
        </button>

        {/* Expandable Change List */}
        {isExpanded && (
          <div
            className="overflow-y-auto p-3"
            style={{
              backgroundColor: darkMode ? "#111827" : "#f9fafb",
              maxHeight: "400px",
            }}
          >
            <div
              className="rounded-lg border"
              style={{
                backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                borderColor: darkMode ? "#374151" : "#e5e7eb",
              }}
            >
              {pendingMoves.map((move) => (
                <div
                  key={`${move.id}-${move.timestamp}`}
                  className="flex items-center justify-between p-3 border-b last:border-b-0"
                  style={{
                    borderColor: darkMode ? "#374151" : "#e5e7eb",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
                        style={{
                          backgroundColor: move.type === 'specialist' 
                            ? (darkMode ? "#1e3a8a" : "#dbeafe")
                            : (darkMode ? "#7c2d12" : "#fed7aa"),
                          color: move.type === 'specialist'
                            ? (darkMode ? "#93c5fd" : "#1e40af")
                            : (darkMode ? "#fdba74" : "#92400e"),
                        }}
                      >
                        {move.type === 'specialist' ? 'Specialist' : 'Subject'}
                      </span>
                      <span
                        className="font-medium truncate"
                        style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                        title={move.itemName + (move.itemCode ? ` (${move.itemCode})` : '')}
                      >
                        {move.itemName}
                        {move.itemCode && ` (${move.itemCode})`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                        <span className="font-medium">{move.fromName}</span>
                      </span>
                      <span style={{ color: darkMode ? "#6b7280" : "#9ca3af" }}>→</span>
                      <span style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                        <span className="font-medium">{move.toName}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveMove(move.id, move.type)}
                    disabled={loading}
                    className="p-1.5 rounded-lg transition-all duration-200 hover:bg-red-100 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed ml-3 flex-shrink-0"
                    style={{
                      color: darkMode ? "#fca5a5" : "#dc2626",
                    }}
                    title="Remove this change"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingChangesDialog;

