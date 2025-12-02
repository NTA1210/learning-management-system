import React, { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { httpClient } from "../../utils/http";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import type { Semester } from "../../services/semesterService";

interface SemesterFormData {
  year: number;
  type: string;
  startDate: string;
  endDate: string;
}

const SemesterList: React.FC = () => {
  const { darkMode } = useTheme();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [formData, setFormData] = useState<SemesterFormData>({
    year: new Date().getFullYear(),
    type: "fall",
    startDate: "",
    endDate: "",
  });

  const pageLimit = 10;

  const semesterTypes = [
    { value: "fall", label: "Fall" },
    { value: "spring", label: "Spring" },
    { value: "summer", label: "Summer" },
  ];

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get("/semesters", {
        withCredentials: true,
      });
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setAllSemesters(list);
      setError("");
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load semesters"
      );
    } finally {
      setLoading(false);
    }
  };

  const getSemesterName = (semester: Semester) => {
    const typeLabel =
      semesterTypes.find((t) => t.value === semester.type)?.label ||
      semester.type;
    return `${typeLabel} ${semester.year}`;
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  // Filter semesters based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSemesters(allSemesters);
      return;
    }

    const filtered = allSemesters.filter((semester) => {
      const searchLower = searchTerm.toLowerCase();
      const semesterName = getSemesterName(semester).toLowerCase();
      const year = semester.year.toString();
      const type = semester.type.toLowerCase();

      return (
        semesterName.includes(searchLower) ||
        year.includes(searchLower) ||
        type.includes(searchLower)
      );
    });

    setSemesters(filtered);
    setCurrentPage(1);
  }, [searchTerm, allSemesters]);

  const handleCreate = () => {
    setFormData({
      year: new Date().getFullYear(),
      type: "fall",
      startDate: "",
      endDate: "",
    });
    setShowCreateModal(true);
  };

  const handleEdit = (semester: Semester) => {
    setEditingSemester(semester);
    // Parse dates from API format (YYYY/MM/DD) to input format (YYYY-MM-DD)
    const parseDate = (dateString: string) => {
      if (!dateString) return "";
      const parts = dateString.split("/");
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(
          2,
          "0"
        )}`;
      }
      return dateString;
    };
    setFormData({
      year: semester.year,
      type: semester.type,
      startDate: parseDate(semester.startDate),
      endDate: parseDate(semester.endDate),
    });
    setShowEditModal(true);
  };

  const handleDelete = async (semesterId: string) => {
    const Swal = (await import("sweetalert2")).default;
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await httpClient.delete(`/semesters/${semesterId}`, {
          withCredentials: true,
        });
        await Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Semester deleted successfully",
          showConfirmButton: false,
          timer: 2000,
        });
        await fetchSemesters();
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to delete semester";
        await Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: msg,
          showConfirmButton: false,
          timer: 2500,
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent, isEdit: boolean) => {
    e.preventDefault();
    try {
      // Format dates to YYYY/MM/DD format
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}/${month}/${day}`;
      };

      const payload = {
        year: formData.year,
        type: formData.type,
        startDate: formatDate(formData.startDate),
        endDate: formatDate(formData.endDate),
      };

      if (isEdit && editingSemester) {
        await httpClient.put(`/semesters/${editingSemester._id}`, payload, {
          withCredentials: true,
        });
      } else {
        await httpClient.post("/semesters", payload, {
          withCredentials: true,
        });
      }

      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: isEdit
          ? "Semester updated successfully!"
          : "Semester created successfully!",
        showConfirmButton: false,
        timer: 2000,
      });

      setShowCreateModal(false);
      setShowEditModal(false);
      setEditingSemester(null);
      await fetchSemesters();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to save semester";
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: msg,
        showConfirmButton: false,
        timer: 2500,
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    // Handle ISO date format (2026-08-31T17:00:00.000Z)
    if (dateString.includes("T")) {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB");
    }

    // Handle YYYY/MM/DD format
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const date = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
      return date.toLocaleDateString("en-GB");
    }

    // Handle YYYY-MM-DD format
    if (dateString.includes("-") && dateString.length === 10) {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB");
    }

    return dateString;
  };

  // Pagination
  const totalPages = Math.ceil(semesters.length / pageLimit);
  const paginatedSemesters = semesters.slice(
    (currentPage - 1) * pageLimit,
    currentPage * pageLimit
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: darkMode ? "#9ca3af" : "#6b7280",
              }}
            />
            <input
              type="text"
              placeholder="Search semesters..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 rounded-lg border"
              style={{
                backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                borderColor: darkMode ? "#374151" : "#d1d5db",
                color: darkMode ? "#ffffff" : "#111827",
                width: "300px",
              }}
            />
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-all"
          style={{ backgroundColor: darkMode ? "#2563eb" : "#3b82f6" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              darkMode ? "#1d4ed8" : "#2563eb")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              darkMode ? "#2563eb" : "#3b82f6")
          }
        >
          <Plus size={18} />
          Create Semester
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-3 rounded-lg"
          style={{
            backgroundColor: darkMode
              ? "rgba(239, 68, 68, 0.2)"
              : "rgba(239, 68, 68, 0.1)",
            color: darkMode ? "#fca5a5" : "#dc2626",
          }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-lg overflow-hidden border"
        style={{
          backgroundColor: darkMode ? "#1f2937" : "#ffffff",
          borderColor: darkMode ? "#374151" : "#e5e7eb",
        }}
      >
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                backgroundColor: darkMode ? "#111827" : "#f9fafb",
                borderBottom: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
              }}
            >
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: darkMode ? "#d1d5db" : "#374151",
                }}
              >
                Semester
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: darkMode ? "#d1d5db" : "#374151",
                }}
              >
                Year
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: darkMode ? "#d1d5db" : "#374151",
                }}
              >
                Start Date
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: darkMode ? "#d1d5db" : "#374151",
                }}
              >
                End Date
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: darkMode ? "#d1d5db" : "#374151",
                  width: "100px",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: darkMode ? "#9ca3af" : "#6b7280",
                  }}
                >
                  Loading...
                </td>
              </tr>
            ) : paginatedSemesters.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: darkMode ? "#9ca3af" : "#6b7280",
                  }}
                >
                  No semesters found.
                </td>
              </tr>
            ) : (
              paginatedSemesters.map((semester) => (
                <tr
                  key={semester._id}
                  style={{
                    borderBottom: `1px solid ${
                      darkMode ? "#374151" : "#e5e7eb"
                    }`,
                  }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      color: darkMode ? "#ffffff" : "#111827",
                      fontWeight: 500,
                    }}
                  >
                    {getSemesterName(semester)}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: darkMode ? "#9ca3af" : "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    {semester.year}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: darkMode ? "#9ca3af" : "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    {formatDate(semester.startDate)}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: darkMode ? "#9ca3af" : "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    {formatDate(semester.endDate)}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(semester)}
                        className="p-1.5 rounded transition-colors"
                        style={{ color: darkMode ? "#60a5fa" : "#3b82f6" }}
                        title="Edit"
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = darkMode
                            ? "#1e3a8a"
                            : "#eff6ff")
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "transparent")
                        }
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(semester._id)}
                        className="p-1.5 rounded transition-colors"
                        style={{ color: darkMode ? "#f87171" : "#ef4444" }}
                        title="Delete"
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = darkMode
                            ? "#7f1d1d"
                            : "#fee2e2")
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "transparent")
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded"
            style={{
              backgroundColor: darkMode ? "#374151" : "#f9fafb",
              color:
                currentPage === 1
                  ? darkMode
                    ? "#6b7280"
                    : "#9ca3af"
                  : darkMode
                  ? "#ffffff"
                  : "#111827",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </button>
          <span
            style={{
              padding: "4px 12px",
              color: darkMode ? "#9ca3af" : "#6b7280",
            }}
          >
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded"
            style={{
              backgroundColor: darkMode ? "#374151" : "#f9fafb",
              color:
                currentPage === totalPages
                  ? darkMode
                    ? "#6b7280"
                    : "#9ca3af"
                  : darkMode
                  ? "#ffffff"
                  : "#111827",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: darkMode ? "#1f2937" : "#ffffff",
              border: darkMode
                ? "1px solid rgba(75, 85, 99, 0.3)"
                : "1px solid #e5e7eb",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              Create New Semester
            </h2>
            <form
              onSubmit={(e) => handleSubmit(e, false)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block mb-2 font-semibold"
                    style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                  >
                    Year *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        year: Number(e.target.value),
                      }))
                    }
                    min="2020"
                    max="2100"
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    className="block mb-2 font-semibold"
                    style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                  >
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    required
                  >
                    {semesterTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block mb-2 font-semibold"
                    style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                  >
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    className="block mb-2 font-semibold"
                    style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                  >
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200"
                  style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200"
                  style={{ backgroundColor: darkMode ? "#6b7280" : "#9ca3af" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingSemester && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setEditingSemester(null);
            }
          }}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: darkMode ? "#1f2937" : "#ffffff",
              border: darkMode
                ? "1px solid rgba(75, 85, 99, 0.3)"
                : "1px solid #e5e7eb",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              Edit Semester
            </h2>
            <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block mb-2 font-semibold"
                    style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                  >
                    Year *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        year: Number(e.target.value),
                      }))
                    }
                    min="2020"
                    max="2100"
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    className="block mb-2 font-semibold"
                    style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                  >
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    required
                  >
                    {semesterTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block mb-2 font-semibold"
                    style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                  >
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    className="block mb-2 font-semibold"
                    style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                  >
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200"
                  style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSemester(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200"
                  style={{ backgroundColor: darkMode ? "#6b7280" : "#9ca3af" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemesterList;
