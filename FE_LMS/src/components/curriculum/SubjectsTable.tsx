import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { subjectService, specialistService } from '../../services';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import type { SubjectNode, SpecialistNode } from '../../types/curriculum';

interface SubjectsTableProps {
    onOpenSubjectModal: (subject?: SubjectNode, context?: { specialistId: string; specialistName: string }) => void;
    onDeleteSubject: (subjectId: string) => void;
    refreshTrigger?: number;
}

const SubjectsTable: React.FC<SubjectsTableProps> = ({ onOpenSubjectModal, onDeleteSubject, refreshTrigger }) => {
    const { darkMode } = useTheme();
    const [subjects, setSubjects] = useState<SubjectNode[]>([]);
    const [specialists, setSpecialists] = useState<SpecialistNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialist, setSelectedSpecialist] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalSubjects, setTotalSubjects] = useState(0);
    const pageLimit = 10;

    const fetchSpecialists = async () => {
        try {
            const response = await specialistService.getAllSpecialists({ limit: 100 });
            setSpecialists(response.specialists);
        } catch (err) {
            console.error('Failed to fetch specialists:', err);
        }
    };

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const response = await subjectService.getAllSubjects({
                page: currentPage,
                limit: pageLimit,
                ...(searchTerm && { search: searchTerm }),
                ...(selectedSpecialist && { specialistId: selectedSpecialist }),
                sortBy: 'title',
                sortOrder: 'asc',
            });
            setSubjects(response.data || []);
            if (response.pagination && typeof response.pagination === 'object' && 'total' in response.pagination) {
                setTotalSubjects(response.pagination.total as number);
            }
        } catch (err) {
            console.error('Failed to fetch subjects:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpecialists();
    }, []);

    useEffect(() => {
        fetchSubjects();
        // eslint-disable-next-line
    }, [currentPage, searchTerm, selectedSpecialist, refreshTrigger]);

    const totalPages = Math.ceil(totalSubjects / pageLimit);

    const getSpecialistNames = (subject: SubjectNode): string => {
        if (!subject.specialistIds || subject.specialistIds.length === 0) return '-';

        const specialistNames = subject.specialistIds.map((id) => {
            if (typeof id === 'object' && 'name' in id) {
                return (id as any).name;
            }
            const specialist = specialists.find(s => s._id === id);
            return specialist?.name || '?';
        }).filter(Boolean);

        return specialistNames.join(', ') || '-';
    };

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: darkMode ? '#9ca3af' : '#6b7280',
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10 pr-4 py-2 rounded-lg border"
                            style={{
                                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                borderColor: darkMode ? '#374151' : '#d1d5db',
                                color: darkMode ? '#ffffff' : '#111827',
                                width: '300px',
                            }}
                        />
                    </div>
                    <select
                        value={selectedSpecialist}
                        onChange={(e) => {
                            setSelectedSpecialist(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-3 py-2 rounded-lg border"
                        style={{
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            borderColor: darkMode ? '#374151' : '#d1d5db',
                            color: darkMode ? '#ffffff' : '#111827',
                        }}
                    >
                        <option value="">All Specialists</option>
                        {specialists.map((specialist) => (
                            <option key={specialist._id} value={specialist._id}>
                                {specialist.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => {
                        // If specialist is selected, pre-fill the modal
                        if (selectedSpecialist) {
                            const specialist = specialists.find(s => s._id === selectedSpecialist);
                            if (specialist) {
                                onOpenSubjectModal(undefined, {
                                    specialistId: specialist._id,
                                    specialistName: specialist.name,
                                });
                                return;
                            }
                        }
                        onOpenSubjectModal();
                    }}
                    className="px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-all"
                    style={{ backgroundColor: darkMode ? '#7c3aed' : '#8b5cf6' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = darkMode ? '#6d28d9' : '#7c3aed')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = darkMode ? '#7c3aed' : '#8b5cf6')}
                >
                    <Plus size={18} />
                    Create Subject
                </button>
            </div>

            {/* Table */}
            <div
                className="rounded-lg overflow-hidden border"
                style={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    borderColor: darkMode ? '#374151' : '#e5e7eb',
                }}
            >
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr
                            style={{
                                backgroundColor: darkMode ? '#111827' : '#f9fafb',
                                borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                            }}
                        >
                            <th
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: darkMode ? '#d1d5db' : '#374151',
                                    width: '100px',
                                }}
                            >
                                Code
                            </th>
                            <th
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: darkMode ? '#d1d5db' : '#374151',
                                }}
                            >
                                Name
                            </th>
                            <th
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: darkMode ? '#d1d5db' : '#374151',
                                    width: '80px',
                                }}
                            >
                                Credits
                            </th>
                            <th
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: darkMode ? '#d1d5db' : '#374151',
                                }}
                            >
                                Specialists
                            </th>
                            <th
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: darkMode ? '#d1d5db' : '#374151',
                                    width: '80px',
                                }}
                            >
                                Status
                            </th>
                            <th
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: darkMode ? '#d1d5db' : '#374151',
                                    width: '100px',
                                }}
                            >
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                    Loading...
                                </td>
                            </tr>
                        ) : subjects.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                    No subjects found.
                                </td>
                            </tr>
                        ) : (
                            subjects.map((subject) => (
                                <tr
                                    key={subject._id}
                                    style={{
                                        borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                                    }}
                                >
                                    <td style={{ padding: '12px 16px', color: darkMode ? '#c4b5fd' : '#7c3aed', fontWeight: 500 }}>
                                        {subject.code || '-'}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: darkMode ? '#ffffff' : '#111827', fontWeight: 500 }}>
                                        {subject.name}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                                        {subject.credits ?? '-'}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                                        {getSpecialistNames(subject)}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <span
                                            className="px-2 py-1 rounded-full text-xs font-medium"
                                            style={{
                                                backgroundColor: subject.isActive
                                                    ? darkMode ? '#065f46' : '#d1fae5'
                                                    : darkMode ? '#374151' : '#f3f4f6',
                                                color: subject.isActive
                                                    ? darkMode ? '#6ee7b7' : '#047857'
                                                    : darkMode ? '#9ca3af' : '#6b7280',
                                            }}
                                        >
                                            {subject.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    // Get first specialist for context
                                                    const firstSpecialistId = subject.specialistIds?.[0];
                                                    if (firstSpecialistId) {
                                                        const specialistId = typeof firstSpecialistId === 'object'
                                                            ? (firstSpecialistId as any)._id
                                                            : firstSpecialistId;
                                                        const specialist = specialists.find(s => s._id === specialistId);
                                                        if (specialist) {
                                                            onOpenSubjectModal(subject, {
                                                                specialistId: specialist._id,
                                                                specialistName: specialist.name,
                                                            });
                                                            return;
                                                        }
                                                    }
                                                    onOpenSubjectModal(subject);
                                                }}
                                                className="p-1.5 rounded transition-colors"
                                                style={{ color: darkMode ? '#60a5fa' : '#3b82f6' }}
                                                title="Edit"
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = darkMode ? '#1e3a8a' : '#eff6ff')}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteSubject(subject._id)}
                                                className="p-1.5 rounded transition-colors"
                                                style={{ color: darkMode ? '#f87171' : '#ef4444' }}
                                                title="Delete"
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = darkMode ? '#7f1d1d' : '#fee2e2')}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded"
                        style={{
                            backgroundColor: darkMode ? '#374151' : '#f9fafb',
                            color: currentPage === 1 ? (darkMode ? '#6b7280' : '#9ca3af') : (darkMode ? '#ffffff' : '#111827'),
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Previous
                    </button>
                    <span style={{ padding: '4px 12px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded"
                        style={{
                            backgroundColor: darkMode ? '#374151' : '#f9fafb',
                            color: currentPage === totalPages ? (darkMode ? '#6b7280' : '#9ca3af') : (darkMode ? '#ffffff' : '#111827'),
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default SubjectsTable;
