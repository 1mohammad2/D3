"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Check, Trophy, Users,
  AlertTriangle, Ban, Loader2, CheckCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ── Types ──────────────────────────────────────────────────────
type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

// ── Icon per notification type ──────────────────────────────────
function NotifIcon({ type }: { type: string }) {
  const map: Record<string, React.ReactNode> = {
    MOVED_FROM_WAITLIST: <Users className="h-5 w-5 text-green-400" />,
    TEAMS_PUBLISHED: <Trophy className="h-5 w-5 text-orange-400" />,
    REGISTRATION_CONFIRMED: <Check className="h-5 w-5 text-blue-400" />,
    WARNING_ISSUED: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
    BAN_ISSUED: <Ban className="h-5 w-5 text-red-400" />,
    GAME_REMINDER: <Bell className="h-5 w-5 text-purple-400" />,
  };
  return (
    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
      {map[type] ?? <Bell className="h-5 w-5 text-slate-400" />}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications", { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });

  const notifications: Notification[] = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Bell className="text-orange-500 h-7 w-7" />
            Notifications
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-sm font-medium transition-colors"
          >
            {markAllMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-16 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
          Failed to load notifications. Please refresh.
        </div>
      )}

      {!isLoading && !error && notifications.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No notifications yet</p>
        </div>
      )}

      {!isLoading && !error && notifications.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => {
                if (!notif.isRead) markOneMutation.mutate(notif.id);
              }}
              className={`w-full text-left flex items-start gap-4 px-5 py-4 hover:bg-slate-800/50 transition-colors ${
                !notif.isRead ? "bg-orange-500/5" : ""
              }`}
            >
              <NotifIcon type={notif.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`font-medium ${
                      notif.isRead ? "text-slate-400" : "text-white"
                    }`}
                  >
                    {notif.title}
                  </p>
                  {!notif.isRead && (
                    <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-2" />
                  )}
                </div>
                <p className="text-slate-500 text-sm mt-1">{notif.message}</p>
                <p className="text-slate-600 text-xs mt-2">
                  {formatDistanceToNow(new Date(notif.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}