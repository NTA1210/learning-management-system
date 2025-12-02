import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { specialistService, majorService } from '../../services';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import type { SpecialistNode, MajorNode } from '../../types/curriculum';

interface SpecialistsTableProps {
    onOpenSpecialistModal: (specialist?: SpecialistNode) => void;
    onDeleteSpecialist: (specialistId: string) => void;
    refreshTrigger?: number;
}

const SpecialistsTable: React.FC<SpecialistsTableProps> = ({ onOpenSpecialistModal, onDeleteSpecialist, refreshTrigger }) => {
    const { darkMode } = useTheme();
    const [specialists, setSpecialists] = useState<SpecialistNode[]>([]);
    const [majors, setMajors] = useState<MajorNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMajor, setSelectedMajor] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalSpecialists, setTotalSpecialists] = useState(0);
    const pageLimit = 10;

    const fetchMajors = async () => {
        try {
            const response = await majorService.getAllMajors({ limit: 100 });
            setMajors(response.majors);
        } catch (err) {
            console.error('Failed to fetch majors:', err);
        }
    };

    const fetchSpecialists = async () => {
        try {
            setLoading(true);
            const response = await specialistService.getAllSpecialists({
                page: currentPage,
                limit: pageLimit,
                ...(searchTerm && { search: searchTerm }),
                ...(selectedMajor && { majorId: selectedMajor }),
                sortBy: 'title',
                sortOrder: 'asc',
            });
            setSpecialists(response.specialists);
            if (response.pagination && typeof response.pagination === 'object' && 'total' in response.pagination) {
                setTotalSpecialists(response.pagination.total as number);
            }
        } catch (err) {
            console.error('Failed to fetch specialists:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMajors();
    }, []);

    useEffect(() => {
        fetchSpecialists();
        // eslint-disable-next-line
    }, [currentPage, searchTerm, selectedMajor, refreshTrigger]);

    const totalPages = Math.ceil(totalSpecialists / pageLimit);

    const getMajorName = (specialist: SpecialistNode): string => {
        if (!specialist.majorId) return '-';
        if (typeof specialist.majorId === 'object' && specialist.majorId.name) {
            return specialist.majorId.name;
        }
        const major = majors.find(m => m._id === specialist.majorId);
        return major?.name || '-';
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
                            placeholder="Search specialists..."
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
                        value={selectedMajor}
                        onChange={(e) => {
                            setSelectedMajor(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-3 py-2 rounded-lg border"
                        style={{
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            borderColor: darkMode ? '#374151' : '#d1d5db',
                            color: darkMode ? '#ffffff' : '#111827',
                        }}
                    >
                        <option value="">All Majors</option>
                        {majors.map((major) => (
                            <option key={major._id} value={major._id}>
                                {major.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => onOpenSpecialistModal()}
                    className="px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-all"
                    style={{ backgroundColor: darkMode ? '#059669' : '#10b981' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = darkMode ? '#047857' : '#059669')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = darkMode ? '#059669' : '#10b981')}
                >
                    <Plus size={18} />
                    Create Specialist
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
                                }}
                            >
                                Name
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
                                Major
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
                                Description
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
                                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                    Loading...
                                </td>
                            </tr>
                        ) : specialists.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: darkMode ? '#9ca3af' : '#6b7280' }}>
                                    No specialists found.
                                </td>
                            </tr>
                        ) : (
                            specialists.map((specialist) => (
                                <tr
                                    key={specialist._id}
                                    style={{
                                        borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                                    }}
                                >
                                    <td style={{ padding: '12px 16px', color: darkMode ? '#ffffff' : '#111827', fontWeight: 500 }}>
                                        {specialist.name}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                                        {getMajorName(specialist)}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                                        {specialist.description || '-'}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <span
                                            className="px-2 py-1 rounded-full text-xs font-medium"
                                            style={{
                                                backgroundColor: specialist.isActive
                                                    ? darkMode ? '#065f46' : '#d1fae5'
                                                    : darkMode ? '#374151' : '#f3f4f6',
                                                color: specialist.isActive
                                                    ? darkMode ? '#6ee7b7' : '#047857'
                                                    : darkMode ? '#9ca3af' : '#6b7280',
                                            }}
                                        >
                                            {specialist.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => onOpenSpecialistModal(specialist)}
                                                className="p-1.5 rounded transition-colors"
                                                style={{ color: darkMode ? '#60a5fa' : '#3b82f6' }}
                                                title="Edit"
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = darkMode ? '#1e3a8a' : '#eff6ff')}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteSpecialist(specialist._id)}
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

export default SpecialistsTable;
