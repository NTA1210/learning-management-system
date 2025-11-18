import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { format, formatDistanceToNow } from "date-fns";
import { createPortal } from "react-dom";
import { Loader2, RefreshCcw, Trash2 } from "lucide-react";
import { notificationService } from "../services/notificationService";
import type { NotificationItem } from "../types/notification";
import "./NotificationDropdown.css";

interface NotificationDropdownProps {
  isDarkMode: boolean;
}

const LIMIT = 10;

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const formatRelativeTime = (isoDate: string) => {
  const createdDate = new Date(isoDate);
  const now = new Date();
  const diffInDays = (now.getTime() - createdDate.getTime()) / 86400000;

  if (Number.isNaN(diffInDays)) {
    return "-";
  }

  if (diffInDays > 3) {
    return format(createdDate, "dd/MM/yyyy HH:mm");
  }

  return formatDistanceToNow(createdDate, { addSuffix: true }).replace(
    "about ",
    ""
  );
};

const getSenderInitial = (notification: NotificationItem) => {
  const source =
    notification.sender?.username || notification.recipientType || "N";
  return source.charAt(0).toUpperCase();
};

const getSenderDisplayName = (notification: NotificationItem) => {
  return (
    notification.sender?.fullname ||
    notification.sender?.username ||
    "System"
  );
};

const truncate = (value: string, length = 80) =>
  value.length > length ? `${value.slice(0, length)}…` : value;

export default function NotificationDropdown({
  isDarkMode,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailNotification, setDetailNotification] =
    useState<NotificationItem | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    ids: string[];
  }>({
    open: false,
    ids: [],
  });

  const unreadCount = useMemo(
    () => items.filter((notification) => !notification.isRead).length,
    [items]
  );

  const closeDropdown = () => {
    setIsOpen(false);
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const fetchNotifications = useCallback(
    async (options?: { reset?: boolean }) => {
      if (isLoading) return;
      setIsLoading(true);
      setError(null);
      try {
        const nextPage = options?.reset ? 1 : page;
        const response = await notificationService.getNotifications({
          page: nextPage,
          limit: LIMIT,
        });
        const newItems = response.data ?? [];
        setItems((prev) =>
          options?.reset ? newItems : [...prev, ...newItems.filter(
              (item) => !prev.some((existing) => existing._id === item._id)
            )]
        );
        setHasNext(response.pagination?.hasNext ?? false);
        setPage(nextPage + 1);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load notifications. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [page, isLoading]
  );

  const handleToggleOpen = () => {
    if (!isOpen && items.length === 0) {
      fetchNotifications({ reset: true }).catch(() => undefined);
    }
    setIsOpen((prev) => !prev);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchNotifications({ reset: true });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelect = (notificationId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(notificationId)) {
        next.delete(notificationId);
      } else {
        next.add(notificationId);
      }
      return next;
    });
  };

  const handleMarkSelectedAsRead = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      await notificationService.markNotificationsAsRead(ids);
      setItems((prev) =>
        prev.map((item) =>
          ids.includes(item._id) ? { ...item, isRead: true } : item
        )
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setConfirmDelete({ open: true, ids });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.ids.length) return;
    const ids = [...confirmDelete.ids];
    try {
      await notificationService.deleteNotifications(ids);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
      setTimeout(() => {
        setItems((prev) =>
          prev.filter((item) => !ids.includes(item._id))
        );
        setRemovingIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      }, 200);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDelete({ open: false, ids: [] });
    }
  };

  const handleOpenDetail = async (notification: NotificationItem) => {
    setDetailNotification(notification);
    if (!notification.isRead) {
      try {
        await notificationService.markNotificationAsRead(notification._id);
        setItems((prev) =>
          prev.map((item) =>
            item._id === notification._id ? { ...item, isRead: true } : item
          )
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllNotificationsAsRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (detailNotification || confirmDelete.open) {
        return;
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (detailNotification || confirmDelete.open) {
        return;
      }
      if (event.key === "Escape") {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, detailNotification, confirmDelete.open]);

  useEffect(() => {
    if (!isOpen || !hasNext || isLoading) return;
    const listElement = listRef.current;
    const sentinelElement = sentinelRef.current;
    if (!listElement || !sentinelElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasNext && !isLoading) {
            fetchNotifications().catch(() => undefined);
          }
        });
      },
      {
        root: listElement,
        threshold: 0.1,
      }
    );

    observer.observe(sentinelElement);

    return () => {
      observer.disconnect();
    };
  }, [isOpen, hasNext, isLoading, fetchNotifications]);

  const dropdownTheme = isDarkMode
    ? "bg-slate-800 text-white"
    : "bg-white text-slate-900";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        aria-label="Notifications"
        onClick={handleToggleOpen}
        className={classNames(
          "relative p-2 rounded-full transition-colors",
          isDarkMode
            ? "text-white hover:bg-white/10"
            : "text-slate-700 hover:bg-slate-100"
        )}
      >
        <svg
          viewBox="64 64 896 896"
          focusable="false"
          data-icon="bell"
          width="22"
          height="22"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M816 768h-24V428c0-141.1-104.3-257.7-240-277.1V112c0-22.1-17.9-40-40-40s-40 17.9-40 40v38.9c-135.7 19.4-240 136-240 277.1v340h-24c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h216c0 61.8 50.2 112 112 112s112-50.2 112-112h216c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM512 888c-26.5 0-48-21.5-48-48h96c0 26.5-21.5 48-48 48zM304 768V428c0-55.6 21.6-107.8 60.9-147.1S456.4 220 512 220c55.6 0 107.8 21.6 147.1 60.9S720 372.4 720 428v340H304z"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={classNames(
            "absolute right-0 mt-3 w-96 shadow-2xl rounded-2xl border border-slate-200/30 overflow-hidden z-[120] transition-all duration-200 ease-out origin-top-right notification-dropdown-panel",
            dropdownTheme,
            "data-[state=open]:scale-100 data-[state=open]:opacity-100"
          )}
          data-state={isOpen ? "open" : "closed"}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/30">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs opacity-70">
                {unreadCount > 0
                  ? `${unreadCount} Unread`
                  : "All read"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectMode((prev) => !prev)}
                className="text-xs px-3 py-1 rounded-full border border-indigo-400/60 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-colors"
              >
                {selectMode ? "Cancel" : "Select"}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-xs px-3 py-1 rounded-full border border-slate-300/50 hover:bg-slate-100/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCcw
                  className={classNames(
                    "h-3.5 w-3.5",
                    (isRefreshing || isLoading) &&
                      "notification-refresh-icon--spinning"
                  )}
                />
              </button>
            </div>
          </div>

          {selectMode && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200/30 text-xs">
              <span className="opacity-70">
                Selected {selectedIds.size} item
                {selectedIds.size === 1 ? "" : "s"}
              </span>
              <button
                disabled={!selectedIds.size}
                onClick={handleMarkSelectedAsRead}
                className="px-2 py-1 rounded-lg bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Mark read
              </button>
              <button
                disabled={!selectedIds.size}
                onClick={handleRequestDeleteSelected}
                className="px-2 py-1 rounded-lg bg-rose-500 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}

          <div
            className="max-h-[420px] overflow-y-auto custom-scrollbar transition-all duration-200 notification-list"
            ref={listRef}
          >
            {error && (
              <div className="px-4 py-6 text-center text-sm text-rose-400">
                {error}
              </div>
            )}
            {!error && items.length === 0 && !isLoading && (
              <div className="px-4 py-10 text-center text-sm opacity-70">
                No notifications found
              </div>
            )}
            {items.map((notification, index) => {
              const isSelected = selectedIds.has(notification._id);
              return (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() =>
                    selectMode
                      ? handleSelect(notification._id)
                      : handleOpenDetail(notification)
                  }
                    className={classNames(
                      "w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150 border-b border-slate-200/20 hover:bg-slate-50/10 notification-item",
                      notification.isRead
                        ? "opacity-70"
                        : "bg-indigo-500/5 border-l-4 border-indigo-400/80",
                      selectMode && "pr-6",
                      removingIds.has(notification._id) &&
                        "notification-item-removing"
                    )}
                    style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold">
                        {getSenderInitial(notification)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm truncate">
                          {notification.title}
                        </p>
                        <span className="text-[11px] opacity-60 whitespace-nowrap">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs opacity-80">
                        {truncate(notification.message, 80)}
                      </p>
                    </div>
                  </div>
                  {selectMode && (
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer"
                      checked={isSelected}
                      onChange={() => handleSelect(notification._id)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  )}
                </button>
              );
            })}
            {isLoading && (
              <div className="px-4 py-4 text-center flex items-center justify-center gap-2 text-xs opacity-80">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            )}
            {!isLoading && hasNext && items.length > 0 && (
              <div className="px-4 py-3 text-center text-xs opacity-60 animate-pulse">
                Scroll to load more...
              </div>
            )}
            <div ref={sentinelRef} />
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/30 text-xs">
            <button
              onClick={handleMarkAllAsRead}
              className="text-indigo-500 hover:text-indigo-400 font-medium"
            >
              Mark all as read
            </button>
            <button
              onClick={closeDropdown}
              className="text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {detailNotification && (
        <DetailModal
          isDarkMode={isDarkMode}
          notification={detailNotification}
          onClose={() => setDetailNotification(null)}
        />
      )}
      {confirmDelete.open && (
        <ConfirmDeleteModal
          count={confirmDelete.ids.length}
          isDarkMode={isDarkMode}
          onCancel={() => setConfirmDelete({ open: false, ids: [] })}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

interface DetailModalProps {
  notification: NotificationItem;
  isDarkMode: boolean;
  onClose: () => void;
}

function DetailModal({
  notification,
  isDarkMode,
  onClose,
}: DetailModalProps) {
  const modalContent: ReactNode = (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 px-4 notification-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        className={classNames(
          "w-full max-w-lg rounded-2xl shadow-2xl p-6 relative notification-modal-content",
          isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Close notification detail"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg font-semibold">
            {getSenderInitial(notification)}
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-400">
              {notification.recipientType === "course" ? "Course" : "System"}
            </p>
            <p className="text-xs opacity-70">
              {formatRelativeTime(notification.createdAt)}
            </p>
            <p className="text-sm font-medium mt-1">
              From: {getSenderDisplayName(notification)}
            </p>
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-3">{notification.title}</h3>
        <p className="text-sm leading-relaxed whitespace-pre-line">
          {notification.message}
        </p>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return <>{modalContent}</>;
  }

  return createPortal(modalContent, document.body);
}

interface ConfirmDeleteModalProps {
  count: number;
  isDarkMode: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

function ConfirmDeleteModal({
  count,
  isDarkMode,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const content = (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 px-4 notification-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          event.stopPropagation();
          onCancel();
        }
      }}
    >
      <div
        className={classNames(
          "w-full max-w-sm rounded-2xl shadow-xl p-6 notification-modal-content",
          isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-2">Remove notifications?</h3>
        <p className="text-sm opacity-80 mb-6">
          Do you want to remove {count} notification{count === 1 ? "" : "s"}?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100/40 text-sm"
          >
            No, keep them
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-rose-500 text-white text-sm hover:bg-rose-600"
          >
            Yes, remove
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return <>{content}</>;
  }

  return createPortal(content, document.body);
}

