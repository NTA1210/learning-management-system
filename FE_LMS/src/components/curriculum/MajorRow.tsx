import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import ActionMenu from "./ActionMenu";
import SpecialistRow from "./SpecialistRow";
import type { MajorNode } from "../../types/curriculum";

interface MajorRowProps {
  major: MajorNode;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onLoadSpecialists: () => void;
  openActionMenu: string | null;
  onActionMenuToggle: (id: string) => void;
  onActionMenuClose: () => void;
  onAddSpecialist: () => void;
  expandedSpecialists: Set<string>;
  expandedSubjects: Set<string>;
  onToggleSpecialist: (specialistId: string) => void;
  onToggleSubject: (specialistId: string, subjectId: string) => void;
  onLoadSubjects: (specialistId: string) => void;
  onLoadCourses: (specialistId: string, subjectId: string) => void;
  onEditSpecialist: (specialistId: string) => void;
  onDeleteSpecialist: (specialistId: string) => void;
}

const MajorRow: React.FC<MajorRowProps> = ({
  major,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onLoadSpecialists,
  openActionMenu,
  onActionMenuToggle,
  onActionMenuClose,
  onAddSpecialist,
  expandedSpecialists,
  expandedSubjects,
  onToggleSpecialist,
  onToggleSubject,
  onLoadSubjects,
  onLoadCourses,
  onEditSpecialist,
  onDeleteSpecialist,
}) => {
  const { darkMode } = useTheme();
  const specialistList = major.specialists || [];

  return (
    <>
      {/* Major row */}
      <tr
        style={{
          backgroundColor: darkMode ? "#1f2937" : "#ffffff",
          borderBottom: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
        }}
      >
        <td style={{ padding: "12px 16px" }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            style={{ width: "16px", height: "16px", cursor: "pointer" }}
          />
        </td>
        <td style={{ padding: "12px 16px" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={onToggle}
              className="flex items-center justify-center rounded-full transition-all"
              style={{
                width: "28px",
                height: "28px",
                backgroundColor: darkMode ? "#4c1d95" : "#4f46e5",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
              }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <div>
              <p style={{ fontWeight: 600, color: darkMode ? "#ffffff" : "#111827", fontSize: "14px" }}>{major.name}</p>
              <p style={{ color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "12px" }}>{major.slug}</p>
            </div>
          </div>
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
          {major.description || "-"}
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
          {major.updatedAt ? new Date(major.updatedAt).toLocaleDateString("en-GB") : "-"}
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
          {major.createdAt ? new Date(major.createdAt).toLocaleDateString("en-GB") : "-"}
        </td>
        <td style={{ padding: "12px 16px" }}>
          <div className="flex items-center gap-2">
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
              }}
            />
            <span style={{ color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>Active</span>
          </div>
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center" }}>
          <ActionMenu
            isOpen={openActionMenu === `major-${major._id}`}
            onToggle={() => onActionMenuToggle(`major-${major._id}`)}
            onClose={onActionMenuClose}
            type="major"
            onAddSpecialist={onAddSpecialist}
            onReload={onLoadSpecialists}
          />
        </td>
      </tr>

      {/* Specialist rows */}
      {isExpanded && (
        <>
          {major.specialistsLoading && (
            <tr>
              <td />
              <td colSpan={6} style={{ padding: "12px 16px", color: darkMode ? "#d1d5db" : "#374151" }}>
                Loading specialists...
              </td>
            </tr>
          )}

          {major.specialistsError && !major.specialistsLoading && (
            <tr>
              <td />
              <td colSpan={6} style={{ padding: "12px 16px", color: darkMode ? "#fecaca" : "#b91c1c" }}>
                Failed to load specialists: {major.specialistsError}
                <button
                  className="ml-3 px-3 py-1 rounded text-white text-sm"
                  style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
                  onClick={onLoadSpecialists}
                >
                  Retry
                </button>
              </td>
            </tr>
          )}

          {!major.specialistsLoading && !major.specialistsError && (
            <>
              {specialistList.length === 0 ? (
                <tr>
                  <td />
                  <td colSpan={6} style={{ padding: "12px 16px", paddingLeft: "56px", color: darkMode ? "#9ca3af" : "#6b7280", fontStyle: "italic" }}>
                    No specialists for this major.
                  </td>
                </tr>
              ) : (
                specialistList.map((specialist) => {
                  const specialistExpanded = expandedSpecialists.has(specialist._id);
                  return (
                    <SpecialistRow
                      key={specialist._id}
                      specialist={specialist}
                      isExpanded={specialistExpanded}
                      onToggle={() => onToggleSpecialist(specialist._id)}
                      onLoadSubjects={() => onLoadSubjects(specialist._id)}
                      openActionMenu={openActionMenu}
                      onActionMenuToggle={onActionMenuToggle}
                      onActionMenuClose={onActionMenuClose}
                      onEdit={() => onEditSpecialist(specialist._id)}
                      onDelete={() => onDeleteSpecialist(specialist._id)}
                      expandedSubjects={expandedSubjects}
                      onToggleSubject={(specialistId, subjectId) => onToggleSubject(specialistId, subjectId)}
                      onLoadCourses={(subjectId) => onLoadCourses(specialist._id, subjectId)}
                    />
                  );
                })
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default MajorRow;

