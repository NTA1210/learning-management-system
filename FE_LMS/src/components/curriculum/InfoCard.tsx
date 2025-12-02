import React, { useState, useEffect } from "react";
import { GripVertical, Info } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import ActionMenu from "./ActionMenu";

interface InfoCardProps {
  type: "major" | "specialist" | "subject" | "course";
  data: any;
  onClose: () => void;
  paddingLeft?: number;
  openActionMenu?: string | null;
  onActionMenuToggle?: (id: string) => void;
  onActionMenuClose?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddSpecialist?: () => void;
  onAddSubject?: () => void;
  onAddCourse?: () => void;
  onReload?: () => void;
  showDragHandle?: boolean;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  treeColor?: string;
  showTreeBranches?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({
  type,
  data,
  onClose,
  paddingLeft = 16,
  openActionMenu,
  onActionMenuToggle,
  onActionMenuClose,
  onEdit,
  onDelete,
  onAddSpecialist,
  onAddSubject,
  onAddCourse,
  onReload,
  showDragHandle = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  treeColor,
  showTreeBranches = false,
}) => {
  const { darkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [fieldsVisible, setFieldsVisible] = useState(false);
  const defaultTreeColor = darkMode ? "#4c1d95" : "#4f46e5";
  const finalTreeColor = treeColor || defaultTreeColor;

  useEffect(() => {
    setIsExpanded(false);
    setFieldsVisible(false);
    requestAnimationFrame(() => {
      setIsExpanded(true);
    });
    const timer = setTimeout(() => {
      setFieldsVisible(true);
    }, 200);
    return () => clearTimeout(timer);
  }, [data]);

  const handleClose = () => {
    setFieldsVisible(false);
    setIsExpanded(false);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  if (!data) return null;

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string | undefined, maxLength: number = 150) => {
    if (!text) return "No description";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getMenuId = () => {
    switch (type) {
      case "major":
        return `major-${data._id}`;
      case "specialist":
        return `specialist-${data._id}`;
      case "subject":
        return `subject-${data._id}`;
      case "course":
        return `course-${data._id}`;
      default:
        return "";
    }
  };

  const renderContent = () => {
    switch (type) {
      case "major":
        return (
          <div>
            <h3 className="font-bold text-lg mb-3" style={{ color: darkMode ? "#ffffff" : "#111827" }}>
              {data.name}
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm" style={{ maxWidth: "600px" }}>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Created:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{formatDate(data.createdAt)}</span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Description:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{truncateText(data.description)}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Updated:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{formatDate(data.updatedAt)}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>ID:</span>{" "}
                <span style={{ color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "11px", fontFamily: "monospace" }}>
                  {data._id}
                </span>
              </div>
            </div>
          </div>
        );
      case "specialist":
        return (
          <div>
            <h3 className="font-bold text-lg mb-3" style={{ color: darkMode ? "#ffffff" : "#111827" }}>{data.name}</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm" style={{ maxWidth: "600px" }}>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Major:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>
                  {typeof data.majorId === "object" ? data.majorId.name : "-"}
                </span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Status:</span>{" "}
                <span
                  style={{
                    color: data.isActive ? (darkMode ? "#6ee7b7" : "#047857") : (darkMode ? "#9ca3af" : "#6b7280"),
                  }}
                >
                  {data.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Created:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{formatDate(data.createdAt)}</span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Description:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{truncateText(data.description)}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Updated:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{formatDate(data.updatedAt)}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>ID:</span>{" "}
                <span style={{ color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "11px", fontFamily: "monospace" }}>
                  {data._id}
                </span>
              </div>
            </div>
          </div>
        );
      case "subject":
        return (
          <div>
            <h3 className="font-bold text-lg mb-3" style={{ color: darkMode ? "#ffffff" : "#111827" }}>
              {data.name} ({data.code})
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm" style={{ maxWidth: "600px" }}>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Code:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{data.code || "-"}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Status:</span>{" "}
                <span
                  style={{
                    color: data.isActive ? (darkMode ? "#6ee7b7" : "#047857") : (darkMode ? "#9ca3af" : "#6b7280"),
                  }}
                >
                  {data.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Credits:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{data.credits ?? "-"}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Prerequisites:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>
                  {data.prerequisites && data.prerequisites.length > 0 ? `${data.prerequisites.length} prerequisite(s)` : "None"}
                </span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Created:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{formatDate(data.createdAt)}</span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Description:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{truncateText(data.description)}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Updated:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{formatDate(data.updatedAt)}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>ID:</span>{" "}
                <span style={{ color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "11px", fontFamily: "monospace" }}>
                  {data._id}
                </span>
              </div>
            </div>
          </div>
        );
      case "course":
        return (
          <div>
            <div className="flex items-start gap-3 mb-3">
              {data.logo && (
                <img
                  src={data.logo}
                  alt={data.title}
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    backgroundColor: darkMode ? "#374151" : "#f3f4f6",
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <h3 className="font-bold text-lg" style={{ color: darkMode ? "#ffffff" : "#111827" }}>{data.title}</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm" style={{ maxWidth: "600px" }}>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Subject:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>
                  {typeof data.subjectId === "object" ? data.subjectId.name : "-"}
                </span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Status:</span>{" "}
                <span
                  style={{
                    color:
                      data.status === "ongoing"
                        ? darkMode ? "#6ee7b7" : "#047857"
                        : data.status === "completed"
                          ? darkMode ? "#93c5fd" : "#1e40af"
                          : darkMode ? "#9ca3af" : "#6b7280",
                  }}
                >
                  {data.status || "draft"}
                </span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Code:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>
                  {data.code || (typeof data.subjectId === "object" ? data.subjectId.code : "-")}
                </span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Published:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{data.isPublished ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Capacity:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{data.capacity || "-"}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Requires Approval:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{data.enrollRequiresApproval ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Start Date:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{formatDate(data.startDate)}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>End Date:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{formatDate(data.endDate)}</span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Description:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{truncateText(data.description)}</span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Teachers:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>
                  {data.teacherIds && data.teacherIds.length > 0
                    ? data.teacherIds.map((t: any) => t.fullname || t.username || (typeof t === "string" ? t : "-")).join(", ")
                    : "None"}
                </span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Created By:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>
                  {data.createdBy ? (typeof data.createdBy === "object" ? data.createdBy.fullname || data.createdBy.username || "-" : "-") : "-"}
                </span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Created:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{formatDate(data.createdAt)}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Updated:</span>{" "}
                <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937" }}>{formatDate(data.updatedAt)}</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>ID:</span>{" "}
                <span style={{ color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "11px", fontFamily: "monospace" }}>
                  {data._id}
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderTreeBranches = () => {
    if (!showTreeBranches) return null;
    if (type === "specialist") {
      return (
        <>
          <div
            style={{
              position: "absolute",
              left: "13px",
              top: "-12px",
              bottom: "50%",
              width: "3px",
              backgroundColor: finalTreeColor,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "13px",
              top: "50%",
              height: "3px",
              width: "16px",
              backgroundColor: finalTreeColor,
            }}
          />
        </>
      );
    }
    if (type === "subject") {
      return (
        <>
          <div
            style={{
              position: "absolute",
              left: "13px",
              top: "-12px",
              height: "32px",
              width: "3px",
              backgroundColor: finalTreeColor,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "13px",
              top: "18px",
              height: "3px",
              width: "22px",
              backgroundColor: finalTreeColor,
            }}
          />
        </>
      );
    }
    return null;
  };

  return (
    <tr
      style={{
        backgroundColor: darkMode ? "#1f2937" : "#f9fafb",
        borderTop: `2px solid ${darkMode ? "#4c1d95" : "#4f46e5"}`,
      }}
    >
      <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
        {showDragHandle ? (
          <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="cursor-move p-1 rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center"
            style={{
              color: darkMode ? "#9ca3af" : "#6b7280",
              cursor: isDragging ? "grabbing" : "grab",
              width: "28px",
              height: "28px",
            }}
            title="Drag to move"
          >
            <GripVertical size={14} />
          </div>
        ) : null}
      </td>
      <td style={{ padding: "12px 16px", paddingLeft: `${paddingLeft}px`, verticalAlign: "top" }}>
        <div style={{ position: "relative" }}>
          {showTreeBranches && renderTreeBranches()}
          <div
            style={{
              position: "relative",
              transform: isExpanded ? "scaleY(1)" : "scaleY(0)",
              transformOrigin: "top",
              transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out",
              opacity: isExpanded ? 1 : 0,
              maxHeight: isExpanded ? "2000px" : "0",
              overflow: "hidden",
              paddingLeft: showTreeBranches ? "32px" : "0",
              marginLeft: showTreeBranches ? "13px" : "0",
            }}
          >
            <div
              style={{
                opacity: fieldsVisible ? 1 : 0,
                transform: fieldsVisible ? "translateY(0)" : "translateY(-10px)",
                transition: "opacity 0.3s ease-out 0.1s, transform 0.3s ease-out 0.1s",
              }}
            >
              {renderContent()}
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px", verticalAlign: "top" }}>
        {data.updatedAt ? new Date(data.updatedAt).toLocaleDateString("en-GB") : "-"}
      </td>
      <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px", verticalAlign: "top" }}>
        {data.createdAt ? new Date(data.createdAt).toLocaleDateString("en-GB") : "-"}
      </td>
      <td style={{ padding: "12px 16px", textAlign: "center", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px", verticalAlign: "top" }}>
        {type === "subject" ? (data.credits ?? "-") : "-"}
      </td>
      <td style={{ padding: "12px 16px", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px", verticalAlign: "top" }}>
        {type === "subject" && data.prerequisites && data.prerequisites.length > 0
          ? `${data.prerequisites.length} prerequisite(s)`
          : "-"}
      </td>
      <td style={{ padding: "12px 16px", textAlign: "center", verticalAlign: "top" }}>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-opacity-20 transition-colors"
            style={{
              color: darkMode ? "#9ca3af" : "#6b7280",
              cursor: "pointer",
            }}
            title="Close details"
          >
            <Info size={16} />
          </button>
          {onActionMenuToggle && (
            <ActionMenu
              isOpen={openActionMenu === getMenuId()}
              onToggle={() => onActionMenuToggle(getMenuId())}
              onClose={onActionMenuClose || (() => { })}
              type={type}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSpecialist={onAddSpecialist}
              onAddSubject={onAddSubject}
              onAddCourse={onAddCourse}
              onReload={onReload}
            />
          )}
        </div>
      </td>
    </tr>
  );
};

export default InfoCard;

