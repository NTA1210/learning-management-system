import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import Navbar from "../../components/layout/Navbar.tsx";
import Sidebar from "../../components/layout/Sidebar.tsx";
import { userService } from "../../services/userService";

type UserLike = {
  _id?: string;
  id?: string;
  fullName?: string; // some places use fullName
  fullname?: string; // our types/auth uses fullnamex
  email?: string;
  phoneNumber?: string;
  phone_number?: string;
  profileImageUrl?: string;
  avatar_url?: string;
  role?: string;
  isActive?: boolean;
  department?: string;
  specializations?: string;
  academicMajor?: string;
  gender?: string;
  dateOfBirth?: string;
  organization?: string;
  bio?: string;
};

type ClassLike = {
  classId: string;
  className: string;
  term?: { name?: string } | null;
  academicMajor?: { name?: string } | null;
  currentStudents?: number;
  maxStudents?: number;
};

const API_BASE = (import.meta.env.VITE_BASE_API as string | undefined)?.replace(/\/$/, "") || "";

const Profile: React.FC = () => {
  const { user, logout, updateCurrentUser } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const safeUser: UserLike | null = (user as unknown as UserLike) || null;

  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    profileImageUrl: "",
    department: "",
    specializations: "",
    academicMajor: "",
    gender: "",
    dateOfBirth: "",
    organization: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [studentImageUrl, setStudentImageUrl] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  // original image url not needed currently
  const [userClasses, setUserClasses] = useState<ClassLike[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classError, setClassError] = useState("");

  // default avatar handled below

  useEffect(() => {
    try {
      if (safeUser) {
        let newStudentImageUrl = "";
        let originalUrl = "";

        const candidateUrl = safeUser.profileImageUrl || safeUser.avatar_url || "";
        if (candidateUrl) {
          originalUrl = candidateUrl;

          if (originalUrl.includes("/profile/image/")) {
            try {
              const parts = originalUrl.split("/");
              const fileName = parts[parts.length - 1];
              const studentId = fileName.split(".")[0];
              if (studentId) {
                newStudentImageUrl = `${API_BASE}/api/StudentImages/${studentId}.png`;
              }
            } catch (err) {
              console.error("Error extracting student ID from URL:", err);
            }
          }
        }

        setStudentImageUrl(newStudentImageUrl || originalUrl || "https://media.tenor.com/AN83u7YyqwUAAAAM/maxwell-the-cat.gif");
      }
    } catch (err) {
      console.error("Error in student image URL processing:", err);
      setStudentImageUrl("https://media.tenor.com/AN83u7YyqwUAAAAM/maxwell-the-cat.gif");
    }
  }, [safeUser]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (safeUser) {
      setProfileData({
        fullName: safeUser.fullName || safeUser.fullname || "",
        email: safeUser.email || "",
        phoneNumber: safeUser.phoneNumber || safeUser.phone_number || "",
        profileImageUrl: safeUser.profileImageUrl || safeUser.avatar_url || "",
        department: safeUser.department || "",
        specializations: safeUser.specializations || "",
        academicMajor: typeof safeUser.academicMajor === 'string' ? safeUser.academicMajor : "",
        gender: safeUser.gender || "",
        dateOfBirth: safeUser.dateOfBirth || "",
        organization: safeUser.organization || "",
        bio: safeUser.bio || "",
      });
    }
  }, [safeUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Avatar must be a PNG or JPG image.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Avatar image must be 20 MB or smaller.");
      return;
    }

    setError("");
    setSelectedAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const cancelEditing = () => {
    setEditing(false);
    setSelectedAvatar(null);
    setAvatarPreview("");
    setError("");
    setProfileData({
      fullName: safeUser?.fullName || safeUser?.fullname || "",
      email: safeUser?.email || "",
      phoneNumber: safeUser?.phoneNumber || safeUser?.phone_number || "",
      profileImageUrl: safeUser?.profileImageUrl || safeUser?.avatar_url || "",
      department: "",
      specializations: "",
      academicMajor: "",
      gender: "",
      dateOfBirth: "",
      organization: "",
      bio: safeUser?.bio || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userId = safeUser?.id || safeUser?._id || "";
      if (!userId) throw new Error("Unable to identify the current user");

      const originalAvatarUrl = safeUser?.profileImageUrl || safeUser?.avatar_url || "";
      const requestedAvatarUrl = profileData.profileImageUrl.trim();
      const updatedUser = await userService.updateProfile(userId, {
        fullname: profileData.fullName.trim(),
        phone_number: profileData.phoneNumber.trim() || undefined,
        bio: profileData.bio.trim() || undefined,
        avatar_url:
          !selectedAvatar && requestedAvatarUrl && requestedAvatarUrl !== originalAvatarUrl
            ? requestedAvatarUrl
            : undefined,
        avatar: selectedAvatar || undefined,
      });
      const newUserData = { ...(safeUser || {}), ...updatedUser };
      updateCurrentUser(newUserData as NonNullable<typeof user>);

      const updatedAvatarUrl = updatedUser.avatar_url || requestedAvatarUrl || originalAvatarUrl;
      setStudentImageUrl(updatedAvatarUrl);
      setProfileData((current) => ({ ...current, profileImageUrl: updatedAvatarUrl }));
      setSelectedAvatar(null);
      setAvatarPreview("");

      setSuccess("Profile updated successfully");
      setEditing(false);
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiMessage || (err instanceof Error ? err.message : "An error occurred while updating your profile"));
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (): void => {};

  const handleLogout = (): void => {
    logout();
    navigate("/login");
  };

  const getUserTitle = () => {
    const role = safeUser?.role;
    if (!role) return "User";
    switch (role) {
      case "teacher":
        return "Teacher";
      case "student":
        return "Student";
      case "outsrc_student":
        return "External Student";
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const getUserHandle = () => {
    const email = safeUser?.email || "";
    return email ? email.split("@")[0] : "user";
  };

  const fetchUserClasses = async () => {
    if (!safeUser) return;
    try {
      setLoadingClasses(true);
      setClassError("");
      const role = safeUser.role;

      if (role === "lecturer") {
        const res = await fetch(`${API_BASE}/classes/teacher/${safeUser.id || safeUser._id}`);
        if (res.ok) {
          const data: ClassLike[] = await res.json();
          setUserClasses(data);
        } else {
          setClassError("Failed to fetch classes");
        }
      } else if (role === "student") {
        const res = await fetch(`${API_BASE}/classes`);
        if (res.ok) {
          const allClasses: ClassLike[] = await res.json();
          const studentClasses: ClassLike[] = [];
          for (const classObj of allClasses) {
            try {
              const studentsRes = await fetch(`${API_BASE}/classes/${classObj.classId}/students`);
              if (studentsRes.ok) {
                const students: Array<{ id?: string; _id?: string }> = await studentsRes.json();
                const uid = safeUser.id || safeUser._id;
                if (students.some(s => (s.id || s._id) === uid)) {
                  studentClasses.push(classObj);
                }
              }
            } catch (err) {
              console.error(`Error checking students for class ${classObj.classId}:`, err);
            }
          }
          setUserClasses(studentClasses);
        } else {
          setClassError("Failed to fetch classes");
        }
      }
    } catch (err) {
      setClassError("An error occurred while fetching classes");
      console.error(err);
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    fetchUserClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeUser]);

  return (
    <div 
      className="flex h-screen overflow-hidden relative"
      style={{
        backgroundColor: darkMode ? '#1a202c' : '#f8fafc',
        color: darkMode ? '#ffffff' : '#1e293b'
      }}
    >
      <Navbar />
      <Sidebar role={(safeUser?.role as 'admin' | 'teacher' | 'student') || 'student'} />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-3xl font-bold mb-8 text-center">User Profile</h1>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
                <p>{success}</p>
              </div>
            )}

            {!safeUser ? (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
                <p>Loading user data...</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-5/12 flex justify-center mb-8 lg:mb-0">
                  <div className="w-full max-w-[350px] rounded-2xl shadow-lg p-6"
                    style={{
                      backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)'
                    }}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative">
                        <img src={avatarPreview || studentImageUrl || "https://media.tenor.com/AN83u7YyqwUAAAAM/maxwell-the-cat.gif"} alt="avatar" className="h-28 w-28 rounded-full object-cover border-2"
                          style={{ borderColor: darkMode ? '#4f46e5' : '#6366f1' }} />
                      </div>
                      {editing && (
                        <>
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="mt-3 rounded-lg px-3 py-2 text-sm font-medium text-white"
                            style={{ backgroundColor: darkMode ? '#4f46e5' : '#6366f1' }}
                          >
                            Choose image from device
                          </button>
                          <p className="mt-1 text-xs" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                            PNG or JPG, maximum 20 MB{selectedAvatar ? ` · ${selectedAvatar.name}` : ''}
                          </p>
                        </>
                      )}
                      <h2 className="mt-4 text-xl font-semibold">{profileData.fullName || 'User Name'}</h2>
                      <p className="text-sm" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>{getUserTitle()}</p>
                      <p className="mt-1 text-xs" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>@{getUserHandle()}</p>
                      <button onClick={handleContactClick} className="mt-4 px-4 py-2 rounded-lg text-white" style={{ backgroundColor: darkMode ? '#4f46e5' : '#6366f1' }}>Message</button>
                    </div>
                  </div>
                </div>

                <div className="lg:w-7/12 backdrop-blur-md rounded-[30px] shadow-md overflow-hidden"
                  style={{
                    backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)'
                  }}
                >
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold" style={{ color: darkMode ? '#ffffff' : '#1e293b' }}>Profile Information</h3>
                      <div>
                        {!editing ? (
                          <div className="space-x-2">
                            <button
                              onClick={() => setEditing(true)}
                              className="px-4 py-2 text-white rounded"
                              style={{ backgroundColor: darkMode ? '#4f46e5' : '#6366f1' }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? '#4338ca' : '#4f46e5';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? '#4f46e5' : '#6366f1';
                              }}
                            >
                              Edit Profile
                            </button>
                            <a
                              href="/change-password"
                              className="px-4 py-2 text-white rounded inline-block"
                              style={{ backgroundColor: darkMode ? '#16a34a' : '#22c55e' }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = darkMode ? '#15803d' : '#16a34a';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = darkMode ? '#16a34a' : '#22c55e';
                              }}
                            >
                              Change Password
                            </a>
                            <button
                              onClick={handleLogout}
                              className="px-4 py-2 text-white rounded"
                              style={{ backgroundColor: darkMode ? '#dc2626' : '#ef4444' }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? '#b91c1c' : '#dc2626';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? '#dc2626' : '#ef4444';
                              }}
                            >
                              Logout
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-2 text-white rounded"
                            style={{ backgroundColor: darkMode ? '#6b7280' : '#9ca3af' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? '#4b5563' : '#6b7280';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? '#6b7280' : '#9ca3af';
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>Full Name</label>
                          {editing ? (
                            <input type="text" name="fullName" value={profileData.fullName} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md" required />
                          ) : (
                            <p className="mt-1">{profileData.fullName}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>Email</label>
                          <p className="mt-1">{profileData.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>Phone Number</label>
                          {editing ? (
                            <input type="text" name="phoneNumber" value={profileData.phoneNumber} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md" />
                          ) : (
                            <p className="mt-1">{profileData.phoneNumber || "Not provided"}</p>
                          )}
                        </div>
                        {editing && (
                          <div>
                            <label className="block text-sm font-medium" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>Profile Image URL (optional)</label>
                            <input type="url" name="profileImageUrl" value={profileData.profileImageUrl} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md" placeholder="https://example.com/avatar.png" />
                            <p className="mt-1 text-xs" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>Choose an image from your device above, or provide a public image URL.</p>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>Role</label>
                          <p className="mt-1 capitalize">{safeUser?.role}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>Bio</label>
                          {editing ? (
                            <textarea name="bio" value={profileData.bio} onChange={handleInputChange} rows={3} maxLength={500} className="mt-1 p-2 w-full border rounded-md" placeholder="Tell others a little about yourself" />
                          ) : (
                            <p className="mt-1 whitespace-pre-wrap">{profileData.bio || "Not provided"}</p>
                          )}
                        </div>

                      </div>

                      {editing && (
                        <div className="mt-6">
                          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-300">
                            {loading ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* {safeUser && (safeUser.role === "lecturer" || safeUser.role === "student") && (
            <div className="mt-8 bg-white/80 backdrop-blur-md rounded-[30px] shadow-md overflow-hidden max-w-6xl mx-auto px-4">
              <div className="p-8">
                <h3 className="text-xl font-semibold mb-6">My Classes</h3>

                {classError && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                    <p>{classError}</p>
                  </div>
                )}

                {loadingClasses ? (
                  <p>Loading classes...</p>
                ) : userClasses.length === 0 ? (
                  <p>You are not associated with any classes.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userClasses.map((classObj) => (
                      <div key={classObj.classId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="text-lg font-medium mb-2">{classObj.className}</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">ID:</span> {classObj.classId}</p>
                          <p><span className="font-medium">Term:</span> {classObj.term ? classObj.term.name : "N/A"}</p>
                          <p><span className="font-medium">Department:</span> {classObj.academicMajor ? classObj.academicMajor.name : "N/A"}</p>
                          <p><span className="font-medium">Students:</span> {classObj.currentStudents}/{classObj.maxStudents}</p>
                        </div>
                        <div className="mt-4">
                          <Link to="/classes" className="text-indigo-600 hover:text-indigo-800 font-medium">View Details</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )} */}
        </main>
      </div>
    </div>
  );
};

export default Profile;
