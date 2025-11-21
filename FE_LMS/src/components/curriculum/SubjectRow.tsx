import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import type { SubjectNode } from "../../types/curriculum";

interface SubjectRowProps {
  subject: SubjectNode;
  isExpanded: boolean;
  onToggle: () => void;
  onLoadCourses: () => void;
}

const SubjectRow: React.FC<SubjectRowProps> = ({
  subject,
  isExpanded,
  onToggle,
  onLoadCourses,
}) => {
  const { darkMode } = useTheme();
  const courses = subject.courses || [];

  const treeColor = darkMode ? "#4c1d95" : "#4f46e5";

  return (
    <tr>
      <td />
      <td colSpan={6} style={{ padding: "12px 16px", paddingLeft: "64px" }}>
        <div style={{ position: "relative" }}>
          {/* Vertical line going up */}
          <div
            style={{
              position: "absolute",
              left: "13px",
              top: "-12px",
              bottom: "50%",
              width: "2px",
              backgroundColor: treeColor,
            }}
          />
          {/* Horizontal line connecting */}
          <div
            style={{
              position: "absolute",
              left: "13px",
              top: "50%",
              height: "3px",
              width: "16px",
              backgroundColor: treeColor,
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              paddingLeft: "32px",
              marginLeft: "13px",
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={onToggle}
                  className="flex items-center justify-center rounded-full transition-all"
                  style={{
                    width: "28px",
                    height: "28px",
                    backgroundColor: darkMode ? "#1e1b4b" : "#e0f2fe",
                    color: darkMode ? "#c4b5fd" : "#0369a1",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <div>
                  <p style={{ fontWeight: 600, color: darkMode ? "#f3f4f6" : "#0f172a" }}>
                    {subject.name} ({subject.code})
                  </p>
                  <p style={{ fontSize: "12px", color: darkMode ? "#9ca3af" : "#6b7280" }}>
                    {subject.description || "No description"}
                  </p>
                </div>
              </div>
              <div style={{ fontSize: "12px", color: darkMode ? "#9ca3af" : "#6b7280" }}>
                Credits: {subject.credits ?? "N/A"}
              </div>
            </div>

          {isExpanded && (
            <div style={{ paddingLeft: "28px", position: "relative" }}>
              {/* vertical line connecting to courses */}
              <div
                style={{
                  position: "absolute",
                  left: "5px",
                  top: "0",
                  bottom: "0",
                  width: "2px",
                  backgroundColor: treeColor,
                }}
              />
              {subject.coursesLoading && (
                <p style={{ color: darkMode ? "#d1d5db" : "#374151" }}>Loading courses...</p>
              )}

              {subject.coursesError && !subject.coursesLoading && (
                <div style={{ color: darkMode ? "#fecaca" : "#b91c1c" }}>
                  Failed to load courses: {subject.coursesError}
                  <button
                    className="ml-3 px-3 py-1 rounded text-white text-sm"
                    style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
                    onClick={onLoadCourses}
                  >
                    Retry
                  </button>
                </div>
              )}

              {!subject.coursesLoading && !subject.coursesError && (
                <>
                  {subject.coursesLoaded ? (
                    courses.length > 0 ? (
                      <div
                        style={{
                          // marginTop: "8px",
                          // display: "flex",
                          // flexDirection: "column",
                          // gap: "8px",
                          // borderLeft: `2px dashed ${treeColor}`,
                          // paddingLeft: "24px",
                        }}
                      >
                        {courses.map((course) => (
                          <div
                            key={course._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "8px 0",
                              position: "relative",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                left: "-24px",
                                top: "50%",
                                width: "20px",
                                height: "2px",
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
                                }}
                                onError={(e) => {
                                  // Hide image if it fails to load
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
                                }}
                              >
                                {course.code ? course.code.substring(0, 2).toUpperCase() : "CO"}
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
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
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: darkMode ? "#9ca3af" : "#6b7280",
                                  margin: "2px 0 0 0",
                                }}
                              >
                                {course.code}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: darkMode ? "#9ca3af" : "#6b7280", fontStyle: "italic" }}>
                        No courses mapped to this subject.
                      </p>
                    )
                  ) : (
                    <button
                      className="px-3 py-1 rounded text-white text-sm"
                      style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
                      onClick={onLoadCourses}
                    >
                      Load Courses
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      </td>
    </tr>
  );
};

export default SubjectRow;

