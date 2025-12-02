import React from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import ActionMenu from "./ActionMenu";
import SpecialistRow from "./SpecialistRow";
import InfoCard from "./InfoCard";
import type { MajorNode, SpecialistNode, SubjectNode } from "../../types/curriculum";

interface MajorRowProps {
  major: MajorNode;
  isExpanded: boolean;
  onToggle: () => void;
  onLoadSpecialists: () => void;
  openActionMenu: string | null;
  onActionMenuToggle: (id: string) => void;
  onActionMenuClose: () => void;
  onAddSpecialist: () => void;
  onEditMajor: () => void;
  onDeleteMajor: () => void;
  expandedSpecialists: Set<string>;
  expandedSubjects: Set<string>;
  onToggleSpecialist: (specialistId: string) => void;
  onToggleSubject: (specialistId: string, subjectId: string) => void;
  onLoadSubjects: (specialistId: string) => void;
  onLoadCourses: (specialistId: string, subjectId: string) => void;
  onAddSubject: (specialist: SpecialistNode) => void;
  onEditSubject: (specialist: SpecialistNode, subject: SubjectNode) => void;
  onDeleteSubject: (specialist: SpecialistNode, subject: SubjectNode) => void;
  onEditSpecialist: (specialistId: string) => void;
  onDeleteSpecialist: (specialistId: string) => void;
  // Course CRUD props
  onAddCourse?: (subject: SubjectNode, major: MajorNode, specialist: SpecialistNode) => void;
  onEditCourse?: (course: any, subject: SubjectNode, major: MajorNode, specialist: SpecialistNode) => void;
  onDeleteCourse?: (course: any, subject: SubjectNode, major: MajorNode, specialist: SpecialistNode) => void;
  // Info card props
  onShowInfo?: (type: "major" | "specialist" | "subject" | "course", data: any, element: HTMLElement) => void;
  openInfoId?: string | null;
  onCloseInfo?: () => void;
  // Drag and Drop props
  onDragStart: (type: 'specialist' | 'subject', id: string, data: any) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, targetType: 'major' | 'specialist', targetId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetType: 'major' | 'specialist', targetId: string) => void;
  draggedItem: { type: 'specialist' | 'subject'; id: string; data: any } | null;
  dropTarget: { type: 'major' | 'specialist'; id: string } | null;
  isDragging: boolean;
  pendingMoves: Array<{
    id: string;
    type: 'specialist' | 'subject';
    itemName: string;
    itemCode?: string;
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    timestamp: number;
  }>;
}

const MajorRow: React.FC<MajorRowProps> = ({
  major,
  isExpanded,
  onToggle,
  onLoadSpecialists,
  openActionMenu,
  onActionMenuToggle,
  onActionMenuClose,
  onAddSpecialist,
  onEditMajor,
  onDeleteMajor,
  expandedSpecialists,
  expandedSubjects,
  onToggleSpecialist,
  onToggleSubject,
  onLoadSubjects,
  onLoadCourses,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onEditSpecialist,
  onDeleteSpecialist,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onShowInfo,
  openInfoId,
  onCloseInfo,
  // Drag and Drop props
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  draggedItem,
  dropTarget,
  isDragging,
  pendingMoves,
}) => {
  const { darkMode } = useTheme();
  const specialistList = major.specialists || [];

  // Helper to truncate long text
  const truncateText = (text: string | undefined, maxLength: number = 100) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const isDropTarget = dropTarget?.type === 'major' && dropTarget.id === major._id;
  const canAcceptDrop = draggedItem?.type === 'specialist';

  return (
    <>
      {/* Major row */}
      <tr
        style={{
          backgroundColor: isDropTarget && canAcceptDrop
            ? (darkMode ? "#065f46" : "#d1fae5")
            : (darkMode ? "#1f2937" : "#ffffff"),
          borderBottom: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
          border: isDropTarget && canAcceptDrop
            ? `2px dashed ${darkMode ? "#10b981" : "#059669"}`
            : undefined,
          display: openInfoId === `major-${major._id}` ? "none" : "table-row",
        }}
        onDragOver={canAcceptDrop ? (e) => onDragOver(e, 'major', major._id) : undefined}
        onDragLeave={canAcceptDrop ? onDragLeave : undefined}
        onDrop={canAcceptDrop ? (e) => onDrop(e, 'major', major._id) : undefined}
      >
        <td style={{ padding: "12px 16px" }}>

        </td>
        <td style={{ padding: "12px 16px" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={onToggle}
              className="flex items-center justify-center rounded-full transition-all"
              style={{
                width: "28px",
                height: "28px",
                flexShrink: 0,
                backgroundColor: darkMode ? "#4c1d95" : "#4f46e5",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
              }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <p style={{ fontWeight: 600, color: darkMode ? "#ffffff" : "#111827", fontSize: "14px", margin: 0 }}>{major.name}</p>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#10b981",
                    flexShrink: 0,
                  }}
                  title="Active"
                />
              </div>
              <p style={{ color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "12px", margin: "2px 0 0 0" }}>{truncateText(major.description)}</p>
            </div>
          </div>
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
          {major.updatedAt ? new Date(major.updatedAt).toLocaleDateString("en-GB") : "-"}
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
          {major.createdAt ? new Date(major.createdAt).toLocaleDateString("en-GB") : "-"}
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
          -
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
          -
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center" }}>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                if (onShowInfo) {
                  onShowInfo("major", major, e.currentTarget);
                }
              }}
              className="p-1 rounded hover:bg-opacity-20 transition-colors"
              style={{
                color: darkMode ? "#9ca3af" : "#6b7280",
                cursor: "pointer",
              }}
              title="Show details"
            >
              <Info size={16} />
            </button>
            <ActionMenu
              isOpen={openActionMenu === `major-${major._id}`}
              onToggle={() => onActionMenuToggle(`major-${major._id}`)}
              onClose={onActionMenuClose}
              type="major"
              onAddSpecialist={onAddSpecialist}
              onReload={onLoadSpecialists}
              onEdit={onEditMajor}
              onDelete={onDeleteMajor}
            />
          </div>
        </td>
      </tr>

      {/* Info row */}
      {openInfoId === `major-${major._id}` && (
        <InfoCard
          type="major"
          data={major}
          onClose={onCloseInfo || (() => { })}
          paddingLeft={56}
          openActionMenu={openActionMenu}
          onActionMenuToggle={onActionMenuToggle}
          onActionMenuClose={onActionMenuClose}
          onEdit={onEditMajor}
          onDelete={onDeleteMajor}
          onAddSpecialist={onAddSpecialist}
          onReload={onLoadSpecialists}
          showDragHandle={false}
          showTreeBranches={false}
        />
      )}

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
                specialistList.map((specialist, index) => {
                  const specialistExpanded = expandedSpecialists.has(specialist._id);
                  const isLastSpecialist = index === specialistList.length - 1;
                  return (
                    <SpecialistRow
                      key={specialist._id}
                      specialist={specialist}
                      isExpanded={specialistExpanded}
                      isLast={isLastSpecialist}
                      onToggle={() => onToggleSpecialist(specialist._id)}
                      onLoadSubjects={() => onLoadSubjects(specialist._id)}
                      openActionMenu={openActionMenu}
                      onActionMenuToggle={onActionMenuToggle}
                      onActionMenuClose={onActionMenuClose}
                      onEdit={() => onEditSpecialist(specialist._id)}
                      onDelete={() => onDeleteSpecialist(specialist._id)}
                      onAddSubject={() => onAddSubject(specialist)}
                      expandedSubjects={expandedSubjects}
                      onToggleSubject={(specialistId, subjectId) => onToggleSubject(specialistId, subjectId)}
                      onLoadCourses={(subjectId) => onLoadCourses(specialist._id, subjectId)}
                      onEditSubject={(subjectId) => onEditSubject(specialist, subjectId)}
                      onDeleteSubject={(subjectId) => onDeleteSubject(specialist, subjectId)}
                      onAddCourse={(subject, major, specialist) => onAddCourse?.(subject, major, specialist)}
                      onEditCourse={(course, subject, major, specialist) => onEditCourse?.(course, subject, major, specialist)}
                      onDeleteCourse={(course, subject, major, specialist) => onDeleteCourse?.(course, subject, major, specialist)}
                      onShowInfo={onShowInfo}
                      openInfoId={openInfoId}
                      onCloseInfo={onCloseInfo}
                      // Drag and Drop props
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      draggedItem={draggedItem}
                      dropTarget={dropTarget}
                      isDragging={isDragging}
                      pendingMoves={pendingMoves}
                      major={major}
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

