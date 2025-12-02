import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, GripVertical, Info } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import ActionMenu from "./ActionMenu";
import InfoCard from "./InfoCard";
import { subjectService } from "../../services";
import type { SubjectNode, SpecialistNode, MajorNode, PrerequisiteSubject } from "../../types/curriculum";

interface SubjectRowProps {
  subject: SubjectNode;
  isExpanded: boolean;
  onToggle: () => void;
  onLoadCourses: () => void;
  onEdit: () => void;
  onDelete: () => void;
  openActionMenu: string | null;
  onActionMenuToggle: (id: string) => void;
  onActionMenuClose: () => void;
  // Drag and Drop props
  onDragStart: (type: 'specialist' | 'subject', id: string, data: any) => void;
  onDragEnd: () => void;
  draggedItem: { type: 'specialist' | 'subject'; id: string; data: any } | null;
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
  specialist: SpecialistNode;
  // Course CRUD props
  onAddCourse?: (subject: SubjectNode, major: MajorNode, specialist: SpecialistNode) => void;
  onEditCourse?: (course: any, subject: SubjectNode, major: MajorNode, specialist: SpecialistNode) => void;
  onDeleteCourse?: (course: any, subject: SubjectNode, major: MajorNode, specialist: SpecialistNode) => void;
  // Major context for course handlers
  major?: MajorNode;
  // Info card props
  onShowInfo?: (type: "major" | "specialist" | "subject" | "course", data: any, element: HTMLElement) => void;
  openInfoId?: string | null;
  onCloseInfo?: () => void;
  isLast?: boolean; // Whether this is the last subject in the list
}

const SubjectRow: React.FC<SubjectRowProps> = ({
  subject,
  isExpanded,
  onToggle,
  onLoadCourses,
  onEdit,
  onDelete,
  openActionMenu,
  onActionMenuToggle,
  onActionMenuClose,
  // Drag and Drop props
  onDragStart,
  onDragEnd,
  draggedItem,
  isDragging,
  pendingMoves,
  specialist,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  major,
  onShowInfo,
  openInfoId,
  onCloseInfo,
  isLast = false,
}) => {
  const { darkMode } = useTheme();
  const courses = subject.courses || [];

  // Helper to truncate long text
  const truncateText = (text: string | undefined, maxLength: number = 100) => {
    if (!text) return "No description";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };
  const treeColor = darkMode ? "#4c1d95" : "#4f46e5";
  const menuId = `subject-${subject._id}`;

  const pendingMove = pendingMoves.find(m => m.id === subject._id && m.type === 'subject');
  const isPendingMove = !!pendingMove;
  const isDraggedItem = draggedItem?.type === 'subject' && draggedItem.id === subject._id;

  // Prerequisites state
  const [prerequisites, setPrerequisites] = useState<PrerequisiteSubject[]>(subject.prerequisiteSubjects || []);
  const [prerequisitesLoading, setPrerequisitesLoading] = useState(false);
  const [prerequisitesError, setPrerequisitesError] = useState<string>("");
  const [prerequisitesLoaded, setPrerequisitesLoaded] = useState(subject.prerequisitesLoaded || false);
  const [removedPrerequisitesCount, setRemovedPrerequisitesCount] = useState(0);

  // Load prerequisites when component mounts or subject prerequisites change
  useEffect(() => {
    if (subject.prerequisites && subject.prerequisites.length > 0 && !prerequisitesLoaded && !prerequisitesLoading) {
      void loadPrerequisites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject.prerequisites, prerequisitesLoaded]);

  const loadPrerequisites = async () => {
    if (!subject.prerequisites || subject.prerequisites.length === 0) return;

    setPrerequisitesLoading(true);
    setPrerequisitesError("");

    try {
      const prerequisitePromises = subject.prerequisites!.map(async (id) => {
        try {
          const response = await subjectService.getSubjectById(id);
          return { success: true, data: response };
        } catch (err: any) {
          // Handle 404 errors for removed subjects
          // Check multiple possible error structures:
          // 1. AxiosError with response.status === 404
          // 2. Error object with status property === 404 (from http client)
          // 3. Error message indicates "not found" or "subject not found"
          const isNotFound =
            err?.response?.status === 404 ||
            err?.status === 404 ||
            (err?.message && (
              err.message.toLowerCase().includes('not found') ||
              err.message.toLowerCase().includes('subject not found')
            ));

          if (isNotFound) {
            return { success: false, data: null };
          }

          // For other errors, throw to be handled by outer catch
          throw err;
        }
      });

      const results = await Promise.all(prerequisitePromises);

      const loadedSubjects: PrerequisiteSubject[] = [];
      let removedCount = 0;

      results.forEach((result) => {
        if (result.success && result.data) {
          loadedSubjects.push({
            _id: result.data._id,
            name: result.data.name,
            code: result.data.code,
            description: result.data.description,
          });
        } else {
          removedCount++;
        }
      });

      setPrerequisites(loadedSubjects);
      setRemovedPrerequisitesCount(removedCount);
      setPrerequisitesLoaded(true);
    } catch (err) {
      setPrerequisitesError(err instanceof Error ? err.message : "Failed to load prerequisites");
    } finally {
      setPrerequisitesLoading(false);
    }
  };

  return (
    <>
      <tr
        style={{
          opacity: isDraggedItem ? 0.5 : 1,
          backgroundColor: isDraggedItem
            ? (darkMode ? "#1e1b4b" : "#e0e7ff")
            : undefined,
          display: openInfoId === `subject-${subject._id}` ? "none" : "table-row",
        }}
      >
        <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
          <div
            draggable
            onDragStart={() => onDragStart('subject', subject._id, subject)}
            onDragEnd={onDragEnd}
            className="cursor-move p-1 rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center"
            style={{
              color: darkMode ? "#9ca3af" : "#6b7280",
              cursor: isDragging ? "grabbing" : "grab",
              width: "28px",
              height: "28px",
            }}
            title="Drag to move subject to another specialist"
          >
            <GripVertical size={14} />
          </div>
        </td>
        <td style={{ padding: "12px 16px", paddingLeft: "48px", verticalAlign: "top" }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "13px",
                top: "-12px",
                height: isLast ? "32px" : "calc(100% + 12px)",
                width: "3px",
                backgroundColor: treeColor,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "13px",
                top: "18px",
                height: "3px",
                width: "22px",
                backgroundColor: treeColor,
              }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                paddingLeft: "32px",
                marginLeft: "13px",
              }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <button
                    onClick={onToggle}
                    className="flex items-center justify-center rounded-full transition-all"
                    style={{
                      width: "28px",
                      height: "28px",
                      flexShrink: 0,
                      backgroundColor: darkMode ? "#1e1b4b" : "#e0f2fe",
                      color: darkMode ? "#c4b5fd" : "#0369a1",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p style={{ fontWeight: 600, color: darkMode ? "#f3f4f6" : "#0f172a", margin: 0 }}>
                        {subject.name} ({subject.code})
                      </p>
                      {subject.isActive !== undefined && (
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: subject.isActive ? "#10b981" : "#9ca3af",
                            flexShrink: 0,
                          }}
                          title={subject.isActive ? "Active" : "Inactive"}
                        />
                      )}
                      {isPendingMove && (
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: darkMode ? "#78350f" : "#fffbeb",
                            color: darkMode ? "#fed7aa" : "#92400e"
                          }}
                        >
                          Pending move to {pendingMove?.toName || specialist.name}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "12px", color: darkMode ? "#9ca3af" : "#6b7280", margin: "2px 0 0 0" }}>
                      {truncateText(subject.description)}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px", verticalAlign: "top" }}>
          {subject.updatedAt ? new Date(subject.updatedAt).toLocaleDateString("en-GB") : "-"}
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px", verticalAlign: "top" }}>
          {subject.createdAt ? new Date(subject.createdAt).toLocaleDateString("en-GB") : "-"}
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px", verticalAlign: "top" }}>
          {subject.credits ?? "-"}
        </td>
        <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px", verticalAlign: "top" }}>
          {prerequisitesLoading ? (
            <span style={{ fontSize: "12px", color: darkMode ? "#9ca3af" : "#6b7280" }}>Loading...</span>
          ) : prerequisitesError ? (
            <span style={{ fontSize: "12px", color: darkMode ? "#fecaca" : "#b91c1c" }} title={prerequisitesError}>Error</span>
          ) : prerequisitesLoaded && (prerequisites.length > 0 || removedPrerequisitesCount > 0) ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {prerequisites.length > 0 && (
                <span style={{ fontSize: "13px" }}>
                  {prerequisites.map(p => p.code).join(", ")}
                </span>
              )}
              {removedPrerequisitesCount > 0 && (
                <span style={{ fontSize: "11px", fontStyle: "italic", color: darkMode ? "#9ca3af" : "#6b7280" }}>
                  {removedPrerequisitesCount} removed Subject{removedPrerequisitesCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          ) : subject.prerequisites && subject.prerequisites.length > 0 ? (
            <span style={{ fontSize: "12px", color: darkMode ? "#9ca3af" : "#6b7280" }}>-</span>
          ) : (
            <span style={{ fontSize: "12px", color: darkMode ? "#9ca3af" : "#6b7280" }}>-</span>
          )}
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center", verticalAlign: "top" }}>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                if (onShowInfo) {
                  onShowInfo("subject", subject, e.currentTarget);
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
              isOpen={openActionMenu === menuId}
              onToggle={() => onActionMenuToggle(menuId)}
              onClose={onActionMenuClose}
              type="subject"
              onEdit={onEdit}
              onDelete={onDelete}
              onAddCourse={() => {
                if (major) {
                  onAddCourse?.(subject, major, specialist);
                }
              }}
            />
          </div>
        </td>
      </tr>

      {/* Info row */}
      {openInfoId === `subject-${subject._id}` && (
        <InfoCard
          type="subject"
          data={subject}
          onClose={onCloseInfo || (() => { })}
          paddingLeft={180}
          openActionMenu={openActionMenu}
          onActionMenuToggle={onActionMenuToggle}
          onActionMenuClose={onActionMenuClose}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddCourse={() => {
            if (major) {
              onAddCourse?.(subject, major, specialist);
            }
          }}
          showDragHandle={true}
          isDragging={isDragging}
          onDragStart={() => onDragStart('subject', subject._id, subject)}
          onDragEnd={onDragEnd}
          showTreeBranches={true}
          treeColor={treeColor}
        />
      )}

      {/* Course rows */}
      {isExpanded && (
        <>
          {subject.coursesLoading && (
            <tr>
              <td />
              <td colSpan={6} style={{ padding: "12px 16px", paddingLeft: "96px", color: darkMode ? "#d1d5db" : "#374151" }}>
                Loading courses...
              </td>
            </tr>
          )}

          {subject.coursesError && !subject.coursesLoading && (
            <tr>
              <td />
              <td colSpan={6} style={{ padding: "12px 16px", paddingLeft: "96px", color: darkMode ? "#fecaca" : "#b91c1c" }}>
                Failed to load courses: {subject.coursesError}
                <button
                  className="ml-3 px-3 py-1 rounded text-white text-sm"
                  style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
                  onClick={onLoadCourses}
                >
                  Retry
                </button>
              </td>
            </tr>
          )}

          {!subject.coursesLoading && !subject.coursesError && (
            <>
              {subject.coursesLoaded ? (
                courses.length > 0 ? (
                  courses.map((course) => {
                    const courseMenuId = `course-${course._id}`;
                    return (
                      <React.Fragment key={course._id}>
                        <tr
                          style={{
                            display: openInfoId === `course-${course._id}` ? "none" : "table-row",
                          }}
                        >
                          <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                            {/* Course drag functionality not implemented */}
                          </td>
                          <td style={{ padding: "12px 16px", paddingLeft: "124px", verticalAlign: "top", position: "relative" }}>
                            {/* Vertical tree branch line connecting to subject */}
                            <div
                              style={{
                                position: "absolute",
                                left: "102px",
                                top: "-12px",
                                bottom: courses.indexOf(course) === courses.length - 1 ? "50%" : "-12px",
                                width: "3px",
                                backgroundColor: treeColor,
                              }}
                            />
                            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px" }}>
                              <div
                                style={{
                                  position: "absolute",
                                  left: "-22px",
                                  top: "50%",
                                  width: "20px",
                                  height: "3px",
                                  backgroundColor: treeColor,
                                  transform: "translateY(-50%)",
                                }}
                              />
                              {course.logo ? (
                                <img
                                  src={course.logo}
                                  alt={course.title}
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "8px",
                                    objectFit: "cover",
                                    backgroundColor: darkMode ? "#374151" : "#f3f4f6",
                                    flexShrink: 0,
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "8px",
                                    backgroundColor: darkMode ? "#4c1d95" : "#c7d2fe",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: darkMode ? "#c4b5fd" : "#4f46e5",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {course.code ? course.code.substring(0, 2).toUpperCase() : "CO"}
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p
                                    style={{
                                      fontWeight: 500,
                                      color: darkMode ? "#e5e7eb" : "#1f2937",
                                      margin: 0,
                                      fontSize: "14px",
                                    }}
                                  >
                                    {course.title}
                                  </p>
                                  {course.status && (
                                    <span
                                      className="px-1.5 py-0.5 rounded text-xs font-medium"
                                      style={{
                                        backgroundColor: course.status === 'ongoing'
                                          ? (darkMode ? "#065f46" : "#d1fae5")
                                          : (darkMode ? "#78350f" : "#fed7aa"),
                                        color: course.status === 'ongoing'
                                          ? (darkMode ? "#6ee7b7" : "#047857")
                                          : (darkMode ? "#fed7aa" : "#92400e"),
                                      }}
                                    >
                                      {course.status}
                                    </span>
                                  )}
                                  {course.isPublished && (
                                    <span
                                      className="px-1.5 py-0.5 rounded text-xs font-medium"
                                      style={{
                                        backgroundColor: darkMode ? "#1e3a8a" : "#dbeafe",
                                        color: darkMode ? "#93c5fd" : "#1e40af",
                                      }}
                                    >
                                      Published
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs flex-wrap">
                                  {course.code && (
                                    <span style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                                      Code: {course.code}
                                    </span>
                                  )}
                                  {(course.teacherIds && course.teacherIds.length > 0) || (course.teachers && course.teachers.length > 0) ? (
                                    <span style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                                      Teacher: {(course.teacherIds?.[0] || course.teachers?.[0])?.username || (course.teacherIds?.[0] || course.teachers?.[0])?.fullname || 'N/A'}
                                    </span>
                                  ) : null}
                                  {course.capacity && (
                                    <span style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                                      Capacity: {course.capacity}
                                    </span>
                                  )}
                                  {course.startDate && (
                                    <span style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                                      {new Date(course.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      {course.endDate && ` - ${new Date(course.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px", verticalAlign: "top" }}>
                            {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString("en-GB") : "-"}
                          </td>
                          <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px", verticalAlign: "top" }}>
                            {course.createdAt ? new Date(course.createdAt).toLocaleDateString("en-GB") : "-"}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px", verticalAlign: "top" }}>
                            -
                          </td>
                          <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px", verticalAlign: "top" }}>
                            -
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center", verticalAlign: "top" }}>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => {
                                  if (onShowInfo) {
                                    onShowInfo("course", course, e.currentTarget);
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
                                isOpen={openActionMenu === courseMenuId}
                                onToggle={() => onActionMenuToggle(courseMenuId)}
                                onClose={onActionMenuClose}
                                type="course"
                                onEdit={() => {
                                  if (major) {
                                    onEditCourse?.(course, subject, major, specialist);
                                  }
                                }}
                                onDelete={() => {
                                  if (major) {
                                    onDeleteCourse?.(course, subject, major, specialist);
                                  }
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                        {/* Info row for course */}
                        {openInfoId === `course-${course._id}` && (
                          <InfoCard
                            type="course"
                            data={course}
                            onClose={onCloseInfo || (() => { })}
                            paddingLeft={96}
                            openActionMenu={openActionMenu}
                            onActionMenuToggle={onActionMenuToggle}
                            onActionMenuClose={onActionMenuClose}
                            onEdit={() => {
                              if (major) {
                                onEditCourse?.(course, subject, major, specialist);
                              }
                            }}
                            onDelete={() => {
                              if (major) {
                                onDeleteCourse?.(course, subject, major, specialist);
                              }
                            }}
                            showDragHandle={true}
                            isDragging={isDragging}
                            onDragStart={() => { }}
                            onDragEnd={() => { }}
                            showTreeBranches={false}
                          />
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td />
                    <td colSpan={6} style={{ padding: "12px 16px", paddingLeft: "96px", color: darkMode ? "#9ca3af" : "#6b7280", fontStyle: "italic" }}>
                      No courses mapped to this subject.
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td />
                  <td colSpan={6} style={{ padding: "12px 16px", paddingLeft: "96px" }}>
                    <button
                      className="px-3 py-1 rounded text-white text-sm"
                      style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
                      onClick={onLoadCourses}
                    >
                      Load Courses
                    </button>
                  </td>
                </tr>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default SubjectRow;
