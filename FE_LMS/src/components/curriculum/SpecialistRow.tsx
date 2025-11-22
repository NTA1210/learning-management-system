import React from "react";
import { ChevronDown, ChevronRight, GripVertical, Info } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import ActionMenu from "./ActionMenu";
import SubjectRow from "./SubjectRow";
import InfoCard from "./InfoCard";
import type { SpecialistNode, SubjectNode, MajorNode } from "../../types/curriculum";

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
  onAddSubject: () => void;
  expandedSubjects: Set<string>;
  onToggleSubject: (specialistId: string, subjectId: string) => void;
  onLoadCourses: (subjectId: string) => void;
  onEditSubject: (subject: SubjectNode) => void;
  onDeleteSubject: (subject: SubjectNode) => void;
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
  major: MajorNode;
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
  onAddSubject,
  expandedSubjects,
  onToggleSubject,
  onLoadCourses,
  onEditSubject,
  onDeleteSubject,
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
  major,
}) => {
  const { darkMode } = useTheme();
  const subjects = specialist.subjects || [];

  const isDropTarget = dropTarget?.type === 'specialist' && dropTarget.id === specialist._id;
  const canAcceptDrop = draggedItem?.type === 'subject';
  const pendingMove = pendingMoves.find(m => m.id === specialist._id && m.type === 'specialist');
  const isPendingMove = !!pendingMove;
  const isDraggedItem = draggedItem?.type === 'specialist' && draggedItem.id === specialist._id;

  return (
    <>
      <tr
        style={{
          backgroundColor: isDropTarget && canAcceptDrop 
            ? (darkMode ? "#065f46" : "#d1fae5") 
            : isDraggedItem 
            ? (darkMode ? "#1e1b4b" : "#e0e7ff")
            : (darkMode ? "#1f2937" : "#ffffff"),
          borderBottom: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
          border: isDropTarget && canAcceptDrop 
            ? `2px dashed ${darkMode ? "#10b981" : "#059669"}` 
            : undefined,
          opacity: isDraggedItem ? 0.5 : 1,
          display: openInfoId === `specialist-${specialist._id}` ? "none" : "table-row",
        }}
        onDragOver={canAcceptDrop ? (e) => onDragOver(e, 'specialist', specialist._id) : undefined}
        onDragLeave={canAcceptDrop ? onDragLeave : undefined}
        onDrop={canAcceptDrop ? (e) => onDrop(e, 'specialist', specialist._id) : undefined}
      >
        <td style={{ padding: "12px 16px" }}>
          <div
            draggable
            onDragStart={() => onDragStart('specialist', specialist._id, specialist)}
            onDragEnd={onDragEnd}
            className="cursor-move p-1 rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center"
            style={{
              color: darkMode ? "#9ca3af" : "#6b7280",
              cursor: isDragging ? "grabbing" : "grab",
              width: "28px",
              height: "28px",
            }}
            title="Drag to move specialist to another major"
          >
            <GripVertical size={16} />
          </div>
        </td>
        <td style={{ padding: "12px 16px" }}>
          <div className="flex items-center" style={{ position: "relative", paddingLeft: "32px" }}>
            <div
              style={{
                position: "absolute",
                left: "13px",
                top: "-12px",
                bottom: "50%",
                width: "3px",
                backgroundColor: darkMode ? "#4c1d95" : "#4f46e5",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "13px",
                top: "50%",
                height: "3px",
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
              <div className="flex items-center gap-2 flex-wrap">
                <p style={{ color: darkMode ? "#d1d5db" : "#111827", fontWeight: 500, margin: 0 }}>{specialist.name}</p>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: specialist.isActive ? "#10b981" : "#9ca3af",
                    flexShrink: 0,
                  }}
                  title={specialist.isActive ? "Active" : "Inactive"}
                />
                {isPendingMove && (
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ 
                      backgroundColor: darkMode ? "#78350f" : "#fffbeb", 
                      color: darkMode ? "#fed7aa" : "#92400e" 
                    }}
                  >
                    Pending move to {pendingMove?.toName || major.name}
                  </span>
                )}
              </div>
              <p style={{ color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "12px", margin: "2px 0 0 0" }}>{specialist.description || "-"}</p>
            </div>
          </div>
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
          {new Date(specialist.updatedAt).toLocaleDateString("en-GB")}
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
          {new Date(specialist.createdAt).toLocaleDateString("en-GB")}
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
                  onShowInfo("specialist", specialist, e.currentTarget);
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
              isOpen={openActionMenu === specialist._id}
              onToggle={() => onActionMenuToggle(specialist._id)}
              onClose={onActionMenuClose}
              type="specialist"
              onAddSubject={onAddSubject}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </td>
      </tr>

      {/* Info row */}
      {openInfoId === `specialist-${specialist._id}` && (
        <InfoCard
          type="specialist"
          data={specialist}
          onClose={onCloseInfo || (() => {})}
          paddingLeft={100}
          openActionMenu={openActionMenu}
          onActionMenuToggle={onActionMenuToggle}
          onActionMenuClose={onActionMenuClose}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubject={onAddSubject}
          showDragHandle={true}
          isDragging={isDragging}
          onDragStart={() => onDragStart('specialist', specialist._id, specialist)}
          onDragEnd={onDragEnd}
          showTreeBranches={true}
          treeColor={darkMode ? "#4c1d95" : "#4f46e5"}
        />
      )}

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
                      onEdit={() => onEditSubject(subject)}
                      onDelete={() => onDeleteSubject(subject)}
                      openActionMenu={openActionMenu}
                      onActionMenuToggle={onActionMenuToggle}
                      onActionMenuClose={onActionMenuClose}
                      // Drag and Drop props
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      draggedItem={draggedItem}
                      isDragging={isDragging}
                      pendingMoves={pendingMoves}
                      specialist={specialist}
                      onAddCourse={(subject) => onAddCourse?.(subject, major, specialist)}
                      onEditCourse={(course, subject) => onEditCourse?.(course, subject, major, specialist)}
                      onDeleteCourse={(course, subject) => onDeleteCourse?.(course, subject, major, specialist)}
                      major={major}
                      onShowInfo={onShowInfo}
                      openInfoId={openInfoId}
                      onCloseInfo={onCloseInfo}
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

