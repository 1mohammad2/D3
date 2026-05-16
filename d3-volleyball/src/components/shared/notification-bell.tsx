"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Trophy, Users, AlertTriangle, Ban, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Types ──────────────────────────────────────────────────────
type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

// ── Icon per notification type ─────────────────────────────────
function NotifIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    MOVED_FROM_WAITLIST: <Users className="h-4 w-4 text-green-400" />,
    TEAMS_PUBLISHED: <Trophy className="h-4 w-4 text-orange-400" />,
    REGISTRATION_CONFIRMED: <Check className="h-4 w-4 text-blue-400" />,
    WARNING_ISSUED: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
    BAN_ISSUED: <Ban className="h-4 w-4 text-red-400" />,
    GAME_REMINDER: <Bell className="h-4 w-4 text-purple-400" />,
  };
  return (
    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
      {icons[type] ?? <Bell className="h-4 w-4 text-slate-400" />}
    </div>
  );
}

// ── Main Bell Component ────────────────────────────────────────
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return { notifications: [], unreadCount: 0 };
      return res.json();
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications", { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markOneRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications: Notification[] = data?.notifications ?? [];
  const unreadCount: number = data?.unreadCount ?? 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors focus:outline-none">
          <Bell className="h-5 w-5" />
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 bg-slate-900 border-slate-700 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="text-white font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-orange-400 hover:text-orange-300"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!notif.isRead) markOneRead.mutate(notif.id);
                  }}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors ${
                    !notif.isRead ? "bg-orange-500/5" : ""
                  }`}
                >
                  <NotifIcon type={notif.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm font-medium truncate ${
                          notif.isRead ? "text-slate-400" : "text-white"
                        }`}
                      >
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}