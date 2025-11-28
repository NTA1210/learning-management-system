import React, { useEffect, useMemo, useState } from "react";
import http, { httpClient } from "../utils/http";
import { subjectService, courseService } from "../services";
import { userService } from "../services/userService";

import type { User } from "../types/auth";
import type { Subject } from "../types/subject";
type Semester = { _id: string; name: string; type: string; year: number; startDate: string; endDate: string };

type Props = {
  darkMode?: boolean;
  onClose?: () => void;
  onCreated?: () => Promise<void> | void;
  presetTeacherId?: string;
};

const statuses = ["draft", "ongoing", "completed"] as const;

const CreateCourseForm: React.FC<Props> = ({ darkMode, onClose, onCreated, presetTeacherId }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [currentSpecialistIds, setCurrentSpecialistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    title: "",
    subjectId: "",
    description: "",
    startDate: "",
    endDate: "",
    semesterId: "",
    teacherIds: [] as string[],
    status: "draft",
    isPublished: false,
    capacity: 50,
    enrollRequiresApproval: true,
    logo: null as File | null,
  });

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        const [subjectsResult, teachersResult, semestersResult] = await Promise.allSettled([
          subjectService.getAllSubjects(),
          userService.getUsers({ role: "teacher", specialistIds: currentSpecialistIds } as any),
          httpClient.get("/semesters", { withCredentials: true }),
        ]);
        if (subjectsResult.status === "fulfilled") {
          setSubjects(subjectsResult.value.data || []);
          console.log("subjects", subjectsResult.value.data || []);
        }
        if (teachersResult.status === "fulfilled") {
          setTeachers(teachersResult.value.users || []);
        }
        if (semestersResult.status === "fulfilled") {
          const body: any = semestersResult.value.data;
          const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
          setSemesters(list);
        }
      } catch (e: any) {
        setError(e?.message || "Không thể tải dữ liệu");
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (presetTeacherId) {
      setForm(prev => ({ ...prev, teacherIds: Array.from(new Set([presetTeacherId, ...prev.teacherIds])) }));
    }
  }, [presetTeacherId]);

  const teacherOptions = useMemo(() => {
    return teachers.map(t => ({ id: t._id, name: t.fullname || t.username }));
  }, [teachers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "capacity" ? Number(value) : value,
    }));
    if (name === "subjectId") {
      const selected = subjects.find(s => s._id === value) as any;
      const rawSpecIds = Array.isArray(selected?.specialistIds)
        ? selected.specialistIds
        : Array.isArray(selected?.specialists)
        ? (selected.specialists || []).map((s: any) => s?._id).filter(Boolean)
        : [selected?.specialistId || selected?.specialist?._id].filter(Boolean);
      const specIds = rawSpecIds
        .map((x: any) => (typeof x === "string" ? x : x?._id))
        .filter((id: any) => typeof id === "string" && id);
      setCurrentSpecialistIds(specIds);
      console.log("specIds", specIds);
      void (async () => {
        try {
          const params: any = { role: "teacher", specialistIds: specIds };
          const res = await userService.getUsers(params);
          const list = res.users || [];
          setTeachers(list);
          const allowedIds = list.map((u: any) => u._id);
          setForm(prev => ({
            ...prev,
            teacherIds: prev.teacherIds.filter(id => allowedIds.includes(id))
          }));
        } catch (_e) {}
      })();
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm(prev => ({ ...prev, logo: file }));
  };

  const toggleTeacher = (id: string) => {
    setForm(prev => {
      const exists = prev.teacherIds.includes(id);
      return { ...prev, teacherIds: exists ? prev.teacherIds.filter(t => t !== id) : [...prev.teacherIds, id] };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const slug = form.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");

      await courseService.createCourse({
        title: form.title,
        slug,
        subjectId: form.subjectId,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        semesterId: form.semesterId || undefined,
        teacherIds: form.teacherIds,
        status: form.status as any,
        isPublished: form.isPublished,
        capacity: form.capacity,
        enrollRequiresApproval: form.enrollRequiresApproval,
        logo: form.logo || undefined,
      });
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        toast: true, position: "top-end", icon: "success", title: "Create a successful course", showConfirmButton: false, timer: 2000 });
      setSuccessMsg("Create a successful course");
      setForm({
        title: "",
        subjectId: "",
        description: "",
        startDate: "",
        endDate: "",
        semesterId: "",
        teacherIds: [],
        status: "draft",
        isPublished: false,
        capacity: 50,
        enrollRequiresApproval: true,
        logo: null as File | null,
      });
      if (onCreated) await onCreated();
      if (onClose) onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Create a course failed";
      setError(msg);
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({ toast: true, position: "top-end", icon: "error", title: msg, showConfirmButton: false, timer: 2500 });
    } finally {
      setLoading(false);
    }
  };
  console.log('teachers', teachers);
  console.log('subjects', subjects);
  return (
    <form onSubmit={submit} className="px-6 py-6">
      {successMsg && <div className="mb-4 p-3 rounded bg-green-500/10 text-green-600">{successMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
            Title
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
              borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
              color: darkMode ? "#ffffff" : "#000000",
            }}
            placeholder="Enter course title"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
            Subject
          </label>
          <select
            name="subjectId"
            value={form.subjectId}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
              borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
              color: darkMode ? "#ffffff" : "#000000",
            }}
            required
          >
            <option value="">Select subject</option>
            {subjects.map(s => (
              <option key={s._id} value={s._id}>{s.name || s.code}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border h-24"
            style={{
              backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
              borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
              color: darkMode ? "#ffffff" : "#000000",
            }}
            placeholder="Enter course description"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
              borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
              color: darkMode ? "#ffffff" : "#000000",
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
           End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
              borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
              color: darkMode ? "#ffffff" : "#000000",
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
            Capacity
          </label>
          <input
            type="number"
            name="capacity"
            min={1}
            value={form.capacity}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
              borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
              color: darkMode ? "#ffffff" : "#000000",
            }}
            placeholder="50"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
          Logo
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="w-full px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
            borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
            color: darkMode ? "#ffffff" : "#000000",
          }}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
          Semester
        </label>
        <select
          name="semesterId"
          value={form.semesterId}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
            borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
            color: darkMode ? "#ffffff" : "#000000",
          }}
          required
        >
          <option value="">Select semester</option>
          {semesters.map(s => (
            <option key={s._id} value={s._id}>{s.name} ({s.year})</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
          Teachers
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-auto p-2 rounded border"
          style={{
            backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
            borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
          }}
        >
          {teacherOptions.map(t => (
            <label key={t.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.teacherIds.includes(t.id)} onChange={() => toggleTeacher(t.id)} />
              <span>{t.name}</span>
            </label>
          ))}
          {!teacherOptions.length && <div className="text-sm opacity-70">Không có giáo viên</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm mb-1">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="w-full px-3 py-2 rounded border">
            {statuses.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} />
            <span>Is published</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="enrollRequiresApproval" checked={form.enrollRequiresApproval} onChange={handleChange} />
            <span>Enroll requires approval</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 px-1">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg"
          style={{ backgroundColor: darkMode ? "#1f2937" : "#e5e7eb", color: darkMode ? "#e5e7eb" : "#111827" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-lg text-white font-medium transition-all duration-200"
          style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
        >
          Create
        </button>
      </div>
    </form>
  );
};

export default CreateCourseForm;