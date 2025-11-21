import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { specialistService, majorService, subjectService, courseService } from "../services";
import type { Specialist } from "../types/specialist";
import type { MajorNode, SpecialistNode, SubjectNode } from "../types/curriculum";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { Plus } from "lucide-react";
import SearchFilters from "../components/curriculum/SearchFilters";
import MajorRow from "../components/curriculum/MajorRow";
import SpecialistModal from "../components/curriculum/SpecialistModal";

const Curriculum: React.FC = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [majors, setMajors] = useState<MajorNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMajors, setExpandedMajors] = useState<Set<string>>(new Set());
  const [expandedSpecialists, setExpandedSpecialists] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [selectedMajors, setSelectedMajors] = useState<Set<string>>(new Set());
  const [contentPaddingLeft, setContentPaddingLeft] = useState(window.innerWidth >= 640 ? 93 : 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(25);
  const [totalMajors, setTotalMajors] = useState(0);
  const [sortOption, setSortOption] = useState<'name_asc' | 'name_desc' | 'date_asc' | 'date_desc'>('date_desc');
  const majorsRef = useRef<MajorNode[]>([]);
  
  useEffect(() => {
    majorsRef.current = majors;
  }, [majors]);
  
  // CRUD states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    majorId: "",
  });


  const changePageLimit = (limit: number) => {
    setPageLimit(limit);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const loadSpecialistsForMajor = useCallback(async (majorId: string, force = false) => {
    const currentMajor = majorsRef.current.find((major) => major._id === majorId);
    if (currentMajor?.specialistsLoaded && !force) {
      return;
    }

    setMajors((prev) =>
      prev.map((major) =>
        major._id === majorId
          ? {
              ...major,
              specialistsLoading: true,
              specialistsError: "",
            }
          : major
      )
    );

    const isNameSort = sortOption === "name_asc" || sortOption === "name_desc";
    const order = sortOption.endsWith("asc") ? "asc" : "desc";

    try {
      const { specialists } = await specialistService.getAllSpecialists({
        majorId,
        limit: 100,
        ...(isNameSort ? { sortBy: "title" as const } : {}),
        sortOrder: order,
      });

      setMajors((prev) =>
        prev.map((major) => {
          if (major._id !== majorId) return major;

          const existingSpecialists = major.specialists || [];
          const existingMap = new Map(existingSpecialists.map((spec) => [spec._id, spec]));

          const specialistNodes: SpecialistNode[] = specialists.map((spec) => {
            const existing = existingMap.get(spec._id);
            return {
              ...existing,
              ...spec,
              subjects: existing?.subjects || [],
              subjectsLoaded: existing?.subjectsLoaded ?? false,
              subjectsLoading: false,
              subjectsError: existing?.subjectsError || "",
            };
          });

          return {
            ...major,
            specialists: specialistNodes,
            specialistsLoaded: true,
            specialistsLoading: false,
            specialistsError: "",
          };
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load specialists";
      setMajors((prev) =>
        prev.map((major) =>
          major._id === majorId
            ? {
                ...major,
                specialistsLoading: false,
                specialistsError: message,
              }
            : major
        )
      );
    }
  }, [sortOption]);

  const loadSubjectsForSpecialist = async (majorId: string, specialistId: string, force = false) => {
    const currentMajor = majorsRef.current.find((major) => major._id === majorId);
    const currentSpecialist = currentMajor?.specialists?.find((spec) => spec._id === specialistId);
    if (currentSpecialist?.subjectsLoaded && !force) {
      return;
    }

    setMajors((prev) =>
      prev.map((major) => {
        if (major._id !== majorId) return major;
        return {
          ...major,
          specialists: (major.specialists || []).map((spec) =>
            spec._id === specialistId
              ? { ...spec, subjectsLoading: true, subjectsError: "" }
              : spec
          ),
        };
      })
    );

    try {
      const subjectsResponse = await subjectService.getAllSubjects({
        specialistId,
        limit: 100,
        sortBy: "title",
        sortOrder: "asc",
      });

      const subjects = subjectsResponse.data || [];

      setMajors((prev) =>
        prev.map((major) => {
          if (major._id !== majorId) return major;
          return {
            ...major,
            specialists: (major.specialists || []).map((spec) => {
              if (spec._id !== specialistId) return spec;

              const existingSubjects = spec.subjects || [];
              const existingMap = new Map(existingSubjects.map((subject) => [subject._id, subject]));

              const subjectNodes: SubjectNode[] = subjects.map((subject) => {
                const existing = existingMap.get(subject._id);
                return {
                  ...existing,
                  ...subject,
                  courses: existing?.courses || [],
                  coursesLoaded: existing?.coursesLoaded ?? false,
                  coursesLoading: false,
                  coursesError: existing?.coursesError || "",
                };
              });

              return {
                ...spec,
                subjects: subjectNodes,
                subjectsLoaded: true,
                subjectsLoading: false,
                subjectsError: "",
              };
            }),
          };
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load subjects";
      setMajors((prev) =>
        prev.map((major) => {
          if (major._id !== majorId) return major;
          return {
            ...major,
            specialists: (major.specialists || []).map((spec) =>
              spec._id === specialistId
                ? { ...spec, subjectsLoading: false, subjectsError: message }
                : spec
            ),
          };
        })
      );
    }
  };

  const loadCoursesForSubject = async (majorId: string, specialistId: string, subjectId: string, force = false) => {
    const currentMajor = majorsRef.current.find((major) => major._id === majorId);
    const currentSpecialist = currentMajor?.specialists?.find((spec) => spec._id === specialistId);
    const currentSubject = currentSpecialist?.subjects?.find((subj) => subj._id === subjectId);

    if (currentSubject?.coursesLoaded && !force) {
      return;
    }

    setMajors((prev) =>
      prev.map((major) => {
        if (major._id !== majorId) return major;
        return {
          ...major,
          specialists: (major.specialists || []).map((spec) => {
            if (spec._id !== specialistId) return spec;
            return {
              ...spec,
              subjects: (spec.subjects || []).map((subj) =>
                subj._id === subjectId
                  ? { ...subj, coursesLoading: true, coursesError: "" }
                  : subj
              ),
            };
          }),
        };
      })
    );

    try {
      const { courses } = await courseService.getAllCourses({
        subjectId,
        limit: 100,
        sortBy: "title",
        sortOrder: "asc",
      });

      setMajors((prev) =>
        prev.map((major) => {
          if (major._id !== majorId) return major;
          return {
            ...major,
            specialists: (major.specialists || []).map((spec) => {
              if (spec._id !== specialistId) return spec;
              return {
                ...spec,
                subjects: (spec.subjects || []).map((subj) =>
                  subj._id === subjectId
                    ? {
                        ...subj,
                        courses,
                        coursesLoaded: true,
                        coursesLoading: false,
                        coursesError: "",
                      }
                    : subj
                ),
              };
            }),
          };
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load courses";
      setMajors((prev) =>
        prev.map((major) => {
          if (major._id !== majorId) return major;
          return {
            ...major,
            specialists: (major.specialists || []).map((spec) => {
              if (spec._id !== specialistId) return spec;
              return {
                ...spec,
                subjects: (spec.subjects || []).map((subj) =>
                  subj._id === subjectId
                    ? {
                        ...subj,
                        coursesLoading: false,
                        coursesError: message,
                      }
                    : subj
                ),
              };
            }),
          };
        })
      );
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Map unified sort option to backend query
      const isName = sortOption === 'name_asc' || sortOption === 'name_desc';
      const order = (sortOption.endsWith('asc') ? 'asc' : 'desc') as 'asc' | 'desc';

      const majorsResult = await majorService.getAllMajors({
          ...(searchTerm && { search: searchTerm }),
          page: currentPage,
          limit: pageLimit,
          ...(isName ? { sortBy: 'title' } : {}),
          ...(order ? { sortOrder: order } : {}),
      });

      setMajors((prev) => {
        const prevMap = new Map(prev.map((major) => [major._id, major]));
        return majorsResult.majors.map((major) => {
          const existing = prevMap.get(major._id);
          return {
            ...existing,
            ...major,
            specialists: existing?.specialists || [],
            specialistsLoaded: existing?.specialistsLoaded ?? false,
            specialistsLoading: existing?.specialistsLoading ?? false,
            specialistsError: existing?.specialistsError || "",
          };
        });
      });
      setError("");
      
      if (majorsResult.pagination && typeof majorsResult.pagination === 'object') {
        if ('total' in majorsResult.pagination)
          setTotalMajors(majorsResult.pagination.total as number);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData();
  };

  const toggleMajor = (majorId: string) => {
    const isExpanded = expandedMajors.has(majorId);
    setExpandedMajors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(majorId)) {
        newSet.delete(majorId);
      } else {
        newSet.add(majorId);
      }
      return newSet;
    });

    if (!isExpanded) {
      const targetMajor = majors.find((major) => major._id === majorId);
      if (targetMajor && (!targetMajor.specialistsLoaded || targetMajor.specialistsError)) {
        void loadSpecialistsForMajor(majorId);
      }
    }
  };

  const toggleSpecialist = (majorId: string, specialistId: string) => {
    const isExpanded = expandedSpecialists.has(specialistId);
    setExpandedSpecialists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(specialistId)) {
        newSet.delete(specialistId);
      } else {
        newSet.add(specialistId);
      }
      return newSet;
    });

    if (!isExpanded) {
      const majorNode = majors.find((major) => major._id === majorId);
      const specialistNode = majorNode?.specialists?.find((spec) => spec._id === specialistId);
      if (specialistNode && (!specialistNode.subjectsLoaded || specialistNode.subjectsError)) {
        void loadSubjectsForSpecialist(majorId, specialistId);
      }
    }
  };

  const toggleSubject = (majorId: string, specialistId: string, subjectId: string) => {
    const isExpanded = expandedSubjects.has(subjectId);
    setExpandedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });

    if (!isExpanded) {
      const majorNode = majors.find((major) => major._id === majorId);
      const specialistNode = majorNode?.specialists?.find((spec) => spec._id === specialistId);
      const subjectNode = specialistNode?.subjects?.find((subj) => subj._id === subjectId);
      if (subjectNode && (!subjectNode.coursesLoaded || subjectNode.coursesError)) {
        void loadCoursesForSubject(majorId, specialistId, subjectId);
      }
    }
  };

  const toggleMajorSelection = (majorId: string) => {
    setSelectedMajors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(majorId)) {
        newSet.delete(majorId);
      } else {
        newSet.add(majorId);
      }
      return newSet;
    });
  };

  // CRUD Handlers
  const handleCreateSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await specialistService.createSpecialist({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        majorId: formData.majorId || undefined,
      });
      setShowCreateModal(false);
      setFormData({ name: "", slug: "", description: "", majorId: "" });
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create specialist");
    }
  };

  const handleEditSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpecialist) return;
    try {
      await specialistService.updateSpecialist(editingSpecialist._id, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        majorId: formData.majorId || undefined,
      });
      setShowEditModal(false);
      setEditingSpecialist(null);
      setFormData({ name: "", slug: "", description: "", majorId: "" });
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update specialist");
    }
  };

  const handleDeleteSpecialist = async (id: string) => {
    if (!confirm("Are you sure you want to delete this specialist?")) return;
    try {
      await specialistService.deleteSpecialist(id);
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete specialist");
    }
  };

  const openEditModal = (specialistId: string) => {
    const majorNode = majors.find((major) =>
      major.specialists?.some((spec) => spec._id === specialistId)
    );
    const specialist = majorNode?.specialists?.find((spec) => spec._id === specialistId);
    if (specialist) {
    setEditingSpecialist(specialist);
    setFormData({
      name: specialist.name,
      slug: specialist.slug,
      description: specialist.description,
      majorId: specialist.majorId?._id || "",
    });
    setShowEditModal(true);
        setOpenActionMenu(null);
      }
    };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleResize() {
      setContentPaddingLeft(window.innerWidth >= 640 ? 93 : 0);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch data on param change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [currentPage, pageLimit, sortOption]);

  // Auto-expand the first major on initial load
  useEffect(() => {
    if (majors.length > 0 && expandedMajors.size === 0) {
      const firstMajorId = majors[0]._id;
      setExpandedMajors(new Set([firstMajorId]));
      void loadSpecialistsForMajor(firstMajorId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [majors.length]);

  return (
    <>
      <div
        className="flex h-screen overflow-hidden relative"
        style={{
          backgroundColor: darkMode ? '#1a202c' : '#f8fafc',
          color: darkMode ? '#ffffff' : '#1e293b'
        }}
      >
        {/* Navigation */}
        <Navbar />

        {/* Sidebar */}
        <Sidebar role={(user?.role as 'admin' | 'teacher' | 'student') || 'student'} />

        {/* Main Content */}
        <div className="flex flex-col flex-1 w-0 overflow-hidden" style={{ paddingLeft: contentPaddingLeft, backgroundColor: darkMode ? '#1f2937' : '#f0f0f0' }}>
          <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16">
            <div className="max-w-full mx-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1
                    className="text-3xl font-bold mb-2"
                    style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                  >
                    Curriculum
                  </h1>
                  <p
                    style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                  >
                    Browse majors and their associated specialists
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 rounded-lg text-white flex items-center transition-all duration-200"
                    style={{ backgroundColor: darkMode ? '#059669' : '#10b981' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#047857' : '#059669'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#059669' : '#10b981'}
                    onClick={() => {
                      setFormData({ name: "", slug: "", description: "", majorId: "" });
                      setShowCreateModal(true);
                    }}
                  >
                    <Plus size={18} className="mr-2" />
                    Create Specialist
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-white flex items-center transition-all duration-200"
                    style={{ backgroundColor: darkMode ? '#4c1d95' : '#4f46e5' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#5b21b6' : '#4338ca'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4c1d95' : '#4f46e5'}
                    onClick={fetchData}
                  >
                    <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>

              {/* Search and Filter Controls */}
              <SearchFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearch={handleSearch}
                sortOption={sortOption}
                onSortChange={setSortOption}
                pageLimit={pageLimit}
                onPageLimitChange={changePageLimit}
                currentPage={currentPage}
                totalMajors={totalMajors}
                onPageChange={goToPage}
              />

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: darkMode ? '#6366f1' : '#4f46e5' }}></div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div
                  className="p-4 rounded-lg mb-6 flex items-center"
                  style={{
                    backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
                    color: darkMode ? '#fca5a5' : '#dc2626'
                  }}
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Table View */}
              {!loading && !error && (
                <div 
                  className="rounded-lg overflow-hidden border"
                  style={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    borderColor: darkMode ? '#374151' : '#e5e7eb',
                  }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{
                          backgroundColor: darkMode ? '#111827' : '#f9fafb',
                          borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        }}>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'left', 
                            fontWeight: 600,
                            fontSize: '14px',
                            color: darkMode ? '#d1d5db' : '#374151',
                            width: '40px'
                          }}>
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMajors(new Set(majors.map(g => g._id)));
                                } else {
                                  setSelectedMajors(new Set());
                                }
                              }}
                              checked={majors.length > 0 && majors.every(g => selectedMajors.has(g._id))}
                              style={{
                                width: '16px',
                                height: '16px',
                                cursor: 'pointer',
                              }}
                            />
                          </th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'left', 
                            fontWeight: 600,
                            fontSize: '14px',
                            color: darkMode ? '#d1d5db' : '#374151',
                          }}>
                            Major / Specialist Name
                          </th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'left', 
                            fontWeight: 600,
                            fontSize: '14px',
                            color: darkMode ? '#d1d5db' : '#374151',
                          }}>
                            Description
                          </th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'left', 
                            fontWeight: 600,
                            fontSize: '14px',
                            color: darkMode ? '#d1d5db' : '#374151',
                            width: '120px'
                          }}>
                            Date Updated
                          </th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'left', 
                            fontWeight: 600,
                            fontSize: '14px',
                            color: darkMode ? '#d1d5db' : '#374151',
                            width: '120px'
                          }}>
                            Date Created
                          </th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'left', 
                            fontWeight: 600,
                            fontSize: '14px',
                            color: darkMode ? '#d1d5db' : '#374151',
                            width: '100px'
                          }}>
                            Status
                          </th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'center', 
                            fontWeight: 600,
                            fontSize: '14px',
                            color: darkMode ? '#d1d5db' : '#374151',
                            width: '80px'
                          }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {majors.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: darkMode ? "#9ca3af" : "#6b7280" }}>
                              No majors found.
                                </td>
                              </tr>
                        ) : (
                          majors.map((major) => {
                            const isExpanded = expandedMajors.has(major._id);
                            const isSelected = selectedMajors.has(major._id);

                            return (
                              <MajorRow
                                key={major._id}
                                major={major}
                                isExpanded={isExpanded}
                                isSelected={isSelected}
                                onToggle={() => toggleMajor(major._id)}
                                onSelect={() => toggleMajorSelection(major._id)}
                                onLoadSpecialists={() => loadSpecialistsForMajor(major._id, true)}
                                openActionMenu={openActionMenu}
                                onActionMenuToggle={(id) => setOpenActionMenu(openActionMenu === id ? null : id)}
                                onActionMenuClose={() => setOpenActionMenu(null)}
                                onAddSpecialist={() => {
                                  setFormData({ name: "", slug: "", description: "", majorId: major._id });
                                  setShowCreateModal(true);
                                }}
                                expandedSpecialists={expandedSpecialists}
                                expandedSubjects={expandedSubjects}
                                onToggleSpecialist={(specialistId) => toggleSpecialist(major._id, specialistId)}
                                onToggleSubject={(specialistId, subjectId) => toggleSubject(major._id, specialistId, subjectId)}
                                onLoadSubjects={(specialistId) => loadSubjectsForSpecialist(major._id, specialistId)}
                                onLoadCourses={(specialistId, subjectId) => loadCoursesForSubject(major._id, specialistId, subjectId)}
                                onEditSpecialist={openEditModal}
                                onDeleteSpecialist={handleDeleteSpecialist}
                              />
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && majors.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                  >
                    No curriculum found
                  </h3>
                  <p
                    style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                  >
                    No majors or specialists match your search criteria
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Create Specialist Modal */}
        <SpecialistModal
          isOpen={showCreateModal}
          onClose={() => {
                setShowCreateModal(false);
                setFormData({ name: "", slug: "", description: "", majorId: "" });
          }}
          onSubmit={handleCreateSpecialist}
          title="Create New Specialist"
          formData={formData}
          onFormDataChange={setFormData}
          majors={majors}
          submitLabel="Create"
        />

        {/* Edit Specialist Modal */}
        <SpecialistModal
          isOpen={showEditModal && !!editingSpecialist}
          onClose={() => {
                setShowEditModal(false);
                setEditingSpecialist(null);
                setFormData({ name: "", slug: "", description: "", majorId: "" });
          }}
          onSubmit={handleEditSpecialist}
          title="Edit Specialist"
          formData={formData}
          onFormDataChange={setFormData}
          majors={majors}
          submitLabel="Update"
        />
      </div>
    </>
  );
};

export default Curriculum;

