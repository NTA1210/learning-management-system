import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import ActionMenu from "./ActionMenu";
import SubjectRow from "./SubjectRow";
import type { SpecialistNode } from "../../types/curriculum";

interface SpecialistRowProps {
  specialist: SpecialistNode;
  isExpanded: boolean;
  onToggle: () => void;
  onLoadSubjects: () => void;
  openActionMenu: string | null;
  onActionMenuToggle: (id: string) => void;
  onActionMenuClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  expandedSubjects: Set<string>;
  onToggleSubject: (specialistId: string, subjectId: string) => void;
  onLoadCourses: (subjectId: string) => void;
}

const SpecialistRow: React.FC<SpecialistRowProps> = ({
  specialist,
  isExpanded,
  onToggle,
  onLoadSubjects,
  openActionMenu,
  onActionMenuToggle,
  onActionMenuClose,
  onEdit,
  onDelete,
  expandedSubjects,
  onToggleSubject,
  onLoadCourses,
}) => {
  const { darkMode } = useTheme();
  const subjects = specialist.subjects || [];

  return (
    <>
      <tr
        style={{
          backgroundColor: darkMode ? "#1f2937" : "#ffffff",
          borderBottom: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
        }}
      >
        <td />
        <td style={{ padding: "12px 16px" }}>
          <div className="flex items-center" style={{ position: "relative", paddingLeft: "32px" }}>
            <div
              style={{
                position: "absolute",
                left: "13px",
                top: "-12px",
                bottom: "50%",
                width: "2px",
                backgroundColor: darkMode ? "#4c1d95" : "#4f46e5",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "13px",
                top: "50%",
                height: "2px",
                width: "16px",
                backgroundColor: darkMode ? "#4c1d95" : "#4f46e5",
              }}
            />
            <button
              onClick={onToggle}
              className="flex items-center justify-center rounded-full transition-all mr-3"
              style={{
                width: "28px",
                height: "28px",
                backgroundColor: darkMode ? "#0f172a" : "#e0e7ff",
                color: darkMode ? "#f8fafc" : "#1d4ed8",
                border: "none",
                cursor: "pointer",
              }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <div>
              <p style={{ color: darkMode ? "#d1d5db" : "#111827", fontWeight: 500 }}>{specialist.name}</p>
              <p style={{ color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "12px" }}>{specialist.slug}</p>
            </div>
          </div>
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
          {specialist.description || "-"}
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
          {new Date(specialist.updatedAt).toLocaleDateString("en-GB")}
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
          {new Date(specialist.createdAt).toLocaleDateString("en-GB")}
        </td>
        <td style={{ padding: "12px 16px" }}>
          <div className="flex items-center gap-2">
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: specialist.isActive ? "#10b981" : "#9ca3af",
              }}
            />
            <span style={{ color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
              {specialist.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center" }}>
          <ActionMenu
            isOpen={openActionMenu === specialist._id}
            onToggle={() => onActionMenuToggle(specialist._id)}
            onClose={onActionMenuClose}
            type="specialist"
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </td>
      </tr>

      {/* Subject rows */}
      {isExpanded && (
        <>
          {specialist.subjectsLoading && (
            <tr>
              <td />
              <td colSpan={6} style={{ padding: "12px 16px", paddingLeft: "80px", color: darkMode ? "#d1d5db" : "#374151" }}>
                Loading subjects...
              </td>
            </tr>
          )}

          {specialist.subjectsError && !specialist.subjectsLoading && (
            <tr>
              <td />
              <td colSpan={6} style={{ padding: "12px 16px", paddingLeft: "80px", color: darkMode ? "#fecaca" : "#b91c1c" }}>
                Failed to load subjects: {specialist.subjectsError}
                <button
                  className="ml-3 px-3 py-1 rounded text-white text-sm"
                  style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
                  onClick={onLoadSubjects}
                >
                  Retry
                </button>
              </td>
            </tr>
          )}

          {!specialist.subjectsLoading && !specialist.subjectsError && (
            <>
              {subjects.length === 0 ? (
                <tr>
                  <td />
                  <td colSpan={6} style={{ padding: "12px 16px", paddingLeft: "100px", color: darkMode ? "#9ca3af" : "#6b7280", fontStyle: "italic" }}>
                    No subjects linked with this specialist.
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => {
                  const subjectExpanded = expandedSubjects.has(subject._id);
                  return (
                    <SubjectRow
                      key={subject._id}
                      subject={subject}
                      isExpanded={subjectExpanded}
                      onToggle={() => onToggleSubject(specialist._id, subject._id)}
                      onLoadCourses={() => onLoadCourses(subject._id)}
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

export default SpecialistRow;

