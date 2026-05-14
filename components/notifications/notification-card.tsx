'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NotificationCardProps {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  timestamp: string;
  onMarkRead?: () => void;
}

export function NotificationCard({ id, title, message, type, read, timestamp, onMarkRead }: NotificationCardProps) {
  const [loading, setLoading] = useState(false);

  const markRead = async () => {
    if (!onMarkRead) return;
    setLoading(true);
    await onMarkRead();
    setLoading(false);
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${read ? 'border-slate-700 bg-slate-950/80' : 'border-orange-500 bg-orange-500/10'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">{title}</p>
          <p className="mt-2 text-sm text-slate-300">{message}</p>
        </div>
        <div className="text-right text-xs uppercase tracking-[0.18em] text-slate-400">
          <p>{type.replace(/_/g, ' ')}</p>
          <p className="mt-2 text-[0.85rem] text-slate-500">{new Date(timestamp).toLocaleString()}</p>
        </div>
      </div>
      {!read && onMarkRead ? (
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={markRead} disabled={loading}>
            {loading ? 'Marking...' : 'Mark as read'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
