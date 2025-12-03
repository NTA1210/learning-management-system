import React, { useState, useMemo, useEffect } from "react";
import { X, Users, Search, UserPlus, Crown, Shield } from "lucide-react";
import { userService } from "../../services";
import { useDebounce } from "../../hooks";
import { useSocketContext } from "../../context/SocketContext";

interface Participant {
  userId: string;
  username: string;
  role: string;
  avatarUrl?: string;
  joinedAt?: Date;
}

interface ChatMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  participants: Participant[];
  chatRoomName: string;
  chatRoomId: string;
  userRole?: string;
}

const ChatMembersModal: React.FC<ChatMembersModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  participants,
  chatRoomName,
  chatRoomId,
  userRole,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddMember, setShowAddMember] = useState<boolean>(false);
  const [addMemberSearch, setAddMemberSearch] = useState<string>("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const { socket } = useSocketContext();

  const canAddMembers = userRole === "admin" || userRole === "teacher";
  const addMemberSearchDebounce = useDebounce(addMemberSearch, 500);

  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const query = searchQuery.toLowerCase();
    return participants.filter(
      (p) =>
        p.username?.toLowerCase().includes(query) ||
        p.role?.toLowerCase().includes(query)
    );
  }, [participants, searchQuery]);

  // Filter users for adding - exclude already existing members
  const filteredUsersToAdd = useMemo(() => {
    const existingUserIds = new Set(participants.map((p) => p.userId));
    return allUsers.filter((u) => !existingUserIds.has(u._id));
  }, [allUsers, participants]);

  // Fetch users for add member search
  useEffect(() => {
    if (!showAddMember) return;

    const fetchUsers = async () => {
      const res = (await userService.getUsers(
        addMemberSearchDebounce ? { username: addMemberSearchDebounce } : {}
      )) as any;
      setAllUsers(res?.users || []);
    };

    fetchUsers();
  }, [showAddMember, addMemberSearchDebounce]);

  const handleAddUser = (email: string): void => {
    socket?.emit("chatroom:invite-user", {
      chatRoomId,
      email,
    });
    setAddMemberSearch("");
  };

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return <Crown className="size-3 text-amber-500" />;
      case "teacher":
        return <Shield className="size-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return { bg: darkMode ? "#78350f" : "#fef3c7", text: "#f59e0b" };
      case "teacher":
        return { bg: darkMode ? "#1e3a5f" : "#dbeafe", text: "#3b82f6" };
      default:
        return { bg: darkMode ? "#1f2937" : "#f1f5f9", text: darkMode ? "#9ca3af" : "#64748b" };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{
            borderColor: darkMode ? "#334155" : "#e5e7eb",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: darkMode ? "#164e63" : "#ecfeff",
              }}
            >
              <Users
                className="size-5"
                style={{ color: darkMode ? "#22d3ee" : "#0891b2" }}
              />
            </div>
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
              >
                Group Members
              </h2>
              <p
                className="text-xs"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                {chatRoomName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-gray-500/20"
            style={{
              color: darkMode ? "#94a3b8" : "#64748b",
            }}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div
          className="px-6 py-3 border-b"
          style={{ borderColor: darkMode ? "#334155" : "#e5e7eb" }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: darkMode ? "#0f172a" : "#f1f5f9",
            }}
          >
            <Search
              className="size-4"
              style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
            />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm"
              style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-0.5 rounded hover:bg-gray-500/20"
                style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Members Count & Add Member Toggle */}
        <div
          className="px-6 py-2 flex items-center justify-between"
          style={{
            backgroundColor: darkMode ? "#0f172a50" : "#f8fafc",
          }}
        >
          <span
            className="text-xs font-medium"
            style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
          >
            {filteredParticipants.length} member{filteredParticipants.length !== 1 ? "s" : ""}
          </span>
          {canAddMembers && (
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: showAddMember ? "#4f46e5" : "#6366f1",
                color: "white",
              }}
            >
              <UserPlus className="size-3" />
              {showAddMember ? "Cancel" : "Add Member"}
            </button>
          )}
        </div>

        {/* Add Member Section */}
        {showAddMember && canAddMembers && (
          <div
            className="px-6 py-3 border-b"
            style={{
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              backgroundColor: darkMode ? "#0f172a30" : "#f8fafc",
            }}
          >
            {/* Search input for adding users */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
              style={{
                backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                border: `1px solid ${darkMode ? "#334155" : "#e5e7eb"}`,
              }}
            >
              <Search
                className="size-4"
                style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
              />
              <input
                type="text"
                placeholder="Search users to add..."
                value={addMemberSearch}
                onChange={(e) => setAddMemberSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
              />
              {addMemberSearch && (
                <button
                  onClick={() => setAddMemberSearch("")}
                  className="p-0.5 rounded hover:bg-gray-500/20"
                  style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Users to add list */}
            <div
              className="max-h-40 overflow-y-auto rounded-lg"
              style={{
                backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                border: `1px solid ${darkMode ? "#334155" : "#e5e7eb"}`,
              }}
            >
              {filteredUsersToAdd.length === 0 ? (
                <div
                  className="py-6 text-center"
                  style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                >
                  <p className="text-xs">
                    {addMemberSearch ? "No users found" : "Type to search users"}
                  </p>
                </div>
              ) : (
                filteredUsersToAdd.map((u) => {
                  const roleColors = getRoleBadgeColor(u.role);
                  return (
                    <div
                      key={u._id}
                      className="flex items-center gap-3 px-3 py-2 transition-colors cursor-pointer"
                      style={{
                        borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = darkMode
                          ? "#334155"
                          : "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {/* Avatar */}
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.username}
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="size-8 rounded-full flex items-center justify-center font-semibold text-xs"
                          style={{
                            backgroundColor: darkMode ? "#374151" : "#e5e7eb",
                            color: darkMode ? "#f1f5f9" : "#374151",
                          }}
                        >
                          {(u.username || u.email || "U")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                      )}

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs font-medium truncate"
                          style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
                        >
                          {u.fullname || u.username}
                        </div>
                        <div
                          className="text-xs truncate"
                          style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                        >
                          {u.email}
                        </div>
                      </div>

                      {/* Role Badge */}
                      <span
                        className="px-1.5 py-0.5 rounded-full text-xs capitalize"
                        style={{
                          backgroundColor: roleColors.bg,
                          color: roleColors.text,
                        }}
                      >
                        {u.role}
                      </span>

                      {/* Add Button */}
                      <button
                        onClick={() => handleAddUser(u.email)}
                        className="px-2 py-1 rounded text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: "#6366f1",
                          color: "white",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#4f46e5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#6366f1";
                        }}
                      >
                        Add
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Members List */}
        <div
          className="max-h-80 overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          {filteredParticipants.length === 0 ? (
            <div
              className="py-12 text-center"
              style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
            >
              <Users className="size-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No members found</p>
            </div>
          ) : (
            <div className="px-4 py-2 space-y-1">
              {filteredParticipants.map((participant, index) => {
                const roleColors = getRoleBadgeColor(participant.role);
                return (
                  <div
                    key={participant.userId || index}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors"
                    style={{
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode
                        ? "#334155"
                        : "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {/* Avatar */}
                    {participant.avatarUrl ? (
                      <img
                        src={participant.avatarUrl}
                        alt={participant.username}
                        className="size-10 rounded-full object-cover border-2"
                        style={{
                          borderColor: darkMode ? "#334155" : "#e5e7eb",
                        }}
                      />
                    ) : (
                      <div
                        className="size-10 rounded-full flex items-center justify-center font-semibold text-sm"
                        style={{
                          backgroundColor: darkMode ? "#374151" : "#e5e7eb",
                          color: darkMode ? "#f1f5f9" : "#374151",
                        }}
                      >
                        {(participant.username || "U")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                    )}

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-medium text-sm truncate"
                          style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
                        >
                          {participant.username || "Unknown User"}
                        </span>
                        {getRoleIcon(participant.role)}
                      </div>
                      {participant.joinedAt && (
                        <p
                          className="text-xs truncate"
                          style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                        >
                          Joined{" "}
                          {new Date(participant.joinedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Role Badge */}
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                      style={{
                        backgroundColor: roleColors.bg,
                        color: roleColors.text,
                      }}
                    >
                      {participant.role || "member"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end px-6 py-4 border-t"
          style={{
            borderColor: darkMode ? "#334155" : "#e5e7eb",
            backgroundColor: darkMode ? "#0f172a50" : "#f8fafc",
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: darkMode ? "#334155" : "#e5e7eb",
              color: darkMode ? "#e5e7eb" : "#475569",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMembersModal;
