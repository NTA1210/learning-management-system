import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { specialistService, majorService } from "../services";
import type { Specialist } from "../types/specialist";
import type { Major } from "../types/specialist";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { Search, ChevronDown, ChevronRight, MoreVertical, Plus, Edit, Trash2 } from "lucide-react";

interface MajorGroup {
  major: {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    updatedAt?: string;
  };
  specialists: Specialist[];
}

interface UngroupedSpecialist {
  specialist: Specialist;
}

const MajorsSpecialists: React.FC = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [majors, setMajors] = useState<Major[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [majorGroups, setMajorGroups] = useState<MajorGroup[]>([]);
  const [ungroupedSpecialists, setUngroupedSpecialists] = useState<UngroupedSpecialist[]>([]);
  const [expandedMajors, setExpandedMajors] = useState<Set<string>>(new Set());
  const [selectedMajors, setSelectedMajors] = useState<Set<string>>(new Set());
  const [contentPaddingLeft, setContentPaddingLeft] = useState(window.innerWidth >= 640 ? 93 : 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(25);
  const [totalMajors, setTotalMajors] = useState(0);
  const [sortOption, setSortOption] = useState<'name_asc' | 'name_desc' | 'date_asc' | 'date_desc'>('date_desc');
  
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
  const actionMenuRef = useRef<HTMLDivElement>(null);


  // Organize specialists into major groups - now using fetched majors
  useEffect(() => {
    // Create a map of specialists by majorId
    const specialistsByMajor = new Map<string, Specialist[]>();
    const ungrouped: UngroupedSpecialist[] = [];

    specialists.forEach(specialist => {
      if (specialist.majorId && specialist.majorId._id) {
        const majorId = specialist.majorId._id;
        if (!specialistsByMajor.has(majorId)) {
          specialistsByMajor.set(majorId, []);
        }
        specialistsByMajor.get(majorId)!.push(specialist);
      } else {
        ungrouped.push({ specialist });
      }
    });

    // Sort specialists within each group
    specialistsByMajor.forEach((specs) => {
      specs.sort((a, b) => {
        if (sortOption === 'name_asc') return a.name.localeCompare(b.name);
        if (sortOption === 'name_desc') return b.name.localeCompare(a.name);
        if (sortOption === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });

    // Create major groups from ALL majors (not just ones with specialists)
    const groups: MajorGroup[] = majors.map(major => ({
      major: {
        _id: major._id,
        name: major.name,
        slug: major.slug,
        description: major.description,
        updatedAt: major.updatedAt,
      },
      specialists: specialistsByMajor.get(major._id) || [],
    }));

    // Sort groups by major name
    const sortedGroups = groups.sort((a, b) => 
      a.major.name.localeCompare(b.major.name)
    );

    setMajorGroups(sortedGroups);
    setUngroupedSpecialists(ungrouped);
  }, [majors, specialists, sortOption]);

  const changePageLimit = (limit: number) => {
    setPageLimit(limit);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Map unified sort option to backend query
      const isName = sortOption === 'name_asc' || sortOption === 'name_desc';
      const order = (sortOption.endsWith('asc') ? 'asc' : 'desc') as 'asc' | 'desc';

      // Fetch both majors and specialists in parallel
      const [majorsResult, specialistsResult] = await Promise.all([
        majorService.getAllMajors({
          ...(searchTerm && { search: searchTerm }),
          page: currentPage,
          limit: pageLimit,
          ...(isName ? { sortBy: 'name' } : {}),
          ...(order ? { sortOrder: order } : {}),
        }),
        specialistService.getAllSpecialists({
          // Don't apply pagination to specialists - we want all of them to group under majors
          ...(isName ? { sortBy: 'name' } : {}),
          ...(order ? { sortOrder: order } : {}),
        }),
      ]);

      setMajors(majorsResult.majors);
      setSpecialists(specialistsResult.specialists);
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
    setExpandedMajors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(majorId)) {
        newSet.delete(majorId);
      } else {
        newSet.add(majorId);
      }
      return newSet;
    });
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

  const openEditModal = (specialist: Specialist) => {
    setEditingSpecialist(specialist);
    setFormData({
      name: specialist.name,
      slug: specialist.slug,
      description: specialist.description,
      majorId: specialist.majorId?._id || "",
    });
    setShowEditModal(true);
    setOpenActionMenu(null);
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Auto-expand all majors on initial load
  useEffect(() => {
    if (majorGroups.length > 0 && expandedMajors.size === 0) {
      const allMajorIds = majorGroups.map(g => g.major._id);
      setExpandedMajors(new Set(allMajorIds));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [majorGroups.length]);

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
                    Majors & Specialists
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
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search majors or specialists..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="p-2 rounded-lg text-white transition-all duration-200 flex items-center justify-center"
                  style={{ backgroundColor: darkMode ? '#4c1d95' : '#4f46e5' }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLElement).style.backgroundColor = darkMode ? '#5b21b6' : '#4338ca')
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.backgroundColor = darkMode ? '#4c1d95' : '#4f46e5')
                  }
                >
                  <Search size={20} />
                </button>
                {/* Sort options */}
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={e => setSortOption(e.target.value as 'name_asc'|'name_desc'|'date_asc'|'date_desc')}
                    className="appearance-none rounded-lg px-4 py-2 pr-10 border focus:outline-none focus:ring-2 transition-colors duration-200 shadow-sm"
                    style={{
                      width: 120,
                      fontWeight: 600,
                      background: darkMode ? '#152632' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      borderColor: darkMode ? '#334155' : '#e5e7eb',
                      boxShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 2px rgba(0,0,0,0.06)'
                    }}
                  >
                    <option value="name_asc">A-Z</option>
                    <option value="name_desc">Z-A</option>
                    <option value="date_asc">Oldest</option>
                    <option value="date_desc">Newest</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.062l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-3 mr-3 flex-wrap">
                  <div className="relative">
                    <select
                      value={pageLimit}
                      onChange={e => changePageLimit(Number(e.target.value))}
                      className="appearance-none rounded-lg px-4 py-2 pr-10 border focus:outline-none focus:ring-2 transition-colors duration-200 shadow-sm"
                      style={{
                        width: 135,
                        fontWeight: 600,
                        background: darkMode ? '#152632' : '#ffffff',
                        color: darkMode ? '#ffffff' : '#111827',
                        borderColor: darkMode ? '#334155' : '#e5e7eb',
                        boxShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 2px rgba(0,0,0,0.06)'
                      }}
                    >
                      {[5, 25, 50, 75, 100].map(l => (
                        <option key={l} value={l}>{l} / page</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                        aria-hidden="true"
                      >
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.062l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <span style={{
                    minWidth: 100,
                    fontVariantNumeric: 'tabular-nums',
                    color: darkMode ? '#e5e7eb' : '#223344'
                  }}>
                    {`${(pageLimit * (currentPage - 1)) + 1} – ${Math.min(pageLimit * currentPage, totalMajors)} of ${totalMajors}`}
                  </span>
                  <button
                    className="px-4 py-1 rounded border mx-1 disabled:opacity-40"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    title="Previous page"
                    style={{
                      background: darkMode ? '#223344' : '#ffffff',
                      color: darkMode ? '#fff' : '#223344',
                      borderColor: darkMode ? '#334155' : '#e5e7eb'
                    }}
                  >&#x2039;</button>
                  <button
                    className="px-4 py-1 rounded border mx-1 disabled:opacity-40"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={(pageLimit * currentPage) >= totalMajors}
                    title="Next page"
                    style={{
                      background: darkMode ? '#223344' : '#ffffff',
                      color: darkMode ? '#fff' : '#223344',
                      borderColor: darkMode ? '#334155' : '#e5e7eb'
                    }}
                  >&#x203A;</button>
                </div>
              </div>

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
                                  setSelectedMajors(new Set(majorGroups.map(g => g.major._id)));
                                } else {
                                  setSelectedMajors(new Set());
                                }
                              }}
                              checked={majorGroups.length > 0 && majorGroups.every(g => selectedMajors.has(g.major._id))}
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
                        {/* Major Groups */}
                        {majorGroups.map((group) => {
                          const isExpanded = expandedMajors.has(group.major._id);
                          const isSelected = selectedMajors.has(group.major._id);
                          
                          return (
                            <React.Fragment key={group.major._id}>
                              {/* Major Row */}
                              <tr
                                style={{
                                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                  borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = darkMode ? '#374151' : '#f9fafb';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = darkMode ? '#1f2937' : '#ffffff';
                                }}
                              >
                                <td style={{ padding: '12px 16px' }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleMajorSelection(group.major._id)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      cursor: 'pointer',
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => toggleMajor(group.major._id)}
                                      className="flex items-center justify-center rounded-full transition-all"
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        backgroundColor: darkMode ? '#4c1d95' : '#4f46e5',
                                        color: '#ffffff',
                                        border: 'none',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {isExpanded ? (
                                        <ChevronDown size={16} />
                                      ) : (
                                        <ChevronRight size={16} />
                                      )}
                                    </button>
                                    <span style={{ 
                                      fontWeight: 600,
                                      color: darkMode ? '#ffffff' : '#111827',
                                      fontSize: '14px'
                                    }}>
                                      {group.major.name}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                                  {group.major.description || '-'}
                                </td>
                                <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                                  {group.major.updatedAt ? new Date(group.major.updatedAt).toLocaleDateString('en-GB') : '-'}
                                </td>
                                <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                                  -
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: '#10b981',
                                      }}
                                    />
                                    <span style={{ 
                                      color: darkMode ? '#9ca3af' : '#6b7280',
                                      fontSize: '14px'
                                    }}>
                                      Active
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', position: 'relative' }}>
                                  <div ref={actionMenuRef} style={{ position: 'relative', display: 'inline-block' }}>
                                    <button
                                      className="p-1 rounded hover:bg-opacity-20 transition-colors"
                                      style={{
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: darkMode ? '#9ca3af' : '#6b7280',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = darkMode ? 'rgba(156, 163, 175, 0.2)' : 'rgba(107, 114, 128, 0.1)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                      onClick={() => setOpenActionMenu(openActionMenu === `major-${group.major._id}` ? null : `major-${group.major._id}`)}
                                    >
                                      <MoreVertical size={18} />
                                    </button>
                                    {openActionMenu === `major-${group.major._id}` && (
                                      <div
                                        style={{
                                          position: 'absolute',
                                          right: 0,
                                          top: '100%',
                                          marginTop: '4px',
                                          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                          border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                                          borderRadius: '8px',
                                          boxShadow: darkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)',
                                          zIndex: 1000,
                                          minWidth: '150px',
                                        }}
                                      >
                                        <button
                                          className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
                                          style={{
                                            color: darkMode ? '#d1d5db' : '#374151',
                                            fontSize: '14px',
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(156, 163, 175, 0.2)' : 'rgba(107, 114, 128, 0.1)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                          }}
                                          onClick={() => {
                                            setFormData({ name: "", slug: "", description: "", majorId: group.major._id });
                                            setShowCreateModal(true);
                                            setOpenActionMenu(null);
                                          }}
                                        >
                                          <Plus size={16} />
                                          Add Specialist
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {/* Specialist Rows (nested) */}
                              {isExpanded && (
                                group.specialists.length > 0 ? (
                                  group.specialists.map((specialist) => (
                                    <tr
                                      key={specialist._id}
                                      style={{
                                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                        borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = darkMode ? '#374151' : '#f9fafb';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = darkMode ? '#1f2937' : '#ffffff';
                                      }}
                                    >
                                      <td style={{ padding: '12px 16px' }}>
                                        {/* Empty for alignment */}
                                      </td>
                                      <td style={{ padding: '12px 16px' }}>
                                        <div className="flex items-center" style={{ position: 'relative', paddingLeft: '56px' }}>
                                          {/* Vertical line connector - connects to parent expand icon */}
                                          <div style={{
                                            position: 'absolute',
                                            left: '13px',
                                            top: '-12px',
                                            bottom: '50%',
                                            width: '2px',
                                            backgroundColor: darkMode ? '#4c1d95' : '#4f46e5',
                                          }} />
                                          <div style={{
                                            position: 'absolute',
                                            left: '13px',
                                            top: '50%',
                                            height: '2px',
                                            width: '16px',
                                            backgroundColor: darkMode ? '#4c1d95' : '#4f46e5',
                                          }} />
                                          <span style={{ 
                                            color: darkMode ? '#d1d5db' : '#374151',
                                            fontSize: '14px',
                                          }}>
                                            {specialist.name}
                                          </span>
                                        </div>
                                      </td>
                                      <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                                        {specialist.description || '-'}
                                      </td>
                                      <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                                        {new Date(specialist.updatedAt).toLocaleDateString('en-GB')}
                                      </td>
                                      <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                                        {new Date(specialist.createdAt).toLocaleDateString('en-GB')}
                                      </td>
                                      <td style={{ padding: '12px 16px' }}>
                                        <div className="flex items-center gap-2">
                                          <div
                                            style={{
                                              width: '8px',
                                              height: '8px',
                                              borderRadius: '50%',
                                              backgroundColor: specialist.isActive ? '#10b981' : '#9ca3af',
                                            }}
                                          />
                                          <span style={{ 
                                            color: darkMode ? '#9ca3af' : '#6b7280',
                                            fontSize: '14px'
                                          }}>
                                            {specialist.isActive ? 'Active' : 'Inactive'}
                                          </span>
                                        </div>
                                      </td>
                                      <td style={{ padding: '12px 16px', textAlign: 'center', position: 'relative' }}>
                                        <div ref={actionMenuRef} style={{ position: 'relative', display: 'inline-block' }}>
                                          <button
                                            className="p-1 rounded hover:bg-opacity-20 transition-colors"
                                            style={{
                                              backgroundColor: 'transparent',
                                              border: 'none',
                                              cursor: 'pointer',
                                              color: darkMode ? '#9ca3af' : '#6b7280',
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.backgroundColor = darkMode ? 'rgba(156, 163, 175, 0.2)' : 'rgba(107, 114, 128, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                            onClick={() => setOpenActionMenu(openActionMenu === specialist._id ? null : specialist._id)}
                                          >
                                            <MoreVertical size={18} />
                                          </button>
                                          {openActionMenu === specialist._id && (
                                            <div
                                              style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: '100%',
                                                marginTop: '4px',
                                                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                                border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                                                borderRadius: '8px',
                                                boxShadow: darkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)',
                                                zIndex: 1000,
                                                minWidth: '150px',
                                              }}
                                            >
                                              <button
                                                className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
                                                style={{
                                                  color: darkMode ? '#d1d5db' : '#374151',
                                                  fontSize: '14px',
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.backgroundColor = darkMode ? 'rgba(156, 163, 175, 0.2)' : 'rgba(107, 114, 128, 0.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                                onClick={() => openEditModal(specialist)}
                                              >
                                                <Edit size={16} />
                                                Edit
                                              </button>
                                              <button
                                                className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
                                                style={{
                                                  color: darkMode ? '#fca5a5' : '#dc2626',
                                                  fontSize: '14px',
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.backgroundColor = darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                                onClick={() => {
                                                  handleDeleteSpecialist(specialist._id);
                                                  setOpenActionMenu(null);
                                                }}
                                              >
                                                <Trash2 size={16} />
                                                Delete
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr
                                    style={{
                                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                      borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                                    }}
                                  >
                                    <td style={{ padding: '12px 16px' }}>
                                      {/* Empty for alignment */}
                                    </td>
                                    <td colSpan={6} style={{ padding: '12px 16px', paddingLeft: '56px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px', fontStyle: 'italic' }}>
                                      No specialists for this major
                                    </td>
                                  </tr>
                                )
                              )}
                            </React.Fragment>
                          );
                        })}

                        {/* Ungrouped Specialists */}
                        {ungroupedSpecialists.length > 0 && (
                          <>
                            {/* Header row for ungrouped specialists */}
                            <tr
                              style={{
                                backgroundColor: darkMode ? '#111827' : '#f9fafb',
                                borderTop: `2px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                                borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                              }}
                            >
                              <td colSpan={7} style={{ 
                                padding: '16px',
                                fontWeight: 600,
                                fontSize: '14px',
                                color: darkMode ? '#d1d5db' : '#374151',
                              }}>
                                Ungrouped Specialists
                              </td>
                            </tr>
                            {ungroupedSpecialists.map((item) => (
                              <tr
                                key={item.specialist._id}
                                style={{
                                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                  borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = darkMode ? '#374151' : '#f9fafb';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = darkMode ? '#1f2937' : '#ffffff';
                                }}
                              >
                                <td style={{ padding: '12px 16px' }}>
                                  {/* Empty for alignment */}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <span style={{ 
                                    color: darkMode ? '#d1d5db' : '#374151',
                                    fontSize: '14px'
                                  }}>
                                    {item.specialist.name}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                                  {item.specialist.description || '-'}
                                </td>
                                <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                                  {new Date(item.specialist.updatedAt).toLocaleDateString('en-GB')}
                                </td>
                                <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                                  {new Date(item.specialist.createdAt).toLocaleDateString('en-GB')}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: item.specialist.isActive ? '#10b981' : '#9ca3af',
                                      }}
                                    />
                                    <span style={{ 
                                      color: darkMode ? '#9ca3af' : '#6b7280',
                                      fontSize: '14px'
                                    }}>
                                      {item.specialist.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', position: 'relative' }}>
                                  <div ref={actionMenuRef} style={{ position: 'relative', display: 'inline-block' }}>
                                    <button
                                      className="p-1 rounded hover:bg-opacity-20 transition-colors"
                                      style={{
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: darkMode ? '#9ca3af' : '#6b7280',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = darkMode ? 'rgba(156, 163, 175, 0.2)' : 'rgba(107, 114, 128, 0.1)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                      onClick={() => setOpenActionMenu(openActionMenu === item.specialist._id ? null : item.specialist._id)}
                                    >
                                      <MoreVertical size={18} />
                                    </button>
                                    {openActionMenu === item.specialist._id && (
                                      <div
                                        style={{
                                          position: 'absolute',
                                          right: 0,
                                          top: '100%',
                                          marginTop: '4px',
                                          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                          border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                                          borderRadius: '8px',
                                          boxShadow: darkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)',
                                          zIndex: 1000,
                                          minWidth: '150px',
                                        }}
                                      >
                                        <button
                                          className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
                                          style={{
                                            color: darkMode ? '#d1d5db' : '#374151',
                                            fontSize: '14px',
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(156, 163, 175, 0.2)' : 'rgba(107, 114, 128, 0.1)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                          }}
                                          onClick={() => openEditModal(item.specialist)}
                                        >
                                          <Edit size={16} />
                                          Edit
                                        </button>
                                        <button
                                          className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
                                          style={{
                                            color: darkMode ? '#fca5a5' : '#dc2626',
                                            fontSize: '14px',
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                          }}
                                          onClick={() => {
                                            handleDeleteSpecialist(item.specialist._id);
                                            setOpenActionMenu(null);
                                          }}
                                        >
                                          <Trash2 size={16} />
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && majorGroups.length === 0 && ungroupedSpecialists.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                  >
                    No specialists found
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
        {showCreateModal && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateModal(false);
                setFormData({ name: "", slug: "", description: "", majorId: "" });
              }
            }}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              style={{ 
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: darkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>Create New Specialist</h2>
              <form onSubmit={handleCreateSpecialist} className="space-y-4">
                <div>
                  <label className="block mb-2 font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>Major (Optional)</label>
                  <select
                    value={formData.majorId}
                    onChange={(e) => setFormData({ ...formData, majorId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                  >
                    <option value="">None (Ungrouped)</option>
                    {majors.map(major => (
                      <option key={major._id} value={major._id}>{major.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200"
                    style={{ backgroundColor: darkMode ? '#059669' : '#10b981' }}
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ name: "", slug: "", description: "", majorId: "" });
                    }}
                    className="flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200"
                    style={{ backgroundColor: darkMode ? '#6b7280' : '#9ca3af' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Specialist Modal */}
        {showEditModal && editingSpecialist && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEditModal(false);
                setEditingSpecialist(null);
                setFormData({ name: "", slug: "", description: "", majorId: "" });
              }
            }}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              style={{ 
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: darkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>Edit Specialist</h2>
              <form onSubmit={handleEditSpecialist} className="space-y-4">
                <div>
                  <label className="block mb-2 font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>Major (Optional)</label>
                  <select
                    value={formData.majorId}
                    onChange={(e) => setFormData({ ...formData, majorId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                  >
                    <option value="">None (Ungrouped)</option>
                    {majors.map(major => (
                      <option key={major._id} value={major._id}>{major.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200"
                    style={{ backgroundColor: darkMode ? '#4c1d95' : '#4f46e5' }}
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingSpecialist(null);
                      setFormData({ name: "", slug: "", description: "", majorId: "" });
                    }}
                    className="flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200"
                    style={{ backgroundColor: darkMode ? '#6b7280' : '#9ca3af' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MajorsSpecialists;
